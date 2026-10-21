"use client";

import { useEffect, useRef } from "react";

const NUM = /(\d+(?:\.\d+)?)/;
const DURATION = 1400;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);

type Run = {
  el: HTMLElement;
  parts: string[];
  /** For each part that is a number: where it starts, where it ends, and its decimals. */
  nums: Map<number, { from: number; to: number; dp: number }>;
  start: number;
};

/** "8.9 → 1 MB" reads as a change: the second figure runs down from the first. Single figures count up from zero. */
function plan(text: string): Omit<Run, "el" | "start"> {
  const parts = text.split(NUM);
  const idx = parts.map((p, i) => (i % 2 === 1 ? i : -1)).filter((i) => i >= 0);
  const nums = new Map<number, { from: number; to: number; dp: number }>();
  const arrow = text.includes("→") && idx.length === 2;
  const decimals = (s: string) => s.split(".")[1]?.length ?? 0;
  idx.forEach((i, k) => {
    if (arrow && k === 0) return;
    const to = parseFloat(parts[i]);
    const from = arrow ? parseFloat(parts[idx[0]]) : 0;
    // A run from 8.9 down to 1 keeps the start's decimals on the way; the true value is set at the end.
    const dp = Math.max(decimals(parts[i]), arrow ? decimals(parts[idx[0]]) : 0);
    nums.set(i, { from, to, dp });
  });
  return { parts, nums };
}

function render(run: Run, t: number): string {
  const e = ease(Math.min(1, Math.max(0, t)));
  return run.parts
    .map((part, i) => {
      const n = run.nums.get(i);
      if (!n) return part;
      return (n.from + (n.to - n.from) * e).toFixed(n.dp);
    })
    .join("");
}

/**
 * The page's counters (every .dx-count). The server renders final values, so the page reads right
 * with no script and under reduced motion. With motion on, each figure that is still below the
 * fold is set to its start and runs to its value when it is revealed; one rAF loop serves them
 * all and stops when the last one lands. Each figure's width is held, so nothing beside it moves.
 */
export function Counters() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>(".d-xray");
    if (!root || document.documentElement.dataset.motion === "off") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const runs: Run[] = [];
    let raf = 0;
    const pending = new Map<Element, Omit<Run, "el" | "start">>();

    const frame = (now: number) => {
      raf = 0;
      for (let i = runs.length - 1; i >= 0; i--) {
        const run = runs[i];
        const t = (now - run.start) / DURATION;
        run.el.textContent = t >= 1 ? (run.el.dataset.count ?? render(run, 1)) : render(run, t);
        if (t >= 1) {
          run.el.style.minWidth = "";
          runs.splice(i, 1);
        }
      }
      if (runs.length) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const p = pending.get(el);
          io.unobserve(el);
          if (!p) continue;
          pending.delete(el);
          runs.push({ el, ...p, start: performance.now() + 120 });
        }
        if (runs.length && !raf) raf = requestAnimationFrame(frame);
      },
      { threshold: 0.6 },
    );

    const vh = window.innerHeight;
    for (const el of root.querySelectorAll<HTMLElement>(".dx-count")) {
      const value = el.dataset.count ?? el.textContent ?? "";
      const p = plan(value);
      if (!p.nums.size) continue;
      // Already on screen: leave it be. Below the fold: hold its width, set it to its start.
      if (el.getBoundingClientRect().top < vh * 0.92) continue;
      el.style.minWidth = `${el.getBoundingClientRect().width}px`;
      el.textContent = render({ el, ...p, start: 0 }, 0);
      pending.set(el, p);
      io.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      // Leave every figure on its true value.
      for (const el of root.querySelectorAll<HTMLElement>(".dx-count")) {
        el.textContent = el.dataset.count ?? el.textContent;
        el.style.minWidth = "";
      }
    };
  }, []);

  return <span ref={ref} hidden />;
}
