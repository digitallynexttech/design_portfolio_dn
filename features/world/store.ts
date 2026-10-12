// The bridge between the engine (three.js, no React) and the interface (React, no three.js).
// The engine writes coarse state here; per-frame values (the prompt's screen position) go straight
// to DOM nodes the interface registers, so React never re-renders at 60 fps.
import { useSyncExternalStore } from "react";
import type { WorldData } from "./data";
import type { PointKind } from "./layout";
import { LIVE_PICK, type DayPhase, type LiveWeather, type Season, type WeatherPick, type WeatherState } from "./weather-logic";
export type Near = { id: string; kind: PointKind; ref: string; label: string; verb: string };
export type Panel = { kind: PointKind; ref: string };
export type Overlay = "map" | "logbook" | "options" | null;
export type Quality = "auto" | 1 | 2 | 3;

export type Showing = { weather: WeatherState; season: Season; phase: DayPhase; hour: number };

export type WorldView = {
  status: "closed" | "loading" | "running" | "error";
  /** The world is open and on screen (home page, #sail). */
  visible: boolean;
  progress: number;
  message: string;
  error: string | null;
  near: Near | null;
  panel: Panel | null;
  overlay: Overlay;
  sound: boolean;
  quality: Quality;
  /**
   * The visitor picked the quality in Options. Until then the world starts on Full and lightens
   * itself if the device can't hold it; an explicit pick is kept as is (Auto keeps adapting).
   */
  chosen: boolean;
  /** The quality level actually rendering now (it drops below `quality` when the world lightens itself). */
  tier: 1 | 2 | 3;
  backend: "webgpu" | "webgl2" | null;
  pick: WeatherPick;
  live: LiveWeather | null;
  showing: Showing;
  /** The visitor has moved the boat (control hints fade out). */
  sailed: boolean;
  toast: string | null;
};

export interface EngineHandle {
  setPaused(paused: boolean): void;
  setSound(on: boolean): void;
  setQuality(quality: Quality): void;
  setPick(pick: WeatherPick): void;
  setLive(live: LiveWeather): void;
  travelTo(id: string): void;
  interact(): void;
  /** Screen-relative steering from the touch joystick or a gamepad: x right, y up, length ≤ 1. */
  setStick(x: number, y: number, active: boolean): void;
  setButton(name: "boost" | "hop", down: boolean): void;
  setPromptElement(element: HTMLElement | null): void;
  boat(): { x: number; z: number; heading: number };
  zoom(delta: number): void;
  horn(): void;
  resize(): void;
  /**
   * Frames rendered per second over the last second, the average CPU time per frame (ms), and how
   * far the world has lightened itself (`level`, 0 = as built; `lite` = phone-scale assets).
   */
  stats(): EngineStats;
  dispose(): void;
}

export type EngineStats = { fps: number; cpuMs: number; calls: number; triangles: number; tier: 1 | 2 | 3; level: number; lite: boolean; pixelRatio: number; frames: number };

const initial: WorldView = {
  status: "closed",
  visible: false,
  progress: 0,
  message: "",
  error: null,
  near: null,
  panel: null,
  overlay: null,
  sound: false,
  // Full quality unless the visitor picks otherwise in Options.
  quality: 3,
  chosen: false,
  tier: 2,
  backend: null,
  pick: LIVE_PICK,
  live: null,
  showing: { weather: "clear", season: "summer", phase: "day", hour: 13 },
  sailed: false,
  toast: null,
};

let state: WorldView = initial;
let data: WorldData | null = null;
let engine: EngineHandle | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const world = {
  get: () => state,
  set(patch: Partial<WorldView>) {
    let changed = false;
    for (const key of Object.keys(patch) as (keyof WorldView)[]) {
      if (state[key] !== patch[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  data: () => data,
  setData(next: WorldData) {
    if (data === next) return;
    data = next;
    emit();
  },
  engine: () => engine,
  setEngine(next: EngineHandle | null) {
    engine = next;
  },
  reset() {
    state = { ...initial, sound: state.sound, quality: state.quality, chosen: state.chosen, pick: state.pick, live: state.live };
    emit();
  },
};

export function useWorld<T>(select: (view: WorldView) => T): T {
  return useSyncExternalStore(
    world.subscribe,
    () => select(state),
    () => select(initial),
  );
}

export function useWorldData(): WorldData | null {
  return useSyncExternalStore(world.subscribe, () => data, () => null);
}

// Persisted per device: the visitor's quality and weather choices.
// v3 records whether the quality was picked in Options (`chosen`). v2 saved the quality whenever
// any option changed, so its default (Full) can't be told from a pick; anything else in a v2 save
// was picked, since Full was the only default it ever wrote. v2 is migrated once, then removed.
const PREFS_KEY = "dn-world-prefs-v3";
const PREFS_V2 = "dn-world-prefs-v2";

type Prefs = Partial<Pick<WorldView, "quality" | "chosen" | "pick">>;

function validQuality(q: unknown): Quality | null {
  return q === "auto" || q === 1 || q === 2 || q === 3 ? q : null;
}

export function loadPrefs(): Prefs {
  try {
    const store = window.localStorage;
    let raw = store.getItem(PREFS_KEY);
    let migrated = false;
    if (!raw) {
      raw = store.getItem(PREFS_V2);
      if (!raw) return {};
      migrated = true;
    }
    const parsed = JSON.parse(raw) as { quality?: unknown; chosen?: unknown; pick?: Partial<WeatherPick> };
    const quality = validQuality(parsed.quality) ?? 3;
    const chosen = migrated ? quality !== 3 : parsed.chosen === true;
    const prefs: Prefs = { quality: chosen ? quality : 3, chosen, pick: { ...LIVE_PICK, ...parsed.pick } };
    if (migrated) {
      store.setItem(PREFS_KEY, JSON.stringify(prefs));
      store.removeItem(PREFS_V2);
    }
    return prefs;
  } catch {
    return {};
  }
}

export function savePrefs() {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ quality: state.quality, chosen: state.chosen, pick: state.pick }));
  } catch {
    // Private windows can refuse storage; the world works without it.
  }
}
