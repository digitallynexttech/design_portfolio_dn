"use client";

import { useEffect, type RefObject } from "react";
import "./stage3d.css";

// How every page's 3D element runs (features/stage3d): a wrapper with a <canvas> in it, and a scene
// file the hook imports only once the wrapper comes near the screen, so three.js and the models are
// never part of a page's first load. While it loads, and wherever WebGL or the model fails, the
// wrapper shows whatever the element puts in it as its still (data-s3 = "live" | "off"). It draws
// only while on screen and the tab is visible. With reduced motion it draws one frame, still, and
// again only when its size changes.

export type Ctx = {
  /** Reduced motion: draw still frames only (frame() is called with dt 0). */
  still: boolean;
  /** Under 900 px: the lighter astronaut build, fewer pixels. */
  small: boolean;
  /** The element's wrapper (for its own pointer and scroll reading). */
  wrap: HTMLElement;
};

export type Mounted = {
  /** One frame: seconds since the last, and since it was mounted. */
  frame: (dt: number, t: number) => void;
  /** The canvas's CSS size changed. */
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

export type Mount = (canvas: HTMLCanvasElement, ctx: Ctx) => Promise<Mounted>;

/**
 * Runs a 3D element. `load` must be stable (a module-level function), and returns the scene file's
 * mount, e.g. `() => import("./lost.scene").then((m) => m.mount)`. `margin`: how far off screen it
 * starts loading.
 */
export function useThree3D(wrap: RefObject<HTMLElement | null>, load: () => Promise<Mount>, margin = "300px") {
  useEffect(() => {
    const el = wrap.current;
    const canvas = el?.querySelector("canvas");
    if (!el || !canvas) return;
    let live = true;
    let started = false;
    let m: Mounted | null = null;
    let raf = 0;
    let then = 0;
    let seen = false;
    const t0 = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = !window.matchMedia("(min-width: 900px)").matches;
    const size = (): [number, number] => {
      const r = canvas.getBoundingClientRect();
      return [Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height))];
    };

    const tick = (now: number) => {
      raf = 0;
      if (!m) return;
      const dt = then ? Math.min((now - then) / 1000, 0.1) : 1 / 60;
      then = now;
      m.frame(dt, (now - t0) / 1000);
      if (seen && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf && m && !still && seen && !document.hidden) {
        then = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const start = () => {
      if (started) return;
      started = true;
      load()
        .then((mount) => mount(canvas, { still, small, wrap: el }))
        .then((made) => {
          if (!live) return made.dispose();
          m = made;
          m.resize(...size());
          m.frame(0, 0);
          el.setAttribute("data-s3", "live");
          wake();
        })
        .catch(() => {
          if (live) el.setAttribute("data-s3", "off");
        });
    };

    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting;
        if (seen) start();
        wake();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => {
      if (!m) return;
      m.resize(...size());
      if (still) m.frame(0, 0);
    });
    ro.observe(canvas);
    const onVisible = () => wake();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      m?.dispose();
      m = null;
      el.removeAttribute("data-s3");
    };
  }, [wrap, load, margin]);
}
