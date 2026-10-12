"use client";

import { useEffect, useRef } from "react";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

// Rebuilt to the settings of the live hero: 60 points, links under 130 px, pointer push within 140 px.
const POINTS = 60;
const LINK = 130;
const PUSH = 140;

export default function ChetanExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(host);
  useEffect(() => onReady(), [onReady]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !inView) return;
    const ctx = el.getContext("2d")!;
    const reduced = prefersReducedMotion();
    const pointer = { x: -9999, y: -9999 };
    let w = 0;
    let h = 0;
    const pts = Array.from({ length: POINTS }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.04, vy: (Math.random() - 0.5) * 0.04 }));
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio);
      if (el.clientWidth !== w || el.clientHeight !== h) {
        w = el.clientWidth;
        h = el.clientHeight;
        el.width = w * dpr;
        el.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reduced) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
        const px = p.x * w;
        const py = p.y * h;
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < PUSH && d > 0.1) {
          p.x += (dx / d) * (1 - d / PUSH) * 0.004;
          p.y += (dy / d) * (1 - d / PUSH) * 0.004;
          ctx.strokeStyle = `rgba(78, 204, 163, ${0.5 * (1 - d / PUSH)})`;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
      for (let i = 0; i < POINTS; i++) {
        for (let j = i + 1; j < POINTS; j++) {
          const a = pts[i];
          const b = pts[j];
          const d = Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(24, 126, 95, ${0.25 * (1 - d / LINK)})`;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(78, 204, 163, 0.7)";
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [inView]);

  return (
    <div ref={host} className="absolute inset-0" style={{ background: "radial-gradient(80% 70% at 30% 40%, #0B5844 0%, #0A0F0D 60%)" }}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <p className="pointer-events-none absolute bottom-28 left-(--gutter) md:bottom-20 max-w-[18ch] font-display text-[clamp(2rem,5vw,4.5rem)] leading-none font-semibold text-[#F3EFE6]">
        Ideas, connected<span className="text-[#4ECCA3]">.</span>
      </p>
    </div>
  );
}
