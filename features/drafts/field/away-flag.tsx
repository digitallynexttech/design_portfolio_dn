"use client";

import { useEffect } from "react";
import { setWaterCovered } from "@/features/water/bus";

/**
 * field.css hides the site's header, footer, Menu pill and water with html:has(.d-field), so they are
 * gone from the first paint. Next keeps a page you leave mounted as a hidden copy, so that selector
 * would follow the visitor to the next route; when the draft unmounts (or is hidden), html gets
 * .df-away and the rules stand down. (Matching the hidden copy's inline style instead would put
 * `style` inside :has(), and every inline style written while panning would restyle the document.)
 * The water is also told to stop drawing while the draft is up, not just hidden.
 */
export function AwayFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("df-away");
    setWaterCovered("draft-field", true);
    return () => {
      root.classList.add("df-away");
      setWaterCovered("draft-field", false);
    };
  }, []);
  return null;
}
