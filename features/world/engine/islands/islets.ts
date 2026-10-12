// The six smaller islands, one per standard case study, each built from one idea in the work:
// Happy Ganga's river, Leocym's clean air, the KYG network's thirteen lighthouses, TalentiFi-X's
// signal, Chetan's constellation and Realty Canvas's skyline.
import * as THREE from "three/webgpu";
import { color, float, fract, instanceIndex, mix, sin, smoothstep, uv, vec3 } from "three/tsl";
import { ISLANDS, NETWORK_ROCKS } from "../../layout";
import { groundHeight, landById, scatter } from "../terrain";
import { type Batch, type Disposables, type IslandCtx, type Materials, type Part, SHAPES, lamp } from "./common";
import { detail } from "../layers";
import { risingSparks } from "./flagships";

type Flora = { tree: (x: number, y: number, z: number, s?: number, kind?: "round" | "pine" | "palm") => void };

function at(id: string) {
  const island = ISLANDS.find((i) => i.id === id)!;
  const land = landById(id);
  const ground = (x: number, z: number) => groundHeight(land, x, z);
  return { island, land, ground };
}

export function buildHappyGanga(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const { island, land, ground } = at("happy-ganga");
  const teal = "#0896ac";
  // A stream from a spring to the sea, flowing toward the shore.
  const path = [
    [-3, -5],
    [0, -3],
    [3, -2.5],
    [6.5, -0.5],
    [9, 0.8],
    [12.5, 1.2],
  ].map(([x, z]) => new THREE.Vector3(island.x + x, 0, island.z + z));
  const curve = new THREE.CatmullRomCurve3(path);
  const samples = 60;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const nx = -tan.z;
    const nz = tan.x;
    for (const s of [-1, 1]) {
      const x = p.x + nx * s * 0.85;
      const z = p.z + nz * s * 0.85;
      positions.push(x, Math.max(0.05, ground(x, z) + 0.06), z);
      uvs.push(t, s < 0 ? 0 : 1);
    }
    if (i < samples) {
      const k = i * 2;
      index.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const streamGeo = new THREE.BufferGeometry();
  streamGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  streamGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  streamGeo.setIndex(index);
  streamGeo.computeVertexNormals();
  d.geometries.push(streamGeo);
  const streamMat = new THREE.MeshBasicNodeMaterial();
  const flow = fract(uv().x.mul(14).sub(ctx.shared.u.time.mul(0.9)));
  const ripple = smoothstep(0.0, 0.15, flow).mul(float(1).sub(smoothstep(0.2, 0.45, flow)));
  streamMat.colorNode = mix(color(new THREE.Color(teal)), color(new THREE.Color("#bff1f6")), ripple.mul(0.55)).mul(mix(float(1), float(0.35), ctx.shared.u.night));
  d.materials.push(streamMat);
  const stream = new THREE.Mesh(streamGeo, streamMat);
  ctx.scene.add(stream);
  d.meshes.push(stream);

  // The brand's drop, as a sculpture at the spring.
  const sx = island.x - 4;
  const sz = island.z - 6;
  const sy = ground(sx, sz);
  batch.add(SHAPES.sphere, mats.paint(teal, 0.25, 0.1), { x: sx, y: sy + 1.6, z: sz, s: 2.4 });
  batch.add(SHAPES.cone, mats.paint(teal, 0.25, 0.1), { x: sx, y: sy + 3.3, z: sz, s: [1.95, 1.9, 1.95] });
  // A little shop with a teal awning.
  const kx = island.x - 4;
  const kz = island.z + 2;
  const ky = ground(kx, kz);
  batch.add(SHAPES.box, mats.paint("#f5fcfd", 0.7), { x: kx, y: ky + 1.2, z: kz, s: [3.6, 2.4, 2.6] });
  batch.add(SHAPES.box, mats.paint(teal, 0.6), { x: kx, y: ky + 2.5, z: kz + 1.6, rx: 0.35, s: [3.9, 0.12, 1.4] });
  batch.add(SHAPES.box, mats.paint("#f4b33c", 0.6), { x: kx, y: ky + 2.55, z: kz, s: [3.7, 0.25, 2.7] });
  for (const p of scatter(land, 7, { keepOut: [{ x: kx, z: kz, r: 3.5 }, { x: sx, z: sz, r: 3 }, { x: island.x + 6, z: island.z, r: 3 }, { x: island.x, z: island.z + 8, r: 4 }], seed: 201 })) flora.tree(p.x, p.y, p.z);
  return {};
}

export function buildLeocym(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const { island, land, ground } = at("leocym");
  const indigo = "#282864";
  const orange = "#f07814";
  const px = island.x + 1;
  const pz = island.z - 3;
  const py = ground(px, pz);
  batch.add(SHAPES.box, mats.paint("#ffffff", 0.6), { x: px, y: py + 1.5, z: pz, s: [6.5, 3, 4.2] });
  batch.add(SHAPES.box, mats.paint(indigo, 0.5), { x: px, y: py + 3.15, z: pz, s: [7, 0.4, 4.7] });
  batch.add(SHAPES.box, mats.paint(orange, 0.5), { x: px, y: py + 2.85, z: pz + 2.36, s: [7, 0.22, 0.06] });
  batch.add(SHAPES.box, mats.windows("#eaf2f5"), { x: px, y: py + 1.4, z: pz + 2.12, s: [5.6, 1.6, 0.05] });
  // The diffuser: clean air rising.
  const dx = island.x - 4.5;
  const dz = island.z + 1;
  const dy = ground(dx, dz);
  batch.add(SHAPES.cyl, mats.paint("#f4f6f8", 0.4, 0.2), { x: dx, y: dy + 1.4, z: dz, s: [1.3, 2.8, 1.3] });
  batch.add(SHAPES.cyl, mats.paint(indigo, 0.4, 0.2), { x: dx, y: dy + 2.95, z: dz, s: [1.45, 0.3, 1.45] });
  risingSparks(ctx, d, new THREE.Vector3(dx, dy + 3, dz), [3, 7, 3], 60, "#c9c4ff", 0.8);
  for (const p of scatter(land, 5, { keepOut: [{ x: px, z: pz, r: 5 }, { x: dx, z: dz, r: 2 }, { x: island.x, z: island.z + 7, r: 4 }], seed: 221, minH: 0.6 })) flora.tree(p.x, p.y, p.z, 1, "palm");
  return {};
}

export function buildKygNetwork(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const { island, land, ground } = at("kyg-network");
  const teal = "#0f766e";
  const hx = island.x;
  const hz = island.z - 2;
  const hy = ground(hx, hz);
  batch.add(SHAPES.box, mats.paint("#fffdf8", 0.7), { x: hx, y: hy + 1.2, z: hz, s: [4, 2.4, 3] });
  batch.add(SHAPES.box, mats.paint(teal, 0.6), { x: hx, y: hy + 2.55, z: hz, s: [4.4, 0.3, 3.4] });
  // Thirteen lighthouses, one per site, lighting in turn.
  const white = mats.paint("#fffdf8", 0.6);
  const cap = mats.paint(teal, 0.5);
  NETWORK_ROCKS.forEach((rock) => {
    const land2 = landById(`net-${NETWORK_ROCKS.indexOf(rock)}`);
    const y = groundHeight(land2, rock.x, rock.z);
    batch.add(SHAPES.cyl, white, { x: rock.x, y: y + 1.8, z: rock.z, s: [0.9, 3.6, 0.9] });
    batch.add(SHAPES.cyl, cap, { x: rock.x, y: y + 2.6, z: rock.z, s: [0.95, 0.35, 0.95] });
    batch.add(SHAPES.cone, cap, { x: rock.x, y: y + 4.3, z: rock.z, s: [1.1, 0.7, 1.1] });
  });
  const lanternMat = new THREE.MeshBasicNodeMaterial();
  const seq = fract(ctx.shared.u.time.mul(0.2).sub(instanceIndex.toFloat().div(13)));
  const on = smoothstep(0.0, 0.04, seq).mul(float(1).sub(smoothstep(0.08, 0.2, seq)));
  lanternMat.colorNode = color(new THREE.Color("#9ff5e8")).mul(on.mul(2.6).add(mix(float(0.35), float(1.1), ctx.shared.u.night)));
  d.materials.push(lanternMat);
  const lanterns = detail(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 10), lanternMat, NETWORK_ROCKS.length));
  const m = new THREE.Matrix4();
  NETWORK_ROCKS.forEach((rock, i) => {
    const y = groundHeight(landById(`net-${i}`), rock.x, rock.z);
    m.makeTranslation(rock.x, y + 3.6, rock.z);
    lanterns.setMatrixAt(i, m);
  });
  ctx.scene.add(lanterns);
  d.meshes.push(lanterns);
  d.geometries.push(lanterns.geometry);
  for (const p of scatter(land, 4, { keepOut: [{ x: hx, z: hz, r: 3.5 }, { x: island.x, z: island.z + 6, r: 4 }], seed: 241 })) flora.tree(p.x, p.y, p.z, 0.9);
  return {};
}

export function buildTalentifix(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const { island, land, ground } = at("talentifix");
  const blue = "#0000ff";
  const mx = island.x - 1;
  const mz = island.z - 3;
  const my = ground(mx, mz);
  const steel = mats.paint("#d9dde6", 0.5, 0.4);
  const h = 13;
  for (const [ox, oz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    batch.add(SHAPES.box, steel, { x: mx + ox * 0.9, y: my + h / 2, z: mz + oz * 0.9, rz: -ox * 0.05, rx: oz * 0.05, s: [0.16, h, 0.16] });
  }
  for (let y = 1.5; y < h; y += 2.2) {
    const w = 1.9 - (y / h) * 1.1;
    batch.add(SHAPES.box, steel, { x: mx, y: my + y, z: mz + w / 2, ry: 0, rz: 0.75, s: [w * 1.3, 0.08, 0.08] });
    batch.add(SHAPES.box, steel, { x: mx, y: my + y, z: mz - w / 2, ry: 0, rz: -0.75, s: [w * 1.3, 0.08, 0.08] });
  }
  const dish = new THREE.Group();
  dish.position.set(mx, my + h + 0.4, mz);
  ctx.scene.add(dish);
  d.meshes.push(dish);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), mats.paint("#f2f4f8", 0.4, 0.2));
  bowl.rotation.x = Math.PI / 2.2;
  bowl.position.z = 0.5;
  dish.add(bowl);
  d.geometries.push(bowl.geometry);
  const light = new THREE.Mesh(SHAPES.sphere, mats.glow(blue, 1.2, 3.5));
  light.scale.setScalar(0.5);
  light.position.set(mx, my + h + 1.6, mz);
  ctx.scene.add(light);
  d.meshes.push(light);
  // Three gauges, rising and settling: the search work in numbers.
  const gauges: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Mesh(SHAPES.box, i === 1 ? mats.paint("#00d5ff", 0.5) : mats.paint(blue, 0.5));
    g.position.set(island.x + 4 + i * 1.3, ground(island.x + 4 + i * 1.3, island.z + 1), island.z + 1);
    g.scale.set(0.9, 1, 0.9);
    g.castShadow = true;
    ctx.scene.add(g);
    d.meshes.push(g);
    gauges.push(g);
  }
  for (const p of scatter(land, 6, { keepOut: [{ x: mx, z: mz, r: 3 }, { x: island.x + 5.5, z: island.z + 1, r: 3 }, { x: island.x, z: island.z + 7, r: 4 }], seed: 261 })) flora.tree(p.x, p.y, p.z, 0.9, "pine");
  const base = gauges.map((g) => g.position.y);
  return {
    update(_dt, t) {
      dish.rotation.y = t * 0.5;
      light.visible = Math.sin(t * 3) > -0.2;
      gauges.forEach((g, i) => {
        const v = 1.5 + i * 0.9 + Math.sin(t * 0.6 + i * 1.7) * 0.6;
        g.scale.y = v;
        g.position.y = base[i] + v / 2;
      });
    },
  };
}

export function buildChetan(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const { island, land, ground } = at("chetan-mangalwedhe");
  const emerald = "#4ecca3";
  const tx = island.x - 1;
  const tz = island.z - 1;
  const ty = ground(tx, tz);
  for (const a of [0, 2.1, 4.2]) batch.add(SHAPES.box, mats.paint("#2a2f2c", 0.5, 0.3), { x: tx + Math.cos(a) * 0.5, y: ty + 0.8, z: tz + Math.sin(a) * 0.5, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3, s: [0.1, 1.8, 0.1] });
  batch.add(SHAPES.cyl, mats.paint("#ecefec", 0.4, 0.3), { x: tx, y: ty + 2, z: tz - 0.4, rx: -0.9, s: [0.5, 2.6, 0.5] });
  // A constellation above the rock, linked like the network on his site.
  const stars: THREE.Vector3[] = [
    [-6, 15, -3],
    [-3, 17.5, -1],
    [0, 16, -4],
    [3, 18.5, -2],
    [6, 16.5, 0],
    [2, 13.5, 1],
    [-2, 13, 2],
    [-5, 12, 0],
    [5, 13, -3],
  ].map(([x, y, z]) => new THREE.Vector3(island.x + x, y - 4.5, island.z + z));
  const starMat = new THREE.MeshBasicNodeMaterial();
  const twinkle = sin(ctx.shared.u.time.mul(2.3).add(instanceIndex.toFloat().mul(1.7))).mul(0.25).add(0.75);
  starMat.colorNode = color(new THREE.Color(emerald)).mul(twinkle).mul(mix(float(1.1), float(2.6), ctx.shared.u.night));
  d.materials.push(starMat);
  const starMesh = detail(new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.42, 0), starMat, stars.length));
  stars.forEach((p, i) => starMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  ctx.scene.add(starMesh);
  d.meshes.push(starMesh);
  d.geometries.push(starMesh.geometry);
  const lineMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  lineMat.colorNode = vec3(0.3, 0.8, 0.64);
  lineMat.opacityNode = mix(float(0.35), float(0.7), ctx.shared.u.night);
  d.materials.push(lineMat);
  const links = [
    [0, 1],
    [1, 2],
    [1, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
    [3, 8],
    [2, 5],
  ];
  for (const [a, b] of links) {
    const pa = stars[a];
    const pb = stars[b];
    const len = pa.distanceTo(pb);
    const g = new THREE.CylinderGeometry(0.04, 0.04, len, 4, 1, true);
    g.translate(0, len / 2, 0);
    g.rotateX(Math.PI / 2);
    d.geometries.push(g);
    const mesh = new THREE.Mesh(g, lineMat);
    mesh.position.copy(pa);
    mesh.lookAt(pb);
    ctx.scene.add(mesh);
    d.meshes.push(mesh);
  }
  for (const p of scatter(land, 5, { keepOut: [{ x: tx, z: tz, r: 2.5 }, { x: island.x, z: island.z + 7, r: 4 }], seed: 281, minH: 1 })) flora.tree(p.x, p.y, p.z, 0.8, "pine");
  return {};
}

export function buildRealty(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const { island, land, ground } = at("realty-canvas");
  const gold = "#feb711";
  const towers = [
    { x: -6, z: -5, w: 2.6, h: 6 },
    { x: -3, z: -6.5, w: 2.4, h: 10 },
    { x: 0, z: -5, w: 3, h: 13 },
    { x: 3.2, z: -6, w: 2.4, h: 8.5 },
    { x: 6, z: -4.5, w: 2.6, h: 11 },
    { x: -1.5, z: -1.5, w: 2.2, h: 5 },
    { x: 3, z: -2, w: 2.2, h: 6.5 },
  ];
  towers.forEach((t, i) => {
    const x = island.x + t.x;
    const z = island.z + t.z;
    const y = ground(x, z);
    // Curtain-wall glass on a stone podium with a lit lobby, and a gold crown at the top.
    batch.add(SHAPES.box, mats.glass(i % 2 ? "#2b4a66" : "#1d3346"), { x, y: y + t.h / 2, z, s: [t.w, t.h, t.w] });
    batch.add(SHAPES.box, mats.paint("#d9d3c6", 0.8), { x, y: y + 0.45, z, s: [t.w + 0.3, 0.9, t.w + 0.3] });
    batch.add(SHAPES.box, mats.glow("#ffe2b0", 0.12, 1.6), { x, y: y + 0.5, z: z + t.w / 2 + 0.16, s: [t.w * 0.6, 0.6, 0.02] });
    batch.add(SHAPES.box, mats.paint(gold, 0.35, 0.6), { x, y: y + t.h + 0.12, z, s: [t.w + 0.12, 0.24, t.w + 0.12] });
  });
  for (const s of [-1, 1]) lamp(ctx, batch, mats, island.x + s * 3.5, ground(island.x + s * 3.5, island.z + 6), island.z + 6);
  for (const p of scatter(land, 4, { keepOut: [{ x: island.x, z: island.z - 4, r: 8 }, { x: island.x, z: island.z + 8, r: 4 }], seed: 301, minH: 1.2 })) flora.tree(p.x, p.y, p.z, 0.7);
  return {};
}
