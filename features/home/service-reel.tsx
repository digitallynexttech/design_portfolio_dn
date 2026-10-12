"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";

export type ReelService = { id: string; title: string; line: string; proof: string[]; image: string };

// The ribbon's feel (CSS px and seconds).
const STRIP = 5; // width of each slice the images are cut into
const AUTOPLAY = 34; // px/s drift when nobody is touching it
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
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [live, setLive] = useState(false);
  const [current, setCurrent] = useState(0);
  const step = useRef<(dir: number) => void>(() => undefined);
  const reveal = useRef<(index: number) => void>(() => undefined);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const list = track.current;
    if (!el || !cv || !list) return;
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
          kick();
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

    const draw = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, imgH + pad * 2);
      const still = reduced.matches;
      const goal = still ? 0 : Math.max(-pad * 0.82, Math.min(pad * 0.82, speed * WAVE_GAIN));
      amp += (goal - amp) * (1 - Math.exp(-6 * dt));
      phase += dt * 1.1;
      const freq = (Math.PI * 2) / Math.max(600, W * 0.95);
      const zone = W * EDGE_ZONE;
      const smear = still ? 0 : Math.min(26, Math.abs(speed) * 0.018);
      const dir = Math.sign(speed) || 1;
      const L = lead;

      for (let i = 0; i < n; i++) {
        const img = sources[i];
        const x0 = L + xOf(i);
        cards[i].style.translate = `${x0.toFixed(2)}px 0`;
        if (!img || x0 > W || x0 + cardW < 0) continue;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        // Cover-fit the picture into the card's frame.
        const scale = Math.max(cardW / iw, imgH / ih);
        const sw = cardW / scale;
        const sh = imgH / scale;
        const sx0 = (iw - sw) / 2;
        const sy0 = (ih - sh) / 2;
        const from = Math.max(0, Math.floor(-x0 / STRIP) * STRIP);
        const to = Math.min(cardW, W - x0);
        for (let s = from; s < to; ) {
          // Thin slices at the rounded corners keep their curve smooth.
          const corner = s < RADIUS || s > cardW - RADIUS - STRIP;
          const w = Math.min(corner ? 1 : STRIP, cardW - s);
          const cx = x0 + s + w / 2;
          const edgeDist = Math.min(cx, W - cx);
          const edge = 1 - Math.min(1, Math.max(0, edgeDist / zone));
          const fade = Math.min(1, Math.max(0, edgeDist / (zone * 0.35)));
          if (fade <= 0) {
            s += w;
            continue;
          }
          const y = amp * Math.sin(cx * freq + phase + offset * 0.0016) * (1 + EDGE_FLARE * edge * edge);
          // Rounded corners, cut per strip so they ride the wave with the picture.
          const fromEdge = Math.min(s + w / 2, cardW - s - w / 2);
          const inset = fromEdge < RADIUS ? RADIUS - Math.sqrt(Math.max(0, RADIUS * RADIUS - (RADIUS - fromEdge) ** 2)) : 0;
          const srcX = sx0 + (s / cardW) * sw;
          const srcW = (w / cardW) * sw;
          const srcY = sy0 + (inset / imgH) * sh;
          const srcH = sh - (2 * inset / imgH) * sh;
          const dy = pad + y + inset;
          const dh = imgH - 2 * inset;
          ctx.globalAlpha = fade;
          ctx.drawImage(img, srcX, srcY, srcW, srcH, x0 + s, dy, w + 0.6, dh);
          // At speed, a faint smear trails each strip.
          if (smear > 2) {
            ctx.globalAlpha = fade * 0.16;
            ctx.drawImage(img, srcX, srcY, srcW, srcH, x0 + s - dir * smear, dy, w + 0.6, dh);
          }
          s += w;
        }
      }
      ctx.globalAlpha = 1;
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
        const drift = still || hover || focusHold ? 0 : AUTOPLAY;
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
      setCurrent((c) => (c === best ? c : best));
      const settled = Math.abs(speed) < 0.5 && Math.abs(amp) < 0.05 && target === null && !dragging && Math.abs(velocity) < 0.5;
      if (visible && !(settled && (still || hover || focusHold))) raf = requestAnimationFrame(frame);
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
    const onScroll = () => {
      const y = window.scrollY;
      if (visible && !dragging && target === null) {
        offset += (y - lastScroll) * SCROLL_PULL;
        kick();
      }
      lastScroll = y;
    };
    // Sideways wheels and trackpads move it directly; vertical wheels scroll the page as usual.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      target = null;
      offset += e.deltaX;
      kick();
    };

    step.current = (dir: number) => {
      const base = Math.round((target ?? offset) / pitch);
      target = (base + dir) * pitch;
      kick();
    };
    // Keyboard focus on a card brings it to the middle.
    reveal.current = (index: number) => {
      const mid = W / 2 - cardW / 2 - lead;
      const x = xOf(index);
      target = offset + (x - mid);
      focusHold = true;
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
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("focusout", onFocusOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", kick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      near.disconnect();
      for (const img of images) img?.removeEventListener("load", onLoad);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", kick);
      delete el.dataset.live;
    };
  }, []);

  return (
    <div className="reel">
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
                  <FlowLink href={`/services#${s.id}`} className="reel__link" onFocus={() => reveal.current(i)} draggable={false}>
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
