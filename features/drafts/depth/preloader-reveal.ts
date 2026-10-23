// The preloader's way out (preloader.tsx), from the red sheet with the wordmark filled to 100%: the X
// in NEXT becomes a window onto the live hero, and grows as it travels to the 3D X on the astronaut's
// shoulder, until the red is gone. The logo opens the site onto the mascot, which then waves. Only
// the hole's path, transforms and opacity move; it says when the hero's copy may start arriving
// (begin) and when it is done (arrive: the X's hello).

import { loadBus } from "./loader-bus";
import { X_GLYPH } from "./x-glyph";

export type Cues = { begin: () => void; arrive: () => void };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** The letters' exit: slow to leave, then gone. */
const AWAY = "cubic-bezier(0.7, 0, 0.84, 0)";

/** Runs step(t) for t 0 → 1 over ms, one call per frame. */
function tween(ms: number, step: (t: number) => void) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      step(t);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

function fade(els: Element[], ms: number) {
  for (const e of els) e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "ease-out", fill: "forwards" });
}

async function windowX(el: HTMLElement, face: HTMLElement, cues: Cues) {
  const glyph = face.querySelector<SVGSVGElement>(".dp-loader__layer--fill .dp-loader__x");
  const hole = el.querySelector<SVGPathElement>("[data-hole]");
  const letters = Array.from(face.querySelectorAll<HTMLElement>(".dp-loader__layer--fill > *"));
  if (!glyph || !hole || !letters.length) throw new Error("preloader: no wordmark");

  // The hole is cut exactly where the X is drawn. Its crossing travels to the 3D X (the middle of the
  // screen without one) while it grows, until the crossing alone (r, the biggest circle inside it)
  // is wider than the farthest corner of the screen from there.
  const r = glyph.getBoundingClientRect();
  const k = r.height / X_GLYPH.height;
  const ox = r.left + X_GLYPH.cx * k;
  const oy = r.top + X_GLYPH.cy * k;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const box = loadBus.locateX();
  const found = !!box && box.every(Number.isFinite) && box[2] > box[0];
  const tx = found && box ? (box[0] + box[2]) / 2 : W / 2;
  const ty = found && box ? (box[1] + box[3]) / 2 : H / 2;
  const far = Math.max(Math.hypot(tx, ty), Math.hypot(W - tx, ty), Math.hypot(tx, H - ty), Math.hypot(W - tx, H - ty));
  const lnS = Math.log((far / (X_GLYPH.r * k)) * 1.1);
  const place = (s: number, deg: number, m: number) =>
    hole.setAttribute(
      "transform",
      `translate(${ox + (tx - ox) * m} ${oy + (ty - oy) * m}) rotate(${deg}) scale(${k * s}) translate(${-X_GLYPH.cx} ${-X_GLYPH.cy})`,
    );
  place(1, 0, 0);

  // From now on the X is a window, not a letter.
  el.dataset.stage = "hole";
  fade(Array.from(face.querySelectorAll(".dp-loader__layer--line")), 160);
  fade(Array.from(face.querySelectorAll("[data-fade]")), 300);
  const xi = letters.indexOf(glyph as unknown as HTMLElement);
  letters.forEach((ch, i) => {
    if (i === xi) return;
    ch.animate(
      [
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
        { opacity: 0, transform: `translate3d(${(i - xi) * 0.05}em, ${i % 2 ? 0.45 : -0.45}em, 0)` },
      ],
      { duration: 520, delay: 60 + Math.abs(i - xi) * 30, easing: AWAY, fill: "forwards" },
    );
  });

  let begun = false;
  await tween(1750, (t) => {
    // A breath first (the window reads as an X), then a zoom that keeps speeding up: even steps in
    // log scale feel like a steady push forward.
    const g = 0.92 * t ** 3 + 0.08 * Math.sin((t * Math.PI) / 2);
    place(Math.exp(lnS * g), -9 * easeInOut(t), easeInOut(span(t, 0.12, 0.78)));
    if (!begun && t > 0.32) {
      begun = true;
      cues.begin();
    }
  });
  cues.arrive();
}

export function reveal(el: HTMLElement, face: HTMLElement, cues: Cues): Promise<void> {
  // A reveal that can't run (a missing part) still lifts the loader.
  return windowX(el, face, cues).catch(() => {
    cues.begin();
    cues.arrive();
  });
}
