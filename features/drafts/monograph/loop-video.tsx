"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A short muted loop of the live site. Nothing downloads, not even the poster frame, until it is
 * near the screen; it plays only while in view, and under reduced motion it stays on its poster.
 */
export function LoopVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const approach = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        approach.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    const view = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduced.matches) {
          video.preload = "auto";
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { rootMargin: "120px 0px" },
    );
    approach.observe(video);
    view.observe(video);
    return () => {
      approach.disconnect();
      view.disconnect();
    };
  }, []);

  return <video ref={ref} className={className} src={src} poster={near ? poster : undefined} width={640} height={360} muted playsInline loop preload="none" />;
}
