"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/features/exhibits/use-in-view";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier } from "@/features/stage/tier";
import type { Mascot, MascotClip } from "./mascot-scene";

/** Hovering anything marked with this (the footer's "Start a project") makes the X wave too. */
const WAVE_TRIGGER = "data-mascot-wave";
const WAVE_GAP_MS = 4000;

/**
 * The Digitally Next X in a square window. All spans, an img and a canvas, so it can sit inside a
 * heading (aria-hidden: the heading reads as its words); the hero and the footer each have one. The
 * poster is a real frame from the same camera; the live model replaces it once the visitor has engaged
 * and the window is near, and draws only while it's on screen. Devices that draw no WebGL (reduced
 * motion, data saver, no WebGL2) keep the poster. It's play, not a control: it greets when first seen,
 * hovering waves, a click spins, the eyes follow the pointer.
 */
export function MascotWindow({
  className = "",
  greet = "Jump",
  bubble = "Pour me into anything.",
}: {
  className?: string;
  /** What it does the first time it's seen live. */
  greet?: MascotClip;
  /** The speech bubble above the window; null for none. */
  bubble?: string | null;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv || detectTier() === 0) return;
    let mascot: Mascot | undefined;
    let cancelled = false;
    let stopEngage: (() => void) | undefined;
    let onScreen = false;
    let greeted = false;
    let lastWave = 0;

    const sync = () => {
      const active = onScreen && document.visibilityState === "visible";
      mascot?.setActive(active);
      // The first time it's seen live, it greets.
      if (active && mascot && !greeted) {
        greeted = true;
        mascot.play(greet);
      }
    };
    const wave = () => {
      if (!mascot || performance.now() - lastWave < WAVE_GAP_MS) return;
      lastWave = performance.now();
      mascot.play("Wave");
    };
    const spin = () => mascot?.play("Spin");

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        stopEngage = whenEngaged(async () => {
          const { createMascot } = await import("./mascot-scene");
          if (cancelled) return;
          try {
            const live = await createMascot(cv, prefersReducedMotion());
            if (cancelled) return live.dispose();
            mascot = live;
            setReady(true);
            sync();
          } catch {
            // No model, no WebGL context: the poster stays.
          }
        });
      },
      { rootMargin: "400px" },
    );
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    near.observe(el);
    seen.observe(el);
    document.addEventListener("visibilitychange", sync);
    el.addEventListener("pointerenter", wave);
    el.addEventListener("click", spin);
    const triggers = [...document.querySelectorAll(`[${WAVE_TRIGGER}]`)];
    for (const t of triggers) t.addEventListener("pointerenter", wave);

    return () => {
      cancelled = true;
      near.disconnect();
      seen.disconnect();
      stopEngage?.();
      document.removeEventListener("visibilitychange", sync);
      el.removeEventListener("pointerenter", wave);
      el.removeEventListener("click", spin);
      for (const t of triggers) t.removeEventListener("pointerenter", wave);
      mascot?.dispose();
    };
  }, [greet]);

  return (
    <span ref={host} aria-hidden className={`mascot-window ${className}`} data-ready={ready || undefined}>
      {bubble ? <span className="mascot-window__bubble">{bubble}</span> : null}
      <span className="mascot-window__pane">
        <Image src="/models/dn-x/poster-3.webp" alt="" fill unoptimized className="mascot-window__poster" />
        <canvas ref={canvas} className="mascot-window__canvas" />
      </span>
    </span>
  );
}
