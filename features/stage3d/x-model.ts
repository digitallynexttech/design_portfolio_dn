import * as THREE from "three";
import { X_MODEL } from "@/features/drafts/depth/astronaut";
import { rotateInModel } from "./runtime";

// The X on its own (dn-x-7.glb, the site's rigged mascot, built in Blender/DigitallyNext): standing on
// its shoes at the origin, one unit tall, facing +z. Its clips: Idle and Walk loop; Wave, Jump and Spin
// play once and fall back to whichever loop it was in. It can sit (legs swung forward, as on the
// astronaut's shoulder) and look about with its eyes.

export type XClip = "Idle" | "Walk" | "Wave" | "Jump" | "Spin";

export type XModel = {
  /** Place, turn and scale this; its origin is between the soles. */
  root: THREE.Group;
  /** Its height before scaling (model units: about 1). */
  height: number;
  /** Plays a clip: a loop becomes the one it goes back to; a once-clip plays over it. */
  play: (clip: XClip, fade?: number) => void;
  /** The loop it is in, and how fast it plays (1 normal; e.g. the walk matched to a speed). */
  setSpeed: (k: number) => void;
  /** Steps the clips, then sits (0 standing … 1 seated) and looks (-1…1 each way). */
  update: (dt: number, o?: { sit?: number; lookX?: number; lookY?: number }) => void;
  dispose: () => void;
};

const LOOPS = new Set<XClip>(["Idle", "Walk"]);
const DEG = Math.PI / 180;

export async function loadX(): Promise<XModel> {
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/loaders/DRACOLoader.js"),
  ]);
  const draco = new DRACOLoader().setDecoderPath("/draco/");
  let gltf;
  try {
    gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(X_MODEL);
  } finally {
    draco.dispose();
  }
  const model = gltf.scene;
  model.traverse((o) => {
    // posed limbs leave the bind-pose bounds: never cull them
    if ((o as THREE.Mesh).isMesh) o.frustumCulled = false;
  });
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  const root = new THREE.Group();
  root.add(model);

  const bones = new Map<string, THREE.Object3D>();
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.set(o.name, o);
  });
  // seated, as on the astronaut's shoulder (astronaut.ts): the legs swung forward, the feet flat
  const sit = [
    { b: bones.get("legL"), rad: -42 * DEG },
    { b: bones.get("legR"), rad: -42 * DEG },
    { b: bones.get("footL"), rad: 30 * DEG },
    { b: bones.get("footR"), rad: 30 * DEG },
  ]
    .filter((p): p is { b: THREE.Object3D; rad: number } => Boolean(p.b))
    .map((p) => ({ ...p, rest: p.b.quaternion.clone() }));
  const eyes = ["eyeL", "eyeR"]
    .map((n) => model.getObjectByName(n))
    .filter((n): n is THREE.Object3D => Boolean(n))
    .map((node) => ({ node, rest: node.position.clone() }));
  const X = new THREE.Vector3(1, 0, 0);

  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map(gltf.animations.map((clip) => [clip.name as XClip, mixer.clipAction(clip)]));
  for (const [name, action] of actions) {
    if (LOOPS.has(name)) continue;
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  }
  let loop: THREE.AnimationAction | undefined = actions.get("Idle");
  let current = loop;
  current?.play();
  const play = (clip: XClip, fade = 0.25) => {
    const next = actions.get(clip);
    if (!next || (next === current && next.isRunning())) return;
    if (LOOPS.has(clip)) loop = next;
    next.reset().setEffectiveWeight(1).play();
    if (current && current !== next) current.crossFadeTo(next, fade, false);
    current = next;
  };
  const onFinished = (e: { action: THREE.AnimationAction }) => {
    if (e.action !== current || !loop) return;
    const back = loop;
    loop = undefined;
    const name = [...actions].find(([, a]) => a === back)?.[0];
    if (name) play(name);
  };
  mixer.addEventListener("finished", onFinished);

  return {
    root,
    height: box.max.y - box.min.y,
    play,
    setSpeed(k) {
      if (loop) loop.timeScale = k;
    },
    update(dt, o = {}) {
      for (const p of sit) p.b.quaternion.copy(p.rest);
      mixer.update(Math.min(dt, 1 / 20));
      const w = o.sit ?? 0;
      if (w > 0) for (const p of sit) rotateInModel(p.b, model, X, p.rad * w);
      for (const eye of eyes) {
        eye.node.position.copy(eye.rest);
        eye.node.position.x += (o.lookX ?? 0) * 0.006;
        eye.node.position.y += (o.lookY ?? 0) * 0.006;
      }
    },
    dispose() {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      });
    },
  };
}
