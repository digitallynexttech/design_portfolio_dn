// Island ground: a smooth radial mesh per landmass, shaped by its style (green hills, black rock,
// KYG's pale plateau, sand, paved quays), with a shallow sandy shelf under the water before it drops
// away. Surfaces blend photographic sand, damp sand, grass, rock and concrete by height and slope;
// grass follows the season; snow settles; sunlight caustics dance on the shallow seabed.
import * as THREE from "three/webgpu";
import {
  attribute,
  cameraViewMatrix,
  float,
  max,
  mix,
  mx_noise_float,
  normalize,
  normalWorld,
  positionWorld,
  smoothstep,
  step,
  texture,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { LANDMASSES, radiusAt, seeded, shoreTable, type Landmass } from "../layout";
import { causticsTexture } from "./procedural";
import type { Shared } from "./shared";
import { planar, triplanar, type Textures } from "./textures";
import type { N } from "./tsl";

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function valueNoise(seed: number) {
  const rand = seeded(seed);
  const perm = Array.from({ length: 256 }, () => rand());
  const at = (ix: number, iz: number) => perm[((((ix * 73 + iz * 151) % 256) + 256) % 256)];
  return (x: number, z: number) => {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);
    const a = at(ix, iz);
    const b = at(ix + 1, iz);
    const c = at(ix, iz + 1);
    const d = at(ix + 1, iz + 1);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  };
}

const noises = new Map<number, (x: number, z: number) => number>();
function noiseFor(seed: number) {
  let n = noises.get(seed);
  if (!n) {
    n = valueNoise(seed);
    noises.set(seed, n);
  }
  return n;
}

/** Ground height of a landmass at world (x, z). Negative below the waterline. */
export function groundHeight(land: Landmass, x: number, z: number): number {
  const dx = x - land.x;
  const dz = z - land.z;
  const d = Math.hypot(dx, dz);
  const R = radiusAt(shoreTable(land), Math.atan2(dz, dx));
  const rr = d / R;
  const n = noiseFor(land.seed);
  const fine = (n(x * 0.55 + 31, z * 0.55) - 0.5) * 0.18;
  if (rr >= 1) {
    // A sandy shelf a few metres wide, then the drop-off into deep water.
    const out = (rr - 1) * R;
    const ripples = (n(x * 0.3, z * 0.3 + 11) - 0.5) * 0.25;
    return -Math.min(34, out * 0.17 + Math.pow(Math.max(0, out - 5), 1.38) * 0.62) + ripples * smooth(0, 3, out);
  }
  const hills = n(x * 0.09, z * 0.09) * 0.65 + n(x * 0.21 + 7, z * 0.21) * 0.35;
  const H = land.h;
  switch (land.ground) {
    case "rock": {
      const cliff = Math.pow(smooth(1.0, 0.8, rr), 0.65);
      return cliff * H * (0.55 + hills * 0.55) + fine * 2.5 * cliff;
    }
    case "linen":
      return smooth(1.0, 0.8, rr) * H * 0.7 + smooth(0.6, 0.2, rr) * H * 0.3 * hills + fine * 0.5;
    case "sand":
      return smooth(1.0, 0.42, rr) * H * (0.45 + hills * 0.55) + fine;
    case "stone": {
      const quay = smooth(1.0, 0.955, rr) * 1.5;
      return quay + smooth(0.75, 0.3, rr) * H * 0.35 * hills;
    }
    default: {
      const beach = Math.pow(smooth(1.0, 0.72, rr), 1.15);
      return beach * H * (0.35 + hills * 0.65 * smooth(0.95, 0.55, rr) + 0.2) + fine * beach;
    }
  }
}

export function landById(id: string): Landmass {
  const land = LANDMASSES.find((l) => l.id === id);
  if (!land) throw new Error(`Unknown landmass ${id}`);
  return land;
}

const STYLE: Record<Landmass["ground"], number> = { green: 0, rock: 1, linen: 2, sand: 3, stone: 4 };

function islandGeometry(land: Landmass): THREE.BufferGeometry {
  const table = shoreTable(land);
  const segments = land.r < 5 ? 40 : land.r < 11 ? 96 : 128;
  // Rings packed toward the shoreline, where the shape changes fastest, then out over the shelf.
  const ringsT: number[] = [0];
  for (let t = 0.06; t < 0.7; t += 0.07) ringsT.push(t);
  for (let t = 0.7; t < 1.06; t += 0.022) ringsT.push(t);
  for (let t = 1.08; t <= 2.6; t += 0.06) ringsT.push(t);
  const positions: number[] = [];
  const index: number[] = [];
  positions.push(land.x, groundHeight(land, land.x, land.z), land.z);
  for (let r = 1; r < ringsT.length; r++) {
    for (let s = 0; s < segments; s++) {
      const th = (s / segments) * Math.PI * 2;
      const R = radiusAt(table, th) * ringsT[r];
      const x = land.x + Math.cos(th) * R;
      const z = land.z + Math.sin(th) * R;
      positions.push(x, groundHeight(land, x, z), z);
    }
  }
  const ring = (r: number, s: number) => 1 + (r - 1) * segments + (((s % segments) + segments) % segments);
  for (let s = 0; s < segments; s++) index.push(0, ring(1, s + 1), ring(1, s));
  for (let r = 1; r < ringsT.length - 1; r++) {
    for (let s = 0; s < segments; s++) {
      const a = ring(r, s);
      const b = ring(r, s + 1);
      const c = ring(r + 1, s + 1);
      const d = ring(r + 1, s);
      index.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const count = positions.length / 3;
  const style = new Float32Array(count).fill(STYLE[land.ground]);
  const dark = new Float32Array(count).fill(land.id === "skelmet" ? 1 : 0);
  geometry.setAttribute("style", new THREE.BufferAttribute(style, 1));
  geometry.setAttribute("dark", new THREE.BufferAttribute(dark, 1));
  return geometry;
}

/** Concatenate indexed geometries that share the same attributes. */
function mergeIndexed(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const names = Object.keys(parts[0].attributes);
  const out = new THREE.BufferGeometry();
  let vertexTotal = 0;
  for (const name of names) {
    const itemSize = parts[0].attributes[name].itemSize;
    const total = parts.reduce((sum, p) => sum + p.attributes[name].count * itemSize, 0);
    const array = new Float32Array(total);
    let offset = 0;
    for (const p of parts) {
      array.set(p.attributes[name].array as Float32Array, offset);
      offset += p.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  const indices: number[] = [];
  for (const p of parts) {
    const idx = p.index!.array;
    for (let i = 0; i < idx.length; i++) indices.push(idx[i] + vertexTotal);
    vertexTotal += p.attributes.position.count;
  }
  out.setIndex(indices);
  out.computeBoundingSphere();
  return out;
}

/** All islands and rocks as one mesh: one draw call, photographic, seasonal. */
export function createTerrain(scene: THREE.Scene, shared: Shared, tex: Textures, tier: 1 | 2 | 3, rich: boolean) {
  const { u } = shared;
  const parts = LANDMASSES.map(islandGeometry);
  const merged = mergeIndexed(parts);
  for (const p of parts) p.dispose();
  const caustics = causticsTexture(tier === 1 ? 128 : 256);

  // Triplanar rock needs more texture slots than phones (and WebGL) guarantee.
  const cheap = tier === 1 || !rich;
  const style = attribute("style", "float");
  const darkRock = attribute("dark", "float");
  const is = (k: number) => float(1).sub(step(0.5, style.sub(k).abs()));
  const y = positionWorld.y;
  const up = normalWorld.y;
  const breakup = mx_noise_float(positionWorld.xz.mul(0.07)).mul(0.5).add(0.5);

  const sand = planar(tex.set("sand"), 0.11, 1.1);
  const grass = planar(tex.set("grass"), 0.13, 1.2);
  const concrete = planar(tex.set("concrete"), 0.12, 0.8);
  const rock = triplanar(tex.set("rock"), 0.09, { normalStrength: 1.3, cheap });
  const dark = triplanar(tex.set("darkrock"), 0.1, { normalStrength: 1.4, cheap });

  // Layer weights by height, slope and island style.
  const steep = float(1).sub(smoothstep(0.6, 0.82, up));
  const beachLine = smoothstep(0.45, 1.25, y.add(breakup.mul(0.6)));
  const wetW = float(1).sub(smoothstep(-0.05, 0.4, y.sub(breakup.mul(0.15))));
  const green = is(0);
  const rocky = is(1);
  const linen = is(2);
  const sandy = is(3);
  const stone = is(4);
  const grassW = beachLine.mul(green.add(sandy.mul(smoothstep(0.55, 0.75, breakup)).mul(step(1.2, y))).add(rocky.mul(smoothstep(0.62, 0.8, breakup)).mul(0.8))).clamp(0, 1);
  const concreteW = stone.mul(smoothstep(0.9, 1.3, y));
  const rockW = max(steep.mul(float(1).sub(concreteW.mul(0.6))), rocky.mul(float(1).sub(grassW))).clamp(0, 1);

  // Seasonal tint for grass (set on the CPU from the season blend).
  const grassColor = grass.color.mul(u.grassTint);
  const rockColor = mix(rock.color, dark.color, darkRock);
  const rockNormal = mix(rock.normal, dark.normal, darkRock);
  const rockRough = mix(rock.rough, dark.rough, darkRock);
  const sandColor = sand.color.mul(mix(vec3(1), vec3(1.08, 1.05, 0.98), linen));

  let color: N = sandColor;
  let tangent: N = sand.tangent;
  let rough: N = sand.rough;
  const layer = (c: N, t: N, r: N, w: N) => {
    color = mix(color, c, w);
    tangent = mix(tangent, t, w);
    rough = mix(rough, r, w);
  };
  layer(grassColor, grass.tangent, grass.rough, grassW);
  layer(concrete.color.mul(0.95), concrete.tangent, concrete.rough, concreteW);
  // Damp sand at the waterline: the same sand, darker and glossier.
  layer(sand.color.mul(vec3(0.58, 0.56, 0.52)), sand.tangent, sand.rough.mul(0.45), wetW.mul(float(1).sub(rocky.mul(0.6))));
  // Rock gets its own (triplanar) normal; blend world normals after.
  const flatNormal = normalize(normalWorld.add(vec3(tangent.x, 0, tangent.y).mul(0.7)));
  color = mix(color, rockColor, rockW);
  rough = mix(rough, rockRough, rockW);
  let n: N = normalize(mix(flatNormal, rockNormal, rockW));

  // Snow on upward faces above the waterline; rain darkens and glosses.
  const snow = u.cover.mul(smoothstep(0.55, 0.85, up)).mul(smoothstep(0.3, 1.0, y)).mul(smoothstep(0.3, 0.6, breakup.add(u.cover.mul(0.4))));
  color = mix(color.mul(mix(float(1), float(0.68), u.wet.mul(smoothstep(-0.2, 0.3, y)))), vec3(0.9, 0.93, 0.97), snow);
  rough = mix(rough.mul(mix(float(1), float(0.45), u.wet)), float(0.55), snow);
  n = normalize(mix(n, normalWorld, snow.mul(0.7)));

  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.colorNode = color;
  material.roughnessNode = rough.clamp(0.08, 1);
  material.normalNode = cameraViewMatrix.mul(vec4(n, 0)).xyz;

  // Caustics on the seabed: two drifting layers, strongest just below the surface.
  const below = float(1).sub(smoothstep(-0.25, 0.05, y));
  const fade = max(float(1).add(y.mul(0.16)), 0);
  const c1 = texture(caustics, positionWorld.xz.mul(0.16).add(vec2(u.time.mul(0.031), u.time.mul(0.017)))).r;
  const c2 = texture(caustics, positionWorld.xz.mul(0.21).sub(vec2(u.time.mul(0.023), u.time.mul(-0.029)))).r;
  const caustic = c1.mul(c2).mul(2.6).add(c1.add(c2).mul(0.12));
  const sunUp = smoothstep(-0.05, 0.2, u.sunDir.y);
  material.emissiveNode = u.sunColor.mul(u.sunI).mul(caustic).mul(below).mul(fade).mul(sunUp).mul(float(1).sub(u.cloud.mul(0.8))).mul(0.09).mul(color.add(0.25));

  const mesh = new THREE.Mesh(merged, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return {
    mesh,
    dispose() {
      merged.dispose();
      material.dispose();
      caustics.dispose();
    },
  };
}

/** Concatenate non-indexed geometries that share the same attributes. */
export function mergeAll(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const names = Object.keys(parts[0].attributes);
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const itemSize = parts[0].attributes[name].itemSize;
    const total = parts.reduce((sum, p) => sum + p.attributes[name].count * itemSize, 0);
    const array = new Float32Array(total);
    let offset = 0;
    for (const p of parts) {
      const src = p.attributes[name].array as Float32Array;
      array.set(src, offset);
      offset += src.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  out.computeBoundingSphere();
  return out;
}

/** Random points on a landmass's dry ground, avoiding `keepOut` circles. */
export function scatter(
  land: Landmass,
  count: number,
  opts: { minH?: number; maxRR?: number; keepOut?: { x: number; z: number; r: number }[]; seed?: number; spacing?: number },
): { x: number; y: number; z: number }[] {
  const rand = seeded(opts.seed ?? land.seed * 31);
  const table = shoreTable(land);
  const out: { x: number; y: number; z: number }[] = [];
  const spacing = opts.spacing ?? 2.2;
  let tries = 0;
  while (out.length < count && tries < count * 40) {
    tries++;
    const th = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * (opts.maxRR ?? 0.85);
    const R = radiusAt(table, th) * rr;
    const x = land.x + Math.cos(th) * R;
    const z = land.z + Math.sin(th) * R;
    const y = groundHeight(land, x, z);
    if (y < (opts.minH ?? 0.7)) continue;
    if (opts.keepOut?.some((k) => (x - k.x) ** 2 + (z - k.z) ** 2 < k.r * k.r)) continue;
    if (spacing > 0 && out.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < spacing * spacing)) continue;
    out.push({ x, y, z });
  }
  return out;
}

