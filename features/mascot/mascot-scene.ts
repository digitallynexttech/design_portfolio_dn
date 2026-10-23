import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { roomEnvironment } from "@/features/exhibits/room-environment";
import { exhibitDpr } from "@/features/exhibits/use-compiled";

export const MASCOT_MODEL = "/models/dn-x/dn-x-6.glb";

export type MascotClip = "Idle" | "Walk" | "Wave" | "Jump" | "Spin";

export type Mascot = {
  play: (clip: MascotClip) => void;
  /** Draw only while the window is on screen. */
  setActive: (active: boolean) => void;
  dispose: () => void;
};

const ONE_SHOT: MascotClip[] = ["Wave", "Jump", "Spin"];

/**
 * The Digitally Next X in its window: plain three.js on the window's own canvas (no React tree, so
 * the canvas can sit inside a heading). The camera matches the poster render, so the swap from
 * poster to live model doesn't move a pixel. Eyes and body follow the pointer; one-shot clips fall
 * back to Idle when they finish. Resolves once the model's shaders are compiled. `url` loads another
 * build of the X with the same rig and clips (the review variants in /drafts/mascots).
 */
export async function createMascot(canvas: HTMLCanvasElement, reduced: boolean, url = MASCOT_MODEL): Promise<Mascot> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, exhibitDpr()[1]));
  // Neutral keeps the brand red red.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(-0.55, 0.62, 2.45);
  camera.lookAt(0, 0.555, 0);

  const key = new THREE.DirectionalLight(0xfff4e8, 2.2);
  key.position.set(-1.4, 2.4, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  key.shadow.camera.left = key.shadow.camera.bottom = -0.9;
  key.shadow.camera.right = key.shadow.camera.top = 0.9;
  key.shadow.radius = 4;
  key.shadow.bias = -0.0006;
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(1.2, 1.6, -1.5);
  scene.add(key, rim, new THREE.HemisphereLight(0xfff8f0, 0xd9cfc0, 0.6));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const draco = new DRACOLoader().setDecoderPath("/draco/");
  const [env, gltf] = await Promise.all([
    roomEnvironment(renderer),
    new GLTFLoader().setDRACOLoader(draco).loadAsync(url),
  ]);
  scene.environment = env;
  scene.environmentIntensity = 0.55;

  const model = gltf.scene;
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      // Animated limbs leave the bind-pose bounds; never cull them mid-jump.
      o.frustumCulled = false;
    }
  });
  const turn = new THREE.Group();
  turn.add(model);
  scene.add(turn);

  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map(gltf.animations.map((clip) => [clip.name as MascotClip, mixer.clipAction(clip)]));
  for (const name of ONE_SHOT) {
    const action = actions.get(name);
    if (!action) continue;
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  }
  let current = actions.get("Idle");
  current?.play();
  if (reduced && current) current.timeScale = 0.5;

  const play = (name: MascotClip) => {
    const next = actions.get(name);
    if (!next || reduced) return;
    // A one-shot already playing finishes first; the idle is never restarted on itself.
    if (next === current && (name === "Idle" || next.isRunning())) return;
    next.reset().setEffectiveWeight(1).play();
    if (current && current !== next) current.crossFadeTo(next, 0.25, false);
    current = next;
  };
  mixer.addEventListener("finished", (event) => {
    if (event.action === current) play("Idle");
  });

  // The clips never move the eyes, so those tracks aren't exported: offset from the rest position.
  const eyes = ["eyeL", "eyeR"].map((n) => model.getObjectByName(n)).filter((o): o is THREE.Object3D => Boolean(o));
  const eyeRest = eyes.map((eye) => eye.position.clone());
  const pointer = new THREE.Vector2();
  const look = new THREE.Vector2();
  const onPointer = (event: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    // Relative to the window, in half-widths: the eyes reach their limit a window's width away.
    pointer.set(
      THREE.MathUtils.clamp(((event.clientX - r.left) / r.width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(-(((event.clientY - r.top) / r.height) * 2 - 1), -1, 1),
    );
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  // Hidden until compiled: drawing first would stall the main thread while the driver finishes.
  await renderer.compileAsync(scene, camera);

  const timer = new THREE.Timer();
  const frame = (time: number) => {
    timer.update(time);
    const dt = Math.min(timer.getDelta(), 1 / 20);
    mixer.update(dt);
    if (!reduced) look.lerp(pointer, 1 - Math.exp(-dt * 8));
    eyes.forEach((eye, i) => {
      // The chest's space: x across, y up.
      eye.position.copy(eyeRest[i]);
      eye.position.x += look.x * 0.006;
      eye.position.y += look.y * 0.006;
    });
    turn.rotation.y += (look.x * 0.32 - turn.rotation.y) * (1 - Math.exp(-dt * 4));
    renderer.render(scene, camera);
  };
  let active = false;

  return {
    play,
    setActive(next) {
      if (next === active) return;
      active = next;
      renderer.setAnimationLoop(active ? frame : null);
      if (active) timer.reset();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("pointermove", onPointer);
      observer.disconnect();
      mixer.stopAllAction();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        for (const m of Array.isArray(material) ? material : material ? [material] : []) m.dispose();
      });
      env.dispose();
      draco.dispose();
      renderer.dispose();
    },
  };
}
