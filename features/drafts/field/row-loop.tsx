"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A study's still, with its 5-second live-site loop over it. With a mouse the loop plays while its
 * row is hovered or holds focus; on touch screens, while the still is mostly on screen. Nothing
 * downloads until then (preload="none"), and with reduced motion or Data Saver the still stays.
 */
export function RowLoop({ src, children, className = "" }: { src?: string; children: ReactNode; className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const v = el?.querySelector("video");
    if (!el || !v || !src) return;
    v.muted = true;
    const row = el.closest<HTMLElement>("[data-row]") ?? el;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const allowed = () => !saveData && document.documentElement.dataset.motion !== "off";
    const play = () => {
      if (!allowed()) return;
      if (!v.getAttribute("src")) v.src = src;
      void v
        .play()
        .then(() => (el.dataset.playing = "on"))
        .catch(() => undefined);
    };
    const stop = () => {
      v.pause();
      delete el.dataset.playing;
    };
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      const out = (e: FocusEvent) => {
        if (!row.contains(e.relatedTarget as Node | null)) stop();
      };
      row.addEventListener("pointerenter", play);
      row.addEventListener("pointerleave", stop);
      row.addEventListener("focusin", play);
      row.addEventListener("focusout", out);
      return () => {
        row.removeEventListener("pointerenter", play);
        row.removeEventListener("pointerleave", stop);
        row.removeEventListener("focusin", play);
        row.removeEventListener("focusout", out);
        stop();
      };
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.75 });
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [src]);

  return (
    <div ref={host} className={className}>
      {children}
      {src ? <video muted loop playsInline preload="none" aria-hidden tabIndex={-1} disablePictureInPicture /> : null}
    </div>
  );
}
