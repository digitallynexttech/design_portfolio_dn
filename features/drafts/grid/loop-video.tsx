"use client";

import { useEffect, useRef } from "react";

/**
 * A study's muted preview loop. Nothing downloads until it is wanted (preload="none"; the poster is
 * the only request), it plays only while at least half of it is on screen (and, in a viewer, only
 * while its row is the active one), and with reduced motion or Data Saver it stays on its poster.
 */
export function LoopVideo({
  src,
  poster,
  active = true,
  className = "",
}: {
  src: string;
  poster: string;
  active?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const state = useRef({ seen: false, active });

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const sync = () => {
      const { seen, active } = state.current;
      if (seen && active && !reduced.matches && !saveData && document.visibilityState === "visible") {
        void video.play().catch(() => undefined);
      } else if (!video.paused) video.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        state.current.seen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.5 },
    );
    io.observe(video);
    // The poster is fetched only as the video nears the screen, so it never competes with the
    // first paint for bandwidth.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        video.poster = poster;
        near.disconnect();
      },
      { rootMargin: "150% 0px" },
    );
    near.observe(video);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("dg-sync", sync);
    return () => {
      io.disconnect();
      near.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("dg-sync", sync);
      video.pause();
    };
  }, [poster]);

  // A viewer switches rows without re-observing: record the new state and resync.
  useEffect(() => {
    state.current.active = active;
    ref.current?.dispatchEvent(new Event("dg-sync"));
  }, [active]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}
