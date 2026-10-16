"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
/** Spacing of the hatch lines under the surface (CSS px). */
const HATCH = 6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The water line through the title. A canvas laid between the solid title and an outline copy of
 * it: everything under the line is painted paper and hatched like a section cut, so the letters
 * below the surface read as outlines, half sunk. The first paint shows the same water, flat, in CSS
 * (grid.css); this takes over once the page is idle. The line is a sum of two slow sines that
 * swells with the page's scroll speed and lifts toward the pointer like a meniscus; a click
 * splashes it. It draws only while on screen; with reduced motion it is drawn once, still.
 */
export function HeroWave() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const box = canvas?.parentElement;
    const hero = box?.closest("section");
    if (!canvas || !box || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const css = getComputedStyle(box);
    const paper = css.getPropertyValue("--g-paper").trim() || "#ece9e1";
    const ink = css.getPropertyValue("--g-ink-rgb").trim() || "23 24 26";
    const paperRgb = css.getPropertyValue("--g-paper-rgb").trim() || "236 233 225";
    const level = () => parseFloat(getComputedStyle(box).getPropertyValue("--dg-level")) || 0.6;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let target = level();
    let shown = target;
    let t = 0;
    let energy = 0;
    let px = -1e4; // pointer x on the canvas
    let lift = 0; // meniscus height now
    let liftGoal = 0;
    let lastMove = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    let armed = false; // set once the faces are in and the page is idle

    // The canvas spans the viewport's width (the line runs edge to edge) and the title's height.
    const size = () => {
      const r = box.getBoundingClientRect();
      W = document.documentElement.clientWidth;
      H = box.clientHeight;
      canvas.style.left = `${-r.left}px`;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      target = level();
      lastBand = null; // resizing cleared the bitmap: the next frame repaints all of it
    };

    const surface = (x: number) => {
      const base = H * shown;
      const a1 = 2 + 9 * energy;
      const a2 = 1 + 4 * energy;
      const k1 = TAU / Math.max(240, W * 0.42);
      const k2 = TAU / Math.max(90, W * 0.13);
      const sigma = Math.max(56, W * 0.045);
      const bump = lift * Math.exp(-((x - px) ** 2) / (2 * sigma * sigma));
      return base + a1 * Math.sin(k1 * x + 0.9 * t) + a2 * Math.sin(k2 * x - 1.7 * t + 1.3) - bump;
    };

    // The hatching is one repeating tile (a hairline every HATCH px, at device resolution), so the
    // whole section cut is a single pattern fill, not a stroke per line.
    let hatch: CanvasPattern | null = null;
    let hatchDpr = 0;
    const hatchFor = () => {
      if (hatch && hatchDpr === dpr) return hatch;
      const tile = document.createElement("canvas");
      tile.width = 1;
      tile.height = Math.round(HATCH * dpr);
      const tc = tile.getContext("2d");
      if (!tc) return null;
      tc.fillStyle = `rgb(${ink} / 0.2)`;
      tc.fillRect(0, tile.height - 1, 1, 1);
      hatch = ctx.createPattern(tile, "repeat");
      hatchDpr = dpr;
      return hatch;
    };

    // Below the reach of the waves the water never changes, so a frame repaints only the band the
    // surface can occupy now or occupied last frame. A resize or a level change repaints it all.
    let lastBand: [number, number] | null = null;
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mean = H * shown;
      const reach = 3 + 13 * energy + lift + 3;
      const top = Math.max(0, Math.floor(mean - reach));
      const bottom = Math.min(H, Math.ceil(mean + reach));
      const settled = Math.abs(target - shown) < 1e-4;
      const [y0, y1] = lastBand && settled ? [Math.min(top, lastBand[0]), Math.max(bottom, lastBand[1])] : [0, H];
      lastBand = [top, bottom];
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y0, W, y1 - y0);
      ctx.clip();
      ctx.clearRect(0, y0, W, y1 - y0);
      const step = W > 900 ? 8 : 6;
      const line = new Path2D();
      line.moveTo(0, surface(0));
      for (let x = step; x < W + step; x += step) line.lineTo(x, surface(x));
      const body = new Path2D(line);
      body.lineTo(W, H + 2);
      body.lineTo(0, H + 2);
      body.closePath();
      // The water: paper over the solid letters, hatched, the hatching fading with depth.
      ctx.fillStyle = paper;
      ctx.fill(body);
      const base = H * shown;
      const pattern = hatchFor();
      if (pattern) {
        // Lines counted from the mean water level, as in the CSS first paint.
        pattern.setTransform(new DOMMatrix().translate(0, base).scale(1 / dpr));
        ctx.fillStyle = pattern;
        ctx.fill(body);
      }
      const fade = ctx.createLinearGradient(0, base, 0, H);
      fade.addColorStop(0, `rgb(${paperRgb} / 0)`);
      fade.addColorStop(1, `rgb(${paperRgb} / 0.8)`);
      ctx.fillStyle = fade;
      ctx.fill(body);
      // The surface itself.
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgb(${ink})`;
      ctx.stroke(line);
      ctx.restore();
    };

    // A calm sea is drawn at 30 fps; a stirred one (scroll, pointer, click) at the full rate. After
    // a few calm seconds it comes to rest (no frames at all) until something stirs it again.
    let tick = 0;
    let calmSince = 0;
    const REST_MS = 6000;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      t += dt;
      shown += (target - shown) * (1 - Math.exp(-4 * dt));
      energy *= Math.exp(-1.3 * dt);
      if (now - lastMove > 900) liftGoal *= Math.exp(-3 * dt);
      lift += (liftGoal - lift) * (1 - Math.exp(-7 * dt));
      const calm = energy < 0.03 && lift < 0.4 && liftGoal < 0.4;
      if (!calm) calmSince = now;
      if (!calm || ++tick % 2 === 0) draw();
      const resting = calm && now - calmSince > REST_MS;
      if (visible && !resting && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!armed) return;
      if (reduced.matches) {
        shown = target;
        t = 0;
        energy = 0;
        lift = 0;
        draw();
        return;
      }
      if (!raf && visible && document.visibilityState === "visible") {
        calmSince = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // Scroll speed swells the waves.
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(8, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      energy = Math.min(1, energy + v * 0.12);
      kick();
    };
    // The surface lifts toward the pointer, more for a quick hand.
    let lastPX = 0;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const speed = Math.abs(x - lastPX);
      lastPX = x;
      px = x;
      liftGoal = clamp(10 + speed * 0.6, 10, 26);
      lastMove = performance.now();
      energy = Math.min(1, energy + speed * 0.0015);
      kick();
    };
    const onClick = (e: MouseEvent) => {
      if (e.detail === 0) return;
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left;
      liftGoal = 34;
      lastMove = performance.now();
      energy = Math.min(1, energy + 0.55);
      kick();
    };

    size();
    const ro = new ResizeObserver(() => {
      size();
      kick();
    });
    ro.observe(box);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(box);

    // Rise once the faces are in (so the line meets the real letters) and the page has gone idle
    // (so the canvas never competes with loading).
    let cancelled = false;
    let idle = 0;
    // Safari has no requestIdleCallback; a short timeout stands in.
    const hasIdle = typeof window.requestIdleCallback === "function";
    // The CSS water is already at the level; the canvas draws the same surface, then shows itself
    // and hides the CSS layer in the same frame, and from then on the surface moves.
    const arm = () => {
      if (cancelled) return;
      size();
      armed = true;
      shown = target;
      draw();
      box.dataset.sized = "";
      kick();
    };
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      idle = hasIdle ? window.requestIdleCallback(arm, { timeout: 900 }) : window.setTimeout(arm, 200);
    });

    const onResize = () => {
      size();
      kick();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", kick);
    reduced.addEventListener("change", kick);
    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", kick);
      reduced.removeEventListener("change", kick);
      delete box.dataset.sized;
    };
  }, []);

  return <canvas ref={ref} className="dg-wave" aria-hidden />;
}
