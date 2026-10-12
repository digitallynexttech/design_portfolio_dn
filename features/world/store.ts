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
  /** Frames rendered per second over the last second, and the average CPU time per frame (ms). */
  stats(): { fps: number; cpuMs: number; calls: number; triangles: number };
  dispose(): void;
}

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
    state = { ...initial, sound: state.sound, quality: state.quality, pick: state.pick, live: state.live };
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

// Persisted per device: the visitor's sound, quality and weather choices.
// v2: quality now defaults to Full; earlier saves (made when it defaulted to Auto) are dropped.
const PREFS_KEY = "dn-world-prefs-v2";

export function loadPrefs(): Partial<Pick<WorldView, "quality" | "pick">> {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Pick<WorldView, "quality" | "pick">>;
    return { quality: parsed.quality ?? 3, pick: { ...LIVE_PICK, ...parsed.pick } };
  } catch {
    return {};
  }
}

export function savePrefs() {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ quality: state.quality, pick: state.pick }));
  } catch {
    // Private windows can refuse storage; the world works without it.
  }
}
