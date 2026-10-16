"use client";

import { useEffect, useRef, useState } from "react";
import type { HurdleDemo } from "@/content/types";

type Shift = Extract<HurdleDemo, { kind: "shift" }>;

const DURATION = 1600;

/** Animates from the before value to the after value when scrolled into view. Replayable. */
export function ShiftMeter({ demo, max }: { demo: Shift; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [runs, setRuns] = useState(0);
  const ceiling = max ?? Math.max(demo.before, demo.after) * 1.08;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const play = () => {
      if (reduced) {
        setT(1);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / DURATION);
        setT(1 - (1 - p) ** 3);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setT(0);
      raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    if (runs === 0) observer.observe(el);
    else play();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [runs]);

  const value = demo.before + (demo.after - demo.before) * t;
  const decimals = demo.decimals ?? (Number.isInteger(demo.before) && Number.isInteger(demo.after) ? 0 : 1);
  const unit = demo.unit ? ` ${demo.unit}` : "";

  return (
    <div ref={ref} className="mx-auto w-full max-w-xl rounded-2xl border border-(--c-line) p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="label">{demo.label}</p>
        <button type="button" onClick={() => setRuns((r) => r + 1)} className="hit text-xs text-(--c-muted) underline-offset-4 hover:underline">
          Replay
        </button>
      </div>
      {/* Lining figures: old-style ones turn "0.6" into "o.6" and "311" into "3II" in some client faces. */}
      <p className="mt-4 font-(family-name:--c-display) text-6xl lining-nums tabular-nums md:text-7xl" aria-hidden>
        {value.toFixed(decimals)}
        <span className="text-2xl text-(--c-muted)">{unit}</span>
      </p>
      <p className="sr-only">
        {demo.label}: from {demo.before}
        {unit} to {demo.after}
        {unit}.
      </p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-(--c-line)" aria-hidden>
        <div className="h-full rounded-full bg-(--c-accent)" style={{ width: `${(value / ceiling) * 100}%` }} />
      </div>
      <div className="mt-3 flex justify-between font-mono text-xs text-(--c-muted)" aria-hidden>
        <span>
          Before · {demo.before}
          {unit}
        </span>
        <span>
          After · {demo.after}
          {unit} {demo.better === "lower" ? "↓" : "↑"}
        </span>
      </div>
    </div>
  );
}
