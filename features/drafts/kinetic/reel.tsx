"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** The frame reaches full size this far through the section; the rest holds it there. */
const GROW = 0.78;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const inOut = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

/**
 * SHOW [frame] REEL. The word is split by a small frame of the reel; scrolling through the pinned
 * screen (native scroll, a sticky stage) opens the frame to the whole screen (a full-width band on a
 * portrait screen) and it pushes the two halves of the word out, the letters gaining weight as
 * they go. A click on the small frame scrolls it open; on the open frame it plays the reel with its
 * chapters. The script writes one scale, two transforms and two weights per frame; the words are
 * positioned from their measured widths at both ends of the axis, so nothing reflows the page.
 * With motion off, it's a still: the word, the poster and the button.
 */
export function KineticReel({
  src,
  poster,
  length,
  summary,
  play,
}: {
  src: string;
  poster: string;
  length: string;
  summary: string;
  play: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const grown = useRef(false);

  // The file: poster as the section nears, playback only while it's on screen.
  useEffect(() => {
    const v = video.current;
    const section = root.current;
    if (!v || !section) return;
    v.muted = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let seen = false;
    const sync = () => {
      const motion = !reduced.matches && document.documentElement.dataset.motion !== "off";
      if (seen && motion && !saveData && document.visibilityState === "visible") void v.play().catch(() => undefined);
      else if (!v.paused) v.pause();
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        v.poster = poster;
        near.disconnect();
      },
      { rootMargin: "120% 0px" },
    );
    const io = new IntersectionObserver(
      ([entry]) => {
        seen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    near.observe(section);
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      near.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      v.pause();
    };
  }, [poster]);

  // Scroll → scale.
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    // The pinned layout is CSS, keyed to the same flag (html[data-motion="on"]), set before paint.
    if (document.documentElement.dataset.motion !== "on") return;
    const stage = section.querySelector<HTMLElement>(".dk-reel__stage");
    const frame = section.querySelector<HTMLElement>(".dk-reel__frame");
    const a = section.querySelector<HTMLElement>("[data-word='a']");
    const b = section.querySelector<HTMLElement>("[data-word='b']");
    if (!stage || !frame || !a || !b) return;
    const portrait = window.matchMedia("(orientation: portrait)");

    let top = 0;
    let height = 1;
    let vh = 1;
    let fw = 1;
    let fh = 1;
    let s0 = 0.26;
    let gap = 16;
    const wa = { lo: 0, hi: 0 };
    const wb = { lo: 0, hi: 0 };
    let shownW = -1;
    let shownS = "";
    let raf = 0;
    let visible = false;

    const measure = () => {
      vh = window.innerHeight;
      top = section.getBoundingClientRect().top + window.scrollY;
      height = section.offsetHeight;
      fw = frame.offsetWidth;
      fh = frame.offsetHeight;
      s0 = portrait.matches ? 0.56 : 0.26;
      const fs = parseFloat(getComputedStyle(a).fontSize) || 100;
      gap = fs * 0.12;
      for (const [el, out] of [
        [a, wa],
        [b, wb],
      ] as const) {
        el.style.fontVariationSettings = `"wght" 200`;
        out.lo = el.getBoundingClientRect().width;
        el.style.fontVariationSettings = `"wght" 700`;
        out.hi = el.getBoundingClientRect().width;
        el.style.fontVariationSettings = "";
      }
      shownW = -1;
      shownS = "";
    };

    const frameFn = () => {
      raf = 0;
      const p = clamp01((window.scrollY - top) / Math.max(1, height - vh) / GROW);
      const e = inOut(p);
      const s = s0 + (1 - s0) * e;
      const wght = Math.round(200 + 500 * e);
      const sKey = s.toFixed(4);
      if (sKey === shownS && wght === shownW) return;
      shownS = sKey;
      if (wght !== shownW) {
        shownW = wght;
        a.style.fontVariationSettings = `"wght" ${wght}`;
        b.style.fontVariationSettings = `"wght" ${wght}`;
      }
      const t = (wght - 200) / 500;
      if (portrait.matches) {
        const half = (s * fh) / 2 + gap;
        frame.style.transform = `translateY(-50%) scale(${sKey})`;
        a.style.transform = `translate3d(-50%, -100%, 0) translate3d(0, ${(-half).toFixed(1)}px, 0)`;
        b.style.transform = `translate3d(-50%, 0, 0) translate3d(0, ${half.toFixed(1)}px, 0)`;
      } else {
        const half = (s * fw) / 2 + gap;
        const widthA = wa.lo + (wa.hi - wa.lo) * t;
        frame.style.transform = `scale(${sKey})`;
        a.style.transform = `translate3d(${(-half - widthA).toFixed(1)}px, -50%, 0)`;
        b.style.transform = `translate3d(${half.toFixed(1)}px, -50%, 0)`;
      }
      const full = p >= 0.97;
      if (full !== grown.current) {
        grown.current = full;
        section.toggleAttribute("data-full", full);
      }
    };
    const kick = () => {
      if (visible && !raf) raf = requestAnimationFrame(frameFn);
    };
    const onResize = () => {
      measure();
      kick();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    io.observe(section);
    measure();
    raf = requestAnimationFrame(frameFn);
    void document.fonts.ready.then(onResize);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // The small frame scrolls itself open; the open frame plays the reel.
  const onFrame = () => {
    const section = root.current;
    if (!section) return;
    if (grown.current || document.documentElement.dataset.motion !== "on") {
      section.querySelector<HTMLButtonElement>(".dk-reel__play button")?.click();
      return;
    }
    const top = section.getBoundingClientRect().top + window.scrollY;
    const end = top + (section.offsetHeight - window.innerHeight) * GROW;
    window.scrollTo({ top: end, behavior: "smooth" });
  };

  return (
    <section ref={root} className="dk-reel" aria-labelledby="dk-reel-title">
      <div className="dk-reel__stage">
        <h2 id="dk-reel-title" className="sr-only">
          Showreel
        </h2>
        <p className="dk-reel__word" data-word="a" aria-hidden>
          Show
        </p>
        <div className="dk-reel__frame" data-cursor="view" data-cursor-label="Play" onClick={onFrame}>
          <video
            ref={video}
            className="dk-reel__video"
            src={src}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            tabIndex={-1}
            disablePictureInPicture
          />
        </div>
        <p className="dk-reel__word" data-word="b" aria-hidden>
          Reel
        </p>
        <div className="dk-reel__bar">
          <p className="dk-mono">
            Reel · <span className="dk-num">{length}</span> · No sound
          </p>
          <p className="dk-mono dk-reel__sum">{summary}</p>
          <div className="dk-reel__play">{play}</div>
        </div>
      </div>
    </section>
  );
}
