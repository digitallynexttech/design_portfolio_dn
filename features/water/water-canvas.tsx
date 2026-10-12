"use client";

import { useEffect, useRef, useState } from "react";
import { TIER_SETTINGS, type Tier } from "@/features/stage/tier";
import { onDrop, onWaterVisibility } from "./bus";
import { type GL, sizeCanvas } from "./gl";
import { WaterSurface } from "./surface/water-surface";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

type Props = {
  tier: Exclude<Tier, 0>;
  onReady: () => void;
  onFail: () => void;
};

// The surface is soft caustics and ripples, so it renders under native resolution and is scaled up;
// only the strongest devices go above 1×.
const PIXEL_RATIO: Record<Exclude<Tier, 0>, number> = { 1: 0.75, 2: 1, 3: 1.25 };
// Full frame rate for a while after the water is touched or the page scrolls; ~30 fps while it idles.
const LIVELY_MS = 3000;
const IDLE_FRAME_MS = 33;
/** Real frames drawn before the canvas fades in over the CSS fallback. */
const READY_FRAMES = 3;

/** Builds the water's GL state and frame loop; returns how to tear it down. */
function start(canvas: HTMLCanvasElement, tier: Exclude<Tier, 0>, hooks: { ready: () => void; fail: () => void }): (() => void) | undefined {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  }) as GL | null;
  // Rendering into half-float targets needs one of these.
  if (!gl || !(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"))) {
    hooks.fail();
    return;
  }
  const pixelRatio = Math.min(PIXEL_RATIO[tier], window.devicePixelRatio || 1);
  // The canvas spans the large viewport (100lvh), so pointers map against its size, not the window's.
  // Until the observer reports it, the window's size stands in (reading the canvas's would force a layout).
  let width = window.innerWidth;
  let height = window.innerHeight;
  sizeCanvas(canvas, width, height, pixelRatio);
  const surface = new WaterSurface(gl, TIER_SETTINGS[tier], width, height);

  let raf = 0;
  let timer = 0;
  let last = 0;
  let frames = 0;
  const t0 = performance.now();
  // Start lively, so the first ripples and the fade-in run at full rate.
  let livelyUntil = t0 + LIVELY_MS;
  let compiled = false;
  let uncovered = true;
  let running = false;
  let disposed = false;

  // Lively: every frame. At rest: a timer waits out most of the gap first, so the page isn't asked
  // for a frame it has nothing to draw in (each one costs layout checks and observers).
  const schedule = (now: number) => {
    if (!running) return;
    if (now < livelyUntil) raf = requestAnimationFrame(frame);
    else
      timer = window.setTimeout(() => {
        timer = 0;
        raf = requestAnimationFrame(frame);
      }, IDLE_FRAME_MS - 12);
  };
  const scroll = () => Math.min(3, window.scrollY / Math.max(1, window.innerHeight));
  const frame = (now: number) => {
    raf = 0;
    const delta = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    surface.render(now, delta, (now - t0) / 1000, scroll());
    if (++frames === READY_FRAMES) {
      hooks.ready();
    }
    schedule(now);
  };
  const halt = () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(timer);
    raf = timer = 0;
  };
  const update = () => {
    const run = compiled && uncovered && !disposed && document.visibilityState === "visible";
    if (run === running) return;
    running = run;
    halt();
    if (run) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  const stir = () => {
    livelyUntil = performance.now() + LIVELY_MS;
    // Waiting out a rest frame: draw at full rate from the next frame instead.
    if (running && timer) {
      halt();
      raf = requestAnimationFrame(frame);
    }
  };
  const fail = () => {
    if (disposed) return;
    disposed = true;
    halt();
    hooks.fail();
  };

  surface.ready.then(() => {
    if (disposed) return;
    surface.warm((performance.now() - t0) / 1000, scroll());
    compiled = true;
    update();
  }, fail);

  const onLost = (event: Event) => {
    event.preventDefault();
    fail();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const resizeObserver = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    sizeCanvas(canvas, width, height, pixelRatio);
    surface.resize(width, height);
    stir();
  });
  resizeObserver.observe(canvas);

  // Pointer and touch stir the water; fast strokes are interpolated so they leave a continuous wake.
  let lastX = -1;
  let lastY = -1;
  let lastT = 0;
  const add = (x: number, y: number, strength: number, radius: number) => surface.addDrop({ x, y, strength, radius });
  const onMove = (event: PointerEvent) => {
    stir();
    const x = event.clientX / Math.max(1, width);
    const y = event.clientY / Math.max(1, height);
    const now = performance.now();
    if (lastX >= 0) {
      const aspect = width / Math.max(1, height);
      const distance = Math.hypot((x - lastX) * aspect, y - lastY);
      const seconds = Math.max(0.016, (now - lastT) / 1000);
      const touchBoost = event.pointerType === "touch" ? 1.5 : 1;
      const strength = Math.min(0.7, (distance / seconds) * 0.2) * touchBoost;
      if (strength > 0.015) {
        const segments = Math.min(4, Math.ceil(distance / 0.03));
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          add(lastX + (x - lastX) * t, lastY + (y - lastY) * t, strength, 0.028);
        }
      }
    }
    lastX = x;
    lastY = y;
    lastT = now;
  };
  const onDown = (event: PointerEvent) => {
    stir();
    add(event.clientX / Math.max(1, width), event.clientY / Math.max(1, height), 1.1, 0.04);
  };
  const offDrop = onDrop((drop) => {
    stir();
    surface.addDrop(drop);
  });
  // Nothing renders while the tab is hidden or something covers the water.
  const offCover = onWaterVisibility((value) => {
    uncovered = value;
    update();
  });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("scroll", stir, { passive: true });
  document.addEventListener("visibilitychange", update);

  return () => {
    disposed = true;
    running = false;
    halt();
    resizeObserver.disconnect();
    offDrop();
    offCover();
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("scroll", stir);
    document.removeEventListener("visibilitychange", update);
    surface.dispose();
    // Browsers cap live WebGL contexts; give this one back now rather than at garbage collection.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

/**
 * The water behind every page, on plain WebGL2. Its shaders compile in the background as soon as it
 * loads (usually while the home hero still covers it), and it draws only while it can be seen: not
 * while the tab is hidden or something covers it, at full rate while it's stirred and slower at rest.
 */
export default function WaterCanvas({ tier, onReady, onFail }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  // The parent's callbacks change identity on every render; the canvas is built once.
  const callbacks = useRef({ onReady, onFail });
  useEffect(() => {
    callbacks.current = { onReady, onFail };
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Set up in an idle moment, not inside the commit that mounted the canvas.
    const w = window as IdleWindow;
    let stop: (() => void) | undefined;
    let cancelled = false;
    const begin = () => {
      if (!cancelled) stop = start(canvas, tier, {
        ready: () => {
          setReady(true);
          callbacks.current.onReady();
        },
        fail: () => callbacks.current.onFail(),
      });
    };
    const hasIdle = typeof w.requestIdleCallback === "function";
    const idle = hasIdle ? w.requestIdleCallback!(begin, { timeout: 400 }) : window.setTimeout(begin, 30);
    return () => {
      cancelled = true;
      if (hasIdle) w.cancelIdleCallback?.(idle);
      else window.clearTimeout(idle);
      stop?.();
    };
  }, [tier]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        display: "block",
        width: "100%",
        // The large viewport: a phone's collapsing toolbar never resizes (and re-allocates) the canvas.
        height: "100lvh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: ready ? 1 : 0,
        transition: "opacity 900ms var(--ease-flow)",
      }}
    />
  );
}
