"use client";

import { useEffect, useRef } from "react";

/**
 * The cursor, for mice only: a small red dot that trails the pointer, gone over links and buttons
 * (the native hand is enough there), and a disc over anything marked data-cursor. The disc reads
 * data-cursor-label ("View" by default) and plays that project's data-cursor-video inside itself,
 * or shows data-cursor-poster where a project has no loop. The native cursor is never hidden except
 * over the project rows the disc stands in for. Touch screens, reduced motion: nothing at all.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.closest<HTMLElement>(".d-kinetic");
    if (!el || !host) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches || document.documentElement.dataset.motion === "off") return;
    const disc = el.querySelector<HTMLElement>(".dk-cursor__disc");
    const video = el.querySelector<HTMLVideoElement>("video");
    const label = el.querySelector<HTMLElement>(".dk-cursor__label");
    if (!disc || !video || !label) return;
    video.muted = true;
    host.classList.add("dk-cur");

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let last = 0;
    let seen = false;
    let src = "";
    let target: HTMLElement | null = null;
    let state = "dot";

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(64, last ? now - last : 16);
      last = now;
      const k = 1 - Math.exp(-dt / 45);
      x += (tx - x) * k;
      y += (ty - y) * k;
      if (Math.abs(tx - x) < 0.15 && Math.abs(ty - y) < 0.15) {
        x = tx;
        y = ty;
        last = 0;
      } else raf = requestAnimationFrame(frame);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const apply = (t: HTMLElement | null, interactive: boolean) => {
      const next = t ? "view" : interactive ? "link" : "dot";
      if (t !== target) {
        target = t;
        if (t) {
          label.textContent = t.dataset.cursorLabel || "View";
          const poster = t.dataset.cursorPoster;
          disc.style.backgroundImage = poster ? `url("${poster}")` : "";
          const clip = t.dataset.cursorVideo || "";
          if (clip !== src) {
            src = clip;
            if (clip) video.src = clip;
            else {
              video.removeAttribute("src");
              video.load();
            }
          }
          el.toggleAttribute("data-media", !!clip || !!poster);
          if (clip) void video.play().catch(() => undefined);
        } else if (!video.paused) video.pause();
      }
      if (next !== state) {
        state = next;
        el.dataset.state = next;
      }
    };

    const probe = (node: Element | null) => {
      if (!node) return apply(null, false);
      apply(node.closest<HTMLElement>("[data-cursor]"), !!node.closest("a, button, input, label, select, textarea, summary"));
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) {
        seen = true;
        x = tx;
        y = ty;
        el.dataset.on = "";
      }
      kick();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      probe(e.target as Element);
    };
    const onOut = (e: PointerEvent) => {
      // Left the window.
      if (e.relatedTarget) return;
      seen = false;
      delete el.dataset.on;
      apply(null, false);
    };
    // Content scrolls under a resting pointer: check what is under it now, once per frame.
    let scrollRaf = 0;
    const onScroll = () => {
      if (!seen || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        probe(document.elementFromPoint(tx, ty));
      });
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible" && !video.paused) video.pause();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      host.classList.remove("dk-cur");
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <div ref={ref} className="dk-cursor" aria-hidden data-state="dot">
      <span className="dk-cursor__disc">
        <video className="dk-cursor__video" muted loop playsInline preload="none" tabIndex={-1} disablePictureInPicture />
        <span className="dk-cursor__label">View</span>
      </span>
    </div>
  );
}
