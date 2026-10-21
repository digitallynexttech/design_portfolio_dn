"use client";

import { useEffect, useRef, type ReactNode } from "react";

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, "0");
const stamp = (t: number) => `${pad2(t / 60)}:${pad2(t % 60)}`;

/**
 * The showreel: one frame from the field, picked up and enlarged as you scroll through the section
 * (CSS scroll timeline where supported, a passive scroll listener otherwise, nothing with reduced
 * motion: then it is simply full size). The muted loop downloads only when the frame comes into
 * view, plays only while it is on screen, and its timecode runs in the corner. "Play reel" opens the
 * full player with chapters.
 */
export function ReelStage({
  src,
  poster,
  length,
  duration,
  summary,
  play,
}: {
  src: string;
  poster: string;
  length: string;
  duration: number;
  summary: string;
  play: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const clock = useRef<HTMLSpanElement>(null);

  // Playback: the poster as it nears, the loop while it is on screen.
  useEffect(() => {
    const v = video.current;
    const f = frame.current;
    if (!v || !f) return;
    v.muted = true;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let seen = false;
    const sync = () => {
      const ok = seen && !saveData && document.documentElement.dataset.motion !== "off" && document.visibilityState === "visible";
      if (ok) {
        if (!v.getAttribute("src")) v.src = src;
        void v.play().catch(() => undefined);
      } else if (!v.paused) v.pause();
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        v.poster = poster;
        near.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    );
    const tick = () => {
      if (clock.current) clock.current.textContent = `${stamp(v.currentTime)} / ${stamp(duration)}`;
    };
    near.observe(f);
    io.observe(f);
    v.addEventListener("timeupdate", tick);
    document.addEventListener("visibilitychange", sync);
    return () => {
      near.disconnect();
      io.disconnect();
      v.removeEventListener("timeupdate", tick);
      document.removeEventListener("visibilitychange", sync);
      v.pause();
    };
  }, [src, poster, duration]);

  // Scroll to enlarge, where the browser has no scroll timeline.
  useEffect(() => {
    const el = root.current;
    const f = frame.current;
    if (!el || !f) return;
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) return;
    if (document.documentElement.dataset.motion === "off") return;
    let raf = 0;
    const from = parseFloat(getComputedStyle(el).getPropertyValue("--from")) || 0.5;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / (travel * 0.7)));
      const k = 1 - (1 - p) ** 3;
      f.style.transform = `scale(${(from + (1 - from) * k).toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else window.removeEventListener("scroll", onScroll);
    });
    io.observe(el);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={root} className="df-reel" aria-labelledby="df-reel-title">
      <div className="df-reel__stick">
        <div className="df-reel__head df-wrap">
          <h2 id="df-reel-title" className="df-label">
            <span className="df-num">00</span> Showreel
          </h2>
          <p className="df-k">
            <span className="df-num">{length}</span> · No sound · {summary}
          </p>
        </div>
        <div className="df-reel__room">
          <div ref={frame} className="df-reel__frame">
            <video ref={video} muted loop playsInline preload="none" aria-hidden tabIndex={-1} disablePictureInPicture />
            <span className="df-reel__corner df-reel__corner--tl" aria-hidden />
            <span className="df-reel__corner df-reel__corner--tr" aria-hidden />
            <span className="df-reel__corner df-reel__corner--bl" aria-hidden />
            <span className="df-reel__corner df-reel__corner--br" aria-hidden />
            <span ref={clock} className="df-reel__clock df-num" aria-hidden>
              00:00 / {stamp(duration)}
            </span>
          </div>
        </div>
        <div className="df-reel__foot df-wrap">
          <div className="df-reel__play">{play}</div>
          <p className="df-k df-reel__hint" aria-hidden>
            Scroll to enlarge
          </p>
        </div>
      </div>
    </section>
  );
}
