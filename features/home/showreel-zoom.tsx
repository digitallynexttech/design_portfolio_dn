"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setWaterCovered } from "@/features/water/bus";

const WORDS = "Watch our showreel";
/** The card reaches full size this far through the track; the rest holds it there. */
const GROW = 0.8;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Cubic in-out: the card starts slowly, opens up through the middle, and settles into the screen.
const inOut = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

/**
 * The showreel's own section, after the hero: "scroll to enlarge". The words run behind a small card
 * of the reel; scrolling through the pinned screen grows the card to the whole screen (a full-width
 * 16:9 band on portrait screens), and then "Play reel" opens the reel with its chapters. The reel has
 * no sound, so that's the button where a sound switch would be.
 *
 * The script only writes --e (0 → 1, eased) on the stage and data-full on the section; the sizes are
 * CSS. The file attaches as the section nears and plays only while it's on screen; reduced motion and
 * Data Saver keep the poster. With motion off the section is a plain 16:9 player, no pinning.
 */
export function ShowreelZoom({ src, poster, play }: { src: string; poster: string; play: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Scroll → size.
  useEffect(() => {
    const track = root.current;
    const box = stage.current;
    if (!track || !box || document.documentElement.dataset.motion !== "on") return;
    const landscape = window.matchMedia("(min-aspect-ratio: 4/3)");

    let top = 0;
    let height = 1;
    let vh = window.innerHeight;
    const measure = () => {
      vh = window.innerHeight;
      top = track.getBoundingClientRect().top + window.scrollY;
      height = track.offsetHeight;
    };

    let shown = "";
    let full = false;
    let covering = false;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const p = clamp01((y - top) / Math.max(1, height - vh) / GROW);
      const value = inOut(p).toFixed(4);
      if (value !== shown) {
        shown = value;
        box.style.setProperty("--e", value);
      }
      const nextFull = p >= 0.9;
      if (nextFull !== full) {
        full = nextFull;
        track.toggleAttribute("data-full", full);
      }
      // While the reel fills a landscape screen and the stage is pinned, the water under it rests.
      const nextCovering = p >= 1 && landscape.matches && y <= top + height - vh;
      if (nextCovering !== covering) {
        covering = nextCovering;
        setWaterCovered("showreel", covering);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      kick();
    };

    measure();
    frame();
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(track);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      box.style.removeProperty("--e");
      track.removeAttribute("data-full");
      setWaterCovered("showreel", false);
    };
  }, []);

  // The video: poster as it nears, file the first time it should play, playing only while on screen.
  useEffect(() => {
    const track = root.current;
    const box = stage.current;
    const el = video.current;
    if (!track || !box || !el) return;
    el.muted = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let seen = false;
    let attached = false;

    const sync = () => {
      if (seen && !saveData && !reduced.matches && document.visibilityState === "visible") {
        if (!attached) {
          attached = true;
          el.src = src;
        }
        void el.play().catch(() => undefined);
      } else if (!el.paused) el.pause();
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.poster = poster;
        near.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    // The words run only while the stage is on screen, too.
    const onScreen = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      track.toggleAttribute("data-seen", seen);
      sync();
    });
    near.observe(track);
    onScreen.observe(box);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      near.disconnect();
      onScreen.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      el.pause();
    };
  }, [src, poster]);

  return (
    <section ref={root} aria-labelledby="showreel-title" className="showreel">
      <h2 id="showreel-title" className="sr-only">
        Showreel
      </h2>
      <div ref={stage} className="showreel__stage">
        {/* Four identical phrases: the track slides by half its width, so the loop never shows a seam. */}
        <div className="showreel__words" aria-hidden>
          <div className="showreel__track">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="showreel__phrase">
                {WORDS}
                <span className="stop">.</span>
              </span>
            ))}
          </div>
        </div>
        <div className="showreel__frame">
          <video ref={video} muted loop playsInline preload="none" aria-hidden tabIndex={-1} disablePictureInPicture />
        </div>
        <p className="showreel__hint" aria-hidden>
          Scroll to enlarge
        </p>
        <div className="showreel__play">{play}</div>
      </div>
    </section>
  );
}
