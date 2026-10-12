"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier, prefersReducedMotion, type Tier } from "@/features/stage/tier";

const FormsCanvas = dynamic(() => import("@/features/water/forms/forms-canvas"), { ssr: false });

/**
 * Loads the water's shapes on the home page once the text has painted and the device can afford it.
 * Visitors who prefer less motion still see each shape, drawn still. Devices that can't draw it get
 * real images in its place (`data-forms="off"` shows each anchor's fallback).
 */
export function FormsStage() {
  const [stage, setStage] = useState<{ tier: Tier; still: boolean }>({ tier: 0, still: false });
  useEffect(
    () =>
      whenEngaged(() => {
        const still = prefersReducedMotion();
        const tier = detectTier({ ignoreMotion: true });
        if (!tier) document.documentElement.dataset.forms = "off";
        setStage({ tier: still ? (Math.min(tier, 2) as Tier) : tier, still });
      }, 1500),
    [],
  );
  return stage.tier ? <FormsCanvas tier={stage.tier} still={stage.still} /> : null;
}
