"use client";

import { useEffect, useRef } from "react";

// The hero's lower edge, in a 1000 × 100 box stretched to the strip: a slow swell that lifts toward
// the pointer like water drawn up a glass, and sloshes a little when the page is scrolled.
const N = 28;
const BASE = 62;
const SWELL = 13;
const PULL = 38;

function edge(phase: number, amp: number, px: number, lift: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    const g = Math.exp(-(((x - px) / 0.13) ** 2));
    pts.push([x * 1000, BASE + SWELL * amp * Math.sin(Math.PI * 2 * 1.15 * x + phase) - PULL * lift * g]);
  }
  // Catmull-Rom through the points, as cubic Béziers.
  let d = `M0,100 L0,${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(N, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d} L1000,100 Z`;
}

const REST_PHASE = 0.9;
const REST = edge(REST_PHASE, 1, 0.5, 0);

/**
 * Drives the hero: the meniscus at its foot (drawn here) and the world-in-a-drop, which leans toward
 * the pointer while the world inside it drifts the other way. Runs only while something moves, and
 * not at all with reduced motion. Everything it writes is a path or a transform.
 */
export function HeroMotion() {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const hero = path?.closest<HTMLElement>(".dc-hero");
    if (!path || !hero) return;
    const drop = hero.querySelector<HTMLElement>(".dc-drop");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    // At rest until someone is there: it moves only for a pointer or a scroll, never on its own.
    const s = { phase: REST_PHASE, amp: 1, energy: 0, px: 0.5, tx: 0.5, lift: 0, ty: 0, tilt: 0 };
    let raf = 0;
    let last = 0;
    let visible = false;
    let lastScroll = window.scrollY;
    let shown = "";

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      s.energy *= Math.exp(-1.6 * dt);
      s.phase += dt * (0.5 + s.energy * 1.4);
      s.amp = 1 + Math.min(1.2, s.energy) * 0.6;
      s.px += (s.tx - s.px) * (1 - Math.exp(-5 * dt));
      s.lift += (s.ty - s.lift) * (1 - Math.exp(-4 * dt));
      s.ty *= Math.exp(-0.9 * dt);
      const d = edge(s.phase, s.amp, s.px, s.lift);
      if (d !== shown) path.setAttribute("d", (shown = d));
      if (drop) {
        const goal = (s.tx - 0.5) * 2;
        s.tilt += (goal - s.tilt) * (1 - Math.exp(-4 * dt));
        drop.style.setProperty("--lean", s.tilt.toFixed(4));
      }
      const settled = s.energy < 0.02 && s.ty < 0.01 && s.lift < 0.01 && Math.abs(s.tx - s.px) < 0.002;
      if (visible && !settled) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      s.tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      // The closer the pointer comes to the edge, the higher the water rises to meet it.
      const near = 1 - Math.min(1, Math.max(0, (r.bottom - e.clientY) / (r.height * 0.85)));
      s.ty = 0.2 + near * 0.8;
      kick();
    };
    const onLeave = () => {
      s.ty = 0;
      s.tx = 0.5;
      kick();
    };
    const onScroll = () => {
      const y = window.scrollY;
      s.energy = Math.min(2, s.energy + Math.abs(y - lastScroll) * 0.004);
      lastScroll = y;
      kick();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastScroll = window.scrollY;
    });
    io.observe(hero);
    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      drop?.style.removeProperty("--lean");
    };
  }, []);

  return (
    <svg className="dc-hero__edge" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden focusable="false">
      <path ref={pathRef} d={REST} fill="currentColor" />
    </svg>
  );
}
