// What the Depth home's preloader reads: real progress from the scene, not a timer. The journey plans
// the downloads (their real sizes, phone or desktop), the scene reports bytes as they arrive and the
// build steps as they finish, and the preloader turns that into its number. The other way round, the
// preloader tells the scene when it has lifted, so the X's hello isn't spent behind it.

/** Each download, in KB as served (public/…). */
const SIZES = {
  desktop: { engine: 180, draco: 270, astronaut: 2778, x: 226, weave: 29, visor: 384, "earth-day": 703, "earth-extra": 302 },
  phone: { engine: 180, draco: 270, astronaut: 1286, x: 226, weave: 29, visor: 384, "earth-day": 221, "earth-extra": 302 },
};
export type LoadKey = keyof typeof SIZES.desktop;
/** The build after the downloads: the corridor compiled, the astronaut compiled, Earth up, a first frame drawn. */
export type LoadStep = "scene" | "astro" | "earth" | "frame";
const STEPS: LoadStep[] = ["scene", "astro", "earth", "frame"];

/** What the scene is given to report into (scene.ts and its loaders only see this). */
export type LoadReport = {
  bytes: (key: LoadKey, loaded: number, total: number) => void;
  got: (key: LoadKey) => void;
  step: (step: LoadStep) => void;
  fail: () => void;
};

export type LoadState = {
  /** Downloads, 0…1, by bytes. */
  download: number;
  /** Build steps done, 0…1. */
  build: number;
  done: boolean;
  failed: boolean;
  /** What is loading now, for the status line ("The astronaut", "First frame"…), and its sizes in KB. */
  now: { key: LoadKey | LoadStep; loaded: number; total: number } | null;
};

let sizes: Record<LoadKey, number> = SIZES.desktop;
const fraction = new Map<LoadKey, number>();
/** When each download last moved: the status line names what is arriving, not what is waiting. */
const moved = new Map<LoadKey, number>();
const steps = new Set<LoadStep>();
let failed = false;
let isLifted = false;
let onHello: (() => void) | null = null;
let findX: (() => number[] | null) | null = null;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const loadBus = {
  /** The journey, as it boots: which model sizes this visitor downloads. */
  plan(small: boolean) {
    sizes = small ? SIZES.phone : SIZES.desktop;
  },
  report: {
    bytes(key, loaded, total) {
      // Content-Length may be missing or (compressed) smaller than what arrives: fall back to the size.
      const f = total > 0 ? loaded / total : loaded / (sizes[key] * 1024);
      fraction.set(key, Math.max(fraction.get(key) ?? 0, clamp01(f)));
      moved.set(key, performance.now());
    },
    got(key) {
      fraction.set(key, 1);
    },
    step(step) {
      steps.add(step);
    },
    fail() {
      failed = true;
    },
  } satisfies LoadReport as LoadReport,

  state(): LoadState {
    let all = 0;
    let have = 0;
    let now: LoadState["now"] = null;
    let latest = -1;
    for (const key of Object.keys(sizes) as LoadKey[]) {
      const kb = sizes[key];
      const f = fraction.get(key) ?? 0;
      all += kb;
      have += kb * f;
      // The status line names what arrived last (else the biggest thing still to come).
      const at = moved.get(key) ?? 0;
      if (f < 1 && (at > latest || (at === latest && (!now || kb > now.total)))) {
        latest = at;
        now = { key, loaded: kb * f, total: kb };
      }
    }
    const build = STEPS.filter((s) => steps.has(s)).length / STEPS.length;
    if (!now) {
      const next = STEPS.find((s) => !steps.has(s));
      if (next) now = { key: next, loaded: 0, total: 0 };
    }
    return { download: all ? have / all : 0, build, done: build === 1 && have >= all, failed, now };
  },

  /** The scene's side: what to do when the preloader has lifted, and where the X is on screen. */
  connect(hooks: { hello: () => void; findX: () => number[] | null }) {
    onHello = hooks.hello;
    findX = hooks.findX;
    // Lifted already (it never waits longer than its limit): nothing to hold for.
    if (isLifted) hooks.hello();
  },
  disconnect() {
    onHello = null;
    findX = null;
  },
  /** The preloader's side: it has lifted (the X may wave now). */
  lifted() {
    isLifted = true;
    onHello?.();
  },
  /** The 3D X's box on screen (left, top, right, bottom, CSS px), if the scene is drawing it. */
  locateX(): number[] | null {
    return findX?.() ?? null;
  },
};
