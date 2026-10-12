// The four flagship islands, each built from the client's own identity and, where it exists, its
// real 3D: SKELMET's print-file skull, the Know Your Genes mascots, Hard2Soft's hard-to-soft
// channel, and a DNMS tower whose windows are DNMS screens.
import * as THREE from "three/webgpu";
import { AdditiveBlending } from "three/webgpu";
import { color, float, fract, hash, instanceIndex, mix, positionLocal, sin, smoothstep, uniform, uv, vec3 } from "three/tsl";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { ISLANDS, dockEnd, type Island } from "../../layout";
import { world } from "../../store";
import { groundHeight, landById, scatter } from "../terrain";
import { type Batch, type Disposables, type IslandCtx, type Materials, type Part, SHAPES, lamp, sign, textTexture } from "./common";
import { loadGLTF } from "./loaders";
import { detail } from "../layers";

type Flora = { tree: (x: number, y: number, z: number, s?: number, kind?: "round" | "pine" | "palm") => void };

function islandOf(id: string): Island {
  return ISLANDS.find((i) => i.id === id)!;
}

/** Rising sparks around a point (SKELMET's embers, the Lab's glints). GPU-only, like the weather. */
export function risingSparks(ctx: IslandCtx, d: Disposables, at: THREE.Vector3, box: [number, number, number], count: number, hex: string, speed = 1.2) {
  const base = new THREE.PlaneGeometry(0.09, 0.09);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.attributes.position);
  geometry.instanceCount = Math.round(count * (ctx.tier === 3 ? 1 : ctx.tier === 2 ? 0.7 : 0.4));
  geometry.boundingSphere = new THREE.Sphere(at.clone(), Math.max(...box));
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, side: THREE.DoubleSide });
  const id = instanceIndex.toFloat();
  const r1 = hash(id.add(1.7));
  const r2 = hash(id.mul(3.1).add(5.3));
  const r3 = hash(id.add(11.9));
  const life = fract(r2.add(ctx.shared.u.time.mul(speed * 0.12).mul(r3.mul(0.6).add(0.7))));
  const x = r1.sub(0.5).mul(box[0]).add(sin(ctx.shared.u.time.mul(0.9).add(r3.mul(6.28))).mul(0.4));
  const z = r3.sub(0.5).mul(box[2]);
  material.positionNode = vec3(x.add(at.x), life.mul(box[1]).add(at.y), z.add(at.z)).add(positionLocal);
  material.colorNode = color(new THREE.Color(hex)).mul(2.2);
  material.opacityNode = sin(life.mul(Math.PI)).mul(0.9);
  const mesh = detail(new THREE.Mesh(geometry, material));
  mesh.renderOrder = 6;
  ctx.scene.add(mesh);
  d.meshes.push(mesh);
  d.geometries.push(geometry, base);
  d.materials.push(material);
  return mesh;
}

// ---------------------------------------------------------------------------------------------

export function buildSkelmet(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const island = islandOf("skelmet");
  const land = landById("skelmet");
  const blaze = "#ff5a1f";
  const gx = island.x;
  const gz = island.z - 6;
  const gy = groundHeight(land, gx, gz) - 0.2;
  const charcoal = mats.paint("#1b1a20", 0.7, 0.1);
  // "After Dark Garage": walls, roof, a half-open roller door, glowing inside.
  batch.add(SHAPES.box, charcoal, { x: gx, y: gy + 2.6, z: gz - 3.5, s: [10, 5.2, 0.4] });
  batch.add(SHAPES.box, charcoal, { x: gx - 5, y: gy + 2.6, z: gz, s: [0.4, 5.2, 7.4] });
  batch.add(SHAPES.box, charcoal, { x: gx + 5, y: gy + 2.6, z: gz, s: [0.4, 5.2, 7.4] });
  batch.add(SHAPES.box, mats.paint("#26242c", 0.8), { x: gx, y: gy + 5.35, z: gz, s: [10.6, 0.35, 7.8] });
  batch.add(SHAPES.box, mats.paint("#2d2b33", 0.5, 0.4), { x: gx, y: gy + 4.4, z: gz + 3.6, s: [9.6, 1.6, 0.2] });
  batch.add(SHAPES.box, mats.glow(blaze, 0.6, 2.6), { x: gx, y: gy + 2.2, z: gz - 3.25, s: [9.2, 3.6, 0.05] });
  batch.add(SHAPES.box, mats.glow(blaze, 0.25, 1.3), { x: gx, y: gy + 0.08, z: gz, s: [9.2, 0.05, 6.6] });
  batch.add(SHAPES.box, mats.glow(blaze, 0.8, 3.2), { x: gx, y: gy + 5.15, z: gz + 3.92, s: [10.4, 0.12, 0.08] });
  const signTex = textTexture([{ text: "SKELMET", size: 150, weight: 800, color: blaze }], { width: 1024, height: 220, bg: "#07060a", align: "center" });
  d.textures.push(signTex);
  const signMat = mats.screen(signTex);
  d.materials.push(signMat);
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.38), signMat);
  signMesh.position.set(gx, gy + 6.4, gz + 3.7);
  ctx.scene.add(signMesh);
  d.meshes.push(signMesh);
  d.geometries.push(signMesh.geometry);
  batch.add(SHAPES.box, charcoal, { x: gx, y: gy + 6.4, z: gz + 3.6, s: [6.8, 1.6, 0.15] });

  risingSparks(ctx, d, new THREE.Vector3(gx, gy + 0.5, gz + 2), [14, 9, 10], 160, "#ff8a2a", 1);

  for (const p of scatter(land, 10, { keepOut: [{ x: gx, z: gz, r: 7.5 }], seed: 77, minH: 1.2 })) flora.tree(p.x, p.y, p.z, 0.9 + Math.random() * 0.4, "pine");

  // The skull, on a pontoon in the cove beside the dock. Ram the pontoon and it spins.
  const end = dockEnd(island);
  const side = { x: -Math.sin(island.dock), z: Math.cos(island.dock) };
  const px = end.x + side.x * 7;
  const pz = end.z + side.z * 7;
  batch.add(SHAPES.cyl, mats.paint("#16151d", 0.6, 0.2), { x: px, y: -0.2, z: pz, s: [3.8, 1.2, 3.8] });
  batch.add(SHAPES.box, mats.paint("#16151d", 0.5, 0.2), { x: px, y: 1.1, z: pz, s: [1.4, 1.8, 1.4] });
  batch.add(SHAPES.box, mats.glow(blaze, 0.7, 2.6), { x: px, y: 2.02, z: pz, s: [1.5, 0.06, 1.5] });
  ctx.physics.posts.push({ x: px, z: pz, r: 2.0, id: "skull-plinth" });

  const skull = new THREE.Group();
  skull.position.set(px, 3.3, pz);
  ctx.scene.add(skull);
  d.meshes.push(skull);
  const filament = new THREE.MeshStandardNodeMaterial({ roughness: 0.55, metalness: 0.02 });
  const flare = uniform(0);
  filament.colorNode = color(new THREE.Color(blaze));
  filament.emissiveNode = color(new THREE.Color(blaze)).mul(flare.mul(1.6).add(ctx.shared.u.night.mul(0.12)).add(0.03));
  d.materials.push(filament);
  // The print file (0.8 MB) loads with the world: it is in view from the spawn, and loading it
  // up front lets its shaders build behind the loader instead of stalling the first seconds.
  void loadGLTF("/models/skelmet/skull.glb").then((gltf) => {
    const root = gltf.scene;
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2.4 / Math.max(size.x, size.y, size.z);
    root.position.copy(center).multiplyScalar(-scale);
    root.scale.multiplyScalar(scale);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = filament;
        m.castShadow = true;
      }
    });
    skull.add(root);
    detail(skull);
    d.cleanups.push(() => root.traverse((o) => (o as THREE.Mesh).isMesh && (o as THREE.Mesh).geometry.dispose()));
  });

  let spin = 0.4;
  let yaw = 0;
  const boatBody = ctx.physics.bodies.find((b) => b.id === "boat");
  const prevImpact = boatBody?.onImpact;
  if (boatBody) {
    boatBody.onImpact = (speed, other) => {
      prevImpact?.(speed, other);
      if (other === "skull-plinth") {
        spin += Math.min(14, speed * 2.2);
        flare.value = 1;
      }
    };
  }

  sign(ctx, batch, mats, d, { x: island.x + 6, y: groundHeight(land, island.x + 6, island.z + 9) + 0.2, z: island.z + 9 }, "SKELMET", "Skull helmet mounts, sold online", blaze, 6.4);

  return {
    update(dt, t) {
      spin += (0.4 - spin) * Math.min(1, dt * 0.6);
      yaw += spin * dt;
      skull.rotation.y = yaw;
      skull.position.y = 3.3 + Math.sin(t * 1.3) * 0.12;
      flare.value = Math.max(0, flare.value - dt * 0.8);
    },
  };
}

// ---------------------------------------------------------------------------------------------

const KYG_CREW = [
  { id: "vita", model: "/models/kyg/vita.glb" },
  { id: "cardi", model: "/models/kyg/cardi.glb" },
  { id: "genee", model: "/models/kyg/genee.glb" },
  { id: "dozy", model: "/models/kyg/dozy.glb" },
  { id: "guard", model: "/models/kyg/guard.glb" },
  { id: "glow", model: "/models/kyg/glow.glb" },
];

export function buildKyg(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const island = islandOf("know-your-genes");
  const land = landById("know-your-genes");
  const teal = "#0e4d4b";
  const eden = "#25b5ab";
  const java = "#7fe3d6";

  // The lab: a long white pavilion with rounded ends and a teal band.
  const lx = island.x + 3;
  const lz = island.z - 8;
  const ly = groundHeight(land, lx, lz) - 0.1;
  const white = mats.paint("#f7f5f0", 0.6);
  batch.add(SHAPES.box, white, { x: lx, y: ly + 2, z: lz, s: [9, 4, 6] });
  for (const s of [-1, 1]) batch.add(SHAPES.cyl, white, { x: lx + s * 4.5, y: ly + 2, z: lz, s: [6, 4, 6] });
  batch.add(SHAPES.box, mats.paint(teal, 0.5), { x: lx, y: ly + 3.6, z: lz, s: [9.1, 0.35, 6.1] });
  batch.add(SHAPES.box, mats.windows("#d8fbf5"), { x: lx, y: ly + 1.9, z: lz + 3.02, s: [8, 1.4, 0.05] });

  // The helix tower, turning slowly.
  const hx = island.x - 8;
  const hz = island.z - 2;
  const hy = groundHeight(land, hx, hz);
  batch.add(SHAPES.cyl, white, { x: hx, y: hy + 0.4, z: hz, s: [3.4, 0.8, 3.4] });
  const helix = new THREE.Group();
  helix.position.set(hx, hy + 0.8, hz);
  ctx.scene.add(helix);
  d.meshes.push(helix);
  const strandA = mats.paint(eden, 0.4);
  const strandB = mats.paint(java, 0.4);
  const rung = mats.paint("#f7f5f0", 0.5);
  const helixBatch: { geo: THREE.BufferGeometry; mat: THREE.Material; m: THREE.Matrix4 }[] = [];
  const turns = 2.3;
  const steps = 26;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const a = t * Math.PI * 2 * turns;
    const y = t * 10.5;
    const r = 1.25;
    const ax = Math.cos(a) * r;
    const az = Math.sin(a) * r;
    helixBatch.push({ geo: SHAPES.sphere, mat: strandA, m: new THREE.Matrix4().compose(new THREE.Vector3(ax, y, az), new THREE.Quaternion(), new THREE.Vector3(0.5, 0.5, 0.5)) });
    helixBatch.push({ geo: SHAPES.sphere, mat: strandB, m: new THREE.Matrix4().compose(new THREE.Vector3(-ax, y, -az), new THREE.Quaternion(), new THREE.Vector3(0.5, 0.5, 0.5)) });
    if (i % 2 === 0) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a, Math.PI / 2));
      helixBatch.push({ geo: SHAPES.cyl6, mat: rung, m: new THREE.Matrix4().compose(new THREE.Vector3(0, y, 0), q, new THREE.Vector3(0.12, r * 2, 0.12)) });
    }
  }
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const h of helixBatch) {
    const g = h.geo.toNonIndexed().applyMatrix4(h.m);
    g.deleteAttribute("uv");
    (groups.get(h.mat) ?? groups.set(h.mat, []).get(h.mat)!).push(g);
  }
  for (const [mat, list] of groups) {
    const total = list.reduce((n, g) => n + g.attributes.position.count, 0);
    const pos = new Float32Array(total * 3);
    const nor = new Float32Array(total * 3);
    let o = 0;
    for (const g of list) {
      pos.set(g.attributes.position.array as Float32Array, o * 3);
      nor.set(g.attributes.normal.array as Float32Array, o * 3);
      o += g.attributes.position.count;
      g.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    merged.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    d.geometries.push(merged);
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    helix.add(mesh);
  }

  for (const p of scatter(land, 7, { keepOut: [{ x: lx, z: lz, r: 9 }, { x: hx, z: hz, r: 3 }, { x: island.x + 3, z: island.z + 10, r: 9 }, { x: island.x - 2, z: island.z + 5, r: 4 }], seed: 91 })) flora.tree(p.x, p.y, p.z, 0.9, "palm");

  sign(ctx, batch, mats, d, { x: island.x - 2, y: groundHeight(land, island.x - 2, island.z + 5) + 0.2, z: island.z + 5 }, "Know Your Genes", "DNA tests, with a guide called GENEe", eden, 6.8);

  // The mascots line the shore either side of the dock, facing the water.
  const mixers: THREE.AnimationMixer[] = [];
  const crews: { id: string; actions: Record<string, THREE.AnimationAction>; group: THREE.Group }[] = [];
  const spots = [-14, -10.5, -7, 8.5, 12, 15.5];
  // The mascots (2.1 MB together) load with the world, for the same reason as SKELMET's skull.
  const contactGeo = new THREE.CircleGeometry(0.9, 24);
  const contactMat = new THREE.MeshBasicNodeMaterial({ color: "#000000", transparent: true, depthWrite: false });
  contactMat.opacityNode = float(1).sub(smoothstep(0.15, 1, uv().sub(0.5).length().mul(2))).mul(0.42);
  d.geometries.push(contactGeo);
  d.materials.push(contactMat);
  KYG_CREW.forEach((c, i) => {
    const x = island.x + spots[i] - 1;
    const z = island.z + 11.5 - Math.abs(spots[i]) * 0.12;
    const y = Math.max(0.5, groundHeight(land, x, z));
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = (x - island.x) * -0.02;
    ctx.scene.add(group);
    d.meshes.push(group);
    void loadGLTF(c.model).then((gltf) => {
      const scene = cloneSkinned(gltf.scene);
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      scene.position.set(-center.x, -box.min.y, -center.z);
      // Culled like everything else, with room in the bounds for the arms when they wave. A soft
      // contact shadow grounds each one; skinned meshes in the shadow map would cost a second set
      // of shaders per mascot for a shadow this small.
      scene.traverse((o) => {
        const m = o as THREE.SkinnedMesh;
        if (!m.isMesh) return;
        m.castShadow = false;
        if (m.isSkinnedMesh) {
          m.computeBoundingSphere();
          m.boundingSphere!.radius *= 1.6;
        }
      });
      const blob = new THREE.Mesh(contactGeo, contactMat);
      blob.rotation.x = -Math.PI / 2;
      blob.position.y = 0.04;
      group.add(blob);
      const wrap = new THREE.Group();
      wrap.add(scene);
      wrap.scale.setScalar((c.id === "genee" ? 3.3 : 2.6) / size.y);
      group.add(wrap);
      detail(group);
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(scene);
        const actions: Record<string, THREE.AnimationAction> = {};
        for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
        actions.Idle?.play();
        mixers.push(mixer);
        crews.push({ id: c.id, actions, group });
        mixer.addEventListener("finished", (event: { action: THREE.AnimationAction }) => {
          event.action.fadeOut(0.3);
          actions.Idle?.reset().fadeIn(0.3).play();
        });
      } else {
        crews.push({ id: c.id, actions: {}, group });
      }
    });
  });

  const play = (crew: (typeof crews)[number], name: string, delay: number) => {
    window.setTimeout(() => {
      const action = crew.actions[name];
      const idle = crew.actions.Idle;
      if (!action || !idle) return;
      action.reset().setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.fadeIn(0.2).play();
      idle.fadeOut(0.2);
    }, delay);
  };

  ctx.interactions.onApproach((p) => {
    if (p.id !== "know-your-genes" || ctx.reduced) return;
    crews.forEach((crew, i) => play(crew, i % 2 ? "Wave" : "Jump", i * 160));
  });
  void world;

  let breathe = 0;
  return {
    update(dt, t) {
      helix.rotation.y += dt * 0.25;
      for (const m of mixers) m.update(dt);
      breathe = t;
      const genee = crews.find((c) => c.id === "genee");
      if (genee) genee.group.rotation.y = Math.sin(breathe * 0.4) * 0.3;
    },
  };
}

// ---------------------------------------------------------------------------------------------

export function buildH2s(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const island = islandOf("hard2soft");
  const land = landById("hard2soft");
  const blue = "#1257c7";
  const tx = island.x - 4;
  const tz = island.z - 5;
  const ty = groundHeight(land, tx, tz);
  // Water tower.
  const steel = mats.paint("#cfd6df", 0.5, 0.4);
  for (const [ox, oz] of [
    [-1.7, -1.7],
    [1.7, -1.7],
    [-1.7, 1.7],
    [1.7, 1.7],
  ]) {
    batch.add(SHAPES.box, steel, { x: tx + ox, y: ty + 3.6, z: tz + oz, rz: -ox * 0.03, rx: oz * 0.03, s: [0.28, 7.4, 0.28] });
  }
  batch.add(SHAPES.box, steel, { x: tx, y: ty + 3.5, z: tz, ry: Math.PI / 4, s: [4.6, 0.18, 0.18] });
  batch.add(SHAPES.box, steel, { x: tx, y: ty + 3.5, z: tz, ry: -Math.PI / 4, s: [4.6, 0.18, 0.18] });
  batch.add(SHAPES.cyl, mats.paint(blue, 0.4, 0.2), { x: tx, y: ty + 8.8, z: tz, s: [5.4, 3.4, 5.4] });
  batch.add(SHAPES.cyl, mats.paint("#f6faff", 0.5), { x: tx, y: ty + 8.2, z: tz, s: [5.5, 0.55, 5.5] });
  batch.add(SHAPES.cone, mats.paint("#0d3f91", 0.5), { x: tx, y: ty + 11.1, z: tz, s: [5.6, 1.3, 5.6] });
  const label = textTexture([{ text: "Hard2Soft", size: 110, weight: 800, color: "#ffffff" }], { width: 900, height: 180, bg: blue, align: "center" });
  d.textures.push(label);
  const labelMat = mats.screen(label);
  d.materials.push(labelMat);
  const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.84), labelMat);
  labelMesh.position.set(tx, ty + 9.2, tz + 2.75);
  ctx.scene.add(labelMesh);
  d.meshes.push(labelMesh);
  d.geometries.push(labelMesh.geometry);
  // Pump house.
  const hx = island.x + 5;
  const hz = island.z - 2;
  const hy = groundHeight(land, hx, hz);
  batch.add(SHAPES.box, mats.paint("#f6faff", 0.7), { x: hx, y: hy + 1.4, z: hz, s: [4.2, 2.8, 3.2] });
  batch.add(SHAPES.box, mats.paint(blue, 0.6), { x: hx, y: hy + 2.95, z: hz, s: [4.5, 0.3, 3.5] });
  batch.add(SHAPES.box, mats.paint(blue, 0.6), { x: hx, y: hy + 1.0, z: hz + 1.62, s: [1.1, 2, 0.05] });
  for (const p of scatter(land, 9, { keepOut: [{ x: tx, z: tz, r: 4.5 }, { x: hx, z: hz, r: 3.5 }, { x: island.x, z: island.z + 11, r: 6 }], seed: 123 })) flora.tree(p.x, p.y, p.z);
  sign(ctx, batch, mats, d, { x: island.x - 6, y: groundHeight(land, island.x - 6, island.z + 10) + 0.2, z: island.z + 10 }, "Hard2Soft", "Hard water, conditioned", blue, 6.2);

  // The channel: chalky at the west gate, clear at the east gate.
  const A = { x: -122, z: 56 };
  const B = { x: -92, z: 56 };
  const width = 5;
  ctx.shared.u.chanA.value.set(A.x, A.z);
  ctx.shared.u.chanB.value.set(B.x, B.z);
  ctx.shared.u.chanW.value = width;
  const markerWhite = mats.paint("#f6faff", 0.5);
  const markerBlue = mats.paint(blue, 0.5);
  for (let x = A.x; x <= B.x + 0.1; x += 3.75) {
    for (const s of [-1, 1]) {
      const z = A.z + s * width;
      batch.add(SHAPES.cyl, (x - A.x) / (B.x - A.x) < 0.5 ? markerWhite : markerBlue, { x, y: 0.1, z, s: [0.7, 1, 0.7] });
      ctx.physics.posts.push({ x, z, r: 0.45, id: "channel-marker" });
    }
  }
  const gate = (x: number, title: string, sub: string, bg: string, fg: string) => {
    for (const s of [-1, 1]) batch.add(SHAPES.box, mats.paint("#1d2733", 0.6, 0.2), { x, y: 2.2, z: A.z + s * (width + 0.6), s: [0.45, 5.4, 0.45] });
    const tex = textTexture(
      [
        { text: title, size: 84, weight: 800, color: fg },
        { text: sub, size: 40, weight: 500, color: fg, font: "--font-text", gap: 8 },
      ],
      { width: 1024, height: 260, bg, align: "center" },
    );
    d.textures.push(tex);
    const m = mats.screen(tex);
    d.materials.push(m);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(width * 2 + 1.6, (width * 2 + 1.6) * (260 / 1024)), m);
    // Across the channel, facing the boat as it comes in from the west.
    board.position.set(x, 5.4, A.z);
    board.rotation.y = -Math.PI / 2;
    ctx.scene.add(board);
    d.meshes.push(board);
    d.geometries.push(board.geometry);
  };
  gate(A.x - 1.5, "Hard water in", "Scale, spots, dry skin", "#d9dbd5", "#2b2e33");
  gate(B.x + 1.5, "Soft water out", "The idea behind Hard2Soft", blue, "#ffffff");

  let entered = false;
  return {
    step() {
      const b = ctx.physics.bodies.find((body) => body.id === "boat");
      if (!b) return;
      const along = (b.x - A.x) / (B.x - A.x);
      const inside = Math.abs(b.z - A.z) < width && along > -0.05 && along < 1.05;
      if (inside && along < 0.25 && b.vx > 1) entered = true;
      if (!inside) {
        if (entered && along >= 1) {
          world.set({ toast: "Hard in, soft out: the idea behind Hard2Soft's conditioner, shown as an illustration." });
          ctx.audio.chime();
        }
        entered = false;
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------

const DNMS_SCREENS = ["/work/dnms/dashboard-hr.webp", "/work/dnms/analytics.webp", "/work/dnms/project-goals.webp", "/work/dnms/ai-connections.webp"];

export function buildDnms(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const island = islandOf("dnms");
  const land = landById("dnms");
  const violet = "#ab63f2";
  const cyan = "#22d3ee";
  const tx = island.x + 1;
  const tz = island.z - 3;
  const ty = groundHeight(land, tx, tz) - 0.05;
  const navy = mats.glass("#2a3150");
  const levels = [
    { w: 7.5, h: 5, d: 7 },
    { w: 6.4, h: 5, d: 6 },
    { w: 5.2, h: 4.4, d: 5 },
  ];
  let y = ty;
  levels.forEach((l, i) => {
    batch.add(SHAPES.box, navy, { x: tx, y: y + l.h / 2, z: tz, s: [l.w, l.h, l.d] });
    // Window bands, alternating Aurora violet and cyan.
    for (let k = 0; k < 2; k++) {
      const by = y + 1.3 + k * 2;
      const glow = mats.glow((i + k) % 2 ? cyan : violet, 0.3, 2.4);
      batch.add(SHAPES.box, glow, { x: tx - l.w / 2 - 0.02, y: by, z: tz, s: [0.05, 0.16, l.d * 0.9] });
      batch.add(SHAPES.box, glow, { x: tx + l.w / 2 + 0.02, y: by, z: tz, s: [0.05, 0.16, l.d * 0.9] });
      if (i > 0) batch.add(SHAPES.box, glow, { x: tx, y: by, z: tz + l.d / 2 + 0.02, s: [l.w * 0.9, 0.16, 0.05] });
    }
    y += l.h;
  });
  // DNMS screens across the ground-floor facade.
  const screenW = 3.2;
  const screenH = 2;
  DNMS_SCREENS.forEach((src, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), mats.paint("#0f1020", 0.4));
    mesh.position.set(tx + (col - 0.5) * (screenW + 0.2), ty + 1.35 + (1 - row) * (screenH + 0.2), tz + levels[0].d / 2 + 0.04);
    ctx.scene.add(mesh);
    d.meshes.push(mesh);
    d.geometries.push(mesh.geometry);
    new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      d.textures.push(tex);
      const m = mats.screen(tex);
      d.materials.push(m);
      mesh.material = m;
    });
  });
  // Rooftop beacon and the AI connector: pulses travel from the beacon to the apps it talks to.
  const top = y;
  batch.add(SHAPES.cyl6, mats.paint("#2a2d48", 0.4, 0.4), { x: tx, y: top + 1.4, z: tz, s: [0.18, 2.8, 0.18] });
  const beaconMat = new THREE.MeshBasicNodeMaterial();
  const pulse = uniform(0);
  beaconMat.colorNode = color(new THREE.Color(violet)).mul(pulse.mul(2.5).add(mix(float(0.6), float(1.6), ctx.shared.u.night)));
  d.materials.push(beaconMat);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), beaconMat);
  beacon.position.set(tx, top + 3, tz);
  ctx.scene.add(beacon);
  d.meshes.push(beacon);
  d.geometries.push(beacon.geometry);
  const nodes: THREE.Mesh[] = [];
  const sparks: THREE.Mesh[] = [];
  const nodeMat = mats.glow(cyan, 0.9, 2.6);
  const lineMat = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.35, color: violet });
  d.materials.push(lineMat);
  for (let i = 0; i < 5; i++) {
    const node = detail(new THREE.Mesh(SHAPES.box, nodeMat));
    node.scale.setScalar(0.9);
    ctx.scene.add(node);
    d.meshes.push(node);
    nodes.push(node);
    const spark = detail(new THREE.Mesh(SHAPES.sphere, mats.glow("#ffffff", 1.4, 3)));
    spark.scale.setScalar(0.32);
    ctx.scene.add(spark);
    d.meshes.push(spark);
    sparks.push(spark);
  }
  const lineGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5, 1, true);
  lineGeo.translate(0, 0.5, 0);
  lineGeo.rotateX(Math.PI / 2);
  d.geometries.push(lineGeo);
  const lines = nodes.map(() => {
    const l = detail(new THREE.Mesh(lineGeo, lineMat));
    ctx.scene.add(l);
    d.meshes.push(l);
    return l;
  });

  for (const s of [-1, 1]) lamp(ctx, batch, mats, island.x + s * 4, groundHeight(land, island.x + s * 4, island.z + 8), island.z + 8);
  for (const p of scatter(land, 6, { keepOut: [{ x: tx, z: tz, r: 6 }, { x: island.x, z: island.z + 10, r: 5 }], seed: 141, minH: 1.2 })) flora.tree(p.x, p.y, p.z, 0.7);
  sign(ctx, batch, mats, d, { x: island.x - 5.5, y: groundHeight(land, island.x - 5.5, island.z + 9) + 0.1, z: island.z + 9 }, "DNMS", "The system Digitally Next runs on", violet, 6.2);

  const origin = new THREE.Vector3(tx, top + 3, tz);
  const target = new THREE.Vector3();
  return {
    update(_dt, t) {
      pulse.value = Math.pow(Math.max(0, Math.sin(t * 2.2)), 8);
      nodes.forEach((node, i) => {
        const a = t * 0.18 + (i / nodes.length) * Math.PI * 2;
        node.position.set(tx + Math.cos(a) * 9.5, top - 1 + Math.sin(t * 0.7 + i) * 1.2 + (i % 2) * 2.5, tz + Math.sin(a) * 9.5);
        node.rotation.set(t * 0.4 + i, t * 0.6, 0);
        target.copy(node.position);
        const line = lines[i];
        line.position.copy(origin);
        line.lookAt(target);
        line.scale.set(1, 1, origin.distanceTo(target));
        const f = (t * 0.55 + i * 0.37) % 1;
        sparks[i].position.lerpVectors(origin, target, f);
      });
    },
  };
}
