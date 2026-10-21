import * as THREE from "three";
import { STATION_DEPTH as D, type DepthPlane } from "./types";

// The flight's scene: one camera moving down -z through a quiet void. Each station's plane hangs at
// DIST in front of the camera's resting point; where it hangs on screen comes from the overlay's own
// box (CSS), so the HTML and the WebGL line up at every viewport size. Lazy-loaded with three after
// the visitor engages; nothing here renders text.

/** A plane's distance from its station's resting camera. */
const DIST = 6;
/** The X's distance from the opening camera. */
const X_DIST = 6.5;
/** Fog and focus ranges, in view depth: the current plane is crisp, the next one a grey silhouette. */
const RANGE = new THREE.Vector4(8, 23.5, 7.5, 17);
const VOID = new THREE.Color("#070708");
/** Pointer parallax, in world units at full deflection. */
const PAR_X = 0.3;
const PAR_Y = 0.16;
/** How far a hovered plane turns toward the cursor, in radians. */
const TILT = 0.11;
/** Frames, crop marks and gates, in CSS pixels at the plane's distance. */
const FRAME_GAP = 10;
const MARK_GAP = 10;
const MARK_ARM = 18;

export type SceneFrame = {
  /** Camera position, in stations (smoothed), and its velocity in stations per second. */
  c: number;
  vel: number;
  /** Smoothed pointer, -1…1. */
  px: number;
  py: number;
  dt: number;
  /** Raw pointer in normalised device coordinates, and whether it is over the scene itself. */
  mx: number;
  my: number;
  over: boolean;
};

export type DepthScene = {
  /** Draws one frame; true while something is still moving (a fade, a tilt, the video, the X). */
  frame: (s: SceneFrame) => boolean;
  /** Re-reads the canvas size and every overlay box. */
  layout: () => void;
  /** What sits under a click or tap: a plane's key, "x" for the mascot, or null. */
  pick: (mx: number, my: number) => string | null;
  /** Off while the tab is hidden or the flight is off screen: the reel pauses. */
  setRunning: (on: boolean) => void;
  dispose: () => void;
};

type Options = {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  planes: DepthPlane[];
  /** The station coordinate where the flight ends. */
  exit: number;
  box: (key: string) => HTMLElement | null;
  xBox: HTMLElement | null;
  maxDpr: number;
  onHover: (key: string | null) => void;
  /** A plane's texture is up: its HTML poster can go. */
  onReady: (key: string) => void;
  onXReady: () => void;
  onLost: () => void;
  /** Asks the journey for another frame (a texture arrived). */
  invalidate: () => void;
};

const VERT = /* glsl */ `
uniform float uBend;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  // Speed bends the sheet: the middle falls back, the edges lead.
  p.z -= sin(uv.x * 3.14159265) * uBend;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uReady;
uniform float uHover;
uniform vec3 uVoid;
uniform vec4 uRange;
varying vec2 vUv;
varying float vDepth;
void main() {
  vec3 c = mix(uVoid, texture2D(uMap, vUv).rgb, uReady);
  // Focus by distance: far planes are grey and dim, the one you reach is in full colour.
  float focus = 1.0 - smoothstep(uRange.z, uRange.w, vDepth);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 0.18 + 0.82 * focus);
  c *= (0.45 + 0.55 * focus) * (1.0 + 0.07 * uHover);
  c = mix(c, uVoid, smoothstep(uRange.x, uRange.y, vDepth));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

type Plane = {
  spec: DepthPlane;
  holder: THREE.Group;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  frame: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  marks: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  rotY: number;
  tilt: THREE.Vector2;
  tiltTo: THREE.Vector2;
  hover: number;
  ready: number;
  state: "idle" | "loading" | "loaded";
  texture?: THREE.Texture;
};

type Mascot = {
  holder: THREE.Group;
  turn: THREE.Group;
  hit: THREE.Mesh;
  height: number;
  mixer: THREE.AnimationMixer;
  play: (name: string) => void;
  busy: () => boolean;
  eyes: { node: THREE.Object3D; rest: THREE.Vector3 }[];
  dispose: () => void;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function radial(inner: string, outer: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** An element's box relative to the stage, ignoring the overlay's own transforms. */
function restRect(el: HTMLElement, stage: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== stage) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export async function createScene(o: Options): Promise<DepthScene> {
  const renderer = new THREE.WebGLRenderer({
    canvas: o.canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(VOID, 1);
  // Neutral tone mapping for the X keeps the brand red red; the planes and lines opt out.
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(VOID, RANGE.x, RANGE.y);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const look = new THREE.Vector3();

  const blank = new THREE.DataTexture(new Uint8Array([7, 7, 8, 255]), 1, 1);
  blank.needsUpdate = true;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let disposed = false;
  let running = true;
  let W = 1;
  let H = 1;
  let tanHalf = Math.tan(THREE.MathUtils.degToRad(18));
  let bend = 0;

  // ---------- Planes ----------
  const planeGeometry = new THREE.PlaneGeometry(1, 1, 32, 1);
  const planes: Plane[] = o.planes.map((spec) => {
    const holder = new THREE.Group();
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: blank },
        uReady: { value: 0 },
        uHover: { value: 0 },
        uBend: { value: 0 },
        uVoid: { value: VOID },
        uRange: { value: RANGE },
      },
    });
    const mesh = new THREE.Mesh(planeGeometry, material);
    mesh.userData.key = spec.key;
    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: spec.accent, transparent: true, opacity: 0.6, toneMapped: false }),
    );
    const marks = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xf2f1ee, transparent: true, opacity: 0.3, toneMapped: false }),
    );
    holder.add(mesh, frame, marks);
    scene.add(holder);
    // Planes hang on the walls of the corridor, turned slightly toward its middle.
    return {
      spec,
      holder,
      mesh,
      frame,
      marks,
      rotY: spec.side * -0.15,
      tilt: new THREE.Vector2(),
      tiltTo: new THREE.Vector2(),
      hover: 0,
      ready: 0,
      state: "idle",
    };
  });

  // ---------- Gates: corner brackets between stations, so passing through space reads as motion ----------
  const gateMaterial = new THREE.LineBasicMaterial({ color: 0xf2f1ee, transparent: true, opacity: 0.2, toneMapped: false });
  const gateGeometry = new THREE.BufferGeometry();
  {
    const a = 0.09;
    const pts: number[] = [];
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        pts.push(sx, sy, 0, sx - sx * a, sy, 0);
        pts.push(sx, sy, 0, sx, sy - sy * a * 1.6, 0);
      }
    gateGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }
  const gates: THREE.LineSegments[] = [];
  for (let k = 0; k < o.exit; k++) {
    const gate = new THREE.LineSegments(gateGeometry, gateMaterial);
    gate.position.z = -(k + 0.5) * D;
    scene.add(gate);
    gates.push(gate);
  }

  // ---------- The reel's video, attached only near its station ----------
  const reel = planes.find((p) => p.spec.kind === "reel");
  let video: HTMLVideoElement | null = null;
  let videoTexture: THREE.VideoTexture | null = null;
  let videoPlaying = false;
  const ensureVideo = (src: string) => {
    if (video) return video;
    const v = document.createElement("video");
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.setAttribute("aria-hidden", "true");
    v.setAttribute("tabindex", "-1");
    v.className = "dp-video";
    v.src = src;
    v.addEventListener("playing", () => {
      videoPlaying = true;
      if (!videoTexture && reel) {
        videoTexture = new THREE.VideoTexture(v);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        reel.mesh.material.uniforms.uMap.value = videoTexture;
        reel.state = "loaded";
        o.onReady(reel.spec.key);
      }
      o.invalidate();
    });
    v.addEventListener("pause", () => {
      videoPlaying = false;
    });
    o.stage.appendChild(v);
    video = v;
    return v;
  };

  // ---------- Textures, by distance ----------
  const load = (p: Plane) => {
    p.state = "loading";
    const done = (texture: THREE.Texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = aniso;
      p.texture = texture;
      // The video may have taken the reel's plane already.
      if (p.mesh.material.uniforms.uMap.value === blank) p.mesh.material.uniforms.uMap.value = texture;
      p.state = "loaded";
      renderer.initTexture(texture);
      o.onReady(p.spec.key);
      o.invalidate();
    };
    const fallback = () => {
      new THREE.TextureLoader().load(p.spec.src, done, undefined, () => {
        p.state = "idle";
      });
    };
    if (typeof createImageBitmap !== "function") return fallback();
    // Decoded off the main thread.
    new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }).load(
      p.spec.src,
      (bitmap) => {
        const texture = new THREE.Texture(bitmap as unknown as HTMLImageElement);
        texture.flipY = false;
        texture.needsUpdate = true;
        done(texture);
      },
      undefined,
      fallback,
    );
  };

  // ---------- The X, standing at the start ----------
  let mascot: Mascot | null = null;
  let greeted = false;
  let lastWave = 0;
  let awakeUntil = 0;
  let lastMx = 0;
  let lastMy = 0;
  const xLook = new THREE.Vector2();
  const pointerTo = new THREE.Vector2();

  const layoutX = () => {
    if (!mascot || !o.xBox) return;
    const r = restRect(o.xBox, o.stage);
    if (!r.w || !r.h) return;
    const hh = X_DIST * tanHalf;
    const hw = hh * (W / H);
    const cx = ((r.x + r.w / 2) / W) * 2 - 1;
    const feet = 1 - ((r.y + r.h * 0.97) / H) * 2;
    const height = (r.h / H) * 2 * hh * 0.86;
    mascot.holder.position.set(cx * hw, feet * hh, -X_DIST);
    mascot.holder.scale.setScalar(height / mascot.height);
  };

  const loadX = async () => {
    const [{ GLTFLoader }, { DRACOLoader }, { roomEnvironment }] = await Promise.all([
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/loaders/DRACOLoader.js"),
      import("@/features/exhibits/room-environment"),
    ]);
    if (disposed) return;
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    const [env, gltf] = await Promise.all([
      roomEnvironment(renderer),
      new GLTFLoader().setDRACOLoader(draco).loadAsync("/models/dn-x/dn-x.glb"),
    ]);
    draco.dispose();
    if (disposed) {
      env.dispose();
      return;
    }
    scene.environment = env;
    scene.environmentIntensity = 0.42;

    const model = gltf.scene;
    model.traverse((n) => {
      if ((n as THREE.Mesh).isMesh) n.frustumCulled = false;
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    model.position.y = -bounds.min.y;
    const turn = new THREE.Group();
    turn.add(model);
    const holder = new THREE.Group();
    holder.add(turn);

    // A pool of light on an unseen floor, and the X's contact shadow inside it.
    const poolTexture = radial("rgba(255,255,255,0.9)", "rgba(255,255,255,0)");
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: poolTexture,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.scale.setScalar(size.x * 3.2);
    const shadowTexture = radial("rgba(0,0,0,0.85)", "rgba(0,0,0,0)");
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    shadow.scale.set(size.x * 1.25, size.x * 0.9, 1);
    holder.add(pool, shadow);

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(size.x * 1.1, size.y, Math.max(size.z, 0.2)),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = size.y / 2;
    hit.userData.key = "x";
    holder.add(hit);

    const key = new THREE.DirectionalLight(0xfff4ea, 2.6);
    key.position.set(-1.6, 2.6, 2.4);
    const rim = new THREE.DirectionalLight(0xffffff, 1.8);
    rim.position.set(1.8, 1.4, -1.8);
    key.target = holder;
    rim.target = holder;
    holder.add(key, rim);
    scene.add(holder, new THREE.HemisphereLight(0xffffff, 0x0b0b0d, 0.35));

    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map(gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
    for (const name of ["Wave", "Jump", "Spin"]) {
      const action = actions.get(name);
      if (!action) continue;
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }
    const idle = actions.get("Idle");
    let current = idle;
    current?.play();
    const play = (name: string) => {
      const next = actions.get(name);
      if (!next) return;
      if (next === current && (name === "Idle" || next.isRunning())) return;
      next.reset().setEffectiveWeight(1).play();
      if (current && current !== next) current.crossFadeTo(next, 0.25, false);
      current = next;
      awakeUntil = performance.now() + 6000;
      o.invalidate();
    };
    mixer.addEventListener("finished", (event) => {
      if (event.action === current) play("Idle");
    });
    const eyes = ["eyeL", "eyeR"]
      .map((n) => model.getObjectByName(n))
      .filter((n): n is THREE.Object3D => Boolean(n))
      .map((node) => ({ node, rest: node.position.clone() }));

    mascot = {
      holder,
      turn,
      hit,
      height: size.y,
      mixer,
      play,
      busy: () => Boolean(current && current !== idle && current.isRunning()),
      eyes,
      dispose: () => {
        mixer.stopAllAction();
        poolTexture.dispose();
        shadowTexture.dispose();
        env.dispose();
      },
    };
    layoutX();
    // Compiled before it is shown, so the first frame with the X doesn't stall.
    await renderer.compileAsync(scene, camera);
    if (disposed) return;
    o.onXReady();
    o.invalidate();
  };

  // ---------- Layout: every plane where its overlay's box says ----------
  const layout = () => {
    const w = o.stage.clientWidth;
    const h = o.stage.clientHeight;
    if (!w || !h) return;
    W = w;
    H = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.maxDpr));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // Portrait screens get a wider lens, so a plane still fills the width at the same distance.
    camera.fov = camera.aspect >= 1 ? 36 : 50;
    camera.updateProjectionMatrix();
    tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // Portrait screens set text over the next plane's silhouette, so the fog closes sooner there.
    RANGE.y = camera.aspect >= 1 ? 23.5 : 20.5;
    if (scene.fog instanceof THREE.Fog) scene.fog.far = RANGE.y;

    const hh = DIST * tanHalf;
    const hw = hh * camera.aspect;
    const unit = (2 * hh) / H;
    for (const p of planes) {
      const el = o.box(p.spec.key);
      if (!el) continue;
      const r = restRect(el, o.stage);
      if (!r.w || !r.h) continue;
      // The box's edges as tangents from the camera. A turned plane has one edge nearer than the
      // other, so solve for the width and centre whose projected edges land exactly on the box.
      const ta = (((r.x / W) * 2 - 1) * hw) / DIST;
      const tb = ((((r.x + r.w) / W) * 2 - 1) * hw) / DIST;
      const sin = Math.sin(p.rotY);
      const cos = Math.cos(p.rotY);
      const half = ((tb - ta) * DIST) / (2 * cos - (ta + tb) * sin);
      const cx = tb * (DIST + half * sin) - half * cos;
      const cy = 1 - ((r.y + r.h / 2) / H) * 2;
      const pw = half * 2;
      const ph = pw * (r.h / r.w);
      p.holder.position.set(cx, cy * hh, -p.spec.at * D - DIST);
      p.mesh.scale.set(pw, ph, 1);

      const fx = pw / 2 + FRAME_GAP * unit;
      const fy = ph / 2 + FRAME_GAP * unit;
      p.frame.geometry.setFromPoints([
        new THREE.Vector3(-fx, -fy, 0),
        new THREE.Vector3(fx, -fy, 0),
        new THREE.Vector3(fx, fy, 0),
        new THREE.Vector3(-fx, fy, 0),
      ]);
      const g = MARK_GAP * unit;
      const a = MARK_ARM * unit;
      const pts: THREE.Vector3[] = [];
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          pts.push(new THREE.Vector3(sx * (fx + g), sy * fy, 0), new THREE.Vector3(sx * (fx + g + a), sy * fy, 0));
          pts.push(new THREE.Vector3(sx * fx, sy * (fy + g), 0), new THREE.Vector3(sx * fx, sy * (fy + g + a), 0));
        }
      p.marks.geometry.setFromPoints(pts);
    }
    // Gates sit just outside the frame when you rest between them, and sweep past as you move.
    const gh = (D / 2) * tanHalf * 1.07;
    for (const gate of gates) gate.scale.set(gh * camera.aspect, gh, 1);
    layoutX();
  };

  // ---------- Picking ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: string | null = null;
  let lastC = 0;
  const targets = () => {
    const list: THREE.Object3D[] = [];
    for (const p of planes) if (Math.abs(lastC - p.spec.at) < 0.55) list.push(p.mesh);
    if (mascot && lastC < 0.5) list.push(mascot.hit);
    return list;
  };
  const cast = (mx: number, my: number) => {
    ndc.set(mx, my);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(targets(), false)[0];
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    o.onLost();
  };
  o.canvas.addEventListener("webglcontextlost", onLost);

  layout();
  await renderer.compileAsync(scene, camera);

  const frame = (s: SceneFrame): boolean => {
    if (disposed) return false;
    lastC = s.c;
    let busy = false;
    const k = 1 - Math.exp(-s.dt * 7);
    const now = performance.now();

    // Camera: the scroll's depth, plus a little parallax from the pointer.
    const z = -s.c * D;
    camera.position.set(s.px * PAR_X, s.py * PAR_Y, z);
    look.set(s.px * PAR_X * 0.4, s.py * PAR_Y * 0.4, z - 10);
    camera.lookAt(look);

    // Hover: the plane under the cursor turns toward it.
    let hit: THREE.Intersection | undefined;
    if (s.over) hit = cast(s.mx, s.my);
    const hitKey = (hit?.object.userData.key as string | undefined) ?? null;
    if (hitKey !== hovered) {
      hovered = hitKey;
      o.onHover(hovered);
      if (hovered === "x" && mascot && now - lastWave > 4000) {
        lastWave = now;
        mascot.play("Wave");
      }
    }

    bend += (THREE.MathUtils.clamp(s.vel * 0.06, -0.32, 0.32) - bend) * k;
    if (Math.abs(bend) > 0.002) busy = true;

    for (const p of planes) {
      const d = s.c - p.spec.at;
      if (p.state === "idle" && d > -1.7 && d < 1.2) load(p);
      p.holder.visible = d > -2.4 && d < 0.9;
      if (!p.holder.visible) continue;

      if (hit && hovered === p.spec.key && hit.uv) {
        p.tiltTo.set(-(hit.uv.y - 0.5) * 2 * TILT * 0.7, (hit.uv.x - 0.5) * 2 * TILT);
      } else p.tiltTo.set(0, 0);
      p.tilt.lerp(p.tiltTo, k);
      const hoverTo = hovered === p.spec.key ? 1 : 0;
      p.hover += (hoverTo - p.hover) * k;
      if (p.tilt.distanceTo(p.tiltTo) > 1e-4 || Math.abs(p.hover - hoverTo) > 1e-3) busy = true;
      if (p.state === "loaded" && p.ready < 1) {
        p.ready = Math.min(1, p.ready + s.dt / 0.8);
        busy = true;
      }

      p.holder.rotation.set(p.tilt.x, p.rotY + p.tilt.y, 0);
      p.holder.scale.setScalar(1 + p.hover * 0.012);
      const u = p.mesh.material.uniforms;
      u.uReady.value = smooth(p.ready);
      u.uHover.value = p.hover;
      u.uBend.value = bend;
      p.frame.material.opacity = (0.5 + 0.5 * p.hover) * (0.35 + 0.65 * smooth(p.ready));
      p.marks.material.opacity = 0.18 + 0.22 * p.hover;
    }

    // The reel plays only while the camera is near it.
    if (reel?.spec.video) {
      const near = Math.abs(s.c - reel.spec.at) < 0.7;
      if (near && running) {
        const v = ensureVideo(reel.spec.video);
        if (v.paused) void v.play().catch(() => undefined);
      } else if (video && !video.paused) video.pause();
      if (near && videoPlaying) busy = true;
    }

    // The X: greets once, then idles while someone is around; it rests when nothing happens.
    if (mascot) {
      const atStart = s.c < 0.9;
      mascot.holder.visible = s.c < 1.2;
      if (atStart && !greeted && s.c < 0.4) {
        greeted = true;
        mascot.play("Wave");
      }
      // Awake while the camera moves or the pointer does (not merely rests on the canvas).
      if (Math.abs(s.vel) > 0.002 || s.mx !== lastMx || s.my !== lastMy) awakeUntil = Math.max(awakeUntil, now + 6000);
      if (atStart && (now < awakeUntil || mascot.busy())) {
        mascot.mixer.update(Math.min(s.dt, 1 / 20));
        busy = true;
      }
      xLook.lerp(pointerTo.set(s.px, s.py), k);
      mascot.turn.rotation.y = -0.18 + xLook.x * 0.32;
      for (const eye of mascot.eyes) {
        eye.node.position.copy(eye.rest);
        eye.node.position.x += xLook.x * 0.006;
        eye.node.position.y += xLook.y * 0.006;
      }
    }

    lastMx = s.mx;
    lastMy = s.my;
    renderer.render(scene, camera);
    return busy;
  };

  // Start the X once the first frame is up; it's only seen at the start.
  if (o.xBox) void loadX().catch(() => undefined);

  return {
    frame,
    layout,
    pick(mx, my) {
      const hit = cast(mx, my);
      const key = (hit?.object.userData.key as string | undefined) ?? null;
      if (key === "x") mascot?.play("Spin");
      return key;
    },
    setRunning(on) {
      running = on;
      if (!on && video && !video.paused) video.pause();
    },
    dispose() {
      disposed = true;
      o.canvas.removeEventListener("webglcontextlost", onLost);
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.remove();
      }
      videoTexture?.dispose();
      mascot?.dispose();
      for (const p of planes) {
        if (p.texture) {
          const image = p.texture.image as { close?: () => void } | undefined;
          p.texture.dispose();
          image?.close?.();
        }
        p.mesh.material.dispose();
        p.frame.geometry.dispose();
        p.frame.material.dispose();
        p.marks.geometry.dispose();
        p.marks.material.dispose();
      }
      planeGeometry.dispose();
      gateGeometry.dispose();
      gateMaterial.dispose();
      blank.dispose();
      scene.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const material = mesh.material;
        for (const m of Array.isArray(material) ? material : material ? [material] : []) m.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
