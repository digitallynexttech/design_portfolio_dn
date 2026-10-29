import * as THREE from "three";

// The pages' own 3D (Karan, 29 Oct 2026: "add 3D elements to all the pages left"): one small
// transparent canvas per element, in the home's look. The renderer, the suit's world and the two light
// rigs the home uses: the astronaut's (a warm sun from the right and behind) and the X's on its own (a
// warm light from the front, so its red and its shoes read). Loaded only by the elements' scene files,
// which the pages import lazily (use-three.ts), so three.js never weighs on a page's first load.

export const SUN = new THREE.Vector3(1, 0.32, -0.45).normalize();

export type Rig = "astronaut" | "x";

export type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Sizes the drawing buffer and the camera to the canvas's CSS size. */
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
};

/** The suit's world, as on the home: black space, Earth's blue from below, a hot sun. */
function spaceEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uSun: { value: SUN.clone() } },
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float below = smoothstep(0.05, -0.65, d.y);
        vec3 c = mix(vec3(0.004, 0.005, 0.008), vec3(0.07, 0.12, 0.22), below);
        float s = max(dot(d, uSun), 0.0);
        c += vec3(1.0, 0.85, 0.64) * (pow(s, 1200.0) * 80.0 + pow(s, 8.0) * 0.12);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), material);
  envScene.add(sphere);
  const tex = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
  sphere.geometry.dispose();
  material.dispose();
  pmrem.dispose();
  return tex;
}

/** The home's lights for each figure (directions in world space; the figure faces +z, the camera). */
const RIGS: Record<Rig, { color: number; k: number; dir: [number, number, number] }[]> = {
  // the sun from the right and behind, a cool fill from the front left, a cool rim, the station's red
  // from below (a little more fill than the home: here the figure is small and faces you)
  astronaut: [
    { color: 0xffdcb0, k: 4.2, dir: [SUN.x, SUN.y, SUN.z] },
    { color: 0xdfe6f5, k: 1.6, dir: [-2.4, 0.6, 2.6] },
    { color: 0xafc6ff, k: 1.5, dir: [-1.8, 2.2, -2.6] },
    { color: 0xe21f26, k: 0.55, dir: [2.8, -1.4, 1.2] },
  ],
  // the X where it lands on the home: a warm key from the front left, a cool fill, a warm back light
  x: [
    { color: 0xfff0e4, k: 3.4, dir: [-1.4, 1.8, 3] },
    { color: 0xdfe6f5, k: 1.1, dir: [2.4, 0.4, 2.2] },
    { color: 0xffb8a8, k: 1.4, dir: [0.8, 1.6, -3] },
  ],
};

export function createStage(canvas: HTMLCanvasElement, opts: { rig: Rig; fov?: number }): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  // Neutral tone mapping keeps the brand red red and the suit white (as on the home).
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const env = spaceEnv(renderer);
  scene.environment = env;
  for (const l of RIGS[opts.rig]) {
    const light = new THREE.DirectionalLight(l.color, l.k);
    light.position.set(...l.dir).normalize().multiplyScalar(5);
    scene.add(light);
  }
  // Earth's blue from below, black space above
  scene.add(new THREE.HemisphereLight(0x161a24, 0x3a5784, 0.75));

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 30, 1, 0.05, 100);

  return {
    renderer,
    scene,
    camera,
    resize(width, height) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      env.dispose();
      renderer.dispose();
    },
  };
}

/** Rotates a bone about its head by an angle around an axis given in its model's space. */
export function rotateInModel(bone: THREE.Object3D, model: THREE.Object3D, axis: THREE.Vector3, rad: number) {
  if (Math.abs(rad) < 1e-5 || !bone.parent) return;
  const p = new THREE.Quaternion();
  for (let n: THREE.Object3D | null = bone.parent; n && n !== model; n = n.parent) p.premultiply(n.quaternion);
  const r = new THREE.Quaternion().setFromAxisAngle(axis, rad);
  bone.quaternion.premultiply(p.clone().invert().multiply(r).multiply(p));
}
