import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { LoadReport } from "./loader-bus";

// The astronaut who carries the X down through the flight. Modelled, baked and rigged in Blender
// (Blender/DigitallyNext/astronaut/hero, scripts/h_*.py): an EMU-proportioned suit whose fabric folds,
// colour, roughness and occlusion are baked from the Cycles look into textures. No animation clips
// ship with it. Its pose is blended here, every frame, from a small table: reaching toward you in
// the hero, freefall while it descends, settled at the destination, plus a slow weightless drift.
// The X is the site's own rigged mascot (dn-x.glb), seated on the "perch" bone on the left shoulder,
// so it can never drift off: wherever the chest goes, the X goes.

export const ASTRONAUT_MODEL = "/models/astronaut/astronaut-v3.glb";
export const ASTRONAUT_MODEL_PHONE = "/models/astronaut/astronaut-v3-phone.glb";
const X_MODEL = "/models/dn-x/dn-x.glb";
const WEAVE = "/models/astronaut/weave.webp";
/** The X's height on the shoulder, in metres (the astronaut is 1.87 m to the top of the helmet). */
export const X_SCALE = 0.38;
/**
 * Where the X's hips sit, from the perch (the top of the left shoulder) in the astronaut's frame, in
 * metres: out over the shoulder's edge, up, forward. On the perch itself its legs were inside the
 * shoulder and the arm. Found by measuring the X against the posed suit in every pose
 * (.captures/astro/xprobe.mjs, xsweep.mjs): resting on it, 1-3 mm clear, never in it.
 */
const SEAT = { out: 0.07, up: 0.06, fwd: 0.04 };
/** Settled at the gate, arms down, the shoulder sits lower and further forward: a little up and back. */
const SEAT_SETTLED = { up: 0.02, fwd: -0.02 };
/** The figure's height and its centre, in model units: the box the slots fit it into. */
export const FIGURE_H = 1.92;
const FIGURE_CY = 0.97;
/** The helmet: its centre relative to the figure's centre, and its diameter (for helmet slots). */
export const HELMET = { x: 0, y: 1.672 - FIGURE_CY, z: 0.035, d: 0.392 };

type Vec3 = [number, number, number];
type Op =
  | { bone: string; kind: "axis"; axis: Vec3; deg: number }
  | { bone: string; kind: "bend"; pair: [string, string]; deg: number }
  | { bone: string; kind: "aim"; dir: Vec3 }
  | { bone: string; kind: "palm"; hand: string; dir: Vec3 };

const axis = (bone: string, a: Vec3, deg: number): Op => ({ bone, kind: "axis", axis: a, deg });
const bend = (bone: string, parent: string, deg: number): Op => ({ bone, kind: "bend", pair: [parent, bone], deg });
const aim = (bone: string, dir: Vec3): Op => ({ bone, kind: "aim", dir });
/** Turns the forearm about its own length until the glove's palm faces dir (as near as it can). */
const palm = (forearm: string, hand: string, dir: Vec3): Op => ({ bone: forearm, kind: "palm", hand, dir });

/**
 * Falling: weightless. NASA's neutral body posture, the shape a body takes when nothing holds it: the
 * arms float up and forward, elbows bent, palms down and in; hips and knees bent, toes pointed; the
 * back a little curled. Not mirrored, so it reads as a body, not a diagram. (Model space: +x the
 * astronaut's left, +y up, +z its front.)
 */
const FALL: Op[] = [
  axis("chest", [1, 0, 0], 6),
  aim("upper_arm.L", [0.72, -0.24, 0.45]),
  aim("upper_arm.R", [-0.78, -0.3, 0.36]),
  aim("forearm.L", [0.2, 0.42, 0.88]),
  aim("forearm.R", [-0.28, 0.3, 0.9]),
  palm("forearm.L", "hand.L", [0.2, -1, 0.1]),
  palm("forearm.R", "hand.R", [-0.2, -1, 0.1]),
  aim("thigh.L", [0.15, -0.68, 0.72]),
  aim("thigh.R", [-0.11, -0.76, 0.62]),
  aim("shin.L", [0.07, -0.98, -0.12]),
  aim("shin.R", [-0.05, -0.93, -0.32]),
  axis("foot.L", [1, 0, 0], 24),
  axis("foot.R", [1, 0, 0], 30),
];
/** Settled at the gate: upright and at ease, still afloat: arms low and a little out with soft
 *  elbows, palms in; hips and knees a little bent, toes down. */
const SETTLE: Op[] = [
  axis("spine", [1, 0, 0], 3),
  aim("upper_arm.L", [0.44, -0.86, 0.22]),
  aim("upper_arm.R", [-0.4, -0.88, 0.26]),
  aim("forearm.L", [0.22, -0.42, 0.88]),
  aim("forearm.R", [-0.2, -0.36, 0.91]),
  palm("forearm.L", "hand.L", [-1, 0, 0.15]),
  palm("forearm.R", "hand.R", [1, 0, 0.15]),
  aim("thigh.L", [0.11, -0.93, 0.35]),
  aim("thigh.R", [-0.09, -0.95, 0.28]),
  aim("shin.L", [0.07, -0.97, -0.22]),
  aim("shin.R", [-0.06, -0.97, -0.26]),
  axis("foot.L", [1, 0, 0], 16),
  axis("foot.R", [1, 0, 0], 20),
];
/** The hero: the left arm reaches out toward you, low and to the side (as in the hero still); the
 *  other arm and the legs at ease. */
const HERO: Op[] = [
  aim("upper_arm.L", [0.86, -0.5, 0.42]),
  bend("forearm.L", "upper_arm.L", 18),
  aim("upper_arm.R", [-0.42, -0.86, 0.28]),
  aim("forearm.R", [-0.16, -0.36, 0.92]),
  // (the reaching hand stays as the reference frame and the Cycles stills have it)
  palm("forearm.R", "hand.R", [1, -0.3, 0.1]),
  axis("chest", [0, 1, 0], -6),
  aim("thigh.L", [0.12, -0.9, 0.42]),
  aim("thigh.R", [-0.1, -0.93, 0.35]),
  aim("shin.L", [0.07, -0.99, -0.1]),
  aim("shin.R", [-0.05, -0.97, -0.22]),
];

export type XClip = "Wave" | "Jump" | "Spin";

export type AstronautFrame = {
  dt: number;
  /** Seconds, for the drift. */
  t: number;
  /** Weights of the poses, 0…1 each, applied on top of the rest pose in this order. */
  hero: number;
  fall: number;
  settle: number;
  /** Where the head and the X look, -1…1 (x to the viewer's right, y up). */
  lookX: number;
  lookY: number;
  /** Extra turn for the X (radians), so it can face the camera however the astronaut turns. */
  xYaw: number;
  /** How much the body drifts, 0…1. */
  drift: number;
  /** How far the X sits (1, on the shoulder; 0 standing), and how far its arms are tucked in (0…1). */
  xSit?: number;
  xTuck?: number;
};

export type Astronaut = {
  /** Positioned, turned and scaled by the scene; its origin is the figure's centre. */
  root: THREE.Group;
  /** An invisible box round the body, for picking. */
  hit: THREE.Mesh;
  /** The gold visor's material (the scene gives it its own world and turns it with the astronaut). */
  visor: THREE.MeshPhysicalMaterial | null;
  /** Poses the figure and steps the X's clips. */
  frame: (f: AstronautFrame) => void;
  react: (clip: XClip) => void;
  /**
   * The X, for the scene to take off the shoulder (x-hop.ts). seat: the X, its origin at its feet;
   * mark: where it sits on the shoulder now (follows the pose); setFree moves it between the shoulder
   * and the given parent, where the scene places it, keeping it exactly where it is.
   */
  x: { seat: THREE.Group; mark: THREE.Object3D; setFree: (free: boolean, parent: THREE.Object3D) => void };
  /** Testing: how much of the X is inside the suit as posed now (sampled points, and the deepest, in metres). */
  probe: () => { inside: number; total: number; deepest: number; gap: number };
  dispose: () => void;
};

export type AstronautOptions = {
  /** The lighter build (half-size baked maps). */
  small: boolean;
  /** Cast and receive shadows (the X on the shoulder, the arm on the chest). */
  shadows: boolean;
  /** The gold visor's own world (a PMREM'd probe of desert, sun and the suit). */
  visorEnv: THREE.Texture | null;
  /** Bytes as they arrive, for the preloader. */
  progress?: LoadReport;
};

const DEG = Math.PI / 180;
const key = (name: string) => name.replace(/[.:]/g, "");

/**
 * A tiling weave in the fabric: the baked map carries the folds, this adds the cloth itself, blended
 * in tangent space (whiteout blend) at 26 repeats across the atlas.
 */
function addWeave(material: THREE.MeshStandardMaterial, weave: THREE.Texture) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWeave = { value: weave };
    shader.uniforms.uWeaveScale = { value: 26 };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <normalmap_pars_fragment>",
        "#include <normalmap_pars_fragment>\nuniform sampler2D uWeave;\nuniform float uWeaveScale;",
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#ifdef USE_NORMALMAP_TANGENTSPACE
  vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
  vec3 detN = texture2D( uWeave, vNormalMapUv * uWeaveScale ).xyz * 2.0 - 1.0;
  mapN = normalize( vec3( mapN.xy + detN.xy * 0.55, mapN.z * detN.z ) );
  mapN.xy *= normalScale;
  normal = normalize( tbn * mapN );
#else
  #include <normal_fragment_maps>
#endif`,
      );
  };
  material.customProgramCacheKey = () => "astro-weave";
}

export async function loadAstronaut(opts: AstronautOptions): Promise<Astronaut> {
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/loaders/DRACOLoader.js"),
  ]);
  const draco = new DRACOLoader().setDecoderPath("/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let a: GLTF;
  let x: GLTF;
  let weave: THREE.Texture;
  const report = opts.progress;
  try {
    [a, x, weave] = await Promise.all([
      loader.loadAsync(opts.small ? ASTRONAUT_MODEL_PHONE : ASTRONAUT_MODEL, (e) => report?.bytes("astronaut", e.loaded, e.total)),
      loader.loadAsync(X_MODEL, (e) => report?.bytes("x", e.loaded, e.total)),
      new THREE.TextureLoader().loadAsync(WEAVE).then((t) => (report?.got("weave"), t)),
    ]);
  } finally {
    draco.dispose();
  }
  // Parsed, so the Draco decoder (fetched on first use) is here too.
  for (const k of ["astronaut", "x", "draco"] as const) report?.got(k);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.anisotropy = 4;

  // ---------- The astronaut, dressed ----------
  const model = a.scene;
  model.updateMatrixWorld(true);
  const bones = new Map<string, THREE.Bone>();
  let visor: THREE.MeshPhysicalMaterial | null = null;
  const owned: THREE.Material[] = [];
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.set(o.name, o as THREE.Bone);
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    // Posed limbs leave the bind-pose bounds: never cull them.
    mesh.frustumCulled = false;
    mesh.castShadow = opts.shadows;
    mesh.receiveShadow = opts.shadows;
    const m = mesh.material as THREE.MeshStandardMaterial;
    switch (m.name) {
      case "A_Visor": {
        // Gold film over a polycarbonate shell: metal gold, a clear coat for the white Fresnel rim,
        // and its own world (the scene sets envMap and turns it with the astronaut).
        visor = new THREE.MeshPhysicalMaterial({
          name: "A_Visor",
          color: new THREE.Color(1.0, 0.7, 0.3),
          metalness: 1,
          roughness: 0.035,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          envMap: opts.visorEnv,
          envMapIntensity: 1.25,
        });
        owned.push(visor);
        mesh.material = visor;
        mesh.castShadow = false;
        break;
      }
      case "A_Metal":
        m.metalness = 1;
        m.roughness = 0.2;
        m.color = new THREE.Color(0xe4e6ea);
        m.envMapIntensity = 1.8;
        break;
      case "A_Fabric": {
        const f = m as THREE.MeshPhysicalMaterial;
        if ("sheen" in f) {
          f.sheen = 0.6;
          f.sheenRoughness = 0.6;
          f.sheenColor = new THREE.Color(0xffffff);
        }
        f.envMapIntensity = 0.8;
        // the baked folds, softened: at hero size they read as cloth, not rock
        f.normalScale.set(0.55, 0.55);
        if (f.normalMap) addWeave(f, weave);
        break;
      }
      case "A_Web": {
        const w = m as THREE.MeshPhysicalMaterial;
        if ("sheen" in w) {
          w.sheen = 0.5;
          w.sheenRoughness = 0.45;
          w.sheenColor = new THREE.Color(0x8a8f99);
        }
        break;
      }
      case "A_Light":
        m.emissive = new THREE.Color(0xff2a2a);
        m.emissiveIntensity = 2.5;
        mesh.castShadow = false;
        break;
      default:
        m.envMapIntensity = 0.85;
    }
  });
  const bone = (name: string) => {
    const b = bones.get(key(name)) ?? bones.get(name);
    if (!b) throw new Error(`astronaut: no bone ${name}`);
    return b;
  };

  // A node's rotation relative to the model root (rotations only: the rig carries no scale). Each
  // node's chain of ancestors is found once; posing then only multiplies quaternions.
  const chains = new Map<THREE.Object3D, THREE.Object3D[]>();
  const modelQ = (node: THREE.Object3D | null, out: THREE.Quaternion) => {
    out.identity();
    if (!node) return out;
    let chain = chains.get(node);
    if (!chain) {
      chain = [];
      for (let n: THREE.Object3D | null = node; n && n !== model; n = n.parent) chain.unshift(n);
      chains.set(node, chain);
    }
    for (const n of chain) out.multiply(n.quaternion);
    return out;
  };
  const restLocal = new Map<THREE.Bone, THREE.Quaternion>();
  const restPos = new Map<string, THREE.Vector3>();
  for (const b of bones.values()) {
    restLocal.set(b, b.quaternion.clone());
    restPos.set(b.name, b.getWorldPosition(new THREE.Vector3()));
  }
  const child: Record<string, string> = {
    "upper_arm.L": "forearm.L",
    "forearm.L": "hand.L",
    "upper_arm.R": "forearm.R",
    "forearm.R": "hand.R",
    "thigh.L": "shin.L",
    "shin.L": "foot.L",
    "thigh.R": "shin.R",
    "shin.R": "foot.R",
  };
  const restDir = (name: string) => {
    const from = restPos.get(bone(name).name)!;
    const to = restPos.get(bone(child[name]).name)!;
    return to.clone().sub(from).normalize();
  };
  // Each op's axis is fixed at load where it can be (axis, bend); aim and palm follow the bone as posed.
  // At rest (the A pose) each glove's palm faces the body.
  const PALM_REST: Record<string, Vec3> = { "hand.L": [-1, 0, 0], "hand.R": [1, 0, 0] };
  type Compiled = {
    b: THREE.Bone;
    axis: THREE.Vector3 | null;
    local: THREE.Vector3 | null;
    target: THREE.Vector3 | null;
    rad: number;
    /** palm: the hand, and its palm's rest normal in the hand's own frame */
    hand?: THREE.Bone;
    palmLocal?: THREE.Vector3;
  };
  const q = new THREE.Quaternion();
  const compile = (ops: Op[]): Compiled[] =>
    ops.map((op) => {
      const b = bone(op.bone);
      if (op.kind === "axis") return { b, axis: new THREE.Vector3(...op.axis).normalize(), local: null, target: null, rad: op.deg * DEG };
      if (op.kind === "bend") {
        const hinge = new THREE.Vector3().crossVectors(restDir(op.pair[0]), restDir(op.pair[1])).normalize();
        return { b, axis: hinge, local: null, target: null, rad: op.deg * DEG };
      }
      // The bone's own length, in its local frame, so it can be re-read in model space once posed.
      const local = restDir(op.bone).applyQuaternion(modelQ(b, q).invert());
      if (op.kind === "aim") return { b, axis: null, local, target: new THREE.Vector3(...op.dir).normalize(), rad: 0 };
      const hand = bone(op.hand);
      const palmLocal = new THREE.Vector3(...(PALM_REST[op.hand] ?? [0, -1, 0])).applyQuaternion(modelQ(hand, q).invert());
      return { b, axis: null, local, target: new THREE.Vector3(...op.dir).normalize(), rad: 0, hand, palmLocal };
    });
  const fall = compile(FALL);
  const settle = compile(SETTLE);
  const hero = compile(HERO);

  const qp = new THREE.Quaternion();
  const qr = new THREE.Quaternion();
  const qt = new THREE.Quaternion();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const tmp3 = new THREE.Vector3();
  const tmp4 = new THREE.Vector3();
  // Rotate a bone about its head, around an axis in model space: q' = P⁻¹ · R · P · q.
  const rotate = (b: THREE.Bone, ax: THREE.Vector3, rad: number) => {
    if (Math.abs(rad) < 1e-5) return;
    modelQ(b.parent, qp);
    qr.setFromAxisAngle(ax, rad);
    qt.copy(qp).invert().multiply(qr).multiply(qp).multiply(b.quaternion);
    b.quaternion.copy(qt);
  };
  const apply = (list: Compiled[], w: number) => {
    if (w < 1e-3) return;
    for (const op of list) {
      if (op.axis) rotate(op.b, op.axis, op.rad * w);
      else if (op.hand && op.palmLocal && op.local && op.target) {
        // palm: about the forearm's own length (as posed now), from where the palm faces to where it
        // should, both seen across that length
        const along = tmp.copy(op.local).applyQuaternion(modelQ(op.b, q)).normalize();
        const now = tmp2.copy(op.palmLocal).applyQuaternion(modelQ(op.hand, q)).projectOnPlane(along).normalize();
        const want = tmp3.copy(op.target).projectOnPlane(along).normalize();
        const angle = Math.atan2(tmp4.crossVectors(now, want).dot(along), now.dot(want));
        if (Math.abs(angle) > 1e-4) rotate(op.b, along, angle * w);
      } else if (op.local && op.target) {
        // aim: turn the bone (as posed now) toward the target, by the weight
        tmp.copy(op.local).applyQuaternion(modelQ(op.b, q)).normalize();
        const angle = Math.acos(THREE.MathUtils.clamp(tmp.dot(op.target), -1, 1));
        if (angle > 1e-4) rotate(op.b, tmp2.crossVectors(tmp, op.target).normalize(), angle * w);
      }
    }
  };

  // The drift: a few slow, unrelated sines per limb, so nothing repeats in step.
  const X = new THREE.Vector3(1, 0, 0);
  const Y = new THREE.Vector3(0, 1, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const hinges = {
    elbowL: compile([bend("forearm.L", "upper_arm.L", 1)])[0].axis!,
    elbowR: compile([bend("forearm.R", "upper_arm.R", 1)])[0].axis!,
    kneeL: compile([bend("shin.L", "thigh.L", 1)])[0].axis!,
    kneeR: compile([bend("shin.R", "thigh.R", 1)])[0].axis!,
  };
  const B = {
    chest: bone("chest"),
    head: bone("head"),
    uaL: bone("upper_arm.L"),
    uaR: bone("upper_arm.R"),
    faL: bone("forearm.L"),
    faR: bone("forearm.R"),
    thL: bone("thigh.L"),
    thR: bone("thigh.R"),
    shL: bone("shin.L"),
    shR: bone("shin.R"),
  };

  // ---------- Hierarchy: root (the scene's) > float (the drift) > model, centred ----------
  const root = new THREE.Group();
  const float = new THREE.Group();
  model.position.y = -FIGURE_CY;
  float.add(model);
  root.add(float);

  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.0, FIGURE_H, 0.8), hitMaterial);
  hit.userData.key = "x";
  float.add(hit);

  // ---------- The X, seated on the left shoulder ----------
  const perch = bone("perch");
  const mount = new THREE.Group();
  // Upright in the astronaut's own frame, whatever the bone's axes are; the crossing (its hips,
  // about 0.42 of its height up) at SEAT, so it rests on the shoulder (frame() moves it as it settles).
  mount.quaternion.copy(modelQ(perch, q)).invert();
  perch.add(mount);
  const seat = new THREE.Group();
  seat.position.set(SEAT.out, -X_SCALE * 0.42 + SEAT.up, SEAT.fwd);
  const xModel = x.scene;
  xModel.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = opts.shadows;
    mesh.userData.x = true;
  });
  xModel.scale.setScalar(X_SCALE);
  const xTurn = new THREE.Group();
  xTurn.add(xModel);
  seat.add(xTurn);
  mount.add(seat);
  // Where it sits on the shoulder, posed with it, so the scene can bring it back to exactly there.
  const seatMark = new THREE.Object3D();
  mount.add(seatMark);
  let xFree = false;
  const setFree = (free: boolean, parent: THREE.Object3D) => {
    if (free === xFree) return;
    xFree = free;
    if (free) {
      // its turn moves into the seat, so the scene places one object
      seat.quaternion.multiply(xTurn.quaternion);
      xTurn.rotation.set(0, 0, 0);
      parent.attach(seat);
    } else {
      mount.add(seat);
      seat.position.copy(seatMark.position);
      seat.quaternion.identity();
      seat.scale.setScalar(1);
      seat.visible = true;
    }
  };

  const mixer = new THREE.AnimationMixer(xModel);
  const actions = new Map(x.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
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
    if (!next || (next === current && next.isRunning())) return;
    next.reset().setEffectiveWeight(1).play();
    if (current && current !== next) current.crossFadeTo(next, 0.25, false);
    current = next;
  };
  const onFinished = (event: { action: THREE.AnimationAction }) => {
    if (event.action === current && idle) play("Idle");
  };
  mixer.addEventListener("finished", onFinished);
  // three strips the dots: eye.L loads as eyeL. No clip moves the eyes, so they are set from rest.
  const eyes = ["eyeL", "eyeR"]
    .map((n) => xModel.getObjectByName(n))
    .filter((n): n is THREE.Object3D => Boolean(n))
    .map((node) => ({ node, rest: node.position.clone() }));
  // Seated: its lower strokes swing forward over the shoulder's edge, its feet hang (turned after
  // the clip each frame, in the X's own model space: +X is its left-right axis).
  const xBones = new Map<string, THREE.Bone>();
  xModel.traverse((o) => {
    if ((o as THREE.Bone).isBone) xBones.set(o.name, o as THREE.Bone);
  });
  const xChains = new Map<THREE.Object3D, THREE.Object3D[]>();
  const xModelQ = (node: THREE.Object3D | null, out: THREE.Quaternion) => {
    out.identity();
    if (!node) return out;
    let chain = xChains.get(node);
    if (!chain) {
      chain = [];
      for (let n: THREE.Object3D | null = node; n && n !== xModel; n = n.parent) chain.unshift(n);
      xChains.set(node, chain);
    }
    for (const n of chain) out.multiply(n.quaternion);
    return out;
  };
  const xRotate = (b: THREE.Bone | undefined, ax: THREE.Vector3, rad: number) => {
    if (!b) return;
    xModelQ(b.parent, qp);
    qr.setFromAxisAngle(ax, rad);
    qt.copy(qp).invert().multiply(qr).multiply(qp).multiply(b.quaternion);
    b.quaternion.copy(qt);
  };
  // glTF drops constant tracks, so a clip that doesn't move the legs (Wave) never resets them: each
  // frame they go back to rest before the clip and the seat are applied, or the seat would add up.
  const sit = [
    { b: xBones.get("legL"), rad: -42 * DEG },
    { b: xBones.get("legR"), rad: -42 * DEG },
    { b: xBones.get("footL"), rad: 30 * DEG },
    { b: xBones.get("footR"), rad: 30 * DEG },
  ].map((p) => ({ ...p, rest: p.b?.quaternion.clone() }));
  // Its arms, tucked in as it becomes the footer's letter (the letter has none).
  const arms = [xBones.get("upper_armL"), xBones.get("upper_armR")]
    .filter((b): b is THREE.Bone => Boolean(b))
    .map((b) => ({ b, rest: b.scale.clone() }));

  const frame = (f: AstronautFrame) => {
    for (const [b, rest] of restLocal) b.quaternion.copy(rest);
    apply(hero, f.hero);
    apply(fall, f.fall);
    apply(settle, f.settle);

    const w = f.drift;
    const t = f.t;
    const s = (speed: number, phase: number) => Math.sin(t * speed + phase);
    rotate(B.chest, X, (1.4 * s(0.9, 0.4) + 1.6 * f.lookY) * DEG * w);
    rotate(B.uaL, Z, (5 * s(0.71, 0) + 2 * s(1.37, 2)) * DEG * w * (1 - 0.6 * f.hero));
    rotate(B.uaR, Z, (-5 * s(0.63, 1.3) - 2 * s(1.21, 0.5)) * DEG * w);
    rotate(B.faL, hinges.elbowL, 7 * s(0.87, 2.1) * DEG * w);
    rotate(B.faR, hinges.elbowR, 7 * s(0.79, 0.2) * DEG * w);
    rotate(B.thL, Z, 3 * s(0.53, 0.9) * DEG * w);
    rotate(B.thR, Z, -3 * s(0.59, 2.4) * DEG * w);
    rotate(B.shL, hinges.kneeL, 6 * s(0.67, 1.1) * DEG * w);
    rotate(B.shR, hinges.kneeR, 6 * s(0.61, 0.3) * DEG * w);
    // The head looks where it is told (the work, the copy, or the pointer), within a helmet's range.
    rotate(B.head, Y, f.lookX * 16 * DEG);
    rotate(B.head, X, -f.lookY * 9 * DEG);

    float.position.y = 0.035 * s(0.83, 0) * w;
    float.rotation.set(0.045 * s(0.57, 1.7) * w, 0.05 * s(0.41, 0.6) * w, 0.06 * s(0.47, 2.9) * w);

    // The X: turned toward where it's told (the camera, mostly), its eyes following the look. Off the
    // shoulder the scene turns it.
    const xYaw = f.xYaw + f.lookX * 0.25;
    if (!xFree) xTurn.rotation.y = xYaw;
    for (const eye of eyes) {
      eye.node.position.copy(eye.rest);
      eye.node.position.x += f.lookX * 0.006;
      eye.node.position.y += f.lookY * 0.006;
    }
    seatMark.position.set(SEAT.out, -X_SCALE * 0.42 + SEAT.up + SEAT_SETTLED.up * f.settle, SEAT.fwd + SEAT_SETTLED.fwd * f.settle);
    seatMark.rotation.set(0, xYaw, 0);
    if (!xFree) seat.position.copy(seatMark.position);
    for (const p of sit) if (p.b && p.rest) p.b.quaternion.copy(p.rest);
    for (const a of arms) a.b.scale.copy(a.rest);
    mixer.update(Math.min(f.dt, 1 / 20));
    const sitW = f.xSit ?? 1;
    for (const p of sit) xRotate(p.b, X, p.rad * sitW);
    const tuck = f.xTuck ?? 0;
    if (tuck > 0) for (const a of arms) a.b.scale.multiplyScalar(Math.max(1e-3, 1 - tuck));
  };

  return {
    root,
    hit,
    visor,
    frame,
    react: play,
    x: { seat, mark: seatMark, setFree },
    probe() {
      // The suit as posed, in world space, cut down to the triangles near the X; then a point is
      // inside when a ray from it first meets the suit from within (the face turned the ray's way),
      // in two directions.
      root.updateMatrixWorld(true);
      const xBox = new THREE.Box3().setFromObject(xModel, true).expandByScalar(0.25 * root.scale.x);
      const tris: THREE.Vector3[] = [];
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const c = new THREE.Vector3();
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || mesh.userData.x || !(mesh.material as THREE.Material).visible) return;
        const index = mesh.geometry.index;
        const n = index ? index.count : mesh.geometry.attributes.position.count;
        for (let i = 0; i < n; i += 3) {
          const ia = index ? index.getX(i) : i;
          const ib = index ? index.getX(i + 1) : i + 1;
          const ic = index ? index.getX(i + 2) : i + 2;
          mesh.getVertexPosition(ia, a).applyMatrix4(mesh.matrixWorld);
          if (!xBox.containsPoint(a)) continue;
          mesh.getVertexPosition(ib, b).applyMatrix4(mesh.matrixWorld);
          mesh.getVertexPosition(ic, c).applyMatrix4(mesh.matrixWorld);
          tris.push(a.clone(), b.clone(), c.clone());
        }
      });
      const ray = new THREE.Ray();
      const hit = new THREE.Vector3();
      const nrm = new THREE.Vector3();
      const e1 = new THREE.Vector3();
      const e2 = new THREE.Vector3();
      const dirs = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.4, -0.3, 0.87).normalize()];
      const firstHit = (p: THREE.Vector3, d: THREE.Vector3, wantInward = true) => {
        ray.set(p, d);
        let best = Infinity;
        let inward = false;
        for (let i = 0; i < tris.length; i += 3) {
          if (!ray.intersectTriangle(tris[i], tris[i + 1], tris[i + 2], false, hit)) continue;
          const dist = hit.distanceTo(p);
          if (dist >= best) continue;
          best = dist;
          nrm.crossVectors(e1.subVectors(tris[i + 1], tris[i]), e2.subVectors(tris[i + 2], tris[i]));
          inward = nrm.dot(d) > 0;
        }
        return best < Infinity && inward === wantInward ? best : -1;
      };
      // How far the X floats: from its points straight down (the astronaut's down) to the suit.
      const down = new THREE.Vector3(0, -1, 0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
      let gap = Infinity;
      let inside = 0;
      let total = 0;
      let deepest = 0;
      const v = new THREE.Vector3();
      xModel.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const count = mesh.geometry.attributes.position.count;
        for (let i = 0; i < count; i += 6) {
          mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld);
          total++;
          let depth = Infinity;
          for (const d of dirs) {
            const h = firstHit(v, d);
            if (h < 0) {
              depth = -1;
              break;
            }
            depth = Math.min(depth, h);
          }
          if (depth > 0) {
            inside++;
            deepest = Math.max(deepest, depth / root.scale.x);
          } else {
            const g = firstHit(v, down, false);
            if (g >= 0) gap = Math.min(gap, g / root.scale.x);
          }
        }
      });
      return { inside, total, deepest, gap };
    },
    dispose() {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      hit.geometry.dispose();
      hitMaterial.dispose();
      weave.dispose();
      for (const m of owned) m.dispose();
      root.traverse((n) => {
        const mesh = n as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const material = mesh.material;
        for (const m of Array.isArray(material) ? material : material ? [material] : []) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      });
    },
  };
}
