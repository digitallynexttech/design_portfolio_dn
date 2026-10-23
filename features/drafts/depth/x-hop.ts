import * as THREE from "three";
import { X_SCALE, type Astronaut } from "./astronaut";
import { X_GLYPH } from "./x-glyph";

// The X's last two jumps (Karan, 23 Oct 2026). When the astronaut arrives at the contact section, the
// X leaps off its shoulder and lands standing on "Join the studio" ([data-x-perch]: where it stands,
// as tall as it is). It rides there as the page goes on; if the button leaves the top of the screen
// first (phones), it steps off and floats down beside the page. When the footer's DIGITALLY NEXT has
// filled up to the gap where its X belongs ([data-x-slot]), it jumps one last time, turning, tucks
// its arms in and lands exactly on the letter's place; the page swaps in the flat letter
// (data-x-home on the draft) and the 3D X goes. Every move is a played jump, not tied to the
// scrollbar, and every one runs backwards when you scroll back up. The jumps go round the words, by
// the right-hand edge of the screen: across to it, up or down it, and in along the row it lands on
// (on a phone, where the words fill the width, it can only pass in front of them). Into its letter it
// comes from straight above, so it never crosses the T beside it.

type Mode = "shoulder" | "perch" | "home";
type Pose = { p: THREE.Vector3; q: THREE.Quaternion; s: number; sit: number; tuck: number };
type Rect = { x: number; y: number; w: number; h: number };

export type XHopFrame = {
  t: number;
  scrollY: number;
  /** How far the astronaut has come to rest at the contact section, 0…1. */
  arrive: number;
  W: number;
  H: number;
  tanHalf: number;
  /** As high as the X's top may go, in CSS px (below the header). */
  clearTop: number;
};

export type XHop = {
  layout: () => void;
  update: (f: XHopFrame) => void;
  /** How far it sits (1 on the shoulder) and how far its arms are tucked, for the astronaut's frame. */
  sit: () => number;
  tuck: () => number;
  /** Mid-jump or floating: the loop should run at full rate. */
  animating: () => boolean;
  /** Where the X is while it is off the shoulder (world), for the astronaut to watch it; else null. */
  free: () => THREE.Vector3 | null;
  /** How far it has left the astronaut's light for its own, 0…1 (it takes off in the one, lands in the other). */
  lit: () => number;
  dispose: () => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Where the model's x = 0 (the crossing) falls across the flat letter: the two are one shape. */
const ORIGIN_X = X_GLYPH.cx / X_GLYPH.width;
/** Seconds per jump. */
const DUR: Record<Mode, number> = { shoulder: 1.0, perch: 1.05, home: 1.25 };

/** An element's box in the document, from offsets (ignores transforms, as the scene's slots do). */
function docRect(el: HTMLElement): Rect {
  let x = 0;
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function createXHop(o: {
  astro: Astronaut;
  /** The scene the X joins when it leaves the shoulder. */
  world: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  /** How far ahead of the camera it moves (world units): the astronaut's own distance. */
  depth: number;
  perch: HTMLElement;
  slot: Element;
  mark: HTMLElement;
  onHome: (on: boolean) => void;
}): XHop {
  const { astro, camera } = o;
  const seat = astro.x.seat;
  let perch: Rect = { x: 0, y: 0, w: 0, h: 0 };
  let slot: Rect = { x: 0, y: 0, w: 0, h: 0 };
  let mark: Rect = { x: 0, y: 0, w: 0, h: 0 };
  let mode: Mode = "shoulder";
  let isFree = false;
  let home = false;
  let floating = false;
  let flight: { from: Pose; t0: number; dur: number; spin: number } | null = null;
  let sitW = 1;
  let tuckW = 0;
  let litW = 0;

  const ray = new THREE.Vector3();
  const c1 = new THREE.Vector3();
  const c2 = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const up = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const spinQ = new THREE.Quaternion();
  const Y = new THREE.Vector3(0, 1, 0);
  const pose = (): Pose => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), s: 1, sit: 0, tuck: 0 });
  const target = pose();
  const now = pose();

  /** A point on the screen (CSS px), o.depth ahead of the camera. */
  const toWorld = (sx: number, sy: number, f: XHopFrame, out: THREE.Vector3) => {
    ray.set((sx / f.W) * 2 - 1, 1 - (sy / f.H) * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    camera.getWorldDirection(fwd);
    return out.copy(camera.position).addScaledVector(ray, o.depth / ray.dot(fwd));
  };
  /** The seat's scale for an X this many CSS px tall (the model is 1 tall at X_SCALE). */
  const scaleFor = (px: number, f: XHopFrame) => ((px / f.H) * 2 * o.depth * f.tanHalf) / X_SCALE;

  const anchor = (m: Mode, f: XHopFrame, out: Pose) => {
    if (m === "shoulder") {
      astro.x.mark.updateWorldMatrix(true, false);
      astro.x.mark.matrixWorld.decompose(out.p, out.q, sc);
      out.s = sc.x;
      out.sit = 1;
      out.tuck = 0;
      floating = false;
      return out;
    }
    out.q.copy(camera.quaternion);
    out.sit = 0;
    if (m === "home") {
      // feet on the letter's baseline, its crossing over the letter's
      toWorld(slot.x + slot.w * ORIGIN_X, slot.y + slot.h - f.scrollY, f, out.p);
      out.s = scaleFor(slot.h, f);
      out.tuck = 1;
      floating = false;
      return out;
    }
    // On the button, feet on its top edge; or, once the button has carried it near the top of the
    // screen, floating there, drifting over toward where the letter will be.
    const bottom = perch.y + perch.h - f.scrollY;
    const line = f.clearTop + perch.h + 8;
    const w = smoothstep(0, perch.h * 1.5, line - bottom);
    floating = w > 0;
    const x = perch.x + perch.w / 2 + (slot.x + slot.w * ORIGIN_X - (perch.x + perch.w / 2)) * w;
    const y = Math.max(bottom, line) + Math.sin(f.t * 1.7) * perch.h * 0.06 * w;
    toWorld(x, y, f, out.p);
    out.s = scaleFor(perch.h, f);
    out.tuck = 0;
    return out;
  };

  const place = (p: Pose) => {
    seat.position.copy(p.p);
    seat.quaternion.copy(p.q);
    seat.scale.setScalar(p.s);
  };

  return {
    layout() {
      perch = docRect(o.perch);
      mark = docRect(o.mark);
      // the letter is an <svg>, which has no offsets; the sign-off has no transforms to undo
      const r = o.slot.getBoundingClientRect();
      slot = { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    },

    update(f) {
      const ready = perch.h > 0 && slot.h > 0 && mark.h > 0;
      const pTop = perch.y - f.scrollY;
      const pBottom = pTop + perch.h;
      // How far DIGITALLY NEXT has filled (its scroll timeline: entry 0…100%), and where its X is.
      const fill = ready ? clamp01((f.H - (mark.y - f.scrollY)) / mark.h) : 0;
      const at = ready ? (slot.x - mark.x) / mark.w : 1;

      let want: Mode;
      if (!ready || f.arrive < 0.5 || pTop > f.H + 10) want = "shoulder";
      else if (fill >= at - (mode === "home" ? 0.24 : 0.12)) want = "home";
      else if (mode !== "shoulder" || (f.arrive > 0.9 && pBottom < f.H * 0.92 && pTop > f.clearTop)) want = "perch";
      else want = "shoulder";

      if (want !== mode) {
        // Take off from wherever it is now.
        const from = pose();
        if (isFree) {
          from.p.copy(seat.position);
          from.q.copy(seat.quaternion);
          from.s = seat.scale.x;
        } else {
          anchor("shoulder", f, from);
          astro.x.setFree(true, o.world);
          isFree = true;
        }
        from.sit = sitW;
        from.tuck = tuckW;
        if (home) {
          home = false;
          o.onHome(false);
          seat.visible = true;
        }
        flight = { from, t0: f.t, dur: DUR[want], spin: want === "home" ? 1 : mode === "home" ? -1 : 0 };
        mode = want;
        astro.react("Jump");
      }

      anchor(mode, f, target);
      if (!flight) {
        sitW = target.sit;
        tuckW = target.tuck;
        litW = mode === "shoulder" ? 0 : 1;
        if (isFree) place(target);
        return;
      }

      const u = clamp01((f.t - flight.t0) / flight.dur);
      const e = easeInOut(u);
      const a = flight.from;
      // By the right-hand edge: a curve through two points out at the edge, level with where it
      // takes off and with where it lands (the words are left of that edge, the astronaut and the
      // footer's X near it). Plus a small hop, never above the header line.
      up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      const pxPerUnit = f.H / (2 * o.depth * f.tanHalf);
      const wide = Math.max(a.s, target.s) * X_SCALE * pxPerUnit * 0.95;
      const sa = ray.copy(a.p).project(camera);
      const ax = ((sa.x + 1) / 2) * f.W;
      const ay = ((1 - sa.y) / 2) * f.H;
      const st = ray.copy(target.p).project(camera);
      const tx = ((st.x + 1) / 2) * f.W;
      const ty = ((1 - st.y) / 2) * f.H;
      if (mode === "home") {
        toWorld(tx, ay, f, c1);
        toWorld(tx, ay + (ty - ay) * 0.35, f, c2);
      } else {
        const edge = Math.max(ax, tx, f.W - 0.2 * wide);
        toWorld(edge, ay, f, c1);
        toWorld(edge, ty, f, c2);
      }
      const v = 1 - e;
      now.p
        .copy(a.p)
        .multiplyScalar(v * v * v)
        .addScaledVector(c1, 3 * v * v * e)
        .addScaledVector(c2, 3 * v * e * e)
        .addScaledVector(target.p, e * e * e);
      // (onto the button the clip's own hop is lift enough: more would reach the line above)
      const tall = Math.max(a.s, target.s) * X_SCALE;
      if (mode !== "perch") now.p.addScaledVector(up, tall * 0.3 * Math.sin(Math.PI * u));
      const s = a.s + (target.s - a.s) * e;
      ray.copy(now.p).project(camera);
      const over = f.clearTop - (((1 - ray.y) / 2) * f.H - s * X_SCALE * pxPerUnit);
      if (over > 0) now.p.addScaledVector(up, -over / pxPerUnit);
      now.q.slerpQuaternions(a.q, target.q, e);
      // into the letter (and back out of it) with a full turn
      if (flight.spin) now.q.multiply(spinQ.setFromAxisAngle(Y, flight.spin * Math.PI * 2 * e));
      now.s = s;
      sitW = a.sit + (target.sit - a.sit) * smoothstep(0, 1, u);
      litW = mode === "shoulder" ? Math.min(litW, 1 - e) : Math.max(litW, e);
      tuckW = a.tuck + (target.tuck - a.tuck) * (target.tuck > a.tuck ? smoothstep(0.5, 0.95, u) : smoothstep(0, 0.4, u));
      place(now);

      if (u >= 1) {
        flight = null;
        if (mode === "shoulder") {
          astro.x.setFree(false, o.world);
          isFree = false;
        } else if (mode === "home") {
          // the page's flat letter takes its place, the same frame
          home = true;
          o.onHome(true);
          seat.visible = false;
        } else astro.react("Wave");
      }
    },

    sit: () => sitW,
    lit: () => litW,
    tuck: () => tuckW,
    animating: () => Boolean(flight) || (floating && mode === "perch"),
    free: () => (isFree && seat.visible ? seat.position : null),

    dispose() {
      if (home) o.onHome(false);
      seat.visible = true;
      if (isFree) astro.x.setFree(false, o.world);
    },
  };
}
