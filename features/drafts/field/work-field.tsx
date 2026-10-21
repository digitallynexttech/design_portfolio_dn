"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { whenEngaged } from "@/features/stage/engage";
import { TileSheet } from "./tile-sheet";
import type { FieldStudy, FieldTile } from "./types";

type Props = {
  tiles: FieldTile[];
  studies: Record<string, FieldStudy>;
  period: { w: number; h: number };
  start: { x: number; y: number };
  /** "Play reel", rendered on the server (it joins the chapter data there). */
  reel: ReactNode;
  reelLength: string;
};

/** Ruler labels every 400 fu (the period is 7 × 5 of them); ticks every 50. */
const RULER = 400;
const pad4 = (n: number) => String(n).padStart(4, "0");
const mod = (a: number, n: number) => ((a % n) + n) % n;
const wrap = (a: number, n: number) => mod(a + n / 2, n) - n / 2;

/** Tile images are drawn at --s × their size in fu; --s steps with the viewport (field.css). */
function sizesFor(w: number) {
  return `(max-width: 639px) ${Math.round(w * 0.6)}px, (max-width: 1023px) ${Math.round(w * 0.8)}px, (max-width: 1599px) ${w}px, (max-width: 2099px) ${Math.round(w * 1.15)}px, ${Math.round(w * 1.4)}px`;
}

/**
 * The hero: every frame of every study on one endless field. Drag it (mouse, pen or a sideways
 * swipe; a vertical swipe still scrolls the page), fling it, or focus it and step between frames
 * with the arrow keys. The frame under the crosshair is selected, design-tool style: red bounds,
 * handles and its pixel size; held still, it plays its study's live-site loop. Click, tap or Enter
 * opens it in a sheet. The wheel is never taken: only a sideways trackpad swipe pans.
 *
 * One requestAnimationFrame loop writes transforms straight to the DOM and stops as soon as
 * nothing is moving. The server paints the first frame in place, so nothing jumps on hydration.
 */
export function WorkField({ tiles, studies, period, start, reel, reelLength }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const opener = useRef<(id: string | null) => void>(() => undefined);
  const [sheet, setSheet] = useState<string | null>(null);
  const [warm, setWarm] = useState(false);

  // Frames off the first screen wait until someone is actually here, then all load quietly.
  useEffect(() => whenEngaged(() => setWarm(true), 2500), []);

  useEffect(() => {
    const vp = viewport.current;
    const hudEl = hud.current;
    if (!vp || !hudEl) return;
    const W = period.w;
    const H = period.h;
    const els = tiles.map((t) => vp.querySelector<HTMLElement>(`[data-tile="${t.id}"]`));
    // Near (large) frames move more than far (small) ones.
    const depth = tiles.map((t) => (t.w * t.h > 150_000 ? 1.5 : t.w * t.h > 38_000 ? 1 : 0.55));
    const cross = vp.querySelector<HTMLElement>(".df-cross");
    const grid = vp.querySelector<HTMLElement>(".df-grid");
    const cursor = vp.querySelector<HTMLElement>(".df-cursor");
    let cursorWord = "";
    const readout = vp.querySelector<HTMLElement>("[data-readout]");
    const rulerX = vp.querySelector<HTMLElement>("[data-ruler='x']");
    const rulerY = vp.querySelector<HTMLElement>("[data-ruler='y']");
    const labelsX = rulerX ? [...rulerX.querySelectorAll<HTMLElement>("span")] : [];
    const labelsY = rulerY ? [...rulerY.querySelectorAll<HTMLElement>("span")] : [];
    const map = hudEl.querySelector<HTMLElement>("[data-map]");
    const views = map ? [...map.querySelectorAll<HTMLElement>("[data-view]")] : [];
    const dots = map ? [...map.querySelectorAll<HTMLElement>("[data-dot]")] : [];
    const tName = hudEl.querySelector<HTMLElement>("[data-target-name]");
    const tMeta = hudEl.querySelector<HTMLElement>("[data-target-meta]");

    // The reel's button lives inside its frame; keyboard users reach it from the field (Enter) and
    // from the showreel below, so it isn't a separate, often off-screen, tab stop.
    vp.querySelector<HTMLElement>(".df-tile--reel button")?.setAttribute("tabindex", "-1");

    const motion = () => document.documentElement.dataset.motion !== "off";
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

    let s = 1;
    let vw = 0;
    let vh = 0;
    let ax = 0;
    let ay = 0;
    const cam = { x: start.x, y: start.y };
    const prev = { x: start.x, y: start.y };
    const vel = { x: 0, y: 0 }; // fu per ms
    const goal = { x: 0, y: 0 };
    const lag = { x: 0, y: 0 }; // px: frames trail the camera a little, by depth
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }; // pointer parallax, -1…1
    let mode: "idle" | "drag" | "inertia" | "glide" = "idle";
    let raf = 0;
    let last = 0;
    let target = -1;
    let announce = false;
    let shownX = "";
    let shownY = "";
    let baseX = Number.NaN;
    let baseY = Number.NaN;

    const measure = () => {
      s = parseFloat(getComputedStyle(vp).getPropertyValue("--s")) || 1;
      vw = vp.clientWidth;
      vh = vp.clientHeight;
      ax = cross?.offsetLeft ?? vw / 2;
      ay = cross?.offsetTop ?? vh / 2;
      if (map) {
        const m = map.clientWidth / W;
        for (const v of views) {
          v.style.width = `${(vw / s) * m}px`;
          v.style.height = `${(vh / s) * m}px`;
        }
      }
      baseX = baseY = Number.NaN;
    };

    // ---------- Loops: a held or hovered frame plays its study's live-site recording ----------
    // Nothing streams until the visitor engages (Lighthouse and idle tabs never pull a loop).
    let engaged = false;
    let loopTimer = 0;
    let playing: HTMLElement | null = null;
    const stopLoop = () => {
      window.clearTimeout(loopTimer);
      if (!playing) return;
      playing.querySelector("video")?.pause();
      delete playing.dataset.playing;
      playing = null;
    };
    const playLoop = (el: HTMLElement | null, delay: number) => {
      window.clearTimeout(loopTimer);
      if (!el || !engaged || saveData || !motion() || playing === el) return;
      const video = el.querySelector<HTMLVideoElement>("video[data-src]");
      if (!video) return;
      loopTimer = window.setTimeout(() => {
        stopLoop();
        if (!video.getAttribute("src")) video.src = video.dataset.src ?? "";
        video.muted = true;
        playing = el;
        void video
          .play()
          .then(() => {
            if (playing === el) el.dataset.playing = "on";
          })
          .catch(() => undefined);
      }, delay);
    };

    const setTarget = (i: number) => {
      if (i === target) return;
      if (target >= 0) delete els[target]?.dataset.target;
      target = i;
      if (i < 0) {
        if (tName) tName.textContent = "-";
        if (tMeta) tMeta.textContent = "";
        dots.forEach((d) => delete d.dataset.on);
        return;
      }
      const t = tiles[i];
      els[i]?.setAttribute("data-target", "on");
      dots.forEach((d, k) => (k === i ? (d.dataset.on = "on") : delete d.dataset.on));
      const study = t.slug ? studies[t.slug] : null;
      const name = study ? study.client : "Showreel";
      const meta = study ? study.disciplines.join(", ") : `${reelLength} · No sound`;
      if (tName) tName.textContent = name;
      if (tMeta) tMeta.textContent = `${t.code} · ${meta}`;
      if (announce && live.current) live.current.textContent = `${name}. ${meta}. Enter opens it.`;
    };

    const pick = () => {
      // Selected means under the crosshair, or within a short reach of it.
      let best = -1;
      let bestD = 70;
      let bestC = Infinity;
      tiles.forEach((t, i) => {
        const dx = wrap(t.cx - cam.x, W);
        const dy = wrap(t.cy - cam.y, H);
        const edge = Math.hypot(Math.max(0, Math.abs(dx) - t.w / 2), Math.max(0, Math.abs(dy) - t.h / 2));
        const centre = Math.hypot(dx, dy);
        if (edge < bestD || (edge === 0 && bestD === 0 && centre < bestC)) {
          best = i;
          bestD = edge;
          bestC = centre;
        }
      });
      setTarget(best);
    };

    const render = () => {
      const Ws = W * s;
      const Hs = H * s;
      const left0 = vw / 2 - Ws / 2;
      const top0 = vh / 2 - Hs / 2;
      const ox = lag.x + tilt.x * -12;
      const oy = lag.y + tilt.y * -9;
      for (let i = 0; i < tiles.length; i++) {
        const el = els[i];
        if (!el) continue;
        const t = tiles[i];
        const d = depth[i];
        const px = mod(ax + (t.cx - cam.x) * s - left0, Ws) + left0;
        const py = mod(ay + (t.cy - cam.y) * s - top0, Hs) + top0;
        const x = px - ax - (t.w * s) / 2 + ox * d;
        const y = py - ay - (t.h * s) / 2 + oy * d;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }

      // The dot grid: one cell of travel, repeated.
      if (grid) {
        const g = 50 * s;
        grid.style.transform = `translate3d(${mod(ax - cam.x * s, g).toFixed(1)}px, ${mod(ay - cam.y * s, g).toFixed(1)}px, 0)`;
      }

      // The crosshair's coordinates, within the period.
      const rx = pad4(mod(Math.round(cam.x), W));
      const ry = pad4(mod(Math.round(cam.y), H));
      if (readout && (rx !== shownX || ry !== shownY)) {
        readout.textContent = `X ${rx} · Y ${ry}`;
        shownX = rx;
        shownY = ry;
      }

      // Rulers: a strip of labels that slides with the field; the labels change only on a step.
      if (rulerX) {
        const x0 = Math.floor((cam.x - ax / s) / RULER) * RULER;
        rulerX.style.transform = `translate3d(${(ax + (x0 - cam.x) * s).toFixed(1)}px, 0, 0)`;
        if (x0 !== baseX) {
          baseX = x0;
          labelsX.forEach((l, k) => (l.textContent = pad4(mod(x0 + k * RULER, W))));
        }
      }
      if (rulerY) {
        const y0 = Math.floor((cam.y - ay / s) / RULER) * RULER;
        rulerY.style.transform = `translate3d(0, ${(ay + (y0 - cam.y) * s).toFixed(1)}px, 0)`;
        if (y0 !== baseY) {
          baseY = y0;
          labelsY.forEach((l, k) => (l.textContent = pad4(mod(y0 + k * RULER, H))));
        }
      }

      // The map: where the screen is in the period (four copies cover the wrap).
      if (map && views.length) {
        const m = map.clientWidth / W;
        const mx = mod(cam.x - ax / s, W) * m;
        const my = mod(cam.y - ay / s, H) * m;
        views.forEach((v, k) => {
          const vx = mx - (k & 1 ? W * m : 0);
          const vy = my - (k & 2 ? H * m : 0);
          v.style.transform = `translate3d(${vx.toFixed(1)}px, ${vy.toFixed(1)}px, 0)`;
        });
      }
      pick();
    };

    const step = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(48, now - last) : 16.7;
      last = now;
      let busy = false;
      const animate = motion();

      if (mode === "inertia") {
        cam.x += vel.x * dt;
        cam.y += vel.y * dt;
        const k = Math.exp(-dt / 330);
        vel.x *= k;
        vel.y *= k;
        if (Math.hypot(vel.x, vel.y) * s < 0.012) mode = "idle";
        else busy = true;
      } else if (mode === "glide") {
        const k = animate ? 1 - Math.exp(-dt / 150) : 1;
        cam.x += (goal.x - cam.x) * k;
        cam.y += (goal.y - cam.y) * k;
        if (Math.abs(goal.x - cam.x) < 0.25 && Math.abs(goal.y - cam.y) < 0.25) {
          cam.x = goal.x;
          cam.y = goal.y;
          mode = "idle";
        } else busy = true;
      }

      // Depth: frames trail the camera by their depth, then settle.
      if (animate) {
        const cvx = ((cam.x - prev.x) * s) / dt;
        const cvy = ((cam.y - prev.y) * s) / dt;
        const clamp = (v: number) => Math.max(-22, Math.min(22, v));
        const lk = 1 - Math.exp(-dt / 120);
        lag.x += (clamp(cvx * 9) - lag.x) * lk;
        lag.y += (clamp(cvy * 9) - lag.y) * lk;
        const tk = 1 - Math.exp(-dt / 260);
        tilt.x += (tilt.tx - tilt.x) * tk;
        tilt.y += (tilt.ty - tilt.y) * tk;
        if (Math.abs(lag.x) + Math.abs(lag.y) > 0.08 || Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.01) busy = true;
      } else {
        lag.x = lag.y = tilt.x = tilt.y = 0;
      }
      prev.x = cam.x;
      prev.y = cam.y;

      render();
      if (busy || mode === "drag") {
        if (busy) raf = requestAnimationFrame(step);
        else last = 0;
      } else {
        last = 0;
        settle();
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    // At rest: the frame under the crosshair plays its loop after a beat.
    const settle = () => {
      announce = false;
      if (target >= 0 && tiles[target].loop) playLoop(els[target], 450);
    };

    const glideTo = (x: number, y: number) => {
      goal.x = cam.x + wrap(x - cam.x, W);
      goal.y = cam.y + wrap(y - cam.y, H);
      vel.x = vel.y = 0;
      mode = "glide";
      stopLoop();
      kick();
    };

    // ---------- Pointer: drag with inertia; a sideways swipe on touch (pan-y lets vertical scroll) ----------
    type Sample = { t: number; x: number; y: number };
    let drag: {
      id: number;
      touch: boolean;
      sx: number;
      sy: number;
      x: number;
      y: number;
      cx: number;
      cy: number;
      moved: boolean;
      samples: Sample[];
    } | null = null;
    let suppress = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      suppress = false;
      drag = {
        id: e.pointerId,
        touch: e.pointerType === "touch",
        sx: e.clientX,
        sy: e.clientY,
        x: e.clientX,
        y: e.clientY,
        cx: cam.x,
        cy: cam.y,
        moved: false,
        samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
      };
      // Catch a moving field.
      if (mode === "inertia" || mode === "glide") {
        mode = "idle";
        vel.x = vel.y = 0;
      }
    };
    // With a mouse, a small label rides beside the pointer: what a press will do here.
    const moveCursor = (e: PointerEvent) => {
      if (!cursor || e.pointerType !== "mouse") return;
      const r = vp.getBoundingClientRect();
      cursor.style.transform = `translate3d(${(e.clientX - r.left + 14).toFixed(0)}px, ${(e.clientY - r.top + 16).toFixed(0)}px, 0)`;
      const over = (e.target as Element).closest?.("[data-tile]");
      const word = drag?.moved ? "" : over?.classList.contains("df-tile--reel") ? "Play" : over ? "Open" : "Drag";
      if (word !== cursorWord) {
        cursorWord = word;
        if (word) cursor.textContent = word;
        cursor.dataset.on = word ? "on" : "";
      }
    };
    const onMove = (e: PointerEvent) => {
      moveCursor(e);
      if (!drag) {
        if (e.pointerType === "mouse" && finePointer.matches && motion()) {
          tilt.tx = ((e.clientX - vp.getBoundingClientRect().left) / vw - 0.5) * 2;
          tilt.ty = ((e.clientY - vp.getBoundingClientRect().top) / vh - 0.5) * 2;
          kick();
        }
        return;
      }
      if (e.pointerId !== drag.id) return;
      if (!drag.moved) {
        const mx = Math.abs(e.clientX - drag.sx);
        const my = Math.abs(e.clientY - drag.sy);
        if (Math.hypot(mx, my) < 6) return;
        // On touch, a mostly vertical start belongs to the page: the browser scrolls (pan-y) and
        // cancels this pointer, so the field waits rather than nudging.
        if (drag.touch && my > mx) return;
        drag.moved = true;
        mode = "drag";
        stopLoop();
        try {
          vp.setPointerCapture(e.pointerId);
        } catch {
          // The pointer is already gone.
        }
        vp.dataset.drag = "on";
      }
      cam.x -= (e.clientX - drag.x) / s;
      cam.y -= (e.clientY - drag.y) / s;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 120) drag.samples.shift();
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        suppress = true;
        delete vp.dataset.drag;
        const first = drag.samples[0];
        const lastS = drag.samples[drag.samples.length - 1];
        const dt = e.timeStamp - first.t;
        // A fling: the last ~120 ms of travel, if the pointer was still moving when it let go.
        if (motion() && dt > 8 && e.timeStamp - lastS.t < 100) {
          const cap = 5 / s;
          vel.x = Math.max(-cap, Math.min(cap, -(e.clientX - first.x) / dt / s));
          vel.y = Math.max(-cap, Math.min(cap, -(e.clientY - first.y) / dt / s));
          mode = "inertia";
        } else mode = "idle";
        kick();
      }
      drag = null;
    };
    const onCancel = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      // The browser took the gesture (a page scroll): the field goes back to where it was.
      if (drag.moved) {
        cam.x = drag.cx;
        cam.y = drag.cy;
      }
      drag = null;
      mode = "idle";
      delete vp.dataset.drag;
      kick();
    };
    const onLeave = () => {
      if (cursor) cursor.dataset.on = "";
      cursorWord = "";
      tilt.tx = tilt.ty = 0;
      kick();
    };
    // After a drag, the click that follows is not a click on a frame.
    const onClickCapture = (e: MouseEvent) => {
      if (!suppress) return;
      suppress = false;
      e.preventDefault();
      e.stopPropagation();
    };
    // A sideways trackpad swipe (or shift + wheel) pans; vertical scrolling is left to the page.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      if (mode !== "idle") mode = "idle";
      cam.x += (e.deltaX * unit) / s;
      stopLoop();
      kick();
    };

    // Hover plays a frame's loop at once (mouse only).
    const enter = (i: number) => () => {
      if (!drag && tiles[i].loop) playLoop(els[i], 120);
    };
    const leave = (i: number) => () => {
      if (playing === els[i] && target !== i) stopLoop();
      else if (playing !== els[i]) window.clearTimeout(loopTimer);
    };
    const hoverOff: (() => void)[] = [];
    els.forEach((el, i) => {
      if (!el || !tiles[i].loop) return;
      const a = enter(i);
      const b = leave(i);
      el.addEventListener("pointerenter", a);
      el.addEventListener("pointerleave", b);
      hoverOff.push(() => {
        el.removeEventListener("pointerenter", a);
        el.removeEventListener("pointerleave", b);
      });
    });

    // The map: click anywhere on it to fly there.
    const onMap = (e: PointerEvent) => {
      if (!map) return;
      const r = map.getBoundingClientRect();
      glideTo(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    };

    // ---------- Keyboard: arrows step to the next frame that way; Enter opens; Home returns ----------
    const nearestToward = (dirX: number, dirY: number) => {
      let best = -1;
      let bestCost = Infinity;
      tiles.forEach((t, i) => {
        const dx = wrap(t.cx - cam.x, W);
        const dy = wrap(t.cy - cam.y, H);
        const along = dx * dirX + dy * dirY;
        const across = Math.abs(dirX ? dy : dx);
        if (along < 40) return;
        const cost = along + across * 2.2;
        if (cost < bestCost) {
          bestCost = cost;
          best = i;
        }
      });
      return best;
    };
    const keys = (e: globalThis.KeyboardEvent) => {
      const onField = e.target === vp;
      const dirs: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      const dir = dirs[e.key];
      if (dir) {
        e.preventDefault();
        const i = nearestToward(dir[0], dir[1]);
        if (i >= 0) {
          announce = true;
          glideTo(tiles[i].cx, tiles[i].cy);
        }
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        announce = true;
        glideTo(start.x, start.y);
        return;
      }
      if (onField && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        if (target >= 0) open(target);
      }
    };

    const open = (i: number) => {
      const t = tiles[i];
      if (t.kind === "reel") {
        els[i]?.querySelector<HTMLButtonElement>("button")?.click();
        return;
      }
      stopLoop();
      opener.current(t.id);
    };

    measure();
    render();
    vp.dataset.live = "on";
    const stopEngage = whenEngaged(() => {
      engaged = true;
      if (mode === "idle") settle();
    }, 800);

    const ro = new ResizeObserver(() => {
      measure();
      render();
    });
    ro.observe(vp);
    vp.addEventListener("pointerdown", onDown);
    vp.addEventListener("pointermove", onMove);
    vp.addEventListener("pointerup", onUp);
    vp.addEventListener("pointercancel", onCancel);
    vp.addEventListener("pointerleave", onLeave);
    vp.addEventListener("click", onClickCapture, true);
    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("keydown", keys);
    map?.addEventListener("pointerdown", onMap);

    return () => {
      stopEngage();
      cancelAnimationFrame(raf);
      stopLoop();
      ro.disconnect();
      hoverOff.forEach((off) => off());
      vp.removeEventListener("pointerdown", onDown);
      vp.removeEventListener("pointermove", onMove);
      vp.removeEventListener("pointerup", onUp);
      vp.removeEventListener("pointercancel", onCancel);
      vp.removeEventListener("pointerleave", onLeave);
      vp.removeEventListener("click", onClickCapture, true);
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("keydown", keys);
      map?.removeEventListener("pointerdown", onMap);
    };
  }, [tiles, studies, period, start, reelLength]);

  // The sheet asks for a frame by id; the engine opens it by keyboard too.
  useEffect(() => {
    opener.current = (id) => setSheet(id);
  }, []);

  const closeSheet = useCallback(() => {
    const id = sheet;
    setSheet(null);
    // Focus returns to the frame that opened it.
    if (id) viewport.current?.querySelector<HTMLElement>(`[data-tile="${id}"]`)?.focus({ preventScroll: true });
  }, [sheet]);

  const current = sheet ? tiles.find((t) => t.id === sheet) : undefined;
  const study = current?.slug ? studies[current.slug] : undefined;

  return (
    <>
      <div
        ref={viewport}
        className="df-field"
        tabIndex={0}
        role="group"
        aria-roledescription="field"
        aria-label="Every frame of our work"
        aria-describedby="df-field-help"
      >
        <p id="df-field-help" className="sr-only">
          Drag to explore, or use the arrow keys to move between frames. Enter opens the frame under the crosshair.
        </p>
        <div className="df-grid" aria-hidden />
        <div className="df-layer">
          {tiles.map((t) => {
            const s = t.slug ? studies[t.slug] : undefined;
            const delay = Math.min(700, Math.round(Math.hypot(t.dx + t.w / 2, t.dy + t.h / 2) * 0.45));
            const style = {
              "--w": t.w,
              "--h": t.h,
              "--dx": t.dx,
              "--dy": t.dy,
              "--delay": `${delay}ms`,
              "--tone": s?.bg ?? "#111",
            } as CSSProperties;
            const image = (
              <Image
                src={t.src}
                alt={t.alt}
                fill
                sizes={sizesFor(t.w)}
                loading={t.near || warm ? "eager" : "lazy"}
                draggable={false}
                className="df-tile__img"
              />
            );
            const marks = (
              <>
                <span className="df-tile__code" aria-hidden>
                  {t.code}
                </span>
                <span className="df-tile__name" aria-hidden>
                  {s ? s.client : "Showreel"}
                  <span className="df-tile__disc">{s ? ` · ${s.disciplines.join(", ")}` : ` · ${reelLength}`}</span>
                </span>
                <span className="df-tile__size" aria-hidden>
                  {t.iw} × {t.ih}
                </span>
                <span className="df-tile__handles" aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </>
            );
            if (t.kind === "reel") {
              return (
                <div key={t.id} data-tile={t.id} className="df-tile df-tile--reel" style={style}>
                  <span className="df-tile__frame">{image}</span>
                  {marks}
                  <span className="df-tile__play">{reel}</span>
                </div>
              );
            }
            return (
              <button
                key={t.id}
                type="button"
                tabIndex={-1}
                data-tile={t.id}
                className="df-tile"
                style={style}
                aria-label={`${s?.client ?? ""}: ${t.alt}. Open details`}
                onClick={() => setSheet(t.id)}
              >
                <span className="df-tile__frame">
                  {image}
                  {t.loop && s?.loop ? (
                    <video className="df-tile__loop" data-src={s.loop.src} muted loop playsInline preload="none" aria-hidden tabIndex={-1} disablePictureInPicture />
                  ) : null}
                </span>
                {marks}
              </button>
            );
          })}
        </div>

        <div className="df-ruler df-ruler--x" aria-hidden>
          <div className="df-ruler__strip" data-ruler="x">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ "--k": i } as CSSProperties} />
            ))}
          </div>
        </div>
        <div className="df-ruler df-ruler--y" aria-hidden>
          <div className="df-ruler__strip" data-ruler="y">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ "--k": i } as CSSProperties} />
            ))}
          </div>
        </div>

        <span className="df-cursor" aria-hidden>
          Drag
        </span>
        <div className="df-cross" aria-hidden>
          <span className="df-cross__h" />
          <span className="df-cross__v" />
          <span className="df-cross__xy" data-readout>
            X {pad4(start.x)} · Y {pad4(start.y)}
          </span>
        </div>
      </div>

      <div ref={hud} className="df-hud" aria-hidden>
        <p className="df-hud__hint">
          <span className="df-hud__dot" />
          Drag to explore
          <span className="df-hud__keys"> · ← ↑ → ↓</span>
        </p>
        <p className="df-hud__target">
          <span className="df-hud__k">Selected</span>
          <span data-target-name>-</span>
          <span className="df-hud__meta" data-target-meta />
        </p>
        <div className="df-map" data-map>
          {tiles.map((t) => (
            <i
              key={t.id}
              data-dot
              style={{
                left: `${((t.cx - t.w / 2) / period.w) * 100}%`,
                top: `${((t.cy - t.h / 2) / period.h) * 100}%`,
                width: `${(t.w / period.w) * 100}%`,
                height: `${(t.h / period.h) * 100}%`,
              }}
            />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <b key={k} data-view />
          ))}
        </div>
      </div>
      <p ref={live} className="sr-only" aria-live="polite" />

      <TileSheet
        tile={current}
        study={study}
        frames={study ? tiles.filter((t) => t.slug === study.slug).sort((a, b) => a.code.localeCompare(b.code)) : []}
        onClose={closeSheet}
      />
    </>
  );
}

