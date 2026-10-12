// Interactive points: docks and floating things the boat can stop at. The nearest one in reach
// becomes the prompt ("Enter · Explore SKELMET"); activating it opens a liquid panel or runs an
// action (the weather buoys). The prompt follows its point on screen without React re-rendering.
import * as THREE from "three/webgpu";
import type { WorldData } from "../data";
import type { PointKind } from "../layout";
import { world, type Near } from "../store";
import type { Body } from "./physics";

export type Point = {
  id: string;
  kind: PointKind;
  ref: string;
  label: string;
  verb: string;
  x: number;
  z: number;
  /** Height of the prompt anchor above the water. */
  y: number;
  reach: number;
  /** Where fast travel parks the boat. */
  berth: { x: number; z: number; heading: number };
  /** Camera leans toward this point while the boat is in reach. */
  focus: THREE.Vector3;
  /** Runs instead of opening a panel. */
  action?: () => void;
  /** Shown in the map and logbook lists (docks only). */
  listed?: boolean;
};

export type Interactions = ReturnType<typeof createInteractions>;

export function createInteractions(_data: WorldData, _camera: THREE.Camera) {
  const points: Point[] = [];
  let near: Point | null = null;
  let prompt: HTMLElement | null = null;
  const v = new THREE.Vector3();
  let onApproach: ((p: Point) => void) | null = null;

  return {
    points,
    add(point: Point) {
      points.push(point);
      return point;
    },
    onApproach(fn: (p: Point) => void) {
      onApproach = fn;
    },
    setPromptElement(element: HTMLElement | null) {
      prompt = element;
    },
    /** Pick the nearest point in reach. Docks win ties over floating things. */
    update(boat: Body, _dt: number): Point | null {
      let best: Point | null = null;
      let bestD = Infinity;
      for (const p of points) {
        const d = Math.hypot(boat.x - p.x, boat.z - p.z);
        // Hysteresis: the current point stays selected a little beyond its reach.
        const reach = p === near ? p.reach * 1.25 : p.reach;
        if (d < reach && d < bestD) {
          best = p;
          bestD = d;
        }
      }
      if (best !== near) {
        near = best;
        const next: Near | null = best ? { id: best.id, kind: best.kind, ref: best.ref, label: best.label, verb: best.verb } : null;
        world.set({ near: next });
        if (best) onApproach?.(best);
      }
      return near;
    },
    activate() {
      if (!near) return;
      if (near.action) near.action();
      else world.set({ panel: { kind: near.kind, ref: near.ref } });
    },
    /** Move the prompt element over its point. */
    place(camera: THREE.Camera, canvas: HTMLCanvasElement) {
      if (!prompt) return;
      if (!near) {
        prompt.style.opacity = "0";
        return;
      }
      v.set(near.x, near.y, near.z).project(camera);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const x = Math.min(w - 120, Math.max(120, (v.x * 0.5 + 0.5) * w));
      const y = Math.min(h - 140, Math.max(90, (-v.y * 0.5 + 0.5) * h));
      prompt.style.opacity = "1";
      prompt.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    },
    berthFor(id: string): { x: number; z: number; heading: number } | null {
      const p = points.find((point) => point.id === id || point.ref === id);
      return p ? p.berth : null;
    },
  };
}
