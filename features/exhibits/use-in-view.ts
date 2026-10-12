"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the element is on screen and the tab is visible; exhibits stop rendering otherwise. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "0px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let intersecting = false;
    const update = () => setInView(intersecting && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        update();
      },
      { rootMargin },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref, rootMargin]);
  return inView;
}

// Exhibits ask every frame; one live query object answers without re-parsing the media query.
let reducedMotion: MediaQueryList | undefined;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  reducedMotion ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return reducedMotion.matches;
}
