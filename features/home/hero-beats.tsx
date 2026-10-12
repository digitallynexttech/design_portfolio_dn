"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Each beat holds, then hands over to the next with a short overlap, so the slot is never empty;
// the last beat holds too, so it is read before the hero scrolls away. Units are timeline seconds,
// spread over the scroll through the track.
const HOLD = 0.8;
const MOVE = 0.5;
const OVERLAP = 0.15;
/** How far a beat travels as it leaves or arrives (px). */
const RISE = 48;
/** The beats trail the scroll by this much, so a flick still plays them as motion (ms). */
const SCRUB = 600;

// The same curves the timeline had under GSAP: power2.inOut (a cubic) for each move, expo.out for the
// scrub catching up with the scroll.
const inOut = (p: number) => (p < 0.5 ? (2 * p) ** 3 / 2 : 1 - (2 * (1 - p)) ** 3 / 2);
const expoIn = (p: number) => 2 ** (10 * (p - 1)) * p + p ** 6 * (1 - p);
const expoOut = (p: number) => 1 - expoIn(1 - p);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Step = { beat: number; at: number; from: [number, number]; to: [number, number] };

/**
 * Plays the three hero beats in sequence as the visitor scrolls through a sticky track. All beats are
 * server-rendered and stay in the accessibility tree; only opacity and position animate (no blur,
 * which costs frames on big type). With motion off, the CSS stacks them as plain text.
 *
 * It runs only while something changes: one frame per scroll event, plus the scrub's catch-up, and
 * it writes only the styles that moved. --hero-lift goes on the elements that read it (the hero's
 * edge and shadow, and the studio under it), so a scroll never restyles the rest of the page.
 */
export function HeroBeats({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = root.current;
    if (!track || document.documentElement.dataset.motion !== "on") return;
    const beats = Array.from(track.querySelectorAll<HTMLElement>("[data-beat]"));
    const lifted = [
      track,
      track.querySelector<HTMLElement>(".hero-sticky"),
      track.closest("main")?.querySelector<HTMLElement>(".hero-underlay > section"),
    ].filter((el): el is HTMLElement => !!el);

    const steps: Step[] = [];
    let cursor = HOLD;
    for (let i = 0; i < beats.length - 1; i++) {
      steps.push({ beat: i, at: cursor, from: [1, 0], to: [0, -RISE] });
      cursor += MOVE - OVERLAP;
      steps.push({ beat: i + 1, at: cursor, from: [0, RISE], to: [1, 0] });
      cursor += MOVE + HOLD;
    }
    // Hold the last beat on screen for its share of the scroll.
    const duration = cursor + HOLD * 1.25;

    const written = beats.map(() => ({ opacity: "", transform: "" }));
    const renderBeats = (progress: number) => {
      const time = progress * duration;
      beats.forEach((el, i) => {
        let opacity = i === 0 ? 1 : 0;
        let y = i === 0 ? 0 : RISE;
        for (const s of steps) {
          if (s.beat !== i || time < s.at) continue;
          const e = inOut(Math.min(1, (time - s.at) / MOVE));
          opacity = s.from[0] + (s.to[0] - s.from[0]) * e;
          y = s.from[1] + (s.to[1] - s.from[1]) * e;
        }
        const o = opacity.toFixed(3);
        const t = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        if (written[i].opacity !== o) el.style.opacity = written[i].opacity = o;
        if (written[i].transform !== t) el.style.transform = written[i].transform = t;
      });
    };
    let liftShown = "";
    const renderLift = (lift: number) => {
      const value = lift.toFixed(4);
      if (value === liftShown) return;
      liftShown = value;
      for (const el of lifted) el.style.setProperty("--hero-lift", value);
    };

    // Where the track sits. Re-measured on resize, but not when a phone's toolbar slides away.
    let top = 0;
    let height = 1;
    let vh = window.innerHeight;
    let vw = window.innerWidth;
    const measure = () => {
      vh = window.innerHeight;
      vw = window.innerWidth;
      top = track.getBoundingClientRect().top + window.scrollY;
      height = track.offsetHeight;
    };
    // Beats run from the track's top reaching the top of the screen to its bottom reaching the bottom;
    // then the hero lifts off over one more screen.
    const beatsAt = (y: number) => clamp01((y - top) / Math.max(1, height - vh));
    const liftAt = (y: number) => clamp01((y - (top + height - vh)) / Math.max(1, vh));

    let current = 0;
    let from = 0;
    let target = 0;
    let start = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = 0;
      const y = window.scrollY;
      const goal = beatsAt(y);
      if (goal !== target) {
        from = current;
        target = goal;
        start = now;
      }
      const k = Math.min(1, (now - start) / SCRUB);
      current = from + (target - from) * expoOut(k);
      renderBeats(current);
      renderLift(liftAt(y));
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      if (window.innerWidth === vw && Math.abs(window.innerHeight - vh) < vh * 0.25) return;
      measure();
      kick();
    };

    measure();
    current = from = target = beatsAt(window.scrollY);
    renderBeats(current);
    renderLift(liftAt(window.scrollY));
    const resizeObserver = new ResizeObserver(() => {
      measure();
      kick();
    });
    resizeObserver.observe(track);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      for (const el of beats) {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      }
      for (const el of lifted) el.style.removeProperty("--hero-lift");
    };
  }, []);

  return (
    <div ref={root} className="hero-track">
      {children}
    </div>
  );
}
