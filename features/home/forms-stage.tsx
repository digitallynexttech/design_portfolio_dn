"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectTier, prefersReducedMotion, type Tier } from "@/features/stage/tier";

const FormsCanvas = dynamic(() => import("@/features/water/forms/forms-canvas"), { ssr: false });

/** How far ahead of the selected work the shapes start loading: about a screen and a half. */
const AHEAD = "150% 0px";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Loads the water's shapes on the home page only as the selected work approaches, so a visit that
 * never gets that far never downloads them. Visitors who prefer less motion still see each shape,
 * drawn still. Devices that can't draw it get real images in its place (`data-forms="off"` shows
 * each anchor's fallback).
 */
export function FormsStage() {
  const [stage, setStage] = useState<{ tier: Tier; still: boolean }>({ tier: 0, still: false });
  useEffect(() => {
    const work = document.getElementById("work");
    const w = window as IdleWindow;
    let idle = 0;
    let timer = 0;
    const start = () => {
      const still = prefersReducedMotion();
      const tier = detectTier({ ignoreMotion: true });
      if (!tier) document.documentElement.dataset.forms = "off";
      setStage({ tier: still ? (Math.min(tier, 2) as Tier) : tier, still });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Let the frame that brought it near finish first.
        if (w.requestIdleCallback) idle = w.requestIdleCallback(start, { timeout: 600 });
        else timer = window.setTimeout(start, 100);
      },
      { rootMargin: AHEAD },
    );
    if (work) observer.observe(work);
    else start();
    return () => {
      observer.disconnect();
      if (idle) w.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, []);
  return stage.tier ? <FormsCanvas tier={stage.tier} still={stage.still} /> : null;
}
