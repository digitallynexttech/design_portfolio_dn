"use client";

import { useEffect, useRef } from "react";

/**
 * A study's muted preview loop, laid over its still. Nothing downloads until the loop is both the
 * one selected and near the screen (preload="none", and no src until then); it plays only while at
 * least 40% of it is visible, and fades in over the still once frames are actually coming. Reduced
 * motion and Data Saver keep the still.
 */
export function LoopVideo({ src, active = true, className = "" }: { src: string; active?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const state = useRef({ near: false, seen: false, active });

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const sync = () => {
      const { near, seen, active } = state.current;
      const motion = !reduced.matches && document.documentElement.dataset.motion !== "off" && !saveData;
      if (near && active && motion && !video.getAttribute("src")) video.setAttribute("src", src);
      if (seen && active && motion && document.visibilityState === "visible") void video.play().catch(() => undefined);
      else if (!video.paused) video.pause();
    };
    const onPlaying = () => video.setAttribute("data-playing", "");
    const io = new IntersectionObserver(
      ([entry]) => {
        state.current.seen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.4 },
    );
    const near = new IntersectionObserver(
      ([entry]) => {
        state.current.near = entry.isIntersecting;
        sync();
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(video);
    near.observe(video);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ds-sync", sync);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      near.disconnect();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ds-sync", sync);
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [src]);

  useEffect(() => {
    state.current.active = active;
    ref.current?.dispatchEvent(new Event("ds-sync"));
  }, [active]);

  return (
    <video
      ref={ref}
      className={`ds-loop ${className}`}
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
