"use client";

import { useEffect, useRef } from "react";

const FLOOR = 4000; // metres at the foot of the page

/**
 * A diver's depth gauge on the right edge of wide screens: a hairline with a marker that sinks with
 * the page and a readout in metres. Decorative (hidden from assistive technology); it writes one
 * transform and one number per frame, and only while the page moves.
 */
export function DepthGauge() {
  const marker = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    let raf = 0;
    let shown = "";
    const frame = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
      if (marker.current) marker.current.style.transform = `translate3d(0, ${(p * 100).toFixed(2)}cqh, 0)`;
      const metres = String(Math.round((p * FLOOR) / 10) * 10).padStart(4, "0");
      // Rewrite the existing text node rather than setting textContent: inserting a new node would
      // make the page's :has() rules re-check (and restyle) the whole document on every frame.
      const text = readout.current?.firstChild;
      if (metres !== shown && text) text.nodeValue = shown = metres;
    };
    const onScroll = () => {
      if (wide.matches && !raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <div className="dd-gauge" aria-hidden>
      <div className="dd-gauge__rail">
        <span ref={marker} className="dd-gauge__marker">
          <span className="dd-gauge__readout">
            <span ref={readout}>0000</span> m
          </span>
        </span>
      </div>
    </div>
  );
}
