"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Each beat holds, then hands over to the next with a short overlap, so the slot is never empty;
// the last beat holds too, so it is read before the hero scrolls away.
const HOLD = 0.8;
const MOVE = 0.5;
const OVERLAP = 0.15;

/**
 * Plays the three hero beats in sequence as the visitor scrolls through a sticky track. All beats are
 * server-rendered and stay in the accessibility tree; only opacity and position animate (no blur,
 * which costs frames on big type). With motion off, the CSS stacks them as plain text.
 */
export function HeroBeats({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (document.documentElement.dataset.motion !== "on") return;
      const beats = gsap.utils.toArray<HTMLElement>("[data-beat]", root.current);

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: MOVE },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });

      let cursor = HOLD;
      beats.forEach((beat, i) => {
        if (i === beats.length - 1) return;
        const next = beats[i + 1];
        timeline.to(beat, { opacity: 0, y: -48 }, cursor);
        cursor += MOVE - OVERLAP;
        timeline.fromTo(next, { opacity: 0, y: 48 }, { opacity: 1, y: 0 }, cursor);
        cursor += MOVE + HOLD;
      });
      // Hold the last beat on screen for its share of the scroll.
      timeline.to({}, { duration: HOLD * 1.25 }, cursor);

      // Then the hero lifts off the page like a sheet, uncovering the studio underneath. --hero-lift
      // (0 → 1 over one screen of scroll) drives its edge and the reveal below, in CSS.
      const main = root.current?.closest("main");
      if (main) {
        gsap.fromTo(
          main,
          { "--hero-lift": 0 },
          { "--hero-lift": 1, ease: "none", scrollTrigger: { trigger: root.current, start: "bottom bottom", end: "bottom top", scrub: true } },
        );
      }
    },
    { scope: root },
  );

  return (
    <div ref={root} className="hero-track">
      {children}
    </div>
  );
}
