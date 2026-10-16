"use client";

import { useEffect, useRef } from "react";

type Ring = { x: number; y: number; px: number; py: number; born: number };

/** Lifetime of one splash (ms), and how far its outer ring travels (CSS px). */
const LIFE = 1100;
const REACH = 132;

/**
 * Ripple rings where you click or tap: three crisp concentric circles that open and fade, and a
 * crosshair that states the point's page coordinates, like a measurement taken on the drawing. One
 * fixed canvas, drawn only while a splash is alive. Taps that scroll never fire a click, so
 * scrolling a phone leaves the page quiet. Off with reduced motion.
 */
export function Ripples() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = canvas.closest<HTMLElement>(".d-grid") ?? document.body;
    const css = getComputedStyle(root);
    const ink = css.getPropertyValue("--g-ink-rgb").trim() || "23 24 26";
    const red = css.getPropertyValue("--g-red").trim() || "#e21f26";
    const paper = css.getPropertyValue("--g-paper").trim() || "#ece9e1";
    const mono = css.getPropertyValue("--dg-mono").trim() || "monospace";

    const rings: Ring[] = [];
    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      if (w === W && h === H && d === dpr) return;
      W = w;
      H = h;
      dpr = d;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const frame = (now: number) => {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        const age = (now - r.born) / LIFE;
        if (age >= 1) {
          rings.splice(i, 1);
          continue;
        }
        // Three rings, each a beat behind the last.
        for (let k = 0; k < 3; k++) {
          const a = Math.min(1, Math.max(0, (age - k * 0.12) / (1 - k * 0.12)));
          if (a <= 0) continue;
          const e = 1 - (1 - a) ** 3;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 4 + e * REACH * (1 - k * 0.22), 0, Math.PI * 2);
          ctx.lineWidth = k === 0 ? 1.25 : 1;
          ctx.strokeStyle = `rgb(${ink} / ${((1 - a) * (k === 0 ? 0.85 : 0.5)).toFixed(3)})`;
          ctx.stroke();
        }
        // The measurement: a red crosshair and the point's coordinates on the page.
        const fade = Math.max(0, 1 - age * 1.15);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = red;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r.x - 9, r.y);
        ctx.lineTo(r.x + 9, r.y);
        ctx.moveTo(r.x, r.y - 9);
        ctx.lineTo(r.x, r.y + 9);
        ctx.stroke();
        // The reading sits on a paper tab, so it reads over type and pictures alike.
        const label = `x ${r.px}  y ${r.py}`;
        ctx.font = `500 10px ${mono}`;
        const w = ctx.measureText(label).width;
        ctx.fillStyle = paper;
        ctx.fillRect(r.x + 10, r.y - 21, w + 8, 15);
        ctx.strokeStyle = `rgb(${ink} / 0.5)`;
        ctx.strokeRect(r.x + 10.5, r.y - 20.5, w + 7, 14);
        ctx.fillStyle = `rgb(${ink})`;
        ctx.fillText(label, r.x + 14, r.y - 10);
        ctx.globalAlpha = 1;
      }
      if (rings.length) raf = requestAnimationFrame(frame);
    };

    const onClick = (e: MouseEvent) => {
      // Keyboard "clicks" have no point; dialogs and the world have their own surfaces.
      if (e.detail === 0 || reduced.matches) return;
      const target = e.target as Element | null;
      if (target?.closest("dialog")) return;
      fit();
      rings.push({
        x: e.clientX,
        y: e.clientY,
        px: Math.round(e.pageX),
        py: Math.round(e.pageY),
        born: performance.now(),
      });
      if (rings.length > 6) rings.shift();
      if (!raf) raf = requestAnimationFrame(frame);
    };

    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={ref} className="dg-ripples" aria-hidden />;
}
