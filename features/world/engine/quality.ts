// How hard the world renders, and how it lightens itself when a device can't keep up.
//
// The tier decides what gets built (shadows, the sea's mirror, multisampling, grass); the knobs
// below decide how much of it runs, and every one of them can change mid-voyage without
// rebuilding a shader. That matters: the world has ~300 GPU pipelines, and changing anything they
// are compiled for (the multisample count, whether shadows exist) would rebuild them all and
// freeze the very device that asked for less work.

export type Tier = 1 | 2 | 3;

export type Knobs = {
  /** Cap on the device pixel ratio. */
  pixelRatio: number;
  /** The islands mirrored in the sea (where built). Off, the sea reflects the sky alone. */
  mirror: boolean;
  /** Render the sun's shadow map every Nth frame (1 = every frame). */
  shadowEvery: number;
  /** Shadow map resolution. */
  shadowSize: number;
  /** Grass density, 0–1 of a full build (Balanced builds 40%, Light none). */
  grass: number;
  /** Rain, snow, spray and leaf density, 0–1 of a full build (Balanced builds 60%, Light 30%). */
  weather: number;
  bloom: boolean;
  /** Frame cap. */
  fps: 60 | 30;
};

/**
 * A tier's settings. `lite` is phone-scale Full: the same world with fewer pixels (a phone at 1.5×
 * is already sharper than most desktops) and no mirror pass, which on a phone costs more than it
 * shows on a small screen.
 */
export function preset(tier: Tier, lite: boolean): Knobs {
  if (tier === 3) return { pixelRatio: lite ? 1.5 : 2, mirror: !lite, shadowEvery: 1, shadowSize: 2048, grass: 1, weather: 1, bloom: true, fps: 60 };
  if (tier === 2) return { pixelRatio: lite ? 1.25 : 1.5, mirror: false, shadowEvery: 1, shadowSize: 1024, grass: 0.4, weather: 0.6, bloom: true, fps: 60 };
  return { pixelRatio: 1, mirror: false, shadowEvery: 2, shadowSize: 1024, grass: 0.25, weather: 0.3, bloom: false, fps: 30 };
}

/**
 * Auto quality's steps, cheapest to see first. Each applies on top of the last; a step that would
 * change nothing on this device (the mirror on a phone, 1.5× on a 1× screen) is skipped.
 */
export const LADDER: Partial<Knobs>[] = [
  // Fewer pixels on dense screens: hard to see, and the biggest saving there is.
  { pixelRatio: 1.5 },
  // The sea reflects the sky alone: one whole scene pass less.
  { mirror: false },
  { shadowEvery: 2, shadowSize: 1024, grass: 0.6, weather: 0.6 },
  { pixelRatio: 1.25 },
  { bloom: false, pixelRatio: 1 },
  // Lightest: an even 30 fps rather than an uneven 35–45.
  { grass: 0.3, weather: 0.3, fps: 30 },
];

/** Apply a ladder step: it only ever takes away (a Light start never steps "down" to more pixels). */
export function lighten(k: Knobs, step: Partial<Knobs>): Knobs {
  return {
    pixelRatio: Math.min(k.pixelRatio, step.pixelRatio ?? Infinity),
    mirror: k.mirror && (step.mirror ?? true),
    shadowEvery: Math.max(k.shadowEvery, step.shadowEvery ?? 1),
    shadowSize: Math.min(k.shadowSize, step.shadowSize ?? Infinity),
    grass: Math.min(k.grass, step.grass ?? Infinity),
    weather: Math.min(k.weather, step.weather ?? Infinity),
    bloom: k.bloom && (step.bloom ?? true),
    fps: Math.min(k.fps, step.fps ?? 60) as 60 | 30,
  };
}

/** What a set of knobs looks like as a quality level (for Options). */
export function levelOf(k: Knobs, built: Tier, hasMirror: boolean): Tier {
  if (!k.bloom || k.fps === 30) return 1;
  if ((hasMirror && !k.mirror) || k.shadowEvery > 1) return Math.min(2, built) as Tier;
  return built;
}

/**
 * Watches the frame rate in 3-second windows. Two slow windows in a row (under 75% of the cap)
 * ask for one lighter step; a window under half the cap asks at once, and under a third for two
 * steps, so a device that is far behind gets there in seconds. Windows are held off while
 * something expected is slow: the first seconds, background shader builds, after a pause, a step
 * or a long jump across the sea.
 */
export class FrameWatch {
  private start = 0;
  private frames = 0;
  private slow = 0;
  private holdUntil = 0;

  private readonly windowMs: number;

  constructor(windowMs = 3000) {
    this.windowMs = windowMs;
  }

  hold(now: number, ms: number) {
    this.holdUntil = Math.max(this.holdUntil, now + ms);
    this.start = 0;
    this.slow = 0;
  }

  /** Count a rendered frame. Returns how many steps lighter the device needs (usually 0). */
  frame(now: number, capFps: number): number {
    if (now < this.holdUntil) return 0;
    if (!this.start) {
      this.start = now;
      this.frames = 0;
      return 0;
    }
    this.frames++;
    const elapsed = now - this.start;
    if (elapsed < this.windowMs) return 0;
    const ratio = (this.frames * 1000) / elapsed / capFps;
    this.start = now;
    this.frames = 0;
    if (ratio < 0.5) {
      this.slow = 0;
      return ratio < 0.34 ? 2 : 1;
    }
    this.slow = ratio < 0.75 ? this.slow + 1 : 0;
    if (this.slow < 2) return 0;
    this.slow = 0;
    return 1;
  }
}

type NavigatorHints = Navigator & { deviceMemory?: number };

/**
 * Phones and small-memory devices get phone-scale assets (512 px colour, 256 px detail maps) and
 * render at most 1.5×: touch-first screens, 4 GB or less, or no WebGPU.
 */
export function isLiteDevice(backend: "webgpu" | "webgl2"): boolean {
  const nav = navigator as NavigatorHints;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || (nav.deviceMemory ?? 8) <= 4 || backend === "webgl2";
}
