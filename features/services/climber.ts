import * as THREE from "three";
import { loadAstronaut, type Astronaut } from "@/features/drafts/depth/astronaut";

// /services, "Spacewalk": the astronaut on the tether, live (Karan, 27 Oct 2026: "it should
// hang with one hand, like swinging from a rope"). The home's own astronaut and X (astronaut.ts),
// hanging from the line by its right hand and swinging from it: the hand slides along the line as you
// scroll, and the body below it is a pendulum. Every change of the line's direction or speed sets it
// swinging, and between them it keeps a slow swing of its own; the free arm is thrown out for
// balance and the legs trail, both a beat behind the swing. Posed here on top of astronaut.ts's rest
// pose, so the home is untouched. The line itself is the page's SVG; this draws only the figure, on a
// small transparent canvas whose point (0, 0) is the hand on the line.

/** The canvas's view, in metres: the hand on the line at (0, 0), the figure swinging below it. */
const VIEW = { w: 4.2, top: 0.45, h: 3.4 };
/**
 * The pendulum: the hand to the body's centre, a pull "down" the page, its damping, how much of the
 * hand's acceleration along the line reaches it (the line's curves at full scroll speed would
 * otherwise throw it level), how far it may swing either way (radians), and its own swing when the
 * line is still: a push in time with it (rad/s², about 11° either way) and seconds per swing.
 */
const PEND = { len: 1.25, g: 7, damp: 0.55, drive: 0.6, max: 0.8, push: 0.3, period: 2.9 };
/** The middle of the glove's palm (where the line is held), from the wrist, along the arm. */
const PALM = 0.09;

export type Rope = {
  /** The line's length, in page pixels. */
  total: number;
  /** The point at a length along the line, in page pixels. */
  at: (len: number, out: { x: number; y: number }) => void;
};

export type Climber = {
  /** One frame: `s` is the hand's place on the line (page pixels of line). */
  frame: (dt: number, t: number, s: number, rope: Rope) => void;
  /** Sizes the canvas for a scale (pixels per metre); returns where the hand sits in it (CSS px). */
  resize: (ppm: number) => { width: number; height: number; x: number; y: number };
  dispose: () => void;
};

/** The suit's world, as on the home: black space, Earth's blue from below, a hot sun. */
function spaceEnv(renderer: THREE.WebGLRenderer, sun: THREE.Vector3) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uSun: { value: sun } },
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

export async function createClimber(canvas: HTMLCanvasElement, small: boolean): Promise<Climber> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const sun = new THREE.Vector3(1, 0.32, -0.45).normalize();
  const env = spaceEnv(renderer, sun.clone());
  scene.environment = env;
  // The home's light: a warm sun from the right and behind, a cool fill from the front left, a cool
  // rim, the station's red from below, and Earth's blue under it all. (A little more fill than the
  // home: here the figure faces you, small, and has to read at a glance.)
  const lights = [
    { light: new THREE.DirectionalLight(0xffdcb0, 4.2), pos: sun.clone().multiplyScalar(5) },
    { light: new THREE.DirectionalLight(0xdfe6f5, 1.6), pos: new THREE.Vector3(-2.4, 0.6, 2.6) },
    { light: new THREE.DirectionalLight(0xafc6ff, 1.5), pos: new THREE.Vector3(-1.8, 2.2, -2.6) },
    { light: new THREE.DirectionalLight(0xe21f26, 0.55), pos: new THREE.Vector3(2.8, -1.4, 1.2) },
  ];
  for (const { light, pos } of lights) {
    light.position.copy(pos);
    scene.add(light);
  }
  scene.add(new THREE.HemisphereLight(0x161a24, 0x3a5784, 0.75));

  const camera = new THREE.OrthographicCamera(-VIEW.w / 2, VIEW.w / 2, VIEW.top, VIEW.top - VIEW.h, 0.1, 40);
  camera.position.set(0, 0, 10);

  let astro: Astronaut;
  try {
    astro = await loadAstronaut({ small, shadows: false, visorEnv: env });
  } catch (e) {
    renderer.dispose();
    env.dispose();
    throw e;
  }
  const root = astro.root;
  scene.add(root);

  // The astronaut's own bones (its skinned mesh's skeleton: the X on the shoulder has bones of the
  // same names, so they are not looked up by name across the whole figure).
  const skeletons: THREE.Skeleton[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh && !mesh.userData.x) skeletons.push(mesh.skeleton);
  });
  if (!skeletons.length) throw new Error("climber: no skeleton");
  const byName = new Map(skeletons[0].bones.map((b) => [b.name, b]));
  const bone = (name: string) => {
    const b = byName.get(name.replace(/[.:]/g, "")) ?? byName.get(name);
    if (!b) throw new Error(`climber: no bone ${name}`);
    return b;
  };
  const B = {
    chest: bone("chest"),
    head: bone("head"),
    uaL: bone("upper_arm.L"),
    faL: bone("forearm.L"),
    hdL: bone("hand.L"),
    uaR: bone("upper_arm.R"),
    faR: bone("forearm.R"),
    hdR: bone("hand.R"),
    thL: bone("thigh.L"),
    shL: bone("shin.L"),
    ftL: bone("foot.L"),
    thR: bone("thigh.R"),
    shR: bone("shin.R"),
    ftR: bone("foot.R"),
  };

  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const q1 = new THREE.Quaternion();
  const q2 = new THREE.Quaternion();
  const q3 = new THREE.Quaternion();
  const pos = (b: THREE.Object3D, out: THREE.Vector3) => b.getWorldPosition(out);

  // Rotates a bone about its head by a rotation given in world space: local' = P⁻¹ · R · P · local.
  const turnWorld = (b: THREE.Bone, r: THREE.Quaternion) => {
    b.parent!.getWorldQuaternion(q2);
    q3.copy(q2).invert().multiply(r).multiply(q2);
    b.quaternion.premultiply(q3);
    b.updateMatrixWorld(true);
  };
  const rotateWorld = (b: THREE.Bone, axis: THREE.Vector3, rad: number) => {
    if (Math.abs(rad) < 1e-5) return;
    turnWorld(b, q1.setFromAxisAngle(axis, rad));
  };
  /** Turns a bone so that it points (head to its child's head) along a world direction. */
  const aim = (b: THREE.Bone, child: THREE.Bone, dir: THREE.Vector3) => {
    const from = pos(child, v1).sub(pos(b, v2)).normalize();
    turnWorld(b, q1.setFromUnitVectors(from, v3.copy(dir).normalize()));
  };

  // At rest, with the figure square to the world: the arm's length, the gripping shoulder, and each
  // glove's palm in its own frame (at rest the palms face the body).
  astro.frame({ dt: 0, t: 0, hero: 0, fall: 0, settle: 0, lookX: 0, lookY: 0, xYaw: 0, drift: 0 });
  root.updateMatrixWorld(true);
  const lenUpper = pos(B.uaR, v1).distanceTo(pos(B.faR, v2));
  const lenFore = pos(B.faR, v1).distanceTo(pos(B.hdR, v2));
  const shoulderR = pos(B.uaR, new THREE.Vector3());
  /**
   * The hand on the line, in the figure's own frame: over the right shoulder, in toward the head a
   * little, the arm all but straight (it bears the body). The X rides the left shoulder, on the free side.
   */
  const reachUp = (lenUpper + lenFore + PALM) * 0.99;
  const hangFrom = shoulderR.clone().add(new THREE.Vector3(0.07, reachUp, -0.05));
  const palmL = new THREE.Vector3(-1, 0, 0).applyQuaternion(B.hdL.getWorldQuaternion(q1).invert());
  const palmR = new THREE.Vector3(1, 0, 0).applyQuaternion(B.hdR.getWorldQuaternion(q1).invert());

  /** Two bones, shoulder to wrist, reaching for a point; the elbow toward `pole`. */
  const reach = (ua: THREE.Bone, fa: THREE.Bone, hd: THREE.Bone, grip: THREE.Vector3, pole: THREE.Vector3) => {
    const s = pos(ua, new THREE.Vector3());
    const toGrip = grip.clone().sub(s);
    const wrist = grip.clone().addScaledVector(toGrip.normalize(), -PALM);
    const d = wrist.sub(s);
    const dist = THREE.MathUtils.clamp(d.length(), Math.abs(lenUpper - lenFore) + 1e-3, (lenUpper + lenFore) * 0.998);
    const dn = d.normalize();
    const cosA = (lenUpper * lenUpper + dist * dist - lenFore * lenFore) / (2 * lenUpper * dist);
    const a = Math.acos(THREE.MathUtils.clamp(cosA, -1, 1));
    const side = pole.clone().addScaledVector(dn, -pole.dot(dn)).normalize();
    const upper = dn.clone().multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a));
    aim(ua, fa, upper);
    const elbow = pos(fa, new THREE.Vector3());
    aim(fa, hd, s.addScaledVector(dn, dist).sub(elbow));
  };
  /**
   * Turns the palm about the arm's length until it faces `want` (as near as it can). `wrist` is the
   * share the wrist takes; the forearm takes the rest, so neither is wrung (a whole quarter turn on the
   * forearm twisted the sleeve).
   */
  const palmTo = (fa: THREE.Bone, hd: THREE.Bone, local: THREE.Vector3, want: THREE.Vector3, wrist = 0) => {
    const along = pos(hd, new THREE.Vector3()).sub(pos(fa, v1)).normalize();
    const now = local.clone().applyQuaternion(hd.getWorldQuaternion(q1)).projectOnPlane(along).normalize();
    const goal = want.clone().projectOnPlane(along).normalize();
    const angle = Math.atan2(v2.crossVectors(now, goal).dot(along), now.dot(goal));
    rotateWorld(fa, along, angle * (1 - wrist));
    rotateWorld(hd, along, angle * wrist);
  };
  /** Bends the wrist so the fingers come over toward the palm (radians): the glove closing round the line. */
  const curl = (fa: THREE.Bone, hd: THREE.Bone, local: THREE.Vector3, rad: number) => {
    const along = pos(hd, new THREE.Vector3()).sub(pos(fa, v1)).normalize();
    const palm = local.clone().applyQuaternion(hd.getWorldQuaternion(q1));
    rotateWorld(hd, v2.crossVectors(along, palm).normalize(), rad);
  };

  // ---------- State ----------
  let ppm = 100;
  // the pendulum (radians, from hanging straight down the page), and what drives it: the hand's
  // motion on the page (m/s, m/s², y up)
  let theta = 0;
  let omega = 0;
  let started = false;
  const handPage = new THREE.Vector2();
  const vel = new THREE.Vector2();
  const acc = new THREE.Vector2();
  const here = { x: 0, y: 0 };
  const grip = new THREE.Vector3(0, 0, -0.08);
  const qBody = new THREE.Quaternion();
  const qYaw = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const Y = new THREE.Vector3(0, 1, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const front = new THREE.Vector3();
  const down = new THREE.Vector3();
  const toLine = new THREE.Vector3(0, 0.3, -1).normalize();
  let yaw = 0;
  let dir = 1;
  let lastS = 0;

  const frame = (dt: number, t: number, s: number, rope: Rope) => {
    dt = Math.min(Math.max(dt, 1e-4), 1 / 20);
    rope.at(s, here);
    const hx = here.x / ppm;
    const hy = -here.y / ppm;
    if (!started) {
      started = true;
      handPage.set(hx, hy);
      lastS = s;
    }
    if (Math.abs(s - lastS) > 0.5) dir = Math.sign(s - lastS);
    lastS = s;

    // ---------- The swing ----------
    const nvx = (hx - handPage.x) / dt;
    const nvy = (hy - handPage.y) / dt;
    handPage.set(hx, hy);
    const ka = 1 - Math.exp(-dt * 12);
    acc.x += (THREE.MathUtils.clamp((nvx - vel.x) / dt, -40, 40) - acc.x) * ka;
    acc.y += (THREE.MathUtils.clamp((nvy - vel.y) / dt, -40, 40) - acc.y) * ka;
    vel.set(nvx, nvy);
    // θ'' = −(g/ℓ)·sin θ − k·(aₓ·cos θ + a_y·sin θ)/ℓ − c·θ' + its own slow swing, in small steps
    const w0 = (2 * Math.PI) / PEND.period;
    const n = Math.ceil(dt / (1 / 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      // (its own swing: a gentle push in time with it, so it never hangs dead still)
      const own = PEND.push * Math.sin(w0 * (t + i * h));
      const a = -(PEND.g / PEND.len) * Math.sin(theta) - (PEND.drive * (acc.x * Math.cos(theta) + acc.y * Math.sin(theta))) / PEND.len - PEND.damp * omega + own;
      omega += a * h;
      theta += omega * h;
      // (at the end of its swing it is caught softly, not stopped dead)
      if (Math.abs(theta) > PEND.max) {
        theta = Math.sign(theta) * PEND.max;
        omega *= -0.3;
      }
    }

    // ---------- The body ----------
    // the home's rest, settled; the X on the shoulder, looking the way it goes
    astro.frame({ dt, t, hero: 0, fall: 0, settle: 1, lookX: 0, lookY: 0.2, xYaw: -0.2 * dir, drift: 0, xSit: 1, xTuck: 0 });
    // turned a little toward the way it goes, and round with the swing
    yaw += (0.28 * dir + omega * 0.18 - yaw) * (1 - Math.exp(-dt * 3));
    qBody.setFromAxisAngle(Z, theta).multiply(qYaw.setFromAxisAngle(Y, yaw));
    root.quaternion.copy(qBody);
    root.position.copy(grip).sub(v1.copy(hangFrom).applyQuaternion(qBody));
    root.updateMatrixWorld(true);

    right.copy(X).applyQuaternion(qBody);
    up.copy(Y).applyQuaternion(qBody);
    front.copy(Z).applyQuaternion(qBody);
    down.copy(up).negate();
    // the chest leans into the hanging arm; the head looks out the way it swings
    rotateWorld(B.chest, front, -0.06);
    rotateWorld(B.head, up, THREE.MathUtils.clamp(omega * 0.25, -0.35, 0.35));
    rotateWorld(B.head, right, -0.12);

    // The chest's lean has moved the shoulder: the body is moved after it, so the hanging arm reaches
    // the line all but straight (placed from the rest shoulder, the few centimetres short folded the
    // elbow). The arm runs up the body's own "up", in a little over the head.
    const shoulder = pos(B.uaR, v2);
    const armDir = v3.copy(up).addScaledVector(right, 0.07).normalize();
    const want = v1.copy(grip).addScaledVector(armDir, -((lenUpper + lenFore) * 0.996 + PALM));
    root.position.add(want.sub(shoulder));
    root.updateMatrixWorld(true);
    // the right hand on the line: the back of the glove to you, the palm on the line behind it, the
    // turn shared between forearm and wrist, and the wrist bent over so the fingers close round it
    reach(B.uaR, B.faR, B.hdR, grip, v1.copy(right).negate().addScaledVector(front, -0.3));
    palmTo(B.faR, B.hdR, palmR, toLine, 0.5);
    curl(B.faR, B.hdR, palmR, 0.85);

    // the free arm thrown out for balance, low enough to clear the X, a beat behind the swing
    const lag = THREE.MathUtils.clamp(-omega * 0.32, -0.55, 0.55);
    aim(B.uaL, B.faL, v1.copy(right).multiplyScalar(0.9).addScaledVector(up, -0.28).addScaledVector(front, 0.32).applyAxisAngle(front, lag));
    aim(B.faL, B.hdL, v1.copy(right).multiplyScalar(0.62).addScaledVector(up, 0.18).addScaledVector(front, 0.62).applyAxisAngle(front, lag * 1.3));
    palmTo(B.faL, B.hdL, palmL, down);

    // the legs together, knees soft, trailing the swing
    const trail = THREE.MathUtils.clamp(-omega * 0.22, -0.5, 0.5);
    aim(B.thL, B.shL, v1.copy(down).addScaledVector(front, 0.26).addScaledVector(right, 0.06).applyAxisAngle(front, trail));
    aim(B.thR, B.shR, v1.copy(down).addScaledVector(front, 0.2).addScaledVector(right, -0.06).applyAxisAngle(front, trail * 0.9));
    aim(B.shL, B.ftL, v1.copy(down).addScaledVector(front, -0.22).applyAxisAngle(front, trail * 1.5));
    aim(B.shR, B.ftR, v1.copy(down).addScaledVector(front, -0.28).applyAxisAngle(front, trail * 1.4));

    renderer.render(scene, camera);
  };

  const resize = (next: number) => {
    ppm = next;
    const width = Math.round(VIEW.w * ppm);
    const height = Math.round(VIEW.h * ppm);
    renderer.setSize(width, height, false);
    return { width, height, x: width / 2, y: VIEW.top * ppm };
  };

  return {
    frame,
    resize,
    dispose() {
      astro.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
