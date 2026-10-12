// A top-down map of the whole sea, computed once from the island shapes: how shallow the water is,
// where the shore foam sits, where ice can form. The GPU samples it for colour and foam; the CPU
// samples the same numbers to calm the waves near shore, so floating things agree with what's drawn.
import { LANDMASSES, radiusAt, shoreTable } from "../layout";

export const MASK_EXTENT = 512; // metres, centred on the hub
export const MASK_RES = 512;

export type SeaMask = {
  /** RGBA bytes: R shallow, G shore foam, B ice band, A land. */
  bytes: Uint8Array;
  shallow: Float32Array;
  ice: Float32Array;
};

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// Cheap value noise so the ice edge and foam band aren't perfect rings.
function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise2(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** Signed distance (metres) from the nearest shore: negative on land. */
export function shoreDistance(x: number, z: number): number {
  let best = Infinity;
  for (const land of LANDMASSES) {
    const dx = x - land.x;
    const dz = z - land.z;
    const reach = land.r * 1.35 + 20;
    if (Math.abs(dx) > reach || Math.abs(dz) > reach) continue;
    const d = Math.hypot(dx, dz);
    const sd = d - radiusAt(shoreTable(land), Math.atan2(dz, dx));
    if (sd < best) best = sd;
  }
  return best;
}

export function buildMask(): SeaMask {
  const n = MASK_RES;
  const bytes = new Uint8Array(n * n * 4);
  const shallow = new Float32Array(n * n);
  const ice = new Float32Array(n * n);
  const texel = MASK_EXTENT / n;
  for (let j = 0; j < n; j++) {
    const z = -MASK_EXTENT / 2 + (j + 0.5) * texel;
    for (let i = 0; i < n; i++) {
      const x = -MASK_EXTENT / 2 + (i + 0.5) * texel;
      const sd = shoreDistance(x, z);
      const k = j * n + i;
      const wobble = noise2(x * 0.11, z * 0.11);
      const s = sd <= 0 ? 1 : 1 - smoothstep(0, 17, sd);
      const foam = sd > 22 ? 0 : 1 - smoothstep(0.2, 2.4 + wobble * 1.4, Math.abs(sd - 0.4));
      const band = sd < -0.5 ? 0 : 1 - smoothstep(4 + wobble * 6, 11 + wobble * 5, sd);
      const land = sd < 0 ? 1 : 0;
      shallow[k] = s;
      ice[k] = band;
      bytes[k * 4] = Math.round(s * 255);
      bytes[k * 4 + 1] = Math.round(foam * 255);
      bytes[k * 4 + 2] = Math.round(band * 255);
      bytes[k * 4 + 3] = land * 255;
    }
  }
  return { bytes, shallow, ice };
}

/** Bilinear sample of a mask channel at world (x, z). */
export function sampleMask(field: Float32Array, x: number, z: number): number {
  const n = MASK_RES;
  const u = (x + MASK_EXTENT / 2) / (MASK_EXTENT / n) - 0.5;
  const v = (z + MASK_EXTENT / 2) / (MASK_EXTENT / n) - 0.5;
  const i = Math.floor(u);
  const j = Math.floor(v);
  if (i < 0 || j < 0 || i >= n - 1 || j >= n - 1) return 0;
  const fu = u - i;
  const fv = v - j;
  const a = field[j * n + i];
  const b = field[j * n + i + 1];
  const c = field[(j + 1) * n + i];
  const d = field[(j + 1) * n + i + 1];
  return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
}
