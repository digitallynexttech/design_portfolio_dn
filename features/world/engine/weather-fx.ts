// Weather you can see: rain streaks, snowflakes, spring petals and autumn leaves, wind lines, spray
// and low mist. Particles live entirely on the GPU: each one's position is a function of its index
// and the time, wrapped in a box around the camera, so nothing is updated on the CPU per frame.
import * as THREE from "three/webgpu";
import {
  cameraPosition,
  cos,
  float,
  fract,
  hash,
  instanceIndex,
  mix,
  mod,
  mx_noise_float,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import type { Audio } from "./audio";
import { detail } from "./layers";
import type { Body } from "./physics";
import type { Ripple } from "./ripple";
import type { Shared } from "./shared";
import { MASK_EXTENT } from "./mask";
import type { N } from "./tsl";
import type { WeatherTargets } from "../weather-logic";

type Layer = { mesh: THREE.Mesh; geometry: THREE.InstancedBufferGeometry; max: number; amount: number };

function instanced(base: THREE.BufferGeometry, max: number): THREE.InstancedBufferGeometry {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.attributes.position);
  geometry.setAttribute("uv", base.attributes.uv);
  geometry.instanceCount = 0;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  void max;
  return geometry;
}

export function createWeatherFx(scene: THREE.Scene, shared: Shared, ripple: Ripple, tier: 1 | 2 | 3, _audio: Audio, maskTex: THREE.Texture) {
  const { u } = shared;
  const focus = uniform(new THREE.Vector3());
  const scale = tier === 3 ? 1 : tier === 2 ? 0.6 : 0.3;
  let density = 1;
  const layers: Layer[] = [];

  /** A falling layer: per-index random start, wrapped around the focus. */
  function falling(opts: {
    max: number;
    width: number;
    height: number;
    box: [number, number, number];
    speed: [number, number];
    color: N;
    opacity: N;
    sway: number;
    shear: number;
    tumble?: boolean;
    /** Only show near islands (leaves fall from trees, not from the open sky). */
    landOnly?: boolean;
    /** Soft round flakes instead of square quads. */
    round?: boolean;
  }): Layer {
    const geometry = instanced(new THREE.PlaneGeometry(opts.width, opts.height), opts.max);
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const id = instanceIndex.toFloat();
    const r1 = hash(id.mul(1.37).add(0.11));
    const r2 = hash(id.add(17.13));
    const r3 = hash(id.mul(0.71).add(41.3));
    const r4 = hash(id.add(91.7));
    const span = vec3(...opts.box);
    const speed = mix(float(opts.speed[0]), float(opts.speed[1]), r4);
    const fall = fract(r2.sub(u.time.mul(speed).div(span.y)));
    const y = fall.mul(span.y);
    const base = vec2(r1, r3).mul(span.xz);
    const wrapped = mod(base.sub(focus.xz).add(span.xz.mul(0.5)), span.xz).sub(span.xz.mul(0.5)).add(focus.xz);
    const drift = u.windDir.mul(u.wind.mul(float(1).sub(fall)).mul(span.y).mul(0.22));
    const swayX = sin(u.time.mul(1.3).add(r1.mul(6.283))).mul(opts.sway);
    const swayZ = cos(u.time.mul(1.1).add(r3.mul(6.283))).mul(opts.sway);
    let local: N = positionLocal;
    if (opts.tumble) {
      const a = u.time.mul(r4.mul(2).add(1)).add(r1.mul(6.28));
      const ca = cos(a);
      const sa = sin(a);
      local = vec3(local.x.mul(ca).sub(local.y.mul(sa)), local.x.mul(sa).add(local.y.mul(ca)).mul(0.5), local.y.mul(sa).mul(0.6));
    }
    // Rain leans with the wind.
    const leaned = vec3(local.x.add(local.y.mul(u.wind).mul(opts.shear)), local.y, local.z);
    const world = vec3(wrapped.x.add(drift.x).add(swayX), y, wrapped.y.add(drift.y).add(swayZ));
    material.positionNode = world.add(leaned);
    // Lit by the sky like everything else (a leaf at night is dark, not glowing), each a shade apart.
    const shade = hash(instanceIndex.toFloat().add(5.1)).mul(0.45).add(0.6);
    material.colorNode = opts.color.mul(shade).mul(u.sunColor.mul(u.sunI).mul(0.2).add(u.ambient.mul(0.9)));
    // Fade in at the top of the box and out near the water.
    let opacity: N = opts.opacity.mul(smoothstep(0.0, 0.08, fall)).mul(float(1).sub(smoothstep(0.85, 1.0, fall)));
    if (opts.round) opacity = opacity.mul(float(1).sub(smoothstep(0.3, 0.5, uv().sub(0.5).length())));
    if (opts.landOnly) {
      const near = texture(maskTex, world.xz.add(MASK_EXTENT / 2).div(MASK_EXTENT)).level(float(0)).r;
      opacity = opacity.mul(smoothstep(0.5, 0.9, near));
    }
    // Nothing streaks across the lens: particles fade out close to the camera.
    opacity = opacity.mul(smoothstep(8, 20, world.sub(cameraPosition).length()));
    material.opacityNode = opacity;
    const mesh = detail(new THREE.Mesh(geometry, material));
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    scene.add(mesh);
    const layer = { mesh, geometry, max: Math.round(opts.max * scale), amount: 0 };
    layers.push(layer);
    return layer;
  }

  const rain = falling({
    max: 7000,
    width: 0.035,
    height: 1.1,
    box: [90, 46, 90],
    speed: [24, 30],
    color: mix(vec3(0.75, 0.82, 0.92), vec3(0.42, 0.5, 0.62), u.night),
    opacity: float(0.42),
    sway: 0,
    shear: 0.45,
  });
  const snow = falling({
    max: 5000,
    width: 0.08,
    height: 0.08,
    round: true,
    box: [90, 40, 90],
    speed: [1.6, 2.8],
    color: vec3(0.96, 0.97, 1),
    opacity: float(0.9),
    sway: 0.6,
    shear: 0,
  });
  const seasonColor = uniform(new THREE.Color("#f3a9c4"));
  const petals = falling({
    max: 900,
    width: 0.22,
    height: 0.15,
    box: [70, 22, 70],
    speed: [0.8, 1.6],
    color: seasonColor,
    opacity: float(0.95),
    sway: 1.4,
    shear: 0,
    tumble: true,
    landOnly: true,
  });

  // Wind lines: long thin streaks racing along the wind, only when it blows hard.
  const windGeometry = instanced(new THREE.PlaneGeometry(3.2, 0.03), 60);
  const windMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
  {
    const id = instanceIndex.toFloat();
    const r1 = hash(id.add(3.3));
    const r2 = hash(id.mul(2.1).add(9.9));
    const r3 = hash(id.add(31.7));
    const life = fract(u.time.mul(0.35).add(r1));
    const along = u.windDir.mul(life.sub(0.5).mul(70));
    const across = vec2(u.windDir.y.negate(), u.windDir.x).mul(r2.sub(0.5).mul(80));
    const p = focus.xz.add(along).add(across);
    // Orient the streak along the wind.
    const angle = u.windDir.y.negate().atan(u.windDir.x);
    const lx = positionLocal.x.mul(cos(angle));
    const lz = positionLocal.x.mul(sin(angle));
    windMat.positionNode = vec3(p.x.add(lx), r3.mul(4).add(1.2).add(positionLocal.y), p.y.sub(lz));
    windMat.colorNode = vec3(0.95, 0.97, 1);
    windMat.opacityNode = sin(life.mul(Math.PI)).mul(0.16).mul(smoothstep(0.45, 0.9, u.wind)).mul(sin(uv().x.mul(Math.PI)));
  }
  const windMesh = detail(new THREE.Mesh(windGeometry, windMat));
  windMesh.frustumCulled = false;
  windMesh.renderOrder = 5;
  scene.add(windMesh);

  // Spray: a small CPU pool for splashes and bow spray.
  const SPRAY = 140;
  const sprayMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  sprayMat.colorNode = mix(vec3(0.97, 0.98, 1), u.teal.mul(1.4), u.night.mul(0.6));
  sprayMat.opacityNode = float(0.85);
  const spray = detail(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), sprayMat, SPRAY));
  spray.frustumCulled = false;
  spray.count = SPRAY;
  const drops = Array.from({ length: SPRAY }, () => ({ x: 0, y: -50, z: 0, vx: 0, vy: 0, vz: 0, life: 0 }));
  let cursor = 0;
  const m = new THREE.Matrix4();
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < SPRAY; i++) spray.setMatrixAt(i, hidden);
  scene.add(spray);

  // Mist: a few soft sheets low over the water (not on the lightest tier).
  let mist: THREE.Mesh | null = null;
  const mistAmount = uniform(0);
  if (tier >= 2) {
    const mistMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    const n = mx_noise_float(vec3(positionWorld.xz.mul(0.035), u.time.mul(0.03))).mul(0.5).add(0.5);
    const radial = float(1).sub(smoothstep(40, 120, positionWorld.xz.sub(focus.xz).length()));
    mistMat.colorNode = u.fogColor;
    mistMat.opacityNode = smoothstep(0.3, 0.8, n).mul(radial).mul(0.55).mul(mistAmount);
    const mistGeometry = new THREE.PlaneGeometry(260, 260, 1, 1);
    mistGeometry.rotateX(-Math.PI / 2);
    mist = new THREE.Mesh(mistGeometry, mistMat);
    mist.position.y = 2.2;
    mist.renderOrder = 4;
    mist.frustumCulled = false;
    mist.visible = false;
    scene.add(mist);
  }

  let rainTimer = 0;
  const leafSpring = new THREE.Color("#f3a9c4");
  const leafAutumn = new THREE.Color("#e0782e");

  function emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number) {
    const d = drops[cursor];
    cursor = (cursor + 1) % SPRAY;
    Object.assign(d, { x, y, z, vx, vy, vz, life });
  }

  return {
    setDensity(next: number) {
      density = next;
    },
    spray(x: number, y: number, z: number, speed: number) {
      const n = Math.min(40, 8 + Math.round(speed * 4));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * speed * 0.6;
        emit(x, y + 0.3, z, Math.cos(a) * s, 2 + Math.random() * speed * 0.7, Math.sin(a) * s, 0.8 + Math.random() * 0.5);
      }
    },
    /** Spray thrown off both sides of the bow at speed (boosting). */
    wash(x: number, y: number, z: number, fx: number, fz: number, speed: number) {
      for (const side of [-1, 1]) {
        const out = 1.2 + Math.random() * 1.6;
        emit(x + fz * side * 0.7, y + 0.15, z - fx * side * 0.7, fz * side * out + fx * speed * 0.35, 1.6 + Math.random() * 1.4, -fx * side * out + fz * speed * 0.35, 0.5 + Math.random() * 0.4);
      }
    },
    update(dt: number, t: number, target: THREE.Vector3, boat: Body, w: WeatherTargets & { season: string }) {
      focus.value.set(target.x, 0, target.z);
      void t;
      const set = (layer: Layer, amount: number) => {
        layer.amount = amount;
        const count = Math.floor(layer.max * Math.max(0, Math.min(1, amount)) * density);
        layer.geometry.instanceCount = count;
        layer.mesh.visible = count > 0;
      };
      set(rain, w.rain);
      set(snow, w.snow);
      const leafy = w.season === "spring" ? 0.4 : w.season === "autumn" ? 0.45 : 0;
      seasonColor.value.copy(w.season === "autumn" ? leafAutumn : leafSpring);
      set(petals, leafy * (1 - w.rain * 0.6) * (1 - w.snow));
      windGeometry.instanceCount = Math.round(60 * scale * density * Math.max(0, w.wind - 0.4) * 1.6);
      windMesh.visible = windGeometry.instanceCount > 0;
      if (mist) {
        mist.visible = w.mist > 0.05;
        mist.position.x = target.x;
        mist.position.z = target.z;
        mistAmount.value = w.mist;
      }

      // Raindrops dimple the water around the boat.
      rainTimer += dt;
      if (w.rain > 0.15 && rainTimer > 1 / 30) {
        rainTimer = 0;
        const n = Math.ceil(w.rain * 3);
        for (let i = 0; i < n; i++) {
          ripple.drop(boat.x + (Math.random() - 0.5) * 60, boat.z + (Math.random() - 0.5) * 60, 0.45, (Math.random() - 0.5) * 0.35 * w.rain);
        }
      }

      // Bow spray when running fast on the water.
      const speed = Math.hypot(boat.vx, boat.vz);
      if (!boat.airborne && speed > 9 && Math.random() < (speed - 9) * 0.12) {
        const fx = -Math.sin(boat.yaw);
        const fz = -Math.cos(boat.yaw);
        const side = Math.random() < 0.5 ? -1 : 1;
        emit(boat.x + fx * 1.6, boat.y + 0.2, boat.z + fz * 1.6, fz * side * 2.5 + boat.vx * 0.3, 1.6 + Math.random(), -fx * side * 2.5 + boat.vz * 0.3, 0.5);
      }
      for (let i = 0; i < SPRAY; i++) {
        const d = drops[i];
        if (d.life <= 0) {
          spray.setMatrixAt(i, hidden);
          continue;
        }
        d.life -= dt;
        d.vy -= 9.8 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.z += d.vz * dt;
        const s = Math.max(0, Math.min(1, d.life * 2));
        m.makeScale(s, s, s).setPosition(d.x, d.y, d.z);
        spray.setMatrixAt(i, d.y < -0.4 ? hidden : m);
      }
      spray.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      for (const layer of layers) {
        layer.geometry.dispose();
        (layer.mesh.material as THREE.Material).dispose();
      }
      windGeometry.dispose();
      windMat.dispose();
      spray.geometry.dispose();
      sprayMat.dispose();
      if (mist) {
        mist.geometry.dispose();
        (mist.material as THREE.Material).dispose();
      }
    },
  };
}
