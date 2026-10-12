// Target shapes the water can take. Each returns N points inside a [-1, 1] box, with a colour and a
// surface normal per point, so any shape can pour into any other and every shape can be lit.
// Colours are stored as sRGB: the particles are added straight onto the page, which is sRGB too.
import * as THREE from "three";

export type FormId = "x" | "skull" | "helix" | "screens" | "drop" | "pool";
export type Shape = { positions: Float32Array; colors: Float32Array; normals: Float32Array };

const hex = (value: string) => new THREE.Color(value);
const TEAL = hex("#0ec8c5");
const RED = hex("#e21f26");
const srgb = { r: 0, g: 0, b: 0 };

function rand(seed: number) {
  // Deterministic so a shape looks the same every visit.
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function alloc(n: number): Shape {
  return { positions: new Float32Array(n * 3), colors: new Float32Array(n * 3), normals: new Float32Array(n * 3) };
}

function put(shape: Shape, i: number, x: number, y: number, z: number, c: THREE.Color, nx = 0, ny = 0, nz = 1) {
  shape.positions[i * 3] = x;
  shape.positions[i * 3 + 1] = y;
  shape.positions[i * 3 + 2] = z;
  c.getRGB(srgb, THREE.SRGBColorSpace);
  shape.colors[i * 3] = srgb.r;
  shape.colors[i * 3 + 1] = srgb.g;
  shape.colors[i * 3 + 2] = srgb.b;
  const len = Math.hypot(nx, ny, nz) || 1;
  shape.normals[i * 3] = nx / len;
  shape.normals[i * 3 + 1] = ny / len;
  shape.normals[i * 3 + 2] = nz / len;
}

/** The walking-X mark, sampled from the logo's alpha: teal water with red shoes. */
export async function xMark(n: number): Promise<Shape> {
  const img = new Image();
  img.src = "/brand/logo-white.png";
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // The mark is the first opaque run of columns; it ends at the first fully transparent column.
  const columnOpaque = (x: number) => {
    for (let y = 0; y < height; y++) if (data[(y * width + x) * 4 + 3] > 40) return true;
    return false;
  };
  let start = 0;
  while (start < width && !columnOpaque(start)) start++;
  let end = start;
  while (end < width && columnOpaque(end)) end++;

  const pixels: { x: number; y: number; red: boolean }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = start; x < end; x++) {
      const k = (y * width + x) * 4;
      // The whole mark is red in the logo; as water it is teal, keeping red only for the shoes (bottom third).
      if (data[k + 3] > 128) pixels.push({ x, y, red: false });
    }
  }
  let top = height;
  let bottom = 0;
  for (const p of pixels) {
    top = Math.min(top, p.y);
    bottom = Math.max(bottom, p.y);
  }
  const shoeLine = top + (bottom - top) * 0.64;
  for (const p of pixels) p.red = p.y > shoeLine;
  const span = Math.max(end - start, height);
  const r = rand(7);
  const shape = alloc(n);
  for (let i = 0; i < n; i++) {
    const p = pixels[Math.floor(r() * pixels.length)];
    const x = ((p.x - start + r()) / span) * 2 - (end - start) / span;
    const y = -(((p.y + r()) / span) * 2 - height / span);
    const c = p.red ? RED : TEAL.clone().lerp(hex("#ffffff"), r() * 0.25);
    put(shape, i, x, y, (r() - 0.5) * 0.18, c, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4, 1);
  }
  return shape;
}

/**
 * SKELMET's real print file, sampled across its surface. The file is quantised (16-bit positions
 * with the scale on the node), so the attributes are read back as plain floats before the node's
 * transform is applied; the face gets more of the points than the back of the head.
 */
export async function skull(n: number): Promise<Shape> {
  const [{ GLTFLoader }, { MeshoptDecoder }, { MeshSurfaceSampler }] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    import("three/examples/jsm/math/MeshSurfaceSampler.js"),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync("/models/skelmet/skull.glb");
  let mesh: THREE.Mesh | null = null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((child) => {
    if (!mesh && (child as THREE.Mesh).isMesh) mesh = child as THREE.Mesh;
  });
  if (!mesh) throw new Error("skull mesh missing");
  const found = mesh as THREE.Mesh;
  const src = found.geometry;
  const pos = src.getAttribute("position");
  const nor = src.getAttribute("normal");
  const count = pos.count;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
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
  if (src.index) geometry.setIndex(Array.from(src.index.array as ArrayLike<number>));
  geometry.applyMatrix4(found.matrixWorld);
  if (!nor) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z);

  // Weight the face (normals toward the viewer) over the back and the mount underneath.
  const n3 = geometry.getAttribute("normal");
  const weights = new Float32Array(n3.count);
  for (let i = 0; i < n3.count; i++) weights[i] = n3.getZ(i) > 0 ? 1.6 : 0.6;
  geometry.setAttribute("weight", new THREE.BufferAttribute(weights, 1));

  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).setWeightAttribute("weight").build();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const out = new THREE.Vector3();
  const blaze = hex("#ff5a1f");
  const ember = hex("#ffc24d");
  const light = new THREE.Vector3(-0.5, 0.6, 0.6).normalize();
  const shape = alloc(n);
  let i = 0;
  let guard = 0;
  while (i < n && guard < n * 4) {
    guard++;
    sampler.sample(point, normal);
    out.copy(point).sub(center);
    // The mount's inner walls face inward: skip them, they only cloud the silhouette.
    if (out.lengthSq() > 1e-6 && out.normalize().dot(normal) < -0.15) continue;
    point.sub(center).multiplyScalar(scale);
    const lit = Math.max(0, normal.dot(light));
    put(shape, i, point.x, point.y, point.z, blaze.clone().lerp(ember, lit * 0.55), normal.x, normal.y, normal.z);
    i++;
  }
  // If the guard ran out, repeat the points already placed.
  for (let j = i; j < n; j++) {
    const k = j % Math.max(1, i);
    for (let c = 0; c < 3; c++) {
      shape.positions[j * 3 + c] = shape.positions[k * 3 + c];
      shape.colors[j * 3 + c] = shape.colors[k * 3 + c];
      shape.normals[j * 3 + c] = shape.normals[k * 3 + c];
    }
  }
  geometry.dispose();
  return shape;
}

/** Know Your Genes: a tilted double helix with clean rungs, in eden and java teals. */
export function helix(n: number): Shape {
  const r = rand(11);
  const eden = hex("#25b5ab");
  const java = hex("#7fe3d6");
  const shape = alloc(n);
  const turns = 2.1;
  const radius = 0.5;
  const RUNGS = 24;
  const tilt = (18 * Math.PI) / 180;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const gauss = () => (r() + r() + r() - 1.5) * 0.04;
  for (let i = 0; i < n; i++) {
    const rung = r() < 0.26;
    let x: number;
    let y: number;
    let z: number;
    let nx: number;
    let nz: number;
    let c: THREE.Color;
    if (rung) {
      // Rungs at fixed heights, each half in its own strand's colour, like base pairs.
      const t = (Math.floor(r() * RUNGS) + 0.5) / RUNGS;
      const angle = t * Math.PI * 2 * turns;
      const s = r() * 2 - 1;
      x = Math.cos(angle) * radius * s;
      z = Math.sin(angle) * radius * s;
      y = t * 2 - 1;
      nx = Math.cos(angle + Math.PI / 2);
      nz = Math.sin(angle + Math.PI / 2);
      c = s > 0 ? eden : java;
    } else {
      const t = r();
      const strand = r() < 0.5 ? 0 : Math.PI;
      const angle = t * Math.PI * 2 * turns + strand;
      x = Math.cos(angle) * radius + gauss();
      z = Math.sin(angle) * radius + gauss();
      y = t * 2 - 1 + gauss();
      nx = Math.cos(angle);
      nz = Math.sin(angle);
      c = (strand ? java : eden).clone().lerp(hex("#ffffff"), r() * 0.12);
    }
    // Lean the whole helix so it reads as a molecule, not a spring.
    put(shape, i, x * ct - y * st * 0.9, (x * st + y * ct) * 0.98, z, c, nx * ct, nx * st, nz);
  }
  return shape;
}

/**
 * DNMS: the system itself. A browser window on a gently curved panel, with a sidebar, four KPI
 * cards, a donut, a bar chart and list rows, and a phone floating in front of it, violet to cyan
 * like its Aurora theme. Drawn from shapes, never from a screenshot (those hold staff names).
 */
export function screens(n: number): Shape {
  const r = rand(23);
  const violet = hex("#ab63f2");
  const cyan = hex("#22d3ee");
  const shape = alloc(n);
  const W = 0.92;
  const H = 0.62;
  const curve = (x: number) => -0.25 * x * x;
  type Gen = () => [number, number, number?];
  // Points on the outline of a rectangle (x0, y0) → (x1, y1).
  const rectLine = (x0: number, y0: number, x1: number, y1: number): Gen => () => {
    const w = x1 - x0;
    const h = y1 - y0;
    const t = r() * (w + h) * 2;
    if (t < w) return [x0 + t, y0];
    if (t < w + h) return [x1, y0 + (t - w)];
    if (t < 2 * w + h) return [x1 - (t - w - h), y1];
    return [x0, y1 - (t - 2 * w - h)];
  };
  const hline = (x0: number, x1: number, y: number): Gen => () => [x0 + r() * (x1 - x0), y + (r() - 0.5) * 0.008];
  const fill = (x0: number, y0: number, x1: number, y1: number): Gen => () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)];
  const ring = (cx: number, cy: number, r0: number, r1: number, from = 0, to = Math.PI * 2): Gen => () => {
    const a = from + r() * (to - from);
    const d = r0 + r() * (r1 - r0);
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  };
  // The dashboard, in panel coordinates (x right, y up).
  const left = -W;
  const right = W;
  const top = H;
  const bottom = -H;
  const sideR = left + 0.34;
  const parts: { w: number; g: Gen; z?: number }[] = [
    { w: 0.13, g: rectLine(left, bottom, right, top) },
    { w: 0.04, g: hline(left, right, top - 0.1) },
    { w: 0.02, g: fill(left + 0.04, top - 0.07, left + 0.16, top - 0.04) },
    // Sidebar: a divider and menu lines.
    { w: 0.03, g: () => [sideR + (r() - 0.5) * 0.006, bottom + r() * (top - 0.1 - bottom)] },
    ...Array.from({ length: 6 }, (_, k) => ({ w: 0.012, g: hline(left + 0.07, sideR - 0.07, top - 0.22 - k * 0.12) })),
    // Four KPI cards with their figures.
    ...Array.from({ length: 4 }, (_, k) => {
      const x0 = sideR + 0.06 + k * 0.32;
      return { w: 0.035, g: rectLine(x0, top - 0.4, x0 + 0.27, top - 0.16) };
    }),
    ...Array.from({ length: 4 }, (_, k) => {
      const x0 = sideR + 0.1 + k * 0.32;
      return { w: 0.018, g: fill(x0, top - 0.33, x0 + 0.12, top - 0.27) };
    }),
    // A donut, three-quarters filled.
    { w: 0.1, g: ring(sideR + 0.3, bottom + 0.34, 0.15, 0.22, -Math.PI / 2, Math.PI) },
    { w: 0.025, g: ring(sideR + 0.3, bottom + 0.34, 0.15, 0.22, Math.PI, Math.PI * 1.5) },
    // A bar chart.
    ...[0.35, 0.6, 0.45, 0.75, 0.55, 0.9].map((h, k) => {
      const x0 = sideR + 0.62 + k * 0.1;
      return { w: 0.025, g: fill(x0, bottom + 0.1, x0 + 0.06, bottom + 0.1 + h * 0.45) };
    }),
    // List rows.
    ...Array.from({ length: 3 }, (_, k) => ({ w: 0.016, g: hline(sideR + 0.06, right - 0.08, top - 0.52 - k * 0.075) })),
  ];
  // A phone in front, to the right, slightly turned.
  const phone = (g: Gen): Gen => () => {
    const [x, y] = g();
    return [x, y, 0.35];
  };
  const px0 = 0.55;
  const py0 = -0.78;
  parts.push(
    { w: 0.06, g: phone(rectLine(px0, py0, px0 + 0.36, py0 + 0.72)) },
    { w: 0.03, g: phone(fill(px0 + 0.05, py0 + 0.48, px0 + 0.31, py0 + 0.6)) },
    ...Array.from({ length: 4 }, (_, k) => ({ w: 0.008, g: phone(hline(px0 + 0.05, px0 + 0.31, py0 + 0.38 - k * 0.07)) })),
  );
  const total = parts.reduce((s, p) => s + p.w, 0);
  for (let i = 0; i < n; i++) {
    let pick = r() * total;
    let part = parts[0];
    for (const p of parts) {
      pick -= p.w;
      if (pick <= 0) {
        part = p;
        break;
      }
    }
    const [x, y, front] = part.g();
    const onPhone = front !== undefined;
    const z = onPhone ? front : curve(x) + (r() - 0.5) * 0.012;
    const c = onPhone ? cyan.clone().lerp(hex("#ffffff"), 0.2) : violet.clone().lerp(cyan, (x + 1) / 2);
    put(shape, i, x, y * 1.05, z, c, onPhone ? 0 : 0.5 * x, 0, 1);
  }
  return shape;
}

/** Hard2Soft: a single drop of clear water. */
export function drop(n: number): Shape {
  const r = rand(31);
  const deep = hex("#1257c7");
  const clear = hex("#9cc7ff");
  const shape = alloc(n);
  for (let i = 0; i < n; i++) {
    // Surface of a sphere, pulled to a point at the top.
    const u = r() * 2 - 1;
    const phi = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    let x = s * Math.cos(phi);
    let z = s * Math.sin(phi);
    let y = u;
    const nx = x;
    const nz = z;
    const ny = y > 0 ? y * 0.5 : y;
    const pinch = y > 0 ? 1 - y * 0.85 : 1;
    x *= pinch * 0.62;
    z *= pinch * 0.62;
    y = y > 0 ? y * 1.15 : y * 0.62;
    put(shape, i, x, y - 0.1, z, deep.clone().lerp(clear, (y + 1) / 2), nx, ny, nz);
  }
  return shape;
}

/** At rest: a shallow pool, used between forms. */
export function pool(n: number): Shape {
  const r = rand(43);
  const shape = alloc(n);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    // Leaning toward the viewer like the pour's pool, and dim: at rest it is just water.
    const z = Math.sin(a) * d * 0.6;
    put(shape, i, Math.cos(a) * d * 1.4, -0.85 + z * 0.18 + (r() - 0.5) * 0.03, z, TEAL.clone().multiplyScalar(0.3 + r() * 0.15), 0, 1, 0.3);
  }
  return shape;
}

export async function buildShape(id: FormId, n: number): Promise<Shape> {
  switch (id) {
    case "x":
      return xMark(n);
    case "skull":
      return skull(n);
    case "helix":
      return helix(n);
    case "screens":
      return screens(n);
    case "drop":
      return drop(n);
    case "pool":
      return pool(n);
  }
}
