"use client";

import { useEffect, useRef } from "react";

/**
 * A muted preview loop over its own poster (the poster is rendered by the parent, underneath). The
 * file is only fetched once the frame is on screen, plays only while it is, and never plays with
 * reduced motion, where the poster stays. Decorative: the case's text says what it shows.
 */
export function LoopVideo({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return;
    let inView = false;
    const sync = () => {
      if (inView && !reduced.matches && document.visibilityState === "visible") {
        if (!video.getAttribute("src")) video.setAttribute("src", src);
        void video.play().catch(() => undefined);
      } else if (!video.paused) video.pause();
    };
    const onPlaying = () => video.setAttribute("data-playing", "");
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    video.addEventListener("playing", onPlaying);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      // A page left behind stays mounted but hidden: never keep decoding video there.
      video.pause();
      io.disconnect();
      video.removeEventListener("playing", onPlaying);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [src]);

  return <video ref={ref} className={`dc-loop ${className}`} muted playsInline loop preload="none" aria-hidden tabIndex={-1} />;
}
