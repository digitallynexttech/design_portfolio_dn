"use client";

import { useLayoutEffect } from "react";
import { setWaterCovered } from "@/features/water/bus";
import { decideMode } from "./mode";

/**
 * The draft hides the site's chrome with html:has(.d-depth), so it's gone from the first paint.
 * Next keeps a page you leave in the DOM as a hidden copy, so that selector would follow the reader
 * to the next route; when the draft unmounts (or is hidden), html gets .dp-away and the rules stand
 * down. It also tells the site's water to stop drawing (the flight replaces it), and picks the
 * layout on client navigations, where the server's inline script never runs.
 */
export function AwayFlag() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dp-away");
    if (!root.dataset.dp) root.dataset.dp = decideMode();
    setWaterCovered("draft-depth", true);
    return () => {
      root.classList.add("dp-away");
      setWaterCovered("draft-depth", false);
    };
  }, []);
  return null;
}
