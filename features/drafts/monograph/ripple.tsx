"use client";

import { useEffect, useRef } from "react";

const DURATION = 1100; // ms for one disturbance to settle
const PEAK = 20; // px of displacement at the height of the ripple

/**
 * The only water on the page: point at a plate and it ripples once, as if seen through a basin that
 * was just touched, then settles still. One SVG displacement filter is shared by every
 * [data-ripple] element and only ever applied for the second it runs. Mouse only, never under
 * reduced motion.
 */
export function Ripple() {
  const turbulence = useRef<SVGFETurbulenceElement>(null);
  const displace = useRef<SVGFEDisplacementMapElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let target: HTMLElement | null = null;
    let start = 0;

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      target?.removeAttribute("data-rippling");
      target = null;
    };
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // A quick swell, then a long settle.
      const swell = t < 0.18 ? t / 0.18 : Math.pow(1 - (t - 0.18) / 0.82, 2);
      displace.current?.setAttribute("scale", (PEAK * swell).toFixed(2));
      turbulence.current?.setAttribute("baseFrequency", `${(0.006 + t * 0.004).toFixed(4)} ${(0.018 + t * 0.012).toFixed(4)}`);
      if (t < 1) raf = requestAnimationFrame(frame);
      else stop();
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !fine.matches || reduced.matches) return;
      const el = (event.target as HTMLElement).closest<HTMLElement>("[data-ripple]");
      if (!el || el === target) return;
      stop();
      target = el;
      target.setAttribute("data-rippling", "");
      start = performance.now();
      raf = requestAnimationFrame(frame);
    };
    document.addEventListener("pointerover", onEnter, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onEnter);
      stop();
    };
  }, []);

  return (
    <svg className="m-ripple-defs" width="0" height="0" aria-hidden focusable="false">
      <filter id="m-ripple" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
        <feTurbulence ref={turbulence} type="fractalNoise" baseFrequency="0.006 0.018" numOctaves={2} seed={7} result="noise" />
        <feDisplacementMap ref={displace} in="SourceGraphic" in2="noise" scale={0} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
