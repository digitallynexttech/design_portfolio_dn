"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";

export type ReelService = { id: string; title: string; line: string; proof: string[]; image: string };

// The ribbon's feel (CSS px and seconds).
const STRIP = 4; // narrowest slice the images are cut into (at speed)
const STEP = 0.25; // the most a straight slice may stray from the wave; wider slices while it's flat
const AUTOPLAY = 34; // px/s drift until somebody takes hold of it (and while no pointer is on it)
const SETTLE = 2.6; // how fast a flick slows back to the drift
const SCROLL_PULL = 0.55; // how far the page's scroll carries the ribbon
const WAVE_GAIN = 0.032; // wave height per px/s of speed
const EDGE_ZONE = 0.14; // share of the stage at each side that flares and fades
const EDGE_FLARE = 0.9;
const RADIUS = 18;

/**
 * Services as an endless ribbon of pictures, like water: drag it, flick it, or scroll the page,
 * and it bends into a wave as fast as it moves, then settles flat. The pictures are drawn on a
 * canvas in thin vertical strips (each strip rides the wave); the words under them are ordinary
 * links and text, so they stay readable and keyboard-reachable. Without script it is a plain
 * swipeable row.
 */
export function ServiceReel({ services }: { services: ReelService[] }) {
  const reel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [live, setLive] = useState(false);
  const [current, setCurrent] = useState(0);
  const step = useRef<(dir: number) => void>(() => undefined);
  const reveal = useRef<(index: number) => void>(() => undefined);

  useEffect(() => {
    const outer = reel.current;
    const el = root.current;
    const cv = canvas.current;
    const list = track.current;
    if (!outer || !el || !cv || !list) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-card]"));
    const images = cards.map((c) => c.querySelector("img"));
    const n = cards.length;
    // The canvas draws its own copy of each loaded picture: an <img> with srcset reports its size
    // scaled to the layout, but the canvas reads the file's real pixels, so the two must not mix.
    const sources: (HTMLImageElement | null)[] = images.map(() => null);
    const adopt = (i: number) => {
      const img = images[i];
      const src = img?.currentSrc || img?.src;
      if (!img?.complete || !src || sources[i]?.src === src) return;
      const raw = new window.Image();
      raw.decoding = "async";
      raw.src = src;
      raw.decode().then(
        () => {
          sources[i] = raw;
          prepare(i);
        },
        () => undefined,
      );
    };
    const onLoad = () => images.forEach((_, i) => adopt(i));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let W = 0; // stage width
    let cardW = 0;
    let imgH = 0;
    let gap = 0;
    let pitch = 0;
    let total = 0;
    let pad = 0; // room above and below the pictures for the wave
    let lead = 0; // the first card lines up with the page gutter
    let dpr = 1;

    const measure = () => {
      W = el.clientWidth;
      const first = cards[0];
      cardW = first.offsetWidth;
      imgH = (first.querySelector("[data-pic]") as HTMLElement).offsetHeight;
      gap = parseFloat(getComputedStyle(list).columnGap) || 24;
      pitch = cardW + gap;
      total = pitch * n;
      pad = Math.round(Math.min(56, imgH * 0.16));
      lead = (el.querySelector("[data-probe]") as HTMLElement).offsetWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round((imgH + pad * 2) * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${imgH + pad * 2}px`;
      cv.style.top = `${-pad}px`;
      list.style.height = `${Math.max(...cards.map((c) => c.offsetHeight))}px`;
      for (let i = 0; i < n; i++) prepare(i);
    };

    // Motion state: offset is how far the ribbon has travelled; speed is measured from it.
    let offset = 0;
    let shown = 0; // where the ribbon was last frame (drags move it between frames)
    let velocity = AUTOPLAY;
    let speed = 0; // smoothed, signed px/s actually travelled (drives the wave)
    let amp = 0;
    let phase = 0;
    let dragging = false;
    let hover = false;
    let focusHold = false;
    // Once the visitor has taken hold of it (a drag, an arrow, a focus, a sideways wheel), the ribbon
    // stays where they leave it: no more drift.
    let engaged = false;
    let target: number | null = null; // a step or a focus asks to glide here
    let visible = false;
    let raf = 0;
    let last = 0;

    const wrap = (x: number) => ((x % total) + total) % total;
    // Where card i sits on the ribbon (the stage adds the gutter). Cards that would run past the
    // right edge come round on the left instead, so the ribbon never ends.
    const xOf = (i: number) => {
      const x = wrap(i * pitch - offset);
      return x + lead > W + pitch * 0.5 ? x - total : x;
    };

    // Each picture is cover-fitted into its card and its corners rounded once, at the screen's
    // resolution, outside the frame loop: the browser crops and scales it off the main thread, then
    // it is clipped round in one copy. Every frame only copies slices of it. A slice carries its piece
    // of the rounded corner with it, so the corners still ride the wave with the picture.
    const plates: (HTMLCanvasElement | null)[] = images.map(() => null);
    const preparing: (string | null)[] = images.map(() => null);
    let disposed = false;
    const prepare = (i: number) => {
      const img = sources[i];
      if (!img || !cardW || !imgH) return;
      const w = Math.round(cardW * dpr);
      const h = Math.round(imgH * dpr);
      const key = `${w}x${h} ${img.src}`;
      if (plates[i]?.dataset.key === key || preparing[i] === key) return;
      preparing[i] = key;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(w / iw, h / ih);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      const cropped: Promise<ImageBitmap | null> =
        typeof createImageBitmap === "function"
          ? createImageBitmap(img, sx, sy, sw, sh, { resizeWidth: w, resizeHeight: h, resizeQuality: "high" }).catch(() => null)
          : Promise.resolve(null);
      void cropped.then((bitmap) => {
        if (disposed || preparing[i] !== key) {
          bitmap?.close();
          return;
        }
        preparing[i] = null;
        const c = plates[i] ?? document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.dataset.key = key;
        const p = c.getContext("2d");
        if (!p) return;
        p.save();
        p.beginPath();
        const r = RADIUS * dpr;
        // roundRect is recent (2023); older engines get the same path from arcs.
        const roundRect = (p as Partial<Pick<CanvasRenderingContext2D, "roundRect">>).roundRect;
        if (roundRect) roundRect.call(p, 0, 0, w, h, r);
        else {
          p.moveTo(r, 0);
          p.arcTo(w, 0, w, h, r);
          p.arcTo(w, h, 0, h, r);
          p.arcTo(0, h, 0, 0, r);
          p.arcTo(0, 0, w, 0, r);
          p.closePath();
        }
        p.clip();
        // Sized to fit even where the browser ignored the resize, or couldn't crop at all.
        if (bitmap) p.drawImage(bitmap, 0, 0, w, h);
        else p.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        p.restore();
        bitmap?.close();
        plates[i] = c;
        kick();
      });
    };
    // The faded margins are erased in one pass each, after the slices are drawn.
    let fadeLeft: CanvasGradient | null = null;
    let fadeRight: CanvasGradient | null = null;
    let fadeW = 0;
    const translates = cards.map(() => "");
    let index = -1;

    const draw = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const H = imgH + pad * 2;
      ctx.clearRect(0, 0, W, H);
      const still = reduced.matches;
      const goal = still ? 0 : Math.max(-pad * 0.82, Math.min(pad * 0.82, speed * WAVE_GAIN));
      amp += (goal - amp) * (1 - Math.exp(-6 * dt));
      phase += dt * 1.1;
      const freq = (Math.PI * 2) / Math.max(600, W * 0.95);
      const zone = W * EDGE_ZONE;
      const smear = still ? 0 : Math.min(26, Math.abs(speed) * 0.018);
      const dir = Math.sign(speed) || 1;
      const L = lead;
      const a = Math.abs(amp);
      // The wave, flaring toward the edges of the stage.
      const wave = (x: number) => {
        const e = 1 - Math.min(1, Math.max(0, Math.min(x, W - x) / zone));
        return amp * Math.sin(x * freq + phase + offset * 0.0016) * (1 + EDGE_FLARE * e * e);
      };

      for (let i = 0; i < n; i++) {
        const x0 = L + xOf(i);
        const t = `${x0.toFixed(2)}px 0`;
        if (translates[i] !== t) cards[i].style.translate = translates[i] = t;
        if (x0 > W || x0 + cardW < 0) continue;
        // A plate from before a resize still draws (scaled) while its replacement is made.
        const src = plates[i];
        prepare(i);
        if (!src) continue;
        const k = src.width / cardW;
        const from = Math.max(0, -x0);
        const to = Math.min(cardW, W - x0);
        let yL = wave(x0 + from);
        for (let s = from; s < to; ) {
          const cx = x0 + s;
          // Each slice is sheared to follow the wave from its left edge to its right, so neighbours
          // meet exactly. A straight slice strays from the curve by about bend × width² / 8, so it
          // is as wide as that allows: as fine as ever at speed, a few broad slices while it lies flat.
          const e = 1 - Math.min(1, Math.max(0, (Math.min(cx, W - cx) - 40) / zone));
          const bend = a * (freq * freq * (1 + EDGE_FLARE * e * e) + (e > 0 ? (4 * EDGE_FLARE * e * freq) / zone + (2 * EDGE_FLARE) / (zone * zone) : 0));
          const w = Math.min(Math.max(STRIP, bend > 0 ? Math.sqrt((8 * STEP) / bend) : Infinity), to - s);
          const yR = wave(cx + w);
          const shear = (yR - yL) / w;
          ctx.setTransform(dpr, dpr * shear, 0, dpr, dpr * cx, dpr * (pad + yL));
          ctx.drawImage(src, s * k, 0, w * k, src.height, 0, 0, w + 0.6, imgH);
          // At speed, a faint smear trails each strip.
          if (smear > 2) {
            ctx.globalAlpha = 0.16;
            ctx.setTransform(dpr, dpr * shear, 0, dpr, dpr * (cx - dir * smear), dpr * (pad + yL));
            ctx.drawImage(src, s * k, 0, w * k, src.height, 0, 0, w + 0.6, imgH);
            ctx.globalAlpha = 1;
          }
          s += w;
          yL = yR;
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The ribbon fades out over the outer part of each margin.
      const fw = zone * 0.35;
      if (!fadeLeft || !fadeRight || fadeW !== W) {
        fadeW = W;
        fadeLeft = ctx.createLinearGradient(0, 0, fw, 0);
        fadeLeft.addColorStop(0, "rgba(0,0,0,1)");
        fadeLeft.addColorStop(1, "rgba(0,0,0,0)");
        fadeRight = ctx.createLinearGradient(W - fw, 0, W, 0);
        fadeRight.addColorStop(0, "rgba(0,0,0,0)");
        fadeRight.addColorStop(1, "rgba(0,0,0,1)");
      }
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fadeLeft;
      ctx.fillRect(0, 0, fw, H);
      ctx.fillStyle = fadeRight;
      ctx.fillRect(W - fw, 0, fw, H);
      ctx.globalCompositeOperation = "source-over";
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      const still = reduced.matches;
      if (target !== null) {
        const d = target - offset;
        offset += d * (1 - Math.exp(-(still ? 60 : 7) * dt));
        velocity = 0;
        if (Math.abs(d) < 0.5) {
          offset = target;
          target = null;
        }
      } else if (!dragging) {
        const drift = still || hover || focusHold || engaged ? 0 : AUTOPLAY;
        velocity += (drift - velocity) * (1 - Math.exp(-SETTLE * dt));
        offset += velocity * dt;
      }
      const moved = (offset - shown) / Math.max(dt, 1e-3);
      shown = offset;
      speed += (moved - speed) * (1 - Math.exp(-10 * dt));
      draw(dt);
      // Which card sits at the start of the row (for the counter; the arrows step from it).
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(xOf(i));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best !== index) setCurrent((index = best));
      const settled = Math.abs(speed) < 0.5 && Math.abs(amp) < 0.05 && target === null && !dragging && Math.abs(velocity) < 0.5;
      if (visible && !(settled && (still || hover || focusHold || engaged))) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    // Drag and flick. Vertical swipes stay with the page (touch-action: pan-y).
    let downX = 0;
    let downOffset = 0;
    let lastX = 0;
    let lastT = 0;
    let travel = 0;
    const onDown = (e: PointerEvent) => {
      // Links and buttons keep their own clicks; the rest of the stage is for dragging.
      if (e.button !== 0 || (e.target as Element).closest("a, button")) return;
      dragging = true;
      engaged = true;
      target = null;
      downX = lastX = e.clientX;
      lastT = performance.now();
      downOffset = offset;
      travel = 0;
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "";
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      travel += Math.abs(dx);
      offset = downOffset - (e.clientX - downX);
      velocity = (-dx / Math.max(1, now - lastT)) * 1000;
      lastX = e.clientX;
      lastT = now;
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete el.dataset.dragging;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      // A tap (not a drag) on a picture opens that service.
      if (travel < 6) {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - lead;
        for (let i = 0; i < n; i++) {
          const x0 = xOf(i);
          if (x >= x0 && x <= x0 + cardW) {
            (cards[i].querySelector("a") as HTMLAnchorElement | null)?.click();
            break;
          }
        }
      }
      kick();
    };
    // The page's own scroll carries the ribbon a little, so it ripples as you read past it.
    let lastScroll = window.scrollY;
    // Off screen it isn't read at all (the observer resets lastScroll as it comes back).
    const onScroll = () => {
      if (!visible) return;
      const y = window.scrollY;
      if (!dragging && target === null) {
        offset += (y - lastScroll) * SCROLL_PULL;
        kick();
      }
      lastScroll = y;
    };
    // Sideways wheels and trackpads move it directly; vertical wheels scroll the page as usual.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      engaged = true;
      target = null;
      offset += e.deltaX;
      kick();
    };

    step.current = (dir: number) => {
      const base = Math.round((target ?? offset) / pitch);
      target = (base + dir) * pitch;
      engaged = true;
      kick();
    };
    // Keyboard focus on a card parks it at the gutter, where the arrows put it, so the counter
    // names the card that has focus.
    reveal.current = (index: number) => {
      target = offset + xOf(index);
      focusHold = true;
      engaged = true;
      kick();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) focusHold = false;
      kick();
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hover = true;
    };
    const onLeave = () => {
      hover = false;
      kick();
    };

    el.dataset.live = "";
    measure();
    setLive(true);
    const ro = new ResizeObserver(() => {
      measure();
      kick();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastScroll = window.scrollY;
      kick();
    });
    io.observe(el);
    // Off-screen cards come round into view, so every picture loads as the section approaches.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        for (const img of images) if (img) img.loading = "eager";
        near.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(el);
    for (const img of images) img?.addEventListener("load", onLoad);
    onLoad();
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    // A pointer anywhere on the reel, the arrows and counter included, holds it still.
    outer.addEventListener("pointerenter", onEnter);
    outer.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("focusout", onFocusOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", kick);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      near.disconnect();
      for (const img of images) img?.removeEventListener("load", onLoad);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      outer.removeEventListener("pointerenter", onEnter);
      outer.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", kick);
      delete el.dataset.live;
    };
  }, []);

  return (
    <div ref={reel} className="reel">
      <div ref={root} className="reel__stage">
        <span data-probe className="reel__probe" aria-hidden />
        <canvas ref={canvas} className="reel__canvas" aria-hidden />
        <ol ref={track} className="reel__track">
          {services.map((s, i) => (
            <li key={s.id} data-card className="reel__card">
              <div data-pic className="reel__pic">
                <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 38rem, 80vw" className="object-cover" draggable={false} />
              </div>
              <div className="reel__caption">
                <span className="reel__index" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="reel__title">
                  <FlowLink href={`/services#${s.id}`} className="reel__link hit" onFocus={() => reveal.current(i)} draggable={false}>
                    {s.title}
                  </FlowLink>
                </h3>
                <p className="reel__line">{s.line}</p>
                {s.proof.length ? (
                  <p className="reel__proof">
                    <span className="sr-only">Proof: </span>
                    {s.proof.join(" · ")}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {live ? (
        <div className="reel__controls">
          <p className="reel__count" aria-hidden>
            <span>{String(current + 1).padStart(2, "0")}</span> / {String(services.length).padStart(2, "0")}
          </p>
          <p className="reel__hint" aria-hidden>
            Drag, or scroll on
          </p>
          <div className="flex gap-2">
            <button type="button" className="reel__btn" aria-label="Previous service" onClick={() => step.current(-1)}>
              ←
            </button>
            <button type="button" className="reel__btn" aria-label="Next service" onClick={() => step.current(1)}>
              →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
