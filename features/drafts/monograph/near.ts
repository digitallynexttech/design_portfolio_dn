"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True once the element comes within `margin` of the screen, and from then on. Used to hold back
 * downloads (logos, video posters, index plates) until a reader is about to reach them, so they
 * never compete with the title page for the first bytes.
 */
export function useNear<T extends Element>(margin = "600px 0px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);
  return [ref, near] as const;
}
