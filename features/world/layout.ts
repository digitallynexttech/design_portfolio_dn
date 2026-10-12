// The archipelago's map: where every island, dock and floating thing sits. Pure data and maths, no
// three.js, so the map overlay, physics, terrain and water mask all read the same shapes.
// Axes: x east, z south, water level y = 0. The camera always looks north (toward −z).

export type Ground = "green" | "rock" | "linen" | "sand" | "stone";

export type PointKind =
  | "study"
  | "making"
  | "studio"
  | "lab"
  | "service"
  | "archive"
  | "reel"
  | "bottle"
  | "recognition"
  | "weather";

export type Island = {
  id: string;
  label: string;
  /** Short line under the label on signs and the map. */
  sub: string;
  x: number;
  z: number;
  /** Mean shore radius in metres. */
  r: number;
  /** Peak height in metres. */
  h: number;
  ground: Ground;
  seed: number;
  /** Direction the dock points, radians: 0 = east, π/2 = south (toward the camera). */
  dock: number;
  dockLength: number;
  kind: PointKind;
  /** Case-study slug or panel id the dock opens. */
  ref: string;
  /** Flagships are larger and visible from the start. */
  flagship?: boolean;
  /** Small islands that carry no dock of their own (the network's lighthouse rocks). */
  satellite?: boolean;
};

const S = Math.PI / 2;

export const ISLANDS: Island[] = [
  { id: "hub", label: "Digitally Next", sub: "How we built this world", x: 0, z: 0, r: 16, h: 5, ground: "green", seed: 1, dock: S, dockLength: 9, kind: "making", ref: "making-of" },
  { id: "skelmet", label: "SKELMET", sub: "Commerce · 3D", x: -64, z: -50, r: 15, h: 6, ground: "rock", seed: 7, dock: S + 0.25, dockLength: 8, kind: "study", ref: "skelmet", flagship: true },
  { id: "know-your-genes", label: "Know Your Genes", sub: "Platform · 3D mascots", x: 64, z: -50, r: 16, h: 4, ground: "linen", seed: 11, dock: S - 0.25, dockLength: 8, kind: "study", ref: "know-your-genes", flagship: true },
  { id: "hard2soft", label: "Hard2Soft", sub: "Commerce · Search", x: -82, z: 22, r: 14, h: 4, ground: "green", seed: 23, dock: S, dockLength: 8, kind: "study", ref: "hard2soft", flagship: true },
  { id: "dnms", label: "DNMS", sub: "Platform · AI", x: 82, z: 22, r: 13, h: 3, ground: "stone", seed: 31, dock: S, dockLength: 8, kind: "study", ref: "dnms", flagship: true },
  { id: "happy-ganga", label: "Happy Ganga", sub: "Brand · Commerce", x: -132, z: -104, r: 11, h: 4, ground: "green", seed: 41, dock: S, dockLength: 7, kind: "study", ref: "happy-ganga" },
  { id: "leocym", label: "Leocym India", sub: "Brand site", x: -44, z: -134, r: 10, h: 3, ground: "sand", seed: 43, dock: S, dockLength: 7, kind: "study", ref: "leocym" },
  { id: "kyg-network", label: "KYG network", sub: "13 sites, one family", x: 48, z: -136, r: 9, h: 3, ground: "green", seed: 47, dock: S, dockLength: 7, kind: "study", ref: "kyg-network" },
  { id: "talentifix", label: "TalentiFi-X", sub: "Platform · Search", x: 136, z: -92, r: 10, h: 4, ground: "green", seed: 53, dock: S, dockLength: 7, kind: "study", ref: "talentifix" },
  { id: "chetan-mangalwedhe", label: "Chetan Mangalwedhe", sub: "Personal brand", x: -142, z: 64, r: 10, h: 6, ground: "rock", seed: 59, dock: S, dockLength: 7, kind: "study", ref: "chetan-mangalwedhe" },
  { id: "realty-canvas", label: "Realty Canvas", sub: "Platform · Real estate", x: 140, z: 72, r: 11, h: 3, ground: "stone", seed: 61, dock: S, dockLength: 7, kind: "study", ref: "realty-canvas" },
  { id: "studio", label: "The studio", sub: "Who poured it", x: -62, z: 104, r: 15, h: 4, ground: "green", seed: 67, dock: S + 0.45, dockLength: 9, kind: "studio", ref: "studio" },
  { id: "lab", label: "The Lab", sub: "Made for no client", x: 64, z: 104, r: 13, h: 3, ground: "sand", seed: 71, dock: S - 0.45, dockLength: 9, kind: "lab", ref: "lab" },
];

// The network's thirteen sites: one lighthouse rock each, in a ring around its island.
export const NETWORK_ROCKS: { x: number; z: number; r: number }[] = Array.from({ length: 13 }, (_, i) => {
  const a = (i / 13) * Math.PI * 2 + 0.2;
  const ring = 21 + (i % 2) * 3;
  return { x: 48 + Math.cos(a) * ring, z: -136 + Math.sin(a) * ring, r: 2.2 + (i % 3) * 0.3 };
});

export type FloatingPoint = {
  id: string;
  kind: PointKind;
  ref: string;
  label: string;
  x: number;
  z: number;
  /** How close the boat must come, in metres. */
  reach: number;
};

/** Six service buoys, a channel from the hub toward the studio. */
export const SERVICE_BUOYS: { x: number; z: number }[] = [
  { x: -16, z: 34 },
  { x: -24, z: 46 },
  { x: -33, z: 57 },
  { x: -10, z: 50 },
  { x: -19, z: 62 },
  { x: -28, z: 73 },
];

export const WEATHER_BUOYS: { state: "live" | "clear" | "rain" | "storm" | "mist" | "snow"; label: string; x: number; z: number }[] = [
  { state: "live", label: "Your weather", x: 54, z: 133 },
  { state: "clear", label: "Clear", x: 61, z: 138 },
  { state: "rain", label: "Rain", x: 69, z: 141 },
  { state: "storm", label: "Storm", x: 80, z: 141 },
  { state: "mist", label: "Mist", x: 88, z: 138 },
  { state: "snow", label: "Snow", x: 95, z: 133 },
];

export const REEL_SCREEN = { x: 36, z: -88, width: 22, height: 12.4 };
export const RECOGNITION_ROCK = { x: -98, z: 122, r: 4.5 };
export const BOTTLE_HOME = { x: 18, z: 31 };
export const SPAWN = { x: 0, z: 42, heading: 0 };
export const WORLD_RADIUS = 236;

/** Archive screens float in an arc on the reef, north of everything. */
export function archiveSlots(count: number): { x: number; z: number; yaw: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = -Math.PI / 2 + (t - 0.5) * 1.15;
    return { x: Math.cos(a) * 196, z: Math.sin(a) * 196 + 6, yaw: 0 };
  });
}

/** Everything solid that rises out of the sea: islands, the network's rocks, the trophy rock, the reef. */
export type Landmass = { id: string; x: number; z: number; r: number; h: number; seed: number; ground: Ground; island?: Island };

const REEF_ROCKS = Array.from({ length: 9 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 8 - 0.5) * 1.4;
  const ring = 212 + (i % 3) * 5;
  return { x: Math.cos(a) * ring, z: Math.sin(a) * ring + 6, r: 2.4 + (i % 4) * 0.8 };
});

export const LANDMASSES: Landmass[] = [
  ...ISLANDS.map((island) => ({ id: island.id, x: island.x, z: island.z, r: island.r, h: island.h, seed: island.seed, ground: island.ground, island })),
  ...NETWORK_ROCKS.map((rock, i) => ({ id: `net-${i}`, x: rock.x, z: rock.z, r: rock.r, h: 1.6, seed: 300 + i, ground: "rock" as const })),
  { id: "trophy", x: RECOGNITION_ROCK.x, z: RECOGNITION_ROCK.z, r: RECOGNITION_ROCK.r, h: 2.6, seed: 401, ground: "rock" },
  ...REEF_ROCKS.map((rock, i) => ({ id: `reef-${i}`, x: rock.x, z: rock.z, r: rock.r, h: 1.4 + (i % 3) * 0.6, seed: 500 + i, ground: "rock" as const })),
];

// ---------------------------------------------------------------------------------------------
// Shapes. Every island's shore is a wobbly circle, r(θ), from a seeded table.

export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RADII = 256;
const radiiCache = new Map<string, Float32Array>();

/** Shore radius around the island centre, sampled at 256 angles. */
export function shoreTable(island: { id: string; r: number; seed: number }, wobble = 0.15): Float32Array {
  const key = `${island.id}:${island.r}:${wobble}`;
  const cached = radiiCache.get(key);
  if (cached) return cached;
  const rand = seeded(island.seed * 9973);
  const terms = [2, 3, 4, 5, 7].map((k) => ({ k, a: (rand() * 0.6 + 0.4) * wobble / (k * 0.55), p: rand() * Math.PI * 2 }));
  const table = new Float32Array(RADII);
  for (let i = 0; i < RADII; i++) {
    const th = (i / RADII) * Math.PI * 2;
    let f = 1;
    for (const t of terms) f += t.a * Math.sin(t.k * th + t.p);
    table[i] = island.r * f;
  }
  radiiCache.set(key, table);
  return table;
}

export function radiusAt(table: Float32Array, theta: number): number {
  let u = (theta / (Math.PI * 2)) % 1;
  if (u < 0) u += 1;
  const f = u * RADII;
  const i = Math.floor(f);
  const t = f - i;
  return table[i % RADII] * (1 - t) + table[(i + 1) % RADII] * t;
}

/** World position of the end of an island's dock, where the boat stops. */
export function dockEnd(island: Island, extra = 0): { x: number; z: number; shore: number } {
  const shore = radiusAt(shoreTable(island), island.dock);
  const d = shore + island.dockLength + extra;
  return { x: island.x + Math.cos(island.dock) * d, z: island.z + Math.sin(island.dock) * d, shore };
}

/** Where the boat floats while docked: beside the dock end, facing back along the pier. */
export function berth(island: Island): { x: number; z: number; heading: number } {
  const end = dockEnd(island, 4.5);
  const out = { x: Math.cos(island.dock), z: Math.sin(island.dock) };
  // Heading convention: forward = (−sin h, −cos h); point the bow at the island.
  const heading = Math.atan2(out.x, out.z);
  return { x: end.x, z: end.z, heading };
}
