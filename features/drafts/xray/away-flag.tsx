"use client";

import { useEffect } from "react";
import { setWaterCovered } from "@/features/water/bus";

/**
 * The draft hides the site's chrome with html:has(.d-xray), so it is gone from the first paint.
 * Next keeps a page you leave mounted as a hidden copy, so that selector would follow the reader
 * to other routes: when the draft unmounts, html gets .dx-away and the page-level rules stand down.
 * The site's WebGL water is hidden here too, and told to stop drawing while the draft is mounted.
 */
export function AwayFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dx-away");
    setWaterCovered("draft-xray", true);
    return () => {
      root.classList.add("dx-away");
      setWaterCovered("draft-xray", false);
    };
  }, []);
  return null;
}
