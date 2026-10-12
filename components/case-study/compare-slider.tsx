"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { HurdleDemo } from "@/content/types";

type Compare = Extract<HurdleDemo, { kind: "compare" }>;

const SWEEP_MS = 2200;
const SWEEP_REACH = 28;

/**
 * Drag (or use arrow keys on) the divider to compare before and after. Sized so the whole frame fits
 * on screen; the first time it comes into view the divider sweeps once to show it moves (never with
 * reduced motion, and never once the visitor has touched it).
 */
export function CompareSlider({ demo }: { demo: Compare }) {
  const [value, setValue] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const id = useId();
  const ratio = demo.after.width / demo.after.height;
  // The frame never grows taller than 78% of the viewport, so on a landscape screen anything up to
  // 7:5 is held by height and drawn 78vh × ratio wide, well under the reading column.
  const sizes = ratio < 1.4 ? `(orientation: landscape) ${(78 * ratio).toFixed(1)}vh, 92vw` : "(min-width: 1216px) 1120px, 92vw";

  useEffect(() => {
    const el = frame.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const sweep = () => {
      const start = performance.now();
      const tick = (now: number) => {
        if (touched.current) return;
        const p = Math.min(1, (now - start) / SWEEP_MS);
        const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        setValue(50 + SWEEP_REACH * Math.sin(eased * Math.PI * 2));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        sweep();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const hold = () => {
    touched.current = true;
  };
  const shown = Math.round(value);

  return (
    <div className="mx-auto" style={{ width: `min(100%, calc(78svh * ${ratio.toFixed(4)}))` }}>
      <div
        ref={frame}
        className="group relative overflow-hidden rounded-xl ring-1 ring-(--c-line) ring-offset-(--c-bg) transition-shadow has-focus-visible:ring-2 has-focus-visible:ring-(--c-accent) has-focus-visible:ring-offset-4"
        style={{ aspectRatio: ratio }}
      >
        <Image src={demo.after.src} alt={demo.after.alt} fill sizes={sizes} className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <Image src={demo.before.src} alt={demo.before.alt} fill sizes={sizes} className="object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-(--c-accent)" style={{ left: `${value}%` }} aria-hidden>
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-(--c-accent) text-sm text-(--c-on-accent) shadow-lg shadow-black/30 transition-[scale] duration-300 group-hover:scale-110 group-has-focus-visible:scale-125">
            ⟷
          </span>
        </div>
        <label htmlFor={id} className="sr-only">
          Compare {demo.beforeLabel} and {demo.afterLabel}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={shown}
          aria-valuetext={`${shown}% ${demo.beforeLabel}, ${100 - shown}% ${demo.afterLabel}`}
          onPointerDown={hold}
          onKeyDown={hold}
          onChange={(event) => {
            hold();
            setValue(Number(event.target.value));
          }}
          className="compare-range absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <div aria-hidden className="mt-3 flex justify-between gap-4 font-mono text-xs tracking-wide text-(--c-muted)">
        <span>← {demo.beforeLabel}</span>
        <span className="text-right">{demo.afterLabel} →</span>
      </div>
    </div>
  );
}
