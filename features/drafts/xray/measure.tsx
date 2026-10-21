"use client";

import { useEffect, useRef } from "react";

/**
 * A live readout of something in the same section: an element's size in px ("151 × 101"), or how
 * many columns a grid is drawing right now. It follows resizes, so the drawing never states a
 * size the page isn't actually using.
 */
export function Measure({ sel, what }: { sel: string; what: "size" | "cols" }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const out = ref.current;
    const target = out?.closest("section")?.querySelector<HTMLElement>(sel);
    if (!out || !target) return;
    const write = () => {
      let v: string;
      if (what === "cols") v = String(getComputedStyle(target).gridTemplateColumns.split(" ").filter(Boolean).length);
      else {
        const r = target.getBoundingClientRect();
        v = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      }
      if (out.textContent !== v) out.textContent = v;
    };
    const ro = new ResizeObserver(write);
    ro.observe(target);
    write();
    return () => ro.disconnect();
  }, [sel, what]);

  return (
    <b ref={ref} className="dx-num">
      —
    </b>
  );
}
