"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { hash, levelOf, paintSprites, setType, VMAX, type DotMap, type Palette } from "./dot-engine";

const FONT = '"Stack Sans Headline", "Stack Sans Headline Fallback", "Helvetica Neue", Arial, sans-serif';
const FONT_WEIGHT = 600;
const PALETTE: Palette = {
  bg: [14, 14, 13],
  off: [38, 38, 35],
  on: [244, 241, 233],
  red: [226, 31, 38],
  redHot: [255, 118, 120],
};

// The reveal: a scan front crosses the matrix and each lit dot flashes on as it passes.
const SWEEP = 820;
const JITTER = 180;
const RISE = 90;
const INTRO_MS = SWEEP + JITTER + RISE + 520;
// Ripples: rings that leave the pointer when it moves or presses.
const SPEED = 0.46; // px per ms
const LIFE = 1500;
const MAX_RIPPLES = 10;

type Ripple = { x: number; y: number; t0: number; amp: number };

const pad3 = (n: number) => String(Math.max(0, n)).padStart(3, "0");

/**
 * A dot-matrix display. The words are set in the headline face onto a grid of round dots and drawn
 * on a canvas: the dots near the pointer brighten, and moving or pressing sends ripples through the
 * matrix (on touch, from the finger). It draws only while something is changing, and stops when the
 * display is off screen.
 *
 * The real text is the children, painted first in CSS (dotted, in the same place), so the message is
 * there before any script, for readers without it and for screen readers (the canvas is aria-hidden).
 * With reduced motion the type is drawn once, already lit; the pointer still brightens the dots under it.
 */
export function DotDisplay({
  words,
  accentTail,
  className = "",
  justify = "start",
  align = "center",
  meta,
  children,
}: {
  words: string[];
  accentTail?: string;
  className?: string;
  justify?: "start" | "center";
  align?: "start" | "center" | "end";
  /** A part label under the display; with it come the live dot count and pointer coordinates. */
  meta?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sizeOut = useRef<HTMLSpanElement>(null);
  const xyOut = useRef<HTMLSpanElement>(null);
  const wordsKey = words.join("\u0001");

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    const list = wordsKey.split("\u0001");
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const still = () => reducedQuery.matches || document.documentElement.dataset.motion === "off";

    // Geometry, in device pixels unless noted.
    let dpr = 1;
    let P = 6; // pitch
    let pitch = 6; // pitch, CSS px
    let cols = 0;
    let rows = 0;
    let ox = 0;
    let oy = 0;
    let map: DotMap = new Uint8Array(0);
    let cx = new Float32Array(0); // dot centres, CSS px within the box
    let cy = new Float32Array(0);
    let sprites: HTMLCanvasElement | null = null;
    let field: HTMLCanvasElement | null = null; // every dot unlit
    let rest: HTMLCanvasElement | null = null; // the type lit, at rest

    let armed = false;
    let visible = false;
    let introAt = -1; // when the reveal started; -1 not yet
    let introDone = false;
    let raf = 0;

    // Pointer: where it is, where the glow is (eased), and how strong the glow is.
    let px = 0;
    let py = 0;
    let gx = 0;
    let gy = 0;
    let gI = 0;
    let gTarget = 0;
    const ripples: Ripple[] = [];
    let spawnX = -1e4;
    let spawnY = -1e4;
    let spawnT = 0;

    const layer = () => {
      const c = document.createElement("canvas");
      c.width = cv.width;
      c.height = cv.height;
      return c;
    };

    const layout = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return false;
      const css = getComputedStyle(el);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      P = Math.max(3, Math.round((parseFloat(css.getPropertyValue("--dot")) || 6) * dpr));
      pitch = P / dpr;
      const margin = parseFloat(css.getPropertyValue("--dot-margin")) || 3;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      cols = Math.floor(cv.width / P);
      rows = Math.floor(cv.height / P);
      ox = Math.floor((cv.width - cols * P) / 2);
      oy = Math.floor((cv.height - rows * P) / 2);
      map = setType({
        words: list,
        accentTail,
        cols,
        rows,
        family: FONT,
        weight: FONT_WEIGHT,
        margin,
        justify,
        align,
        tracking: 0.025,
      }).map;
      const n = cols * rows;
      cx = new Float32Array(n);
      cy = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        cx[i] = (ox + (i % cols) * P + P / 2) / dpr;
        cy[i] = (oy + Math.floor(i / cols) * P + P / 2) / dpr;
      }
      sprites = paintSprites(PALETTE, P);
      field = layer();
      rest = layer();
      const f = field.getContext("2d");
      const s = rest.getContext("2d");
      if (!f || !s) return false;
      f.fillStyle = `rgb(${PALETTE.bg.join(" ")})`;
      f.fillRect(0, 0, field.width, field.height);
      for (let i = 0; i < n; i++) f.drawImage(sprites, 0, 0, P, P, ox + (i % cols) * P, oy + Math.floor(i / cols) * P, P, P);
      s.drawImage(field, 0, 0);
      const on = levelOf(1) * P;
      for (let i = 0; i < n; i++) {
        if (!map[i]) continue;
        s.drawImage(sprites, on, map[i] === 2 ? P : 0, P, P, ox + (i % cols) * P, oy + Math.floor(i / cols) * P, P, P);
      }
      if (sizeOut.current) sizeOut.current.textContent = `${cols} × ${rows}`;
      return true;
    };

    const draw = (now: number) => {
      if (!sprites || !field || !rest) return;
      const intro = !introDone && introAt >= 0;
      const it = now - introAt;
      ctx.drawImage(intro ? field : rest, 0, 0);
      const R = Math.max(64, pitch * 13);
      const glow = gI > 0.003;
      const front = intro ? (it / SWEEP) * (cols + 8) - 4 : -99;
      const width = Math.max(9, pitch * 1.7);
      const n = cols * rows;
      for (let i = 0; i < n; i++) {
        const lit = map[i];
        const c = i % cols;
        let base = lit ? 1 : 0;
        let add = 0;
        if (intro) {
          if (lit) {
            const on = (c / cols) * SWEEP + hash(i) * JITTER;
            const x = (it - on) / RISE;
            base = x <= 0 ? 0 : x < 1 ? 1.5 * x : 1 + 0.5 * Math.exp(-(x - 1) * 0.6);
          }
          const dc = Math.abs(c - front);
          if (dc < 3) add += 0.34 * (1 - dc / 3);
        }
        if (glow) {
          const dx = cx[i] - gx;
          const dy = cy[i] - gy;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const f = 1 - Math.sqrt(d2) / R;
            add += gI * f * f * (lit ? 0.45 : 0.78);
          }
        }
        for (let k = 0; k < ripples.length; k++) {
          const rp = ripples[k];
          const age = now - rp.t0;
          const dx = cx[i] - rp.x;
          const dy = cy[i] - rp.y;
          const delta = Math.sqrt(dx * dx + dy * dy) - age * SPEED;
          if (delta > 3 * width || delta < -3 * width) continue;
          const q = delta / width;
          add += rp.amp * Math.exp(-age / 520) * Math.exp(-q * q) * (lit ? 0.5 : 1);
        }
        if (intro ? base + add < 0.015 : add < 0.015) continue;
        const v = Math.min(VMAX, base + add);
        ctx.drawImage(sprites, levelOf(v) * P, lit === 2 ? P : 0, P, P, ox + c * P, oy + Math.floor(i / cols) * P, P, P);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const quiet = still();
      const k = quiet ? 1 : 0.3;
      gx += (px - gx) * k;
      gy += (py - gy) * k;
      gI += (gTarget - gI) * (quiet ? 1 : 0.14);
      let moving = Math.abs(gTarget - gI) > 0.004 || Math.abs(px - gx) + Math.abs(py - gy) > 0.4;
      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 > LIFE) ripples.splice(i, 1);
      if (ripples.length) moving = true;
      if (!introDone && introAt >= 0) {
        if (now - introAt > INTRO_MS) introDone = true;
        else moving = true;
      }
      draw(now);
      if (moving && visible && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (armed && !raf && visible && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
    };

    const startIntro = () => {
      if (introAt >= 0 || introDone) return;
      if (still()) {
        introDone = true;
        return;
      }
      introAt = performance.now();
    };

    // ---- Pointer ----
    const locate = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (gI < 0.02) {
        gx = px;
        gy = py;
      }
      if (xyOut.current && P) {
        const c = Math.floor((px * dpr - ox) / P);
        const rr = Math.floor((py * dpr - oy) / P);
        xyOut.current.textContent = `X ${pad3(c)} · Y ${pad3(rr)}`;
      }
    };
    const ripple = (amp: number) => {
      if (still()) return;
      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      ripples.push({ x: px, y: py, t0: performance.now(), amp });
      spawnX = px;
      spawnY = py;
      spawnT = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && e.buttons === 0) return;
      locate(e);
      gTarget = 1;
      const now = performance.now();
      if (Math.hypot(px - spawnX, py - spawnY) > pitch * 5 && now - spawnT > 70) ripple(0.42);
      kick();
    };
    const onDown = (e: PointerEvent) => {
      locate(e);
      gTarget = 1;
      ripple(1.1);
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        gTarget = 0;
        kick();
      }
    };
    const onLeave = () => {
      gTarget = 0;
      if (xyOut.current) xyOut.current.textContent = "X ––– · Y –––";
      kick();
    };

    // ---- Lifecycle ----
    let cancelled = false;
    let idle = 0;
    const hasIdle = typeof window.requestIdleCallback === "function";
    const arm = () => {
      if (cancelled || !layout()) return;
      armed = true;
      el.dataset.live = "";
      if (visible) startIntro();
      draw(performance.now());
      kick();
    };
    // The face must be in before the type is set, or the matrix would spell the fallback font.
    const fontReady = document.fonts?.load(`${FONT_WEIGHT} 64px "Stack Sans Headline"`).catch(() => undefined) ?? Promise.resolve();
    void fontReady.then(() => {
      if (cancelled) return;
      idle = hasIdle ? window.requestIdleCallback(arm, { timeout: 700 }) : window.setTimeout(arm, 120);
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && armed) startIntro();
      kick();
    });
    io.observe(el);

    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      if (!armed) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!layout()) return;
        draw(performance.now());
        kick();
      });
    });
    ro.observe(el);

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointerup", onUp, { passive: true });
    el.addEventListener("pointercancel", onUp, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    document.addEventListener("visibilitychange", kick);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", kick);
      delete el.dataset.live;
    };
  }, [wordsKey, accentTail, justify, align]);

  return (
    <div className={`ds-dots-wrap ${className}`}>
      <div ref={box} className="ds-dots">
        <div className="ds-dots__fallback">{children}</div>
        <canvas ref={canvas} className="ds-dots__canvas" aria-hidden />
      </div>
      {meta ? (
        <p className="ds-dots__meta" aria-hidden>
          <span className="ds-dots__part">{meta}</span>
          <span ref={sizeOut} className="ds-num">
            – × –
          </span>
          <span className="ds-dots__rule" />
          <span ref={xyOut} className="ds-num ds-dots__xy">
            X ––– · Y –––
          </span>
        </p>
      ) : null}
    </div>
  );
}
