"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier, prefersReducedMotion } from "@/features/stage/tier";
import type { Mascot } from "@/features/mascot/mascot-scene";

const WAVE_GAP_MS = 4000;

/**
 * The Digitally Next X, set into the title like a glyph and drawn like a specimen: crop marks, its
 * figure number, and (in Build mode) its blueprint with the canvas's live size. All spans, an img
 * and a canvas, so it can sit inside the h1 (aria-hidden: the heading reads as its words).
 *
 * The poster is a real frame from the same camera. The live model replaces it once the visitor has
 * engaged and the X is near, and draws only while on screen; devices that draw no WebGL (reduced
 * motion, data saver, no WebGL2) keep the poster. Hovering it, or "Start a project", makes it
 * wave; a click spins it; its eyes follow the pointer.
 */
export function XSpecimen() {
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const size = el.querySelector<HTMLElement>("[data-cv]");

    // The canvas's live size, for the blueprint's tag.
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (size) size.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    });
    ro.observe(cv);

    if (detectTier() === 0) return () => ro.disconnect();

    let mascot: Mascot | undefined;
    let cancelled = false;
    let stopEngage: (() => void) | undefined;
    let onScreen = false;
    let greeted = false;
    let lastWave = 0;

    const sync = () => {
      const active = onScreen && document.visibilityState === "visible";
      mascot?.setActive(active);
      if (active && mascot && !greeted) {
        greeted = true;
        mascot.play("Wave");
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
          const { createMascot } = await import("@/features/mascot/mascot-scene");
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
      { rootMargin: "300px" },
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
    const root = el.closest(".d-xray");
    const triggers = root ? [...root.querySelectorAll("[data-mascot-wave]")] : [];
    for (const t of triggers) t.addEventListener("pointerenter", wave);

    return () => {
      cancelled = true;
      ro.disconnect();
      near.disconnect();
      seen.disconnect();
      stopEngage?.();
      document.removeEventListener("visibilitychange", sync);
      el.removeEventListener("pointerenter", wave);
      el.removeEventListener("click", spin);
      for (const t of triggers) t.removeEventListener("pointerenter", wave);
      mascot?.dispose();
    };
  }, []);

  return (
    <span ref={host} className="dx-x" data-ready={ready || undefined} aria-hidden data-x="canvas">
      <span className="dx-x__frame dx-plate dx-bp">
        <span className="dx-plate__bp">
          <svg className="dx-plate__x" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
            <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="dx-plate__tag">
            <b>canvas</b> <span data-cv>0 × 0</span>
          </span>
        </span>
        <span className="dx-plate__media">
          <Image src="/models/dn-x/poster.webp" alt="" fill unoptimized loading="eager" className="dx-x__poster" />
          <canvas ref={canvas} className="dx-x__canvas" />
        </span>
        <span className="dx-x__crop dx-x__crop--tl" />
        <span className="dx-x__crop dx-x__crop--tr" />
        <span className="dx-x__crop dx-x__crop--bl" />
        <span className="dx-x__crop dx-x__crop--br" />
      </span>
      <span className="dx-x__cap">
        <span>Fig. 0.1</span> <span>The X · live</span>
      </span>
    </span>
  );
}
