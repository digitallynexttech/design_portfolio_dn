// The archipelago engine: one Game with an ordered frame (input → physics → boat → weather → camera
// → wake → islands → interaction → render). Created on "Set sail", kept alive while the visitor
// reads a case study, so coming back is instant.
import * as THREE from "three/webgpu";
import type { WorldData } from "../data";
import { SPAWN } from "../layout";
import { world, type EngineHandle, type Quality } from "../store";
import type { LiveWeather, WeatherPick } from "../weather-logic";
import { createAtmosphere } from "./atmosphere";
import { createAudio } from "./audio";
import { createBoat } from "./boat";
import { createCamera } from "./camera";
import { createInput } from "./input";
import { createInteractions } from "./interact";
import { createIslands } from "./islands";
import { modelsSettled } from "./islands/loaders";
import { LAYER_VIEW } from "./layers";
import { buildMask } from "./mask";
import { Physics } from "./physics";
import { createRipple } from "./ripple";
import { createShared } from "./shared";
import { createTerrain } from "./terrain";
import { createTextures } from "./textures";
import { createPost } from "./post";
import { createWater, maskTexture } from "./water";
import { createWeather } from "./weather";
import { createWeatherFx } from "./weather-fx";

export type Tier = 1 | 2 | 3;

const STEP = 1 / 60;

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export async function createWorld(canvas: HTMLCanvasElement, data: WorldData, options: { tier: Tier; forceWebGL: boolean; sound: boolean; reduced: boolean; signal?: AbortSignal }): Promise<EngineHandle> {
  const { tier, reduced } = options;
  const { signal } = options;
  const progress = (value: number, message: string) => {
    if (!signal?.aborted) world.set({ progress: value, message });
  };

  progress(0.05, "Filling the sea");
  // Ask the GPU for its real per-shader texture limit: desktops allow far more than WebGPU's
  // portable default of 16, which lets the full tier use triplanar rock.
  let maxTextures = 16;
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ limits: { maxSampledTexturesPerShaderStage: number } } | null> } }).gpu;
  if (gpu && !options.forceWebGL) {
    try {
      const adapter = await gpu.requestAdapter();
      if (adapter) maxTextures = Math.min(48, adapter.limits.maxSampledTexturesPerShaderStage);
    } catch {
      // Fall back to the default limit.
    }
  }
  // Antialiasing happens in the post pipeline (multisampled scene pass, or FXAA on phones).
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    forceWebGL: options.forceWebGL,
    alpha: false,
    ...(maxTextures > 16 ? { requiredLimits: { maxSampledTexturesPerShaderStage: maxTextures } } : {}),
  });
  await renderer.init();
  // Closed (or remounted) while loading: stop here and give the GPU back.
  const alive = () => {
    if (!signal?.aborted) return;
    renderer.dispose();
    throw new DOMException("World creation cancelled", "AbortError");
  };
  alive();
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "webgpu" : "webgl2";
  if (backend === "webgl2") {
    const gl = (renderer.backend as unknown as { gl?: WebGL2RenderingContext }).gl;
    maxTextures = gl ? gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) : 16;
  }
  const rich = maxTextures >= 24;
  world.set({ backend });
  const dprCap = tier === 3 ? 2 : tier === 2 ? 1.5 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  // Clear to transparent: the sea's mirror uses alpha to tell reflected objects from open sky.
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = tier >= 2;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const shared = createShared();
  const textures = createTextures(tier, tier === 3 ? 8 : 4);
  const follow = createCamera();
  const camera = follow.camera;

  await nextFrame();
  alive();
  progress(0.15, "Drawing the shores");
  const mask = buildMask();
  const physics = new Physics(mask);
  const maskTex = maskTexture(mask);
  const ripple = createRipple(renderer, tier === 3 ? 256 : tier === 2 ? 192 : 128);

  await nextFrame();
  alive();
  progress(0.3, "Raising the islands");
  const atmosphere = createAtmosphere(scene, shared, tier, renderer);
  const water = createWater(scene, shared, maskTex, ripple, tier, atmosphere.envTexture, camera);
  const terrain = createTerrain(scene, shared, textures, tier, rich);
  const boat = createBoat(scene, shared, physics, ripple, textures);
  const audio = createAudio();

  await nextFrame();
  alive();
  progress(0.45, "Building the docks");
  const interactions = createInteractions(data, camera);
  const islands = await createIslands({ scene, shared, physics, ripple, renderer, camera, tier, data, interactions, audio, reduced, textures, rich });

  await nextFrame();
  alive();
  progress(0.6, "Checking the sky");
  const weather = createWeather(shared, physics, audio, reduced);
  const weatherFx = createWeatherFx(scene, shared, ripple, tier, audio, maskTex);

  // Start at the spawn, or back at the dock the visitor left from.
  const resume = readResume();
  boat.place(resume?.x ?? SPAWN.x, resume?.z ?? SPAWN.z, resume?.heading ?? SPAWN.heading);
  follow.snap(boat.body.x, boat.body.z);

  let hopQueued = false;
  let paused = false;
  let sailed = false;
  const input = createInput((edge) => {
    if (paused) return;
    if (edge === "hop") hopQueued = true;
    else if (edge === "interact") interactions.activate();
    else if (edge === "horn") audio.horn();
    else if (edge === "options") world.set({ overlay: "options" });
  });

  boat.body.onImpact = (speed) => {
    audio.thud(speed);
    if (speed > 3) follow.kick(Math.min(0.6, speed * 0.08));
  };
  boat.body.onLand = (speed) => {
    audio.splash(speed);
    ripple.drop(boat.body.x, boat.body.z, 3.2, -Math.min(1.4, speed * 0.25));
    weatherFx.spray(boat.body.x, boat.body.y, boat.body.z, speed);
  };

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    follow.resize(width, height);
  };
  resize();
  window.addEventListener("resize", resize);

  let post = createPost(renderer, scene, camera, tier);

  // Build the opening view's shaders before the first visible frame, so the first seconds don't
  // hitch; the rest of the world follows in the background once the visitor is sailing.
  progress(0.68, "Waking the crew");
  weather.update(0, true);
  atmosphere.update(world.get().showing.hour, shared.u.cloud.value, 0, follow.target);
  follow.update(1, boat.body.x, boat.body.z, 0, 0, reduced);
  water.follow(follow.target.x, follow.target.z);
  await modelsSettled();
  alive();
  progress(0.75, "Warming up the shaders");
  await nextFrame();
  alive();
  // For the real (multisampled) target, one compile per top-level object, all at once so the GPU
  // builds several in parallel.
  renderer.setRenderTarget(post.target);
  const parts = [...scene.children];
  let compiled = 0;
  await Promise.all(
    parts.map((part) =>
      renderer.compileAsync(part, camera, scene).then(() => {
        compiled++;
        progress(0.75 + (compiled / parts.length) * 0.17, "Warming up the shaders");
      }),
    ),
  );
  alive();
  renderer.setRenderTarget(null);
  progress(0.92, "Setting sail");
  await nextFrame();
  alive();
  // One real frame, behind the loader, builds the rest of the opening view: the wake simulation,
  // the shadow map, the sea's mirror and the post chain. Pipelines are created at once but
  // compiled on the GPU's own time, so wait for it to finish before the first visible frame.
  ripple.update(boat.body.x, boat.body.z, 1);
  post.render();
  const device = (renderer.backend as unknown as { device?: { queue: { onSubmittedWorkDone(): Promise<void> } } }).device;
  if (device) await device.queue.onSubmittedWorkDone();
  alive();
  await nextFrame();

  /**
   * Everything not in the opening view (islands across the sea, rain, snow, mist, night-only
   * lights) compiles in the background, so it doesn't stall the first time it appears.
   * compileAsync gathers its objects synchronously, so culling and visibility change only for the
   * length of that call. The sea and the sky are always in view (already built) and stay out:
   * the sea's depth copy must only ever run inside a real frame.
   */
  const warmTheRest = () => {
    if (paused) {
      window.setTimeout(warmTheRest, 2000);
      return;
    }
    const culled: THREE.Object3D[] = [];
    const hidden: THREE.Object3D[] = [];
    const shown: THREE.Object3D[] = [];
    const empty: THREE.InstancedBufferGeometry[] = [];
    scene.traverse((o) => {
      if (o.layers.isEnabled(LAYER_VIEW) && o.visible) {
        shown.push(o);
        o.visible = false;
        return;
      }
      if (o.frustumCulled) {
        culled.push(o);
        o.frustumCulled = false;
      }
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
      const g = (o as THREE.Mesh).geometry as THREE.InstancedBufferGeometry | undefined;
      if (g?.isInstancedBufferGeometry && g.instanceCount === 0) {
        empty.push(g);
        g.instanceCount = 1;
      }
    });
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(post.target);
    const done = renderer.compileAsync(scene, camera);
    renderer.setRenderTarget(previous);
    for (const o of culled) o.frustumCulled = true;
    for (const o of hidden) o.visible = false;
    for (const o of shown) o.visible = true;
    for (const g of empty) g.instanceCount = 0;
    void done.catch(() => undefined);
  };
  progress(0.97, "Setting sail");

  let accumulator = 0;
  let last = performance.now();
  let lastRender = 0;
  let fpsFrames = 0;
  let fpsTime = 0;
  let slowWindows = 0;
  let boostAmt = 0;
  let washTimer = 0;
  let measuredTier: Tier = tier;
  let firstFrame = true;
  let firstFrameAt = 0;
  // A cap, not a clock: 60 fps (30 on the light tier) on fast displays. The slack lets a frame
  // that arrives a little early still render, so a 60 Hz display never drops to every other frame.
  const frameBudget = (tier === 1 ? 1000 / 30 : 1000 / 60) * 0.75;

  let statFrames = 0;
  let statCpu = 0;
  let statStart = performance.now();
  const stats = { fps: 0, cpuMs: 0, calls: 0, triangles: 0 };
  const frame = (now: number) => {
    if (paused) return;
    if (now - lastRender < frameBudget) return;
    const cpu0 = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    lastRender = now;

    // Input and physics at a fixed 60 Hz.
    const controls = input.read(boat.body.yaw);
    if (controls.moving && !sailed) {
      sailed = true;
      world.set({ sailed: true });
    }
    accumulator += dt;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      const hopped = boat.control({ ...controls, hop: hopQueued }, STEP);
      if (hopped) audio.hop();
      hopQueued = false;
      islands.step(STEP);
      physics.step(STEP);
      accumulator -= STEP;
      steps++;
    }
    if (steps === 5) accumulator = 0;

    const t = physics.time;
    shared.u.time.value = t;
    boat.update(dt, shared.u.wind.value);
    const view = weather.update(dt, false);
    const night = atmosphere.update(view.hour, shared.u.cloud.value, view.mist, follow.target, dt);
    post.setGlow(0.16 + night * 0.25 + shared.u.flash.value * 0.3);
    // Eyes adapt: nights get a longer exposure so the world stays readable by moonlight.
    renderer.toneMappingExposure = 0.82 + night * 0.55;
    const near = interactions.update(boat.body, dt);
    follow.setMagnet(near?.focus ?? null, near ? 0.32 : 0);
    // Boost reads on screen: the view widens a touch and the bow throws spray.
    const boosting = controls.boost && controls.throttle > 0 && !boat.body.airborne;
    boostAmt += ((boosting ? 1 : 0) - boostAmt) * (1 - Math.exp(-(boosting ? 2.5 : 1.8) * dt));
    follow.setBoost(reduced ? 0 : boostAmt);
    const speed = Math.hypot(boat.body.vx, boat.body.vz);
    washTimer += dt;
    if (boosting && speed > 6 && washTimer > 1 / 24) {
      washTimer = 0;
      const fx = -Math.sin(boat.body.yaw);
      const fz = -Math.cos(boat.body.yaw);
      weatherFx.wash(boat.body.x + fx * 2.1, boat.body.y, boat.body.z + fz * 2.1, fx, fz, speed);
    }
    follow.update(dt, boat.body.x, boat.body.z, boat.body.vx, boat.body.vz, reduced);
    water.follow(follow.target.x, follow.target.z);
    ripple.update(boat.body.x, boat.body.z, dt > 1 / 45 ? 2 : 1);
    islands.update(dt, t, night, boat.body);
    weatherFx.update(dt, t, follow.target, boat.body, weather.current);
    audio.update(dt, { speed, throttle: Math.abs(controls.throttle), boost: controls.boost, rain: shared.u.rain.value, wind: shared.u.wind.value, airborne: boat.body.airborne });
    interactions.place(camera, canvas);

    post.render();
    statFrames++;
    statCpu += performance.now() - cpu0;
    if (now - statStart > 1000) {
      stats.fps = Math.round((statFrames * 1000) / (now - statStart));
      stats.cpuMs = Math.round((statCpu / statFrames) * 10) / 10;
      const info = renderer.info.render as unknown as { drawCalls?: number; calls?: number; triangles?: number };
      stats.calls = info.drawCalls ?? info.calls ?? 0;
      stats.triangles = info.triangles ?? 0;
      statFrames = 0;
      statCpu = 0;
      statStart = now;
    }
    if (firstFrame) {
      firstFrame = false;
      firstFrameAt = now;
      world.set({ status: "running", progress: 1, message: "" });
      window.setTimeout(warmTheRest, 1500);
    }

    // Auto quality: after a warm-up (late models and their shaders arrive in the first seconds),
    // two slow windows in a row step down a tier and lighten the load now.
    if (now - firstFrameAt < 6000) return;
    fpsFrames++;
    fpsTime += dt;
    if (fpsTime > 3 && world.get().quality === "auto") {
      const fps = fpsFrames / fpsTime;
      slowWindows = fps < 40 ? slowWindows + 1 : 0;
      if (slowWindows >= 2 && measuredTier > 1) {
        slowWindows = 0;
        measuredTier = (measuredTier - 1) as Tier;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, measuredTier === 2 ? 1.25 : 1));
        weatherFx.setDensity(measuredTier === 1 ? 0.35 : 0.65);
        water.setMirror(false);
        post.dispose();
        post = createPost(renderer, scene, camera, measuredTier);
        if (measuredTier === 1) {
          renderer.shadowMap.enabled = false;
          atmosphere.sun.castShadow = false;
        }
        world.set({ tier: measuredTier });
      }
      fpsFrames = 0;
      fpsTime = 0;
    }
  };
  renderer.setAnimationLoop(frame);

  const saveResume = () => {
    try {
      sessionStorage.setItem("dn-world-boat", JSON.stringify({ x: boat.body.x, z: boat.body.z, heading: boat.body.yaw }));
    } catch {
      // Storage can be unavailable; the boat simply starts at the spawn.
    }
  };

  if (options.sound) audio.enable();

  const handle: EngineHandle = {
    setPaused(next) {
      if (paused === next) return;
      paused = next;
      input.setEnabled(!next);
      if (next) {
        saveResume();
        audio.suspend();
      } else {
        last = performance.now();
        accumulator = 0;
        if (world.get().sound) audio.enable();
        resize();
      }
    },
    setSound(on) {
      if (on) audio.enable();
      else audio.disable();
    },
    setQuality(q: Quality) {
      const target = q === "auto" ? tier : q;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, target === 3 ? 2 : target === 2 ? 1.5 : 1));
      weatherFx.setDensity(target === 3 ? 1 : target === 2 ? 0.65 : 0.35);
      renderer.shadowMap.enabled = target >= 2;
      atmosphere.sun.castShadow = target >= 2;
      world.set({ tier: target });
    },
    setPick(pick: WeatherPick) {
      weather.setPick(pick);
    },
    setLive(live: LiveWeather) {
      weather.setLive(live);
    },
    travelTo(id) {
      const spot = interactions.berthFor(id);
      if (!spot) return;
      boat.place(spot.x, spot.z, spot.heading);
      follow.snap(spot.x, spot.z);
      ripple.drop(spot.x, spot.z, 4, 0.8);
      audio.splash(4);
    },
    interact() {
      interactions.activate();
    },
    setStick(x, y, active) {
      input.setStick(x, y, active);
    },
    setButton(name, down) {
      input.setButton(name, down);
    },
    setPromptElement(element) {
      interactions.setPromptElement(element);
    },
    boat() {
      return { x: boat.body.x, z: boat.body.z, heading: boat.body.yaw };
    },
    zoom(delta) {
      follow.zoom(delta);
    },
    horn() {
      audio.horn();
    },
    resize,
    stats() {
      return { ...stats };
    },
    dispose() {
      saveResume();
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      input.dispose();
      audio.dispose();
      islands.dispose();
      weatherFx.dispose();
      water.dispose();
      terrain.dispose();
      post.dispose();
      atmosphere.dispose();
      ripple.dispose();
      boat.dispose();
      maskTex.dispose();
      shared.palette.dispose();
      textures.dispose();
      renderer.dispose();
    },
  };
  return handle;
}

function readResume(): { x: number; z: number; heading: number } | null {
  try {
    const raw = sessionStorage.getItem("dn-world-boat");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x: number; z: number; heading: number };
    if (![parsed.x, parsed.z, parsed.heading].every(Number.isFinite)) return null;
    return parsed;
  } catch {
    return null;
  }
}
