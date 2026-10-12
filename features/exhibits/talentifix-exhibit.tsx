"use client";

import { useEffect, useRef, useState } from "react";
import { TFX_SHIFTS } from "@/content/exhibits/talentifix";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

const DURATION = 1800;

/** The search fixes as gauges filling like water levels, before → after. Replayable. */
export default function TalentifixExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host);
  const [t, setT] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => onReady(), [onReady]);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    if (prefersReducedMotion()) {
      raf = requestAnimationFrame(() => setT(1));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setT(1 - (1 - p) ** 3);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, run]);

  return (
    <div ref={host} className="absolute inset-0 overflow-auto text-white" style={{ background: "linear-gradient(135deg, #000099, #0000FF 55%, #00DDE2)" }}>
      <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center px-(--gutter) pt-16 pb-28 md:py-12">
        <div className="flex items-end justify-between gap-4">
          <p className="font-display text-3xl font-semibold md:text-5xl">Built to be found.</p>
          <button type="button" onClick={() => setRun((n) => n + 1)} className="rounded-full border border-white/40 px-4 py-2 text-sm hover:bg-white hover:text-[#000099]">
            Run it again
          </button>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {TFX_SHIFTS.map((shift) => {
            const value = shift.before + (shift.after - shift.before) * t;
            const decimals = Number.isInteger(shift.before) && Number.isInteger(shift.after) ? 0 : 1;
            return (
              <li key={shift.label} className="relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl bg-white/10 p-4 md:h-56">
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 bg-[#00DDE2]/35"
                  style={{ height: `${(value / shift.max) * 100}%`, transition: "height 120ms linear" }}
                />
                <p className="relative font-display text-4xl font-semibold tabular-nums md:text-5xl" aria-hidden>
                  {value.toFixed(decimals)}
                  <span className="text-lg opacity-70">{shift.unit ?? ""}</span>
                </p>
                <p className="relative mt-1 text-sm leading-snug opacity-90">{shift.label}</p>
                <p className="relative mt-1 font-mono text-[0.65rem] opacity-70">
                  {shift.before}
                  {shift.unit ?? ""} → {shift.after}
                  {shift.unit ?? ""} {shift.better === "lower" ? "(lower is better)" : ""}
                </p>
                <span className="sr-only">
                  {shift.label}: from {shift.before}
                  {shift.unit ?? ""} to {shift.after}
                  {shift.unit ?? ""}.
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
