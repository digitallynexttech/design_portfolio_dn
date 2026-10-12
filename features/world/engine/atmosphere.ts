// Sky, sun, moon and the light they cast. The sky is three.js's physical sky (Preetham scattering
// with drifting clouds); a copy of it is rendered into an environment map every so often, which
// lights every material, colours the fog and gives the sea something true to reflect.
import * as THREE from "three/webgpu";
import {
  cameraPosition,
  dot,
  float,
  fog,
  Fn,
  hash,
  max,
  mix,
  normalize,
  pmremTexture,
  positionWorld,
  pow,
  rangeFogFactor,
  smoothstep,
  uniform,
  vec3,
  vec4,
} from "three/tsl";
import { SkyMesh } from "three/examples/jsm/objects/SkyMesh.js";
import type { Shared } from "./shared";
import type { N } from "./tsl";
import { LAYER_DETAIL, LAYER_VIEW } from "./layers";

type Key = { h: number; sun: string; sunI: number; amb: string; ambI: number; night: number };

// Sun colour and strength through the day (the sky itself is computed physically).
const KEYS: Key[] = [
  { h: 0, sun: "#9db4e8", sunI: 0.9, amb: "#34497a", ambI: 0.6, night: 1 },
  { h: 5, sun: "#9db4e8", sunI: 0.85, amb: "#34497a", ambI: 0.55, night: 1 },
  { h: 6.2, sun: "#ffad78", sunI: 1.8, amb: "#8fa2c8", ambI: 0.4, night: 0.2 },
  { h: 8, sun: "#ffe9cf", sunI: 3.4, amb: "#a9c4e6", ambI: 0.35, night: 0 },
  { h: 13, sun: "#fff6ea", sunI: 3.9, amb: "#b4cdec", ambI: 0.35, night: 0 },
  { h: 16.8, sun: "#ffe1bb", sunI: 3.4, amb: "#b7c6dc", ambI: 0.35, night: 0 },
  { h: 18.4, sun: "#ffa369", sunI: 2.1, amb: "#9fa3c4", ambI: 0.48, night: 0.1 },
  { h: 19.5, sun: "#b39adb", sunI: 0.8, amb: "#4d4f7c", ambI: 0.55, night: 0.75 },
  { h: 21, sun: "#9db4e8", sunI: 0.9, amb: "#34497a", ambI: 0.6, night: 1 },
  { h: 24, sun: "#9db4e8", sunI: 0.9, amb: "#34497a", ambI: 0.6, night: 1 },
];

const ca = new THREE.Color();
const cb = new THREE.Color();

function lerpKey(hour: number) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= hour) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (hour - a.h) / (b.h - a.h)));
  const s = t * t * (3 - 2 * t);
  return {
    sun: new THREE.Color().copy(ca.set(a.sun)).lerp(cb.set(b.sun), s),
    amb: new THREE.Color().copy(ca.set(a.amb)).lerp(cb.set(b.amb), s),
    sunI: a.sunI + (b.sunI - a.sunI) * s,
    ambI: a.ambI + (b.ambI - a.ambI) * s,
    night: a.night + (b.night - a.night) * s,
  };
}

/** Real sun direction for an hour: rises east, crosses the southern sky (toward the camera), sets west. */
function sunDirection(hour: number, out: THREE.Vector3) {
  // Sunrise about 6:00, sunset about 18:55.
  const day = (hour - 6.0) / 12.9;
  const arc = Math.PI * day;
  const elevation = Math.sin(arc) * 1.05;
  const azimuth = Math.PI * (0.08 + day * 0.84);
  return out.set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), 0.45 * Math.cos(elevation) + 0.25).normalize();
}

export type Atmosphere = ReturnType<typeof createAtmosphere>;

export function createAtmosphere(scene: THREE.Scene, shared: Shared, tier: 1 | 2 | 3, renderer: THREE.WebGPURenderer) {
  const { u } = shared;
  const skyGain = uniform(0.42);
  const moonDir = uniform(new THREE.Vector3(-0.4, 0.6, 0.6).normalize());
  const sunPos = uniform(new THREE.Vector3(0, 1, 0));

  /** Add the night sky (deep blue, stars, moon) and lightning on top of the physical sky. */
  const dress = (base: N, withStars: boolean) =>
    Fn(() => {
      const dir = normalize(positionWorld.sub(cameraPosition));
      const up = max(dir.y, 0);
      let c: N = base.rgb.mul(skyGain);
      const nightSky = mix(vec3(0.03, 0.05, 0.1), vec3(0.006, 0.012, 0.035), pow(up, float(0.45)));
      c = c.add(nightSky.mul(u.night));
      // Twilight: after the sun sets, a warm band lingers on its side of the horizon.
      const sunAz = normalize(vec3(sunPos.x, 0, sunPos.z));
      const towardSun = max(dot(normalize(vec3(dir.x, 0, dir.z)), sunAz), 0);
      const sy = normalize(sunPos).y;
      const below = float(1).sub(smoothstep(-0.06, 0.02, sy)).mul(smoothstep(-0.32, -0.08, sy));
      const band = float(1).sub(smoothstep(0.0, 0.35, up));
      c = c.add(mix(vec3(0.35, 0.14, 0.2), vec3(0.95, 0.42, 0.18), pow(towardSun, float(3))).mul(band).mul(below).mul(0.55));
      if (withStars) {
        const cell = dir.mul(300).floor();
        const star = smoothstep(0.9975, 1.0, hash(cell.x.add(cell.y.mul(57)).add(cell.z.mul(113))));
        c = c.add(vec3(0.9, 0.95, 1).mul(star).mul(u.night).mul(float(1).sub(u.cloud.mul(0.9))).mul(smoothstep(0.02, 0.25, up)).mul(1.4));
      }
      const m = max(dot(dir, moonDir), 0);
      const moon = smoothstep(0.99955, 0.9997, m).mul(2.2).add(pow(m, float(60)).mul(0.08));
      c = c.add(vec3(0.85, 0.9, 1).mul(moon).mul(u.night).mul(float(1).sub(u.cloud.mul(0.7))));
      c = c.add(vec3(0.5, 0.55, 0.7).mul(u.flash));
      return vec4(c, 1);
    })();

  // --- The visible sky ------------------------------------------------------------------------
  const sky = new SkyMesh();
  sky.scale.setScalar(4000);
  sky.turbidity.value = 3;
  sky.rayleigh.value = 1.4;
  sky.mieCoefficient.value = 0.004;
  sky.mieDirectionalG.value = 0.82;
  sky.cloudElevation.value = 0.55;
  sky.cloudScale.value = 0.00018;
  sky.cloudSpeed.value = 0.000025;
  const skyMat = sky.material as THREE.NodeMaterial;
  skyMat.colorNode = dress(skyMat.colorNode, true);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  sky.layers.set(LAYER_VIEW);
  scene.add(sky);

  // --- Environment map: a second sky plus a dark sea below the horizon ------------------------
  const envScene = new THREE.Scene();
  const envSky = new SkyMesh();
  envSky.scale.setScalar(4000);
  const envMat = envSky.material as THREE.NodeMaterial;
  envMat.colorNode = dress(envMat.colorNode, false);
  envScene.add(envSky);
  const seaColor = uniform(new THREE.Color("#0a2733"));
  const seaMat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  seaMat.colorNode = seaColor;
  const sea = new THREE.Mesh(new THREE.CircleGeometry(3500, 32), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -40;
  envScene.add(sea);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envSize = tier === 3 ? 256 : 128;
  let envRT: THREE.RenderTarget = pmrem.fromScene(envScene, 0, 1, 9000, { size: envSize });
  scene.environment = envRT.texture;
  scene.environmentIntensity = 1;

  // --- Lights -----------------------------------------------------------------------------------
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = tier >= 2;
  if (sun.castShadow) {
    const size = tier === 3 ? 2048 : 1024;
    sun.shadow.mapSize.set(size, size);
    const cam = sun.shadow.camera;
    cam.left = -55;
    cam.right = 55;
    cam.top = 55;
    cam.bottom = -55;
    cam.near = 1;
    cam.far = 300;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.05;
    sun.shadow.radius = 3;
    // Props and ferns cast shadows too; grass and particles don't cast at all.
    cam.layers.enable(LAYER_DETAIL);
  }
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x2a3c66, 0x0b0f18, 0);
  scene.add(hemi);

  // Fog takes its colour from the environment in the direction you look, so distance melts into
  // the real sky; mist pulls it toward a pale veil.
  const mistColor = uniform(new THREE.Color("#c3ccd3"));
  const mistMix = uniform(0);
  const viewDir = normalize(positionWorld.sub(cameraPosition));
  const horizonDir = normalize(vec3(viewDir.x, max(viewDir.y, 0.02), viewDir.z));
  const envFog = pmremTexture(envRT.texture, horizonDir, float(0.55));
  scene.fogNode = fog(mix(envFog.rgb, mistColor, mistMix), rangeFogFactor(u.fogNear, u.fogFar));

  const real = new THREE.Vector3();
  const key = new THREE.Vector3();
  const lastEnv = { sunY: 99, cloud: -1, mist: -1, t: -10 };
  let clock = 0;

  /** Apply a time of day (hours, 0–24) and the weather's cloud, mist and flash. Returns the night factor. */
  function update(hour: number, cloud: number, mist: number, focus: THREE.Vector3, dt = 0): number {
    clock += dt;
    const k = lerpKey(hour);
    sunDirection(hour, real);
    const overcast = Math.min(1, cloud);

    // Physical sky: sun position, haze from cloud and mist, clouds from the weather.
    sunPos.value.copy(real);
    for (const s of [sky, envSky]) {
      s.sunPosition.value.copy(real).multiplyScalar(4000);
      s.turbidity.value = 2.6 + overcast * 6 + mist * 5;
      s.rayleigh.value = 1.3 + overcast * 0.6 - mist * 0.4;
      s.cloudCoverage.value = 0.12 + overcast * 0.85;
      s.cloudDensity.value = 0.25 + overcast * 0.6;
    }
    // Overcast days: lift a grey into the sky so rain doesn't sit under a bright blue.
    skyGain.value = 0.42 * (1 - overcast * 0.3);

    // The key light is the sun by day and the moon by night.
    const night = k.night;
    if (night > 0.6) key.set(-0.42, 0.72, 0.55).normalize();
    else key.copy(real).setY(Math.max(0.1, real.y)).normalize();
    moonDir.value.set(-0.42, 0.6, -0.68).normalize();

    u.sunDir.value.copy(key);
    u.sunColor.value.copy(k.sun);
    u.night.value = night;
    u.cloud.value = cloud;
    const sunI = k.sunI * (1 - overcast * 0.72) * (1 - mist * 0.35) + u.flash.value * 2.5;
    u.sunI.value = sunI;
    u.ambient.value.copy(k.amb).multiplyScalar(k.ambI * 2 + overcast * 0.3);

    sun.color.copy(k.sun);
    sun.intensity = sunI;
    sun.position.copy(focus).addScaledVector(key, 150);
    sun.target.position.copy(focus);
    // Moonlit nights need a little help beyond the (dark) environment.
    hemi.color.copy(k.amb);
    hemi.intensity = night * 1.6 + u.flash.value * 0.6;
    scene.environmentIntensity = 0.42 + night * 0.25;

    seaColor.value.set(night > 0.5 ? "#02070c" : "#0b2a36").multiplyScalar(1 - overcast * 0.3);
    mistColor.value.set("#c3ccd3").multiplyScalar(1 - night * 0.82);
    mistMix.value = Math.min(1, mist * 0.85 + overcast * 0.25);
    u.fogColor.value.copy(mistColor.value);

    // Mist is capped: islands within ~90 m always stay readable.
    u.fogNear.value = THREE.MathUtils.lerp(140, 30, mist);
    u.fogFar.value = THREE.MathUtils.lerp(900 - cloud * 250, 170, mist);
    sky.position.copy(focus);

    // Re-render the environment when the light has visibly changed (at most a few times a second).
    const changed = Math.abs(real.y - lastEnv.sunY) > 0.01 || Math.abs(cloud - lastEnv.cloud) > 0.04 || Math.abs(mist - lastEnv.mist) > 0.05;
    if (changed && clock - lastEnv.t > 0.35) {
      lastEnv.sunY = real.y;
      lastEnv.cloud = cloud;
      lastEnv.mist = mist;
      lastEnv.t = clock;
      envRT = pmrem.fromScene(envScene, 0, 1, 9000, { size: envSize, renderTarget: envRT });
    }
    return night;
  }

  return {
    sun,
    hemi,
    sky,
    get envTexture() {
      return envRT.texture;
    },
    update,
    dispose() {
      sky.geometry.dispose();
      skyMat.dispose();
      envSky.geometry.dispose();
      envMat.dispose();
      sea.geometry.dispose();
      seaMat.dispose();
      envRT.dispose();
      pmrem.dispose();
      sun.dispose();
      hemi.dispose();
    },
  };
}
