"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Logo = { name: string; src: string; width: number; height: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Keeps a track's offset inside one copy's width, (−w, 0]. */
const wrap = (x: number, w: number) => (w > 0 ? (((x % w) - w) % w) : 0);

/**
 * The clients on two currents: their names, set large, drifting left, and their marks drifting
 * right. Both answer the page's scroll: they speed up with it, follow its direction, lean into it
 * (a skew eased from the scroll velocity), then settle back to a drift. A visible Pause stops both
 * (WCAG 2.2.2), as does resting the pointer on them. The loop runs only while they're on screen;
 * with reduced motion they're a still, wrapped list. Screen readers get one plain list.
 */
export function ClientMarquee({ names, logos }: { names: string[]; logos: Logo[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
    root.current?.dispatchEvent(new Event("dk-kick"));
  }, [paused]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off") return;
    const tracks = Array.from(el.querySelectorAll<HTMLElement>("[data-track]"));
    const viewport = el.querySelector<HTMLElement>(".dk-marq__view");
    if (!tracks.length || !viewport) return;
    const speed = tracks.map((t) => Number(t.dataset.speed) || 40);
    const sign = tracks.map((t) => Number(t.dataset.sign) || -1);
    const lean = tracks.map((t) => Number(t.dataset.lean) || 1);
    const xs = tracks.map(() => 0);
    let widths = tracks.map(() => 0);

    let vel = 0;
    let skew = 0;
    let dir = 1;
    let lastY = window.scrollY;
    let raf = 0;
    let last = 0;
    let visible = false;
    let hover = false;

    const measure = () => {
      widths = tracks.map((t) => t.scrollWidth / 2);
    };
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(50, last ? now - last : 16);
      last = now;
      const y = window.scrollY;
      const raw = ((y - lastY) / dt) * 1000;
      lastY = y;
      vel += (raw - vel) * (1 - Math.exp(-dt / 140));
      if (raw > 40) dir = 1;
      else if (raw < -40) dir = -1;
      const held = pausedRef.current || hover;
      const goalSkew = held ? 0 : clamp(-vel * 0.0032, -7, 7);
      skew += (goalSkew - skew) * (1 - Math.exp(-dt / 110));
      tracks.forEach((t, i) => {
        if (!held) {
          const v = (speed[i] * dir + vel * 0.28) * sign[i];
          xs[i] = wrap(xs[i] + (v * dt) / 1000, widths[i]);
        }
        t.style.transform = `translate3d(${xs[i].toFixed(2)}px, 0, 0) skewX(${(skew * lean[i]).toFixed(2)}deg)`;
      });
      const settled = held && Math.abs(skew) < 0.02;
      if (visible && !settled) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (visible && !raf) {
        lastY = window.scrollY;
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hover = true;
    };
    const onLeave = () => {
      hover = false;
      kick();
    };
    measure();
    io.observe(el);
    const ro = new ResizeObserver(measure);
    tracks.forEach((t) => ro.observe(t));
    viewport.addEventListener("pointerenter", onEnter);
    viewport.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", kick, { passive: true });
    el.addEventListener("dk-kick", kick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      viewport.removeEventListener("pointerenter", onEnter);
      viewport.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", kick);
      el.removeEventListener("dk-kick", kick);
    };
  }, []);

  const copies = [0, 1];
  return (
    <div ref={root} className="dk-marq" data-paused={paused || undefined}>
      <ul className="sr-only" aria-label="Clients">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <div className="dk-marq__view" aria-hidden>
        <div className="dk-marq__track dk-marq__track--names" data-track data-speed="46" data-sign="-1" data-lean="1">
          {copies.map((c) => (
            <div key={c} className="dk-marq__set" data-dup={c ? "" : undefined}>
              {names.map((name, i) => (
                <span key={name} className={`dk-marq__name${i % 2 ? " dk-marq__name--b" : ""}`}>
                  {name}
                  <span className="dk-marq__sep" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="dk-marq__track dk-marq__track--logos" data-track data-speed="30" data-sign="1" data-lean="-0.6">
          {copies.map((c) => (
            <div key={c} className="dk-marq__set" data-dup={c ? "" : undefined}>
              {logos.map((logo) => {
                const aspect = logo.width / logo.height;
                // Wide wordmarks drawn shorter, tall marks taller, so each reads at the same weight.
                const k = Math.sqrt(2.6 / aspect);
                const w = Math.ceil(aspect * Math.min(2.6, Math.max(1.1, k * 1.7)) * 16);
                return (
                  <Image
                    key={logo.src}
                    src={logo.src}
                    alt=""
                    width={logo.width}
                    height={logo.height}
                    sizes={`${w}px`}
                    className="dk-marq__logo"
                    style={{ "--k": k.toFixed(3) } as CSSProperties}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <button type="button" className="dk-marq__pause dk-mono" onClick={() => setPaused((p) => !p)}>
        <span className="dk-marq__icon" aria-hidden />
        {paused ? "Play" : "Pause"}
        <span className="sr-only"> the client names</span>
      </button>
    </div>
  );
}
