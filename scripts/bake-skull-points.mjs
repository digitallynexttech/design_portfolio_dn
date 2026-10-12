// Bakes the points the home page's water pours into for SKELMET, so home never downloads the
// 0.7 MB print file (public/models/skelmet/skull.glb stays for the case study and the world).
//
//   node scripts/bake-skull-points.mjs
//
// Samples the skull exactly as features/water/forms/shapes.ts used to at runtime: positions read
// back as floats (the file is quantised), the node's transform applied, the face weighted over the
// back of the head, inward-facing samples dropped, then normalised into [-1, 1]. Writes
// public/forms/skull-points.bin, little-endian:
//
//   0   "SKP1"
//   4   u32   count
//   8   f32×3 per-axis minimum      20  f32×3 per-axis maximum
//   32  f32   density constant K: a point whose surface weight is W sits about sqrt(K / W) from
//             its neighbours (the page uses it to add points between these for the top tier)
//   36  u32×count  positions, x:10 y:11 z:11 bits across each axis's own range
//   ..  i8×2×count normals, octahedral
//
// Points are stored in sampling order, so any prefix is an even sample of the whole skull.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "public/models/skelmet/skull.glb");
const OUT = path.join(ROOT, "public/forms/skull-points.bin");
/** The second tier's count; the first takes a prefix, the top tier fills in between them. */
const COUNT = 24000;
const BITS = [10, 11, 11];
// Same weights as the runtime sampler had: the face (normals toward the viewer) over the back.
const FRONT = 1.6;
const BACK = 0.6;

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function octEncode(x, y, z) {
  const l1 = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
  let u = x / l1;
  let v = y / l1;
  if (z < 0) {
    const pu = u;
    u = (1 - Math.abs(v)) * (pu >= 0 ? 1 : -1);
    v = (1 - Math.abs(pu)) * (v >= 0 ? 1 : -1);
  }
  return [Math.round(u * 127), Math.round(v * 127)];
}

function octDecode(a, b) {
  let x = a / 127;
  let y = b / 127;
  const z = 1 - Math.abs(x) - Math.abs(y);
  if (z < 0) {
    const px = x;
    x = (1 - Math.abs(y)) * (px >= 0 ? 1 : -1);
    y = (1 - Math.abs(px)) * (y >= 0 ? 1 : -1);
  }
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

const file = fs.readFileSync(SOURCE);
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await new Promise((resolve, reject) =>
  loader.parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "", resolve, reject),
);
let mesh = null;
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse((child) => {
  if (!mesh && child.isMesh) mesh = child;
});
if (!mesh) throw new Error("skull mesh missing");

// Read the quantised attributes back as plain floats, then apply the node's transform.
const src = mesh.geometry;
const pos = src.getAttribute("position");
const nor = src.getAttribute("normal");
const positions = new Float32Array(pos.count * 3);
const normals = new Float32Array(pos.count * 3);
for (let i = 0; i < pos.count; i++) {
  positions[i * 3] = pos.getX(i);
  positions[i * 3 + 1] = pos.getY(i);
  positions[i * 3 + 2] = pos.getZ(i);
  if (nor) {
    normals[i * 3] = nor.getX(i);
    normals[i * 3 + 1] = nor.getY(i);
    normals[i * 3 + 2] = nor.getZ(i);
  }
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
if (nor) geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
if (src.index) geometry.setIndex(Array.from(src.index.array));
geometry.applyMatrix4(mesh.matrixWorld);
if (!nor) geometry.computeVertexNormals();
geometry.computeBoundingBox();
const center = geometry.boundingBox.getCenter(new THREE.Vector3());
const size = geometry.boundingBox.getSize(new THREE.Vector3());
const scale = 2 / Math.max(size.x, size.y, size.z);

const n3 = geometry.getAttribute("normal");
const weights = new Float32Array(n3.count);
for (let i = 0; i < n3.count; i++) weights[i] = n3.getZ(i) > 0 ? FRONT : BACK;
geometry.setAttribute("weight", new THREE.BufferAttribute(weights, 1));

// K: the sampler's total weight (area × summed vertex weights, in normalised units) per point.
const p3 = geometry.getAttribute("position");
const index = geometry.getIndex();
const tri = new THREE.Triangle();
let totalWeight = 0;
for (let f = 0; f < index.count; f += 3) {
  const [a, b, c] = [index.getX(f), index.getX(f + 1), index.getX(f + 2)];
  tri.a.fromBufferAttribute(p3, a);
  tri.b.fromBufferAttribute(p3, b);
  tri.c.fromBufferAttribute(p3, c);
  totalWeight += tri.getArea() * scale * scale * (weights[a] + weights[b] + weights[c]);
}

const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).setWeightAttribute("weight").setRandomGenerator(rand(5)).build();
const point = new THREE.Vector3();
const normal = new THREE.Vector3();
const out = new THREE.Vector3();
const P = new Float32Array(COUNT * 3);
const N = new Float32Array(COUNT * 3);
let count = 0;
let draws = 0;
while (count < COUNT) {
  if (++draws > COUNT * 4) throw new Error("too many inward-facing samples");
  sampler.sample(point, normal);
  out.copy(point).sub(center);
  // The mount's inner walls face inward: skip them, they only cloud the silhouette.
  if (out.lengthSq() > 1e-6 && out.normalize().dot(normal) < -0.15) continue;
  point.sub(center).multiplyScalar(scale);
  P.set([point.x, point.y, point.z], count * 3);
  N.set([normal.x, normal.y, normal.z], count * 3);
  count++;
}

const lo = [Infinity, Infinity, Infinity];
const hi = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < COUNT; i++)
  for (let c = 0; c < 3; c++) {
    lo[c] = Math.min(lo[c], P[i * 3 + c]);
    hi[c] = Math.max(hi[c], P[i * 3 + c]);
  }

const HEADER = 36;
const buffer = Buffer.alloc(HEADER + COUNT * 6);
buffer.write("SKP1", 0, "ascii");
buffer.writeUInt32LE(COUNT, 4);
for (let c = 0; c < 3; c++) {
  buffer.writeFloatLE(lo[c], 8 + c * 4);
  buffer.writeFloatLE(hi[c], 20 + c * 4);
}
buffer.writeFloatLE(totalWeight / COUNT, 32);

const steps = BITS.map((b) => (1 << b) - 1);
let maxPosError = 0;
let maxNormalError = 0;
for (let i = 0; i < COUNT; i++) {
  const q = [0, 1, 2].map((c) => Math.round(((P[i * 3 + c] - lo[c]) / (hi[c] - lo[c])) * steps[c]));
  const word = ((q[0] << 22) | (q[1] << 11) | q[2]) >>> 0;
  buffer.writeUInt32LE(word, HEADER + i * 4);
  for (let c = 0; c < 3; c++) maxPosError = Math.max(maxPosError, Math.abs(lo[c] + (q[c] / steps[c]) * (hi[c] - lo[c]) - P[i * 3 + c]));
  const [u, v] = octEncode(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
  buffer.writeInt8(u, HEADER + COUNT * 4 + i * 2);
  buffer.writeInt8(v, HEADER + COUNT * 4 + i * 2 + 1);
  const d = octDecode(u, v);
  const dot = d[0] * N[i * 3] + d[1] * N[i * 3 + 1] + d[2] * N[i * 3 + 2];
  maxNormalError = Math.max(maxNormalError, Math.acos(Math.min(1, dot)));
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buffer);
console.log(
  `${path.relative(ROOT, OUT)}: ${COUNT} points, ${(buffer.length / 1024).toFixed(1)} KB ` +
    `(max position error ${maxPosError.toFixed(5)} of [-1, 1], max normal error ${((maxNormalError * 180) / Math.PI).toFixed(2)}°, ` +
    `${draws - COUNT} inward samples dropped)`,
);
