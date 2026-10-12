"use client";

import { useEffect, useRef } from "react";
import { LEOCYM_DIFFERENCE } from "@/content/exhibits/leocym";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

type Mode = "mask" | "neutralise";
const ODOUR = "#DC3C14";
const CLEAN = "#50A03C";
const SCENT = "#A6A2B9";

/**
 * Odour particles rise from a source. Masking lays a perfume cloud over them and they keep rising;
 * neutralising acts at the source, so they fade before they get far. Both run side by side.
 */
function OdourPanel({ mode, active }: { mode: Mode; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !active) return;
    const ctx = el.getContext("2d")!;
    const reduced = prefersReducedMotion();
    const parts = Array.from({ length: 90 }, () => ({ x: 0.5 + (Math.random() - 0.5) * 0.25, y: 1 - Math.random(), v: 0.08 + Math.random() * 0.12, p: Math.random() * 6 }));
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== w * dpr) {
        el.width = w * dpr;
        el.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // The source.
      ctx.fillStyle = "#282864";
      ctx.fillRect(w * 0.3, h * 0.9, w * 0.4, h * 0.04);
      if (mode === "neutralise") {
        ctx.fillStyle = CLEAN;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(w * 0.26, h * 0.82, w * 0.48, h * 0.12);
        ctx.globalAlpha = 1;
      }
      for (const q of parts) {
        if (!reduced) {
          q.y -= q.v * dt;
          q.p += dt * 2;
        }
        const reach = mode === "neutralise" ? 0.78 : 0;
        if (q.y < reach) {
          q.y = 1;
          q.x = 0.5 + (Math.random() - 0.5) * 0.25;
        }
        const life = mode === "neutralise" ? Math.max(0, (q.y - reach) / (1 - reach)) : 1;
        ctx.globalAlpha = 0.75 * life;
        ctx.fillStyle = ODOUR;
        ctx.beginPath();
        ctx.arc((q.x + Math.sin(q.p) * 0.02) * w, q.y * h * 0.9, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (mode === "mask") {
        // The perfume cloud: it sits on top, and the odour passes straight through it.
        const g = ctx.createRadialGradient(w / 2, h * 0.38, 4, w / 2, h * 0.38, w * 0.45);
        g.addColorStop(0, `${SCENT}cc`);
        g.addColorStop(1, `${SCENT}00`);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode, active]);
  return <canvas ref={canvas} className="h-full w-full" aria-hidden />;
}

export default function LeocymExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, "100px");
  useEffect(() => onReady(), [onReady]);

  return (
    <div ref={host} className="absolute inset-0 grid bg-white pb-20 text-[#282864] md:grid-cols-2 md:pb-0">
      {(["mask", "neutralise"] as const).map((mode) => {
        const copy = LEOCYM_DIFFERENCE[mode];
        return (
          <section key={mode} className={`relative flex flex-col ${mode === "mask" ? "bg-[#EAF2F5]" : "bg-white"}`} aria-label={mode === "mask" ? "Masking" : "Neutralising"}>
            <div className="relative min-h-0 flex-1">
              <OdourPanel mode={mode} active={inView} />
            </div>
            <div className="px-6 pb-6 md:px-10 md:pb-20">
              <p className="font-mono text-xs tracking-widest uppercase" style={{ color: mode === "mask" ? "#A8300F" : "#2F6E22" }}>
                {mode === "mask" ? "Masking" : "Neutralising"}
              </p>
              <p className="mt-2 font-display text-2xl font-black uppercase md:text-3xl">{copy.title}</p>
              <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-[#5E608E] md:text-base">{copy.body}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
