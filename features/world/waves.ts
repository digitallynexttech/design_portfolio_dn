// One definition of the sea, read by both the GPU (to draw it) and the CPU (to float things on it).
// If the two ever disagreed the boat would hover or sink, so neither keeps its own copy.

export type Wave = {
  /** Travel direction, normalised at load. */
  dx: number;
  dz: number;
  /** Wavelength in metres. */
  length: number;
  /** Height in metres at calm weather. */
  amp: number;
  /** Crest sharpness: 1 is a sine, higher pinches the crests and widens the troughs. */
  sharp: number;
  phase: number;
};

const G = 9.81;

const RAW: Wave[] = [
  { dx: 1, dz: 0.35, length: 38, amp: 0.34, sharp: 2.2, phase: 0 },
  { dx: -0.45, dz: 1, length: 23, amp: 0.2, sharp: 1.7, phase: 1.7 },
  { dx: 0.7, dz: -0.75, length: 14, amp: 0.11, sharp: 1.4, phase: 4.1 },
  { dx: -0.95, dz: -0.25, length: 8.5, amp: 0.055, sharp: 1.2, phase: 2.3 },
];

export const WAVES: (Wave & { k: number; w: number })[] = RAW.map((w) => {
  const len = Math.hypot(w.dx, w.dz);
  const k = (Math.PI * 2) / w.length;
  // Deep-water dispersion: long waves travel faster, as they do at sea.
  return { ...w, dx: w.dx / len, dz: w.dz / len, k, w: Math.sqrt(G * k) * 0.8 };
});

/**
 * Height of the sea at (x, z) and time t, before shore damping. `amp` is the weather's multiplier
 * (calm ≈ 0.7, storm ≈ 2.4).
 */
export function seaHeight(x: number, z: number, t: number, amp: number): number {
  let h = 0;
  for (const w of WAVES) {
    const s = (Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t + w.phase) + 1) * 0.5;
    h += w.amp * (2 * Math.pow(Math.max(s, 0), w.sharp) - 1);
  }
  return h * amp;
}

/** Waves flatten near shore and in ice; `shallow` is the mask value 0 (open sea) → 1 (beach). */
export function shoreDamping(shallow: number, ice: number): number {
  return (1 - shallow * 0.72) * (1 - ice * 0.85);
}
