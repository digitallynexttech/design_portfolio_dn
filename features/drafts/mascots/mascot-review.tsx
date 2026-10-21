"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { prefersReducedMotion } from "@/features/exhibits/use-in-view";
import type { Mascot } from "@/features/mascot/mascot-scene";
import { detectTier } from "@/features/stage/tier";
import { MASCOT_VARIANTS, type MascotVariant } from "./variants";
import "./mascots.css";

const DIR = "/models/dn-x-variants";
/** The wave takes 2.4 s; then the X waits in its idle, and waves again. */
const WAVE_EVERY = 5200;
/** A card must hold the middle this long before its 3D starts, so a fast swipe doesn't load every one. */
const SETTLE = 220;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One variant's stage: the poster (a real frame from the same camera) until the live model is ready.
 * Only the card in front runs a model. Each visit makes its own canvas and removes it on leaving, so
 * no canvas ever holds a disposed renderer's context. A click waves again.
 */
function Stage({ variant, active }: { variant: MascotVariant; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const mascot = useRef<Mascot | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!active || !el || detectTier() === 0) return;
    const cv = document.createElement("canvas");
    cv.className = "mr-stage__canvas";
    cv.setAttribute("aria-hidden", "true");
    el.appendChild(cv);
    let cancelled = false;
    let timer = 0;
    let m: Mascot | undefined;
    const sync = () => m?.setActive(document.visibilityState === "visible");
    const settle = window.setTimeout(async () => {
      const { createMascot } = await import("@/features/mascot/mascot-scene");
      if (cancelled) return;
      try {
        m = await createMascot(cv, prefersReducedMotion(), `${DIR}/${variant.id}.glb`);
      } catch {
        return; // no WebGL or no file: the poster stays
      }
      if (cancelled) return m.dispose();
      mascot.current = m;
      sync();
      m.play("Wave");
      setLive(true);
      timer = window.setInterval(() => m?.play("Wave"), WAVE_EVERY);
    }, SETTLE);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      m?.dispose();
      cv.remove();
      mascot.current = null;
      setLive(false);
    };
  }, [active, variant.id]);

  return (
    <div ref={host} className="mr-stage" data-live={live || undefined} onClick={() => mascot.current?.play("Wave")}>
      <Image src={`${DIR}/${variant.id}.webp`} alt="" fill unoptimized sizes="(min-width: 768px) 34rem, 86vw" className="mr-stage__poster" />
    </div>
  );
}

/**
 * The review: one card per variant on a horizontal rail, one at a time in the middle. Swipe, drag
 * with a mouse, use the arrows, the dots, or the arrow keys. The X in front waves, waits, and waves.
 */
export function MascotReview() {
  const rail = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const total = MASCOT_VARIANTS.length;

  // The card at least 60% inside the rail is the one in front; between two, the last one stays.
  useEffect(() => {
    const root = rail.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    for (const c of cards.current) if (c) io.observe(c);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((i: number) => {
    const card = cards.current[Math.max(0, Math.min(total - 1, i))];
    card?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [total]);

  const onKey = (e: KeyboardEvent) => {
    const to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: total - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    goTo(to);
  };

  // Mouse drag: the rail follows the pointer with snapping off, then snaps to the nearest card.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !rail.current) return;
    drag.current = { x: e.clientX, left: rail.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = rail.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "";
    }
    el.scrollLeft = d.left - dx;
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = rail.current;
    drag.current = null;
    if (!d?.moved || !el) return;
    el.releasePointerCapture(e.pointerId);
    delete el.dataset.dragging;
    // A short flick is enough to move one card.
    const dx = e.clientX - d.x;
    goTo(Math.abs(dx) > 60 ? active + (dx < 0 ? 1 : -1) : active);
  };

  return (
    <div className="mr">
      <header className="mr__head">
        <div>
          <p className="label">Review · DN X mascot</p>
          <h1 className="mr__title">
            Ten X&apos;s. Pick one<span className="stop">.</span>
          </h1>
        </div>
        <p className="mr__hint">
          Swipe, drag or use the arrow keys. The X in front waves, waits, then waves again; click it to wave now.
          Note the number of your favourite.
        </p>
      </header>

      <div
        ref={rail}
        className="mr__rail"
        role="region"
        aria-roledescription="carousel"
        aria-label="Mascot variants"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <ol className="mr__track">
          {MASCOT_VARIANTS.map((v, i) => (
            <li
              key={v.id}
              ref={(el) => {
                cards.current[i] = el;
              }}
              data-index={i}
              data-active={i === active || undefined}
              className="mr__card"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}: ${v.name}`}
              aria-current={i === active || undefined}
            >
              <Stage variant={v} active={i === active} />
              <div className="mr__info">
                <p className="mr__num">
                  {pad(i + 1)} <span>/ {pad(total)}</span>
                </p>
                <h2 className="mr__name">
                  {v.name}
                  <span className="stop">.</span>
                </h2>
                <p className="mr__line">{v.line}</p>
                <dl className="mr__traits">
                  {(
                    [
                      ["Shape", v.traits.shape],
                      ["Face", v.traits.face],
                      ["Arms", v.traits.arms],
                      ["Finish", v.traits.finish],
                    ] as const
                  ).map(([k, val]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <nav className="mr__nav" aria-label="Choose a variant">
        <button type="button" className="btn" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous variant">
          <span aria-hidden>←</span>
        </button>
        <ol className="mr__dots">
          {MASCOT_VARIANTS.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                className="mr__dot"
                aria-label={`${i + 1}: ${v.name}`}
                aria-current={i === active || undefined}
                onClick={() => goTo(i)}
              >
                {pad(i + 1)}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={() => goTo(active + 1)} disabled={active === total - 1} aria-label="Next variant">
          <span aria-hidden>→</span>
        </button>
      </nav>
    </div>
  );
}
