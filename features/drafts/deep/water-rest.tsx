"use client";

import { useEffect } from "react";
import { setWaterCovered } from "@/features/water/bus";

/**
 * While the draft is on screen: the site's WebGL water (hidden by deep.css) is paused, since the
 * draft paints its own sea, and resumes when the visitor leaves.
 *
 * It also marks the moment the draft is left. deep.css hides the site's own header, footer and water
 * with html:has(.d-deep), so they are gone from the very first paint. But Next keeps a page it leaves
 * in the DOM as a hidden copy, so on the next page that selector would still match; when the draft
 * unmounts (or is hidden), html gets .dd-left and the rules stand down. (Matching the hidden copy's
 * inline style instead would put `style` inside :has(), and every inline style written while
 * scrolling would then restyle the whole document.)
 */
export function WaterRest() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dd-left");
    setWaterCovered("draft-deep", true);
    return () => {
      root.classList.add("dd-left");
      setWaterCovered("draft-deep", false);
    };
  }, []);
  return null;
}
