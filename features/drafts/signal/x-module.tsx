"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Mascot, MascotClip } from "@/features/mascot/mascot-scene";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier } from "@/features/stage/tier";

const WAVE_TRIGGER = "data-mascot-wave";
const WAVE_GAP_MS = 4000;

/**
 * The Digitally Next X in the hero's side module, on a canvas this draft owns. The poster is a real
 * frame from the same camera; the live model replaces it once the visitor has engaged. Unlike the
 * site's own window, it draws only while something is happening and then holds its last frame: it
 * wakes when the pointer moves over the hero (its eyes follow), waves when the pointer reaches it or
 * "Start a project", spins when pressed, and greets the first time it is seen live. Devices that draw
 * no WebGL keep the poster.
 */
export function XModule() {
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv || detectTier() === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";
    let mascot: Mascot | undefined;
    let cancelled = false;
    let stopEngage: (() => void) | undefined;
    let onScreen = false;
    let greeted = false;
    let awakeUntil = 0;
    let timer = 0;
    let lastWave = 0;

    // Live only while on screen, the tab is visible, and something has happened lately.
    const sync = () => {
      window.clearTimeout(timer);
      const now = performance.now();
      const live = onScreen && document.visibilityState === "visible" && now < awakeUntil;
      mascot?.setActive(live);
      if (live) timer = window.setTimeout(sync, awakeUntil - now + 30);
    };
    const wake = (ms: number) => {
      if (!mascot) return;
      awakeUntil = Math.max(awakeUntil, performance.now() + ms);
      sync();
    };
    const play = (clip: MascotClip, ms: number) => {
      if (!mascot) return;
      mascot.play(clip);
      wake(ms);
    };
    const greet = () => {
      if (greeted || !mascot || !onScreen) return;
      greeted = true;
      play("Wave", 3400);
    };
    const wave = () => {
      if (performance.now() - lastWave < WAVE_GAP_MS) return;
      lastWave = performance.now();
      play("Wave", 3200);
    };
    const spin = () => play("Spin", 2600);
    const look = () => wake(1400);

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        stopEngage = whenEngaged(async () => {
          const { createMascot } = await import("@/features/mascot/mascot-scene");
          if (cancelled) return;
          try {
            const live = await createMascot(cv, reduced);
            if (cancelled) return live.dispose();
            mascot = live;
            // At least a few frames before the poster gives way, so the swap never shows a blank.
            wake(900);
            setReady(true);
            greet();
          } catch {
            // No model, no WebGL context: the poster stays.
          }
        });
      },
      { rootMargin: "400px" },
    );
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) greet();
      sync();
    });
    near.observe(el);
    seen.observe(el);

    const hero = el.closest("section") ?? el;
    const triggers = [...document.querySelectorAll(`[${WAVE_TRIGGER}]`)];
    hero.addEventListener("pointermove", look, { passive: true });
    el.addEventListener("pointerenter", wave);
    el.addEventListener("click", spin);
    for (const t of triggers) t.addEventListener("pointerenter", wave);
    document.addEventListener("visibilitychange", sync);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      near.disconnect();
      seen.disconnect();
      stopEngage?.();
      hero.removeEventListener("pointermove", look);
      el.removeEventListener("pointerenter", wave);
      el.removeEventListener("click", spin);
      for (const t of triggers) t.removeEventListener("pointerenter", wave);
      document.removeEventListener("visibilitychange", sync);
      mascot?.dispose();
    };
  }, []);

  return (
    <span ref={host} className="ds-xwin" data-ready={ready || undefined} aria-hidden>
      <Image src="/models/dn-x/poster.webp" alt="" fill unoptimized className="ds-xwin__poster" />
      <canvas ref={canvas} className="ds-xwin__canvas" />
    </span>
  );
}
