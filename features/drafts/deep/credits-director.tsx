"use client";

import { useEffect } from "react";

/**
 * Chooses which frame of the film strip sits in the gate: the row under the mouse, the row with
 * keyboard focus, or (when neither) the row crossing the middle of the screen as the list scrolls by.
 * It only writes one attribute and one custom property; the strip glides there in CSS.
 */
export function CreditsDirector() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".d-deep .dd-credits");
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".dd-credits__item"));
    let held = false;
    const set = (i: number) => {
      if (root.dataset.active === String(i)) return;
      root.dataset.active = String(i);
      root.style.setProperty("--active", String(i));
    };
    const indexOf = (target: EventTarget | null) => {
      const item = (target as Element | null)?.closest<HTMLElement>(".dd-credits__item");
      return item ? Number(item.dataset.i) : -1;
    };
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const i = indexOf(event.target);
      if (i < 0) return;
      held = true;
      set(i);
    };
    const onLeave = () => {
      held = false;
    };
    const onFocus = (event: FocusEvent) => {
      const i = indexOf(event.target);
      if (i >= 0) set(i);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (held) return;
        for (const entry of entries) if (entry.isIntersecting) set(Number((entry.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    for (const item of items) io.observe(item);
    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
    };
  }, []);
  return null;
}
