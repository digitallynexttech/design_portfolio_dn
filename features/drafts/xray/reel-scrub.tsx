"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { fileOf } from "./parts";

export type ScrubChapter = { start: number; end: number; client: string; accent: string };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 21.4 → "0:21" */
const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
/** 21.4 → "00:21.40" */
const tc = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;

/**
 * The showreel as a drawing: the frame with its real size called out, and under it a timeline
 * ruler, one tick a second, each chapter marked in its client's colour. Moving along the ruler (or
 * across the frame) scrubs the reel: the video's currentTime follows, one seek at a time, so
 * frames keep up without piling requests. Nothing downloads until someone reaches for it
 * (preload="none", src set on first intent). The ruler is a slider: arrows step a second,
 * Page Up / Down jump a chapter, Home / End go to the ends. "Play reel" opens the site's player.
 */
export function ReelScrub({
  src,
  poster,
  width,
  height,
  duration,
  length,
  summary,
  chapters,
  play,
}: {
  src: string;
  poster: string;
  width: number;
  height: number;
  duration: number;
  length: string;
  summary: string;
  chapters: ScrubChapter[];
  play: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    const frame = host?.querySelector<HTMLElement>("[data-frame]");
    const ruler = host?.querySelector<HTMLElement>("[data-ruler]");
    const video = host?.querySelector<HTMLVideoElement>("video");
    const head = host?.querySelector<HTMLElement>("[data-head]");
    const headTag = head?.querySelector<HTMLElement>(".dx-tl__tc");
    if (!host || !frame || !ruler || !video || !head) return;
    const outs = host.querySelectorAll<HTMLElement>("[data-tc]");
    const chOut = host.querySelector<HTMLElement>("[data-ch]");
    const chDot = host.querySelector<HTMLElement>("[data-chdot]");
    const marks = host.querySelectorAll<HTMLElement>("[data-chapter]");

    let engaged = false;
    let seeking = false;
    let want = 0;
    let shownCh = -1;
    let dragging = false;
    let raf = 0;

    const chapterAt = (t: number) => {
      let i = 0;
      for (let k = 0; k < chapters.length; k++) if (t >= chapters[k].start) i = k;
      return i;
    };

    const paint = () => {
      raf = 0;
      const p = want / duration;
      const rw = ruler.clientWidth;
      const x = p * rw;
      head.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      if (headTag) {
        const tw = headTag.offsetWidth;
        const off = Math.min(Math.max(-tw / 2, -x), rw - x - tw);
        headTag.style.transform = `translate3d(${off.toFixed(1)}px,0,0)`;
      }
      const code = tc(want);
      for (const o of outs) o.textContent = code;
      const ch = chapterAt(want);
      if (ch !== shownCh) {
        shownCh = ch;
        const c = chapters[ch];
        if (chOut) chOut.textContent = c?.client ?? "";
        if (chDot && c) chDot.style.background = c.accent;
        marks.forEach((m, i) => m.toggleAttribute("data-on", i === ch));
      }
      ruler.setAttribute("aria-valuenow", want.toFixed(1));
      ruler.setAttribute("aria-valuetext", `${mmss(want)}, ${chapters[ch]?.client ?? ""}`);
    };

    const engage = () => {
      if (engaged) return;
      engaged = true;
      video.preload = "auto";
      video.src = src;
      video.load();
    };

    const seek = () => {
      if (seeking || video.readyState < 1) return;
      if (Math.abs(video.currentTime - want) < 0.03) return;
      seeking = true;
      video.currentTime = want;
    };

    const go = (t: number) => {
      want = clamp(t, 0, duration - 0.05);
      engage();
      seek();
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onSeeked = () => {
      seeking = false;
      host.dataset.live = "";
      seek();
    };
    const onMeta = () => seek();

    const at = (e: PointerEvent, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1) * duration;
    };

    // Mouse: hovering scrubs. Touch and pen: drag. Both on the ruler and on the frame.
    const onMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      if (e.pointerType === "mouse" || dragging) go(at(e, el));
    };
    const onDown = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      dragging = true;
      if (e.pointerType === "mouse") el.setPointerCapture(e.pointerId);
      go(at(e, el));
    };
    const onUp = () => {
      dragging = false;
    };
    const onIntent = () => engage();

    const onKey = (e: KeyboardEvent) => {
      const next =
        e.key === "ArrowRight" || e.key === "ArrowUp"
          ? want + 1
          : e.key === "ArrowLeft" || e.key === "ArrowDown"
            ? want - 1
            : e.key === "PageUp"
              ? (chapters[chapterAt(want) + 1]?.start ?? duration)
              : e.key === "PageDown"
                ? (chapters[Math.max(0, chapterAt(want - 0.5))]?.start ?? 0)
                : e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? duration
                    : null;
      if (next === null) return;
      e.preventDefault();
      go(next);
    };

    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadedmetadata", onMeta);
    for (const el of [ruler, frame]) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerenter", onIntent);
    }
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    ruler.addEventListener("keydown", onKey);
    ruler.addEventListener("focus", onIntent);
    window.addEventListener("resize", onResize);
    paint();
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadedmetadata", onMeta);
      for (const el of [ruler, frame]) {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointerenter", onIntent);
      }
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      ruler.removeEventListener("keydown", onKey);
      ruler.removeEventListener("focus", onIntent);
      window.removeEventListener("resize", onResize);
      video.removeAttribute("src");
      video.load();
    };
  }, [src, duration, chapters]);

  return (
    <div ref={ref} className="dx-reel">
      <div className="dx-reel__draw">
        <span className="dx-dim dx-dim--w dx-reel__dw" aria-hidden>
          <span className="dx-dim__v">{width} px</span>
        </span>
        <div className="dx-plate dx-reel__frame" data-frame data-x="video" style={{ "--ar": `${width} / ${height}` } as CSSProperties}>
          <div className="dx-plate__bp" aria-hidden>
            <svg className="dx-plate__x" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
              <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="dx-plate__tag">
              <b>video</b> {width} × {height} · {fileOf(src)} · {length} · no audio
            </span>
          </div>
          <div className="dx-plate__media">
            <Image src={poster} alt="" fill sizes="(min-width: 1024px) 80vw, 100vw" className="dx-cover" />
            <video className="dx-reel__video" muted playsInline preload="none" aria-hidden tabIndex={-1} disablePictureInPicture />
          </div>
          <p className="dx-reel__hud" aria-hidden>
            <span>
              TC <b data-tc>00:00.00</b>
            </span>
            <span className="dx-reel__ch">
              <i data-chdot style={{ background: chapters[0]?.accent }} />
              <b data-ch>{chapters[0]?.client}</b>
            </span>
          </p>
        </div>
        <span className="dx-dim dx-dim--h dx-reel__dh" aria-hidden>
          <span className="dx-dim__v">{height} px</span>
        </span>
      </div>

      <div
        className="dx-tl"
        data-ruler
        role="slider"
        tabIndex={0}
        aria-label="Scrub through the showreel"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={0}
        aria-valuetext={`0:00, ${chapters[0]?.client ?? ""}`}
        aria-orientation="horizontal"
        style={{ "--sec": `${(100 / duration).toFixed(4)}%` } as CSSProperties}
      >
        <span className="dx-tl__ticks" aria-hidden />
        <ol className="dx-tl__chs" aria-hidden>
          {chapters.map((c) => (
            <li
              key={c.start}
              data-chapter
              className="dx-tl__ch"
              style={{ left: `${(c.start / duration) * 100}%`, width: `${((c.end - c.start) / duration) * 100}%`, "--c": c.accent } as CSSProperties}
            >
              <span className="dx-tl__bar" />
              <span className="dx-tl__t">{mmss(c.start)}</span>
              <span className="dx-tl__name">{c.client}</span>
            </li>
          ))}
        </ol>
        <span className="dx-tl__head" data-head aria-hidden>
          <span className="dx-tl__tc" data-tc>
            00:00.00
          </span>
        </span>
      </div>

      <div className="dx-reel__foot">
        <p className="dx-reel__meta dx-k">
          <span>Reel</span>
          <span>{length}</span>
          <span>No sound</span>
          <span>{summary}</span>
        </p>
        <p className="dx-reel__hint dx-k" aria-hidden>
          <span className="dx-hover">Hover the frame or the ruler to scrub</span>
          <span className="dx-touch">Drag along the ruler to scrub</span>
        </p>
        <div className="dx-reel__play">{play}</div>
      </div>
    </div>
  );
}
