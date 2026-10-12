// Trees, palms, firs, ferns, grass and boulders. Trunks are tapered tubes with a photographic bark
// texture; canopies are cards textured with real leaf scans (CC0, Poly Haven), shaded as one soft
// volume and lit through from behind; palms carry drooping fronds built from the same scans. Every
// kind is instanced, so a hundred trees cost a handful of draw calls. Leaves follow the season and
// sway in the wind; boulders are photoscans simplified to ~1,500 triangles.
import * as THREE from "three/webgpu";
import {
  attribute,
  cameraPosition,
  dot,
  float,
  hash,
  instanceIndex,
  max,
  mix,
  normalize,
  normalViewGeometry,
  positionGeometry,
  positionLocal,
  positionWorld,
  pow,
  sin,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import { LANDMASSES, radiusAt, seeded, shoreTable, type Landmass } from "../layout";
import type { Shared } from "./shared";
import { groundHeight, scatter } from "./terrain";
import type { Textures } from "./textures";
import type { N } from "./tsl";
import { loadGLTF } from "./islands/loaders";
import { detail } from "./layers";

export type TreeKind = "round" | "pine" | "palm";
type Spot = { x: number; y: number; z: number; s: number; kind: TreeKind; ry: number };

/** Build geometry with custom attributes from parts, as one non-indexed geometry. */
function combine(parts: { g: THREE.BufferGeometry; attrs?: Record<string, number[]> }[], keepUv = true): THREE.BufferGeometry {
  const flat = parts.map(({ g, attrs }) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (attrs) for (const [name, v] of Object.entries(attrs)) n.setAttribute(name, new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * v.length).map((_, i) => v[i % v.length]), v.length));
    return n;
  });
  const names = Object.keys(flat[0].attributes).filter((n) => keepUv || n !== "uv");
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const size = flat[0].attributes[name].itemSize;
    const total = flat.reduce((k, g) => k + g.attributes[name].count * size, 0);
    const arr = new Float32Array(total);
    let o = 0;
    for (const g of flat) {
      arr.set(g.attributes[name].array as Float32Array, o);
      o += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  out.computeBoundingSphere();
  return out;
}

function taperedTube(points: THREE.Vector3[], r0: number, r1: number, segs = 14, radial = 8, rings = 0): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uvs = g.attributes.uv as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const t = uvs.getX(i);
    const c = curve.getPointAt(Math.min(1, t));
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(c);
    // Palm trunks get rings: a gentle bulge every segment.
    const ring = rings ? 1 + Math.pow(Math.abs(Math.sin(t * Math.PI * rings)), 6) * 0.12 : 1;
    p.multiplyScalar((r0 + (r1 - r0) * t) * ring);
    pos.setXYZ(i, c.x + p.x, c.y + p.y, c.z + p.z);
    uvs.setXY(i, uvs.getX(i) * curve.getLength() * 0.7, uvs.getY(i) * 2);
  }
  g.computeVertexNormals();
  return g;
}

/** A leaf card: a quad facing `dir`, with a "crown normal" pointing out from the canopy centre. */
function card(center: THREE.Vector3, size: number, crown: THREE.Vector3, rand: () => number, droop = 0) {
  const g = new THREE.PlaneGeometry(size, size, 1, 2);
  // Bend the card a little so it reads as a sprig, not a sheet.
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.pow(pos.getY(i) / size + 0.5, 2) * size * (0.15 + droop));
  const out = center.clone().sub(crown).normalize();
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), out.clone().add(new THREE.Vector3((rand() - 0.5) * 1.2, (rand() - 0.2) * 0.8, (rand() - 0.5) * 1.2)), new THREE.Vector3(0, 1, 0));
  g.applyMatrix4(m);
  g.rotateY(0);
  g.translate(center.x, center.y, center.z);
  const n = g.attributes.position.count;
  const cn: number[] = [];
  const own = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(g.attributes.position.getX(i), g.attributes.position.getY(i), g.attributes.position.getZ(i)).sub(crown).normalize();
    // Mostly the crown's normal, with some of the card's own, so the canopy has texture in its shading.
    own.set(g.attributes.normal.getX(i), g.attributes.normal.getY(i), g.attributes.normal.getZ(i));
    if (own.dot(v) < 0) own.negate();
    v.multiplyScalar(0.7).addScaledVector(own, 0.3).normalize();
    cn.push(v.x, v.y * 0.85 + 0.2, v.z);
  }
  // The card's lighting normal is the canopy's: the crown shades as one rounded volume.
  g.setAttribute("normal", new THREE.Float32BufferAttribute(cn, 3));
  g.setAttribute("cnormal", new THREE.Float32BufferAttribute(cn, 3));
  return g;
}

function broadleaf(seed: number) {
  const rand = seeded(seed);
  const height = 3.4 + rand() * 1.4;
  const lean = new THREE.Vector3((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5);
  const top = new THREE.Vector3(0, height, 0).add(lean);
  const bark = [taperedTube([new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(lean.x * 0.3, height * 0.45, lean.z * 0.3), top], 0.24, 0.07)];
  const crown = top.clone().add(new THREE.Vector3(0, 0.6, 0));
  // Main limbs reaching into the crown.
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2 + rand();
    const start = new THREE.Vector3(lean.x * 0.5, height * (0.55 + rand() * 0.2), lean.z * 0.5);
    const end = crown.clone().add(new THREE.Vector3(Math.cos(a) * 1.6, rand() * 0.8, Math.sin(a) * 1.6));
    bark.push(taperedTube([start, start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.3, 0)), end], 0.09, 0.03, 8, 6));
  }
  const leaves: THREE.BufferGeometry[] = [];
  const radius = new THREE.Vector3(2.1 + rand() * 0.6, 1.5 + rand() * 0.4, 2.1 + rand() * 0.6);
  for (let i = 0; i < 96; i++) {
    // Points spread through an ellipsoid, denser toward the surface.
    const u = rand() * Math.PI * 2;
    const v = Math.acos(2 * rand() - 1);
    const r = Math.pow(rand(), 0.35);
    const c = new THREE.Vector3(Math.sin(v) * Math.cos(u) * radius.x * r, Math.cos(v) * radius.y * r, Math.sin(v) * Math.sin(u) * radius.z * r).add(crown);
    leaves.push(card(c, 1.05 + rand() * 0.5, crown, rand));
  }
  return { bark, leaves, height };
}

function palm(seed: number) {
  const rand = seeded(seed);
  const height = 5.2 + rand() * 2.2;
  const lean = (rand() - 0.5) * 2.4;
  const leanZ = (rand() - 0.5) * 1.2;
  const pts = [0, 0.33, 0.66, 1].map((t) => new THREE.Vector3(lean * t * t, t * height, leanZ * t * t));
  pts[0].y = -0.3;
  const bark = [taperedTube(pts, 0.2, 0.13, 20, 8, 22)];
  const crown = pts[3].clone();
  const fronds: THREE.BufferGeometry[] = [];
  const count = 13;
  for (let f = 0; f < count; f++) {
    const a = (f / count) * Math.PI * 2 + rand() * 0.3;
    const len = 2.6 + rand() * 0.9;
    const lift = 0.35 + rand() * 0.45;
    const g = new THREE.PlaneGeometry(1.1, len, 2, 10);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const across = pos.getX(i) / 0.55;
      const t = pos.getY(i) / len + 0.5;
      // Arc up, then droop; fold the leaflets into a shallow V along the rachis.
      const along = t * len;
      const y = lift * along - along * along * 0.32;
      const fold = Math.abs(across) * 0.18 * (1 - t * 0.5);
      pos.setXYZ(i, pos.getX(i) * (1 - t * 0.35), y - fold, along);
    }
    g.computeVertexNormals();
    g.rotateY(a);
    g.translate(crown.x, crown.y, crown.z);
    const n = g.attributes.position.count;
    const cn: number[] = [];
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(g.attributes.position.getX(i), g.attributes.position.getY(i) + 1.2, g.attributes.position.getZ(i)).sub(crown).normalize();
      cn.push(v.x, v.y, v.z);
    }
    g.setAttribute("normal", new THREE.Float32BufferAttribute(cn, 3));
    g.setAttribute("cnormal", new THREE.Float32BufferAttribute(cn, 3));
    fronds.push(g);
  }
  // A few coconuts under the crown.
  for (let c = 0; c < 4; c++) {
    const a = rand() * Math.PI * 2;
    bark.push(new THREE.SphereGeometry(0.13, 8, 6).translate(crown.x + Math.cos(a) * 0.2, crown.y - 0.15, crown.z + Math.sin(a) * 0.2));
  }
  return { bark, leaves: fronds, height };
}

/**
 * A sprig card lying along a branch: out from `base` at `angle` around the trunk, drooping by
 * `droop` (radians) and curving further down toward its tip, rolled about its own length.
 */
function sprig(base: THREE.Vector3, angle: number, length: number, width: number, droop: number, roll: number, axisY: number) {
  const g = new THREE.PlaneGeometry(width, length, 1, 3);
  g.translate(0, length / 2, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  // Curl the tip down (local z is the card's normal, which ends up facing roughly up).
  for (let i = 0; i < pos.count; i++) {
    const f = pos.getY(i) / length;
    pos.setZ(i, -f * f * length * 0.28);
  }
  const dir = new THREE.Vector3(Math.cos(angle) * Math.cos(droop), -Math.sin(droop), Math.sin(angle) * Math.cos(droop));
  const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).applyAxisAngle(dir, roll);
  const normal = new THREE.Vector3().crossVectors(tangent, dir).normalize();
  g.applyMatrix4(new THREE.Matrix4().makeBasis(tangent, dir, normal));
  g.translate(base.x, base.y, base.z);
  // Light it as part of the cone: outward from the trunk, tipped up.
  const cn: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), (pos.getY(i) - axisY) * 0.4, pos.getZ(i)).normalize();
    v.y = v.y * 0.6 + 0.45;
    v.normalize();
    cn.push(v.x, v.y, v.z);
  }
  g.setAttribute("normal", new THREE.Float32BufferAttribute(cn, 3));
  g.setAttribute("cnormal", new THREE.Float32BufferAttribute(cn, 3));
  return g;
}

function fir(seed: number) {
  const rand = seeded(seed);
  const height = 5 + rand() * 2.5;
  const bark = [taperedTube([new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, height * 0.5, 0), new THREE.Vector3(0, height + 0.4, 0)], 0.2, 0.03, 10, 7)];
  const leaves: THREE.BufferGeometry[] = [];
  // Whorls of branches, long and drooping at the bottom, short and lifted at the top, each branch
  // two crossed sprig cards so it has body from every side.
  const whorls = 15;
  for (let l = 0; l < whorls; l++) {
    const t = l / (whorls - 1);
    const y = 0.8 + t * (height - 0.5);
    const length = (1 - t) * 1.9 + 0.45;
    const n = Math.max(4, Math.round(8 - t * 4));
    const offset = rand() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const a = offset + (k / n) * Math.PI * 2 + (rand() - 0.5) * 0.4;
      const droop = 0.18 + (1 - t) * 0.3 + (rand() - 0.5) * 0.12;
      const base = new THREE.Vector3(Math.cos(a) * 0.08, y, Math.sin(a) * 0.08);
      const len = length * (0.85 + rand() * 0.3);
      const roll = (rand() - 0.5) * 0.5;
      leaves.push(sprig(base, a, len, len * 0.62, droop, roll, y));
      leaves.push(sprig(base, a, len * 0.9, len * 0.5, droop + 0.08, roll + Math.PI / 2, y));
    }
  }
  // The leader at the top.
  for (const r of [0, Math.PI / 2]) {
    const top = new THREE.PlaneGeometry(0.5, 1.1, 1, 1);
    top.translate(0, 0.55, 0);
    top.rotateY(r);
    top.translate(0, height - 0.1, 0);
    const n = top.attributes.position.count;
    top.setAttribute("normal", new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [0, 1, 0]).flat(), 3));
    top.setAttribute("cnormal", new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [0, 1, 0]).flat(), 3));
    leaves.push(top);
  }
  return { bark, leaves, height };
}

export function createFlora(ctx: { scene: THREE.Scene; shared: Shared; tier: 1 | 2 | 3; textures: Textures }) {
  const { scene, shared, tier, textures } = ctx;
  const { u } = shared;
  const spots: Spot[] = [];
  const rocks: { x: number; y: number; z: number; s: number }[] = [];
  const meshes: THREE.Object3D[] = [];
  const disposables: { dispose(): void }[] = [];
  let lawn: { geometry: THREE.InstancedBufferGeometry; total: number } | null = null;
  let grassDensity = 1;

  const barkSet = textures.set("bark");
  const leafTex = textures.card("leaves-cluster.webp");
  const frondTex = textures.card("palm-frond.webp");
  const firTex = textures.card("pine-sprig.webp");

  // Sway: more at the top, phase per tree, stronger in wind.
  const phase = hash(instanceIndex.toFloat().add(3.1)).mul(6.283);
  const swayAt = (height: number, k: number) => {
    const h = positionGeometry.y.div(height).clamp(0, 1.4);
    const gust = sin(u.time.mul(1.3).add(phase)).add(sin(u.time.mul(2.9).add(phase.mul(1.7))).mul(0.35));
    return gust.mul(h.mul(h)).mul(u.wind.mul(0.32).add(0.03)).mul(k);
  };

  const barkMaterial = (height: number) => {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.9 });
    const t = texture(barkSet.albedo, uv().mul(vec2(1, 1)));
    m.colorNode = shared.weathered(t.rgb.mul(0.85), 0.5);
    const sway = swayAt(height, 0.6);
    m.positionNode = positionLocal.add(vec3(u.windDir.x.mul(sway), 0, u.windDir.y.mul(sway)));
    disposables.push(m);
    return m;
  };

  const leafMaterial = (map: THREE.Texture, height: number, kind: TreeKind) => {
    const m = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, roughness: 1, metalness: 0 });
    const t = texture(map, uv());
    // Per-tree colour variety, then the season.
    const vary = hash(instanceIndex.toFloat().add(11.7)).mul(0.25).add(0.88);
    const seasonTint: N = kind === "pine" ? mix(vec3(1), u.leafTint, 0.25) : kind === "palm" ? mix(vec3(1), u.leafTint, 0.15) : u.leafTint;
    let col: N = t.rgb.mul(vary).mul(seasonTint).mul(kind === "round" ? 1.3 : 1.12);
    // Snow dusts the tops of canopies.
    const cn = normalize(attribute("cnormal", "vec3"));
    const snow = u.cover.mul(smoothstep(0.3, 0.8, cn.y)).mul(0.7);
    col = mix(col, vec3(0.88, 0.91, 0.95), snow);
    m.colorNode = col;
    // Winter thins broadleaf canopies.
    const opacity = kind === "round" ? t.a.mul(float(1).sub(u.cover.mul(0.35))) : t.a;
    m.opacityNode = opacity;
    // The leaf's outline, as a mask rather than alphaTest. The sun's shadow pass shares one
    // material among all casters and copies each caster's alphaTest onto it; alternating between
    // cut-out leaves and solid shapes changed its version every draw, so every caster rebuilt its
    // cache key every frame. A mask also reaches the shadow pass, so canopies cast dappled shade.
    m.maskNode = opacity.greaterThan(0.42);
    // Light passing through leaves when the sun is behind them.
    const view = normalize(cameraPosition.sub(positionWorld));
    const through = pow(max(dot(view.negate(), u.sunDir), 0), float(4)).mul(u.sunI).mul(0.18);
    m.emissiveNode = col.mul(vec3(0.9, 1.0, 0.6)).mul(through);
    const sway = swayAt(height, 1);
    const flutter = sin(u.time.mul(6).add(positionGeometry.x.mul(3)).add(phase)).mul(0.03).mul(u.wind.add(0.2));
    m.positionNode = positionLocal.add(vec3(u.windDir.x.mul(sway).add(flutter), flutter.mul(0.5), u.windDir.y.mul(sway)));
    // Both faces of a card share the crown's normal: three would flip it on the back face, which
    // turns half of every canopy toward the ground and leaves it dark.
    m.normalNode = normalViewGeometry;
    disposables.push(m);
    return m;
  };

  return {
    tree(x: number, y: number, z: number, s = 1, kind: TreeKind = "round") {
      spots.push({ x, y, z, s, kind, ry: Math.random() * Math.PI * 2 });
    },
    rock(x: number, y: number, z: number, s = 1) {
      rocks.push({ x, y, z, s });
    },
    build() {
      const variants: Record<TreeKind, ReturnType<typeof broadleaf>[]> = {
        round: [broadleaf(11), broadleaf(23), broadleaf(37)],
        palm: [palm(5), palm(17), palm(29)],
        pine: [fir(7), fir(19)],
      };
      const maps: Record<TreeKind, THREE.Texture> = { round: leafTex, palm: frondTex, pine: firTex };
      for (const kind of Object.keys(variants) as TreeKind[]) {
        // One bark and one leaf material per kind (one shader each), swaying for the kind's tallest.
        const tallest = Math.max(...variants[kind].map((v) => v.height));
        const bark = barkMaterial(tallest);
        const leaves = leafMaterial(maps[kind], tallest + 2, kind);
        variants[kind].forEach((variant, vi) => {
          const list = spots.filter((s, i) => s.kind === kind && i % variants[kind].length === vi);
          if (!list.length) return;
          const barkGeo = combine(variant.bark.map((g) => ({ g })));
          const leafGeo = combine(variant.leaves.map((g) => ({ g })));
          const barkMesh = new THREE.InstancedMesh(barkGeo, bark, list.length);
          const leafMesh = new THREE.InstancedMesh(leafGeo, leaves, list.length);
          const m = new THREE.Matrix4();
          list.forEach((t, i) => {
            m.compose(new THREE.Vector3(t.x, t.y - 0.05, t.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t.ry, 0)), new THREE.Vector3(t.s, t.s * (0.92 + ((i * 37) % 10) / 40), t.s));
            barkMesh.setMatrixAt(i, m);
            leafMesh.setMatrixAt(i, m);
          });
          for (const mesh of [barkMesh, leafMesh]) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            meshes.push(mesh);
          }
          disposables.push(barkGeo, leafGeo);
          for (const g of [...variant.bark, ...variant.leaves]) g.dispose();
        });
      }

      // Boulders: photoscans, instanced, two shapes, random turn and scale.
      void Promise.all([loadGLTF("/world/models/boulder-b.glb"), loadGLTF("/world/models/boulder-c.glb")]).then((gltfs) => {
        gltfs.forEach((gltf, gi) => {
          let src: THREE.Mesh | null = null;
          gltf.scene.traverse((o) => {
            if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh;
          });
          if (!src) return;
          const mesh0 = src as THREE.Mesh;
          const geo = mesh0.geometry.clone();
          geo.computeBoundingBox();
          const box = geo.boundingBox!;
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          geo.translate(-center.x, -box.min.y, -center.z);
          geo.scale(1 / Math.max(size.x, size.z), 1 / Math.max(size.x, size.z), 1 / Math.max(size.x, size.z));
          const list = rocks.filter((_, i) => i % 2 === gi);
          if (!list.length) return;
          const material = mesh0.material as THREE.Material;
          const inst = new THREE.InstancedMesh(geo, material, list.length);
          const m = new THREE.Matrix4();
          list.forEach((r, i) => {
            const s = r.s * 1.6;
            m.compose(new THREE.Vector3(r.x, r.y - s * 0.2, r.z), new THREE.Quaternion().setFromEuler(new THREE.Euler((i % 3) * 0.2, i * 1.7, (i % 5) * 0.1)), new THREE.Vector3(s, s * (0.6 + (i % 4) * 0.12), s));
            inst.setMatrixAt(i, m);
          });
          inst.castShadow = true;
          inst.receiveShadow = true;
          scene.add(inst);
          meshes.push(inst);
          disposables.push(geo);
        });
      });

      if (tier >= 2) buildGrass();
      void buildFerns();
    },
    /** Grass density 0–1 (auto quality): fewer blades, spread evenly over every lawn. No rebuild. */
    setGrass(k: number) {
      grassDensity = k;
      if (lawn) lawn.geometry.instanceCount = Math.round(lawn.total * k);
    },
    dispose() {
      for (const m of meshes) m.removeFromParent();
      for (const d of disposables) d.dispose();
    },
  };

  /** Grass blades on the green islands, swaying, in the season's colour. */
  function buildGrass() {
    const perIsland = tier === 3 ? 7000 : 2800;
    const blade = new THREE.BufferGeometry();
    // Three segments, tapering to a point.
    const pts = [
      [-0.035, 0],
      [0.035, 0],
      [-0.028, 0.09],
      [0.028, 0.09],
      [-0.015, 0.18],
      [0.015, 0.18],
      [0, 0.26],
    ];
    blade.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap(([x, y]) => [x, y, 0]), 3));
    blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);
    // Lit like the ground it grows from, so a lawn reads as one soft surface.
    blade.setAttribute("normal", new THREE.Float32BufferAttribute(pts.flatMap(() => [0, 1, 0]), 3));
    const offsets: number[] = [];
    for (const land of LANDMASSES) {
      if (!land.island || land.ground !== "green") continue;
      const pts2 = scatter(land, perIsland, { minH: 0.9, maxRR: 0.8, spacing: 0, seed: land.seed * 7 });
      for (const p of pts2) offsets.push(p.x, groundHeight(land, p.x, p.z) - 0.02, p.z);
    }
    if (!offsets.length) return;
    // Shuffled, so drawing only the first part of the list thins every lawn evenly.
    const total = offsets.length / 3;
    const rand = seeded(97);
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      for (let c = 0; c < 3; c++) {
        const t = offsets[i * 3 + c];
        offsets[i * 3 + c] = offsets[j * 3 + c];
        offsets[j * 3 + c] = t;
      }
    }
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = blade.index;
    geometry.setAttribute("position", blade.attributes.position);
    geometry.setAttribute("normal", blade.attributes.normal);
    geometry.setAttribute("offset", new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.instanceCount = Math.round(total * grassDensity);
    lawn = { geometry, total };
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    const material = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, roughness: 0.8 });
    const id = instanceIndex.toFloat();
    const r1 = hash(id.add(0.13));
    const r2 = hash(id.mul(1.31).add(7.7));
    const angle = r1.mul(6.283);
    const scale = r2.mul(0.9).add(0.6).mul(float(1).sub(u.cover.mul(0.6)));
    const local = positionLocal.mul(vec3(1, scale, 1));
    const ca = angle.cos();
    const sa = angle.sin();
    const rotated = vec3(local.x.mul(ca), local.y, local.x.mul(sa));
    const h = positionGeometry.y.div(0.26);
    const bend = sin(u.time.mul(1.8).add(attribute("offset", "vec3").x.mul(0.35)).add(attribute("offset", "vec3").z.mul(0.27))).mul(u.wind.mul(0.18).add(0.04)).mul(h.mul(h));
    material.positionNode = rotated.add(attribute("offset", "vec3")).add(vec3(u.windDir.x.mul(bend), 0, u.windDir.y.mul(bend)));
    // Rooted in the lawn's own colour, lighter and yellower at the tips; lit straight up like the
    // ground, from both sides.
    const base = vec3(0.1, 0.17, 0.045);
    const tip = vec3(0.36, 0.48, 0.14);
    material.colorNode = mix(base, tip, h).mul(u.grassTint).mul(r2.mul(0.3).add(0.85));
    material.normalNode = normalViewGeometry;
    const grass = detail(new THREE.Mesh(geometry, material));
    grass.frustumCulled = false;
    grass.receiveShadow = true;
    scene.add(grass);
    meshes.push(grass);
    disposables.push(geometry, material, blade);
  }

  /** Ferns under the trees: a CC0 scan, instanced. */
  async function buildFerns() {
    const gltf = await loadGLTF("/world/models/fern.glb");
    let src: THREE.Mesh | null = null;
    gltf.scene.traverse((o) => {
      if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh;
    });
    if (!src) return;
    const mesh0 = src as THREE.Mesh;
    const geo = mesh0.geometry.clone();
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const size = box.getSize(new THREE.Vector3());
    geo.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    const k = 1 / Math.max(size.x, size.y, size.z);
    geo.scale(k, k, k);
    const places: { x: number; y: number; z: number; s: number }[] = [];
    for (const land of LANDMASSES) {
      if (!land.island || land.ground === "stone" || land.ground === "linen") continue;
      for (const p of scatter(land, tier === 1 ? 5 : 9, { minH: 0.9, maxRR: 0.78, spacing: 1.6, seed: land.seed * 13 })) places.push({ ...p, s: 1.1 + Math.random() * 0.8 });
    }
    // The scan's own material, with its cut-out (glTF MASK, i.e. alphaTest) as a mask node: see
    // leafMaterial for why no shadow caster uses alphaTest.
    const scan = mesh0.material as THREE.MeshStandardMaterial;
    const material = new THREE.MeshStandardNodeMaterial({
      map: scan.map,
      normalMap: scan.normalMap,
      normalScale: scan.normalScale,
      roughnessMap: scan.roughnessMap,
      metalnessMap: scan.metalnessMap,
      roughness: scan.roughness,
      metalness: scan.metalness,
      color: scan.color,
      side: scan.side,
    });
    if (scan.map && scan.alphaTest > 0) material.maskNode = texture(scan.map, uv()).a.greaterThan(scan.alphaTest);
    disposables.push(material);
    const inst = detail(new THREE.InstancedMesh(geo, material, places.length));
    const m = new THREE.Matrix4();
    places.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, p.y - 0.05, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 2.3, 0)), new THREE.Vector3(p.s, p.s, p.s));
      inst.setMatrixAt(i, m);
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    scene.add(inst);
    meshes.push(inst);
    disposables.push(geo);
  }
}

export type Flora = ReturnType<typeof createFlora>;

/** Scatter trees and shore boulders on a landmass. */
export function plant(flora: Flora, land: Landmass, count: number, scatterFn: (n: number) => { x: number; y: number; z: number }[], kind: TreeKind = "round", scale: [number, number] = [0.8, 1.25]) {
  for (const p of scatterFn(count)) flora.tree(p.x, p.y, p.z, scale[0] + Math.random() * (scale[1] - scale[0]), kind);
  const table = shoreTable(land);
  const n = Math.round(land.r * 0.8);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2;
    const R = radiusAt(table, th) * (0.93 + Math.random() * 0.12);
    const x = land.x + Math.cos(th) * R;
    const z = land.z + Math.sin(th) * R;
    flora.rock(x, groundHeight(land, x, z), z, 0.7 + Math.random() * 1.3);
  }
}
