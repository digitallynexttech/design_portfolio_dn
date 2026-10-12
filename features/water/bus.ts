// A tiny channel so DOM features (hero beats, Liquid surfaces, transitions) can disturb the water
// without importing three.js. Coordinates are normalised viewport units: x 0→1 left→right, y 0→1 top→bottom.

export type Drop = { x: number; y: number; strength: number; radius: number };
export type Edge = "left" | "right" | "top" | "bottom";

type Listener = (drop: Drop) => void;

const listeners = new Set<Listener>();

export function onDrop(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitDrop(x: number, y: number, strength = 0.6, radius = 0.06): void {
  for (const listener of listeners) listener({ x, y, strength, radius });
}

// Whatever hides the water entirely pauses it to save the GPU: a case study's own background
// ("study"), the 3D world, a full-size Liquid surface, the hero poster. Each names its reason, and the
// water only runs while no reason is set, so one cover lifting never uncovers another.
type VisibilityListener = (visible: boolean) => void;
const visibilityListeners = new Set<VisibilityListener>();
const coverReasons = new Set<string>();
let waterVisible = true;

export function setWaterCovered(reason: string, covered: boolean): void {
  if (covered) coverReasons.add(reason);
  else coverReasons.delete(reason);
  const visible = coverReasons.size === 0;
  if (visible === waterVisible) return;
  waterVisible = visible;
  for (const listener of visibilityListeners) listener(visible);
}

/** The older on/off switch, kept for callers that have not named a reason yet. */
export function setWaterVisible(visible: boolean): void {
  setWaterCovered("unnamed", !visible);
}

/** Called now with the current state, then on every change. */
export function onWaterVisibility(listener: VisibilityListener): () => void {
  visibilityListeners.add(listener);
  listener(waterVisible);
  return () => visibilityListeners.delete(listener);
}

/** A wave entering from one edge, e.g. where a Liquid surface flows in. */
export function emitEdgeWave(edge: Edge, strength = 0.5): void {
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const inset = 0.02;
    if (edge === "left") emitDrop(inset, t, strength, 0.08);
    else if (edge === "right") emitDrop(1 - inset, t, strength, 0.08);
    else if (edge === "top") emitDrop(t, inset, strength, 0.08);
    else emitDrop(t, 1 - inset, strength, 0.08);
  }
}
