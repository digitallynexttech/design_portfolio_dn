"use client";

import { useEffect, useRef, useState } from "react";
import { seaHeight, WAVES } from "@/features/world/waves";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

// A slice through the world's sea: the four waves, their sum, and the boat floating on it. It runs
// the exact function the GPU uses to draw the water and the physics uses to float the hull.

const SPAN = 64; // metres across the slice
const HULL = 4.4;

export default function MakingOfExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(host, "100px");
  const [amp, setAmp] = useState(0.75);
  const [parts, setParts] = useState(false);
  const state = useRef({ amp: 0.75, parts: false });

  useEffect(() => {
    state.current = { amp, parts };
  }, [amp, parts]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !inView) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const styles = getComputedStyle(c);
    const accent = styles.getPropertyValue("--c-accent").trim() || "#0ec8c5";
    const text = styles.getPropertyValue("--c-text").trim() || "#fafaf8";
    let raf = 0;
    let t = 0;
    let last = performance.now();
    let ready = false;
    const reduced = prefersReducedMotion();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) t += dt;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { amp: a, parts: showParts } = state.current;
      const scale = w / SPAN;
      const mid = h * 0.58;
      // Heights are drawn five times taller than life, so the waves read at this width.
      const yOf = (m: number) => mid - m * scale * 5;
      const xOf = (m: number) => (m + SPAN / 2) * scale;

      if (showParts) {
        WAVES.forEach((wave, i) => {
          ctx.beginPath();
          for (let px = 0; px <= w; px += 3) {
            const x = px / scale - SPAN / 2;
            const s = (Math.sin(wave.k * (wave.dx * x) - wave.w * t + wave.phase) + 1) * 0.5;
            const y = wave.amp * (2 * Math.pow(s, wave.sharp) - 1) * a;
            if (px === 0) ctx.moveTo(px, yOf(y));
            else ctx.lineTo(px, yOf(y));
          }
          ctx.strokeStyle = `rgba(250, 250, 248, ${0.4 - i * 0.07})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // The sea: the sum of the four, filled.
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let px = 0; px <= w; px += 2) ctx.lineTo(px, yOf(seaHeight(px / scale - SPAN / 2, 0, t, a)));
      ctx.lineTo(w, h);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, mid - 60, 0, h);
      fill.addColorStop(0, "rgba(16, 102, 120, 0.95)");
      fill.addColorStop(1, "rgba(4, 24, 38, 1)");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= w; px += 2) {
        const y = yOf(seaHeight(px / scale - SPAN / 2, 0, t, a));
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // The boat reads the same function at bow and stern.
      const bx = 0;
      const bow = seaHeight(bx - HULL / 2, 0, t, a);
      const stern = seaHeight(bx + HULL / 2, 0, t, a);
      const y = (bow + stern) / 2;
      const pitch = Math.atan2((bow - stern) * 5, HULL);
      ctx.save();
      ctx.translate(xOf(bx), yOf(y));
      ctx.rotate(pitch);
      const L = HULL * scale;
      ctx.fillStyle = "#e21f26";
      ctx.beginPath();
      ctx.moveTo(-L / 2 - 6, -10);
      ctx.lineTo(L / 2, -10);
      ctx.lineTo(L / 2 - 4, 6);
      ctx.lineTo(-L / 2 + 10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f3f1ec";
      ctx.fillRect(-8, -22, 16, 12);
      ctx.restore();
      // Probe marks where the physics samples.
      ctx.fillStyle = text;
      for (const m of [bx - HULL / 2, bx + HULL / 2]) {
        ctx.beginPath();
        ctx.arc(xOf(m), yOf(seaHeight(m, 0, t, a)), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!ready) {
        ready = true;
        onReady();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const redraw = () => {
      if (reduced) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    window.addEventListener("resize", redraw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", redraw);
    };
  }, [inView, onReady]);

  // Reduced motion: still draw when the controls change.
  useEffect(() => {
    if (!prefersReducedMotion()) return;
    window.dispatchEvent(new Event("resize"));
  }, [amp, parts]);

  return (
    <div ref={host} className="absolute inset-0" style={{ background: "radial-gradient(80% 90% at 50% 30%, #0f2633, #05070a 75%)" }}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label="A slice through the world's sea, with the boat floating on it" role="img" />
      {/* Phones: clear of the exhibit's More button in the top-right corner. */}
      <div className="absolute inset-x-(--gutter) top-6 max-w-[42ch] text-(--c-text) max-md:pr-18">
        <p className="font-mono text-xs tracking-widest uppercase opacity-80">The sea, sliced</p>
        <p className="mt-2 text-lg leading-snug">The same function draws the water on the GPU and floats the boat on the CPU. Two dots: where the hull reads it.</p>
        <p className="mt-1 text-sm opacity-75">Heights shown five times taller than life.</p>
      </div>
      {/* Both controls are 44px tall to the touch; py-2 keeps the panel as compact as before. */}
      <div className="absolute right-(--gutter) bottom-24 left-(--gutter) flex flex-wrap items-center gap-x-4 rounded-2xl bg-black/55 px-5 py-2 text-white backdrop-blur md:bottom-6 md:left-auto">
        <label className="flex items-center gap-3 text-sm">
          <span>Calm</span>
          <input
            type="range"
            min={0.5}
            max={2.4}
            step={0.05}
            value={amp}
            onChange={(e) => setAmp(Number(e.target.value))}
            aria-label="Sea state, from calm to storm"
            className="h-11 cursor-pointer"
          />
          <span>Storm</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={parts} onChange={(e) => setParts(e.target.checked)} />
          Show the four waves
        </label>
      </div>
    </div>
  );
}
