"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { registerAnchor, type Anchor } from "@/features/water/forms/anchors";
import type { FormId } from "@/features/water/forms/shapes";

/**
 * One vessel for the selected work on wide screens: it stays in place while the cases scroll past
 * beside it, and the water reshapes for whichever case is in the middle of the screen. Each case
 * marks itself with `data-case-form`. `fallbacks` are real images, shown when no water is drawn.
 */
export function FormVessel({ first, className = "", fallbacks }: { first: FormId; className?: string; fallbacks?: { form: FormId; node: ReactNode }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<FormId>(first);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anchor: Anchor = { form: first, el };
    const unregister = registerAnchor(anchor);
    const cases = Array.from(document.querySelectorAll<HTMLElement>("[data-case-form]"));
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let score = Infinity;
      for (const item of cases) {
        const rect = item.getBoundingClientRect();
        const d = Math.abs(rect.top + rect.height / 2 - mid);
        if (d < score) {
          score = d;
          best = item;
        }
      }
      const form = (best?.dataset.caseForm as FormId | undefined) ?? first;
      if (form !== anchor.form) {
        anchor.form = form;
        setCurrent(form);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      unregister();
    };
  }, [first]);

  return (
    <div ref={ref} aria-hidden className={`relative ${className}`}>
      {fallbacks?.map((f) => (
        <div key={f.form} className="form-fallback absolute inset-0 transition-opacity duration-700" style={{ opacity: f.form === current ? 1 : 0 }}>
          {f.node}
        </div>
      ))}
    </div>
  );
}
