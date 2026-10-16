"use client";

import { useEffect } from "react";

/**
 * The draft hides the site's chrome with html:has(.d-monograph), so it's gone from the first paint.
 * Next keeps a page you leave in the DOM as a hidden copy, so that selector would follow the reader
 * to the real home; when the draft unmounts (or is hidden), html gets .dm-away and the rules stand
 * down. (Matching the hidden copy's inline style instead puts `style` inside :has(), and then every
 * inline style written while scrolling restyles the whole document.)
 */
export function AwayFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dm-away");
    return () => root.classList.add("dm-away");
  }, []);
  return null;
}
