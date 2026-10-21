"use client";

import { useEffect } from "react";
import { setWaterCovered } from "@/features/water/bus";

/**
 * The draft hides the site's chrome with html:has(.d-kinetic), so it's gone from the first paint.
 * Next keeps a page you leave in the DOM as a hidden copy, so that selector would follow the reader
 * to other routes; when the draft unmounts (or is hidden), html gets .dk-away and the rules stand
 * down. The site's WebGL water is hidden here too, so it's told to stop drawing.
 */
export function AwayFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dk-away");
    setWaterCovered("draft-kinetic", true);
    return () => {
      root.classList.add("dk-away");
      setWaterCovered("draft-kinetic", false);
    };
  }, []);
  return null;
}
