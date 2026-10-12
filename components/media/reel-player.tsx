"use client";

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { FlowLink } from "@/components/ui/flow-link";
import type { ReelData } from "@/content/reel";

/** 7 → "0:07". */
function timecode(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function chapterAt(chapters: ReelData["chapters"], time: number): number {
  let index = 0;
  chapters.forEach((chapter, i) => {
    if (time >= chapter.start - 0.02) index = i;
  });
  return index;
}

/**
 * The silent showreel with its text alternative: a "Now" pill in the current client's colour that links to the
 * case study, and an ordered chapter list (jump to any site, or read what each one is). Native controls stay, so
 * the player is fully keyboard accessible; the reel has no audio track.
 */
export function ReelPlayer({
  reel,
  head,
  autoPlay = false,
  className = "",
}: {
  reel: ReelData;
  /** Rendered above the video, inside the same column (the page title, or a label in the pop-up). */
  head?: ReactNode;
  autoPlay?: boolean;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [ended, setEnded] = useState(false);
  const listId = useId();
  const { chapters } = reel;
  const now = chapters[current];

  const sync = () => {
    const v = video.current;
    if (v) setCurrent(chapterAt(chapters, v.currentTime));
  };

  const seek = (start: number) => {
    const v = video.current;
    if (!v) return;
    // A hair past the cut, so the frame shown is the new site rather than the last frame of the one before.
    v.currentTime = start > 0 ? start + 0.05 : 0;
    setCurrent(chapterAt(chapters, start));
    setEnded(false);
    v.play().catch(() => undefined);
    // Bring the video back into view (with its title and "Now" pill) when the list has scrolled it away.
    const box = stage.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      top.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
  };

  const replay = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    setCurrent(0);
    setEnded(false);
    v.play().catch(() => undefined);
    v.focus();
  };

  return (
    <div className={`reel ${className}`}>
      <div ref={top} className="reel__top">
        {head ? <div className="reel__head">{head}</div> : null}
        <div ref={stage} className="reel__stage">
          <div className="reel__frame">
            <video
              ref={video}
              className="reel__video"
              src={reel.src}
              poster={reel.poster}
              width={reel.width}
              height={reel.height}
              controls
              playsInline
              muted
              autoPlay={autoPlay}
              preload={autoPlay ? "auto" : "metadata"}
              aria-label={`Showreel: ${reel.summary.toLowerCase()}. ${reel.length}, no sound.`}
              onTimeUpdate={sync}
              onSeeked={sync}
              onPlay={() => setEnded(false)}
              onEnded={() => setEnded(true)}
            >
              <track kind="chapters" src={reel.chaptersTrack} srcLang="en" label="Sites" default />
            </video>
            {ended ? (
              <div className="reel__end" role="group" aria-label="End of the reel">
                <FlowLink href="/work" className="btn btn--solid">
                  See the work <span aria-hidden>→</span>
                </FlowLink>
                <button type="button" onClick={replay} className="btn">
                  Watch again
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <FlowLink
          href={`/work/${now.slug}`}
          direction="deeper"
          className="reel__now"
          style={{ "--now": now.accent, "--on-now": now.onAccent } as CSSProperties}
        >
          <span key={now.slug} className="reel__now-text">
            Now: {now.client} <span aria-hidden>·</span> Case study&nbsp;<span aria-hidden>→</span>
          </span>
        </FlowLink>
      </div>

      <div className="reel__list">
        <h2 id={listId} className="label">
          {reel.summary}
        </h2>
        <ol aria-labelledby={listId} className="mt-4 border-t border-paper/10">
          {chapters.map((chapter, i) => (
            <li key={chapter.slug} className="reel__chapter" aria-current={i === current ? "true" : undefined}>
              <button
                type="button"
                className="reel__time"
                onClick={() => seek(chapter.start)}
                aria-label={`Play from ${timecode(chapter.start)}, ${chapter.client}`}
              >
                {timecode(chapter.start)}
              </button>
              <p className="min-w-0">
                <span className="reel__client" style={{ "--dot": chapter.accent } as CSSProperties}>
                  {chapter.client}
                </span>{" "}
                <span className="text-paper/65">{chapter.headline}</span>
                <span className="sr-only"> On screen: {chapter.shows}</span>
              </p>
              <FlowLink href={`/work/${chapter.slug}`} direction="deeper" className="reel__study">
                Case study<span className="sr-only">: {chapter.client}</span> <span aria-hidden>→</span>
              </FlowLink>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** "Play reel": a compact ghost button that flows the reel up from the bottom in a full-screen liquid surface. */
export function ReelPopup({ reel, className = "" }: { reel: ReelData; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`btn gap-2.5 pl-2.5 text-paper ${className}`}
      >
        <span aria-hidden className="grid size-6 place-items-center rounded-full bg-teal text-[0.55rem] text-ink">
          ▶
        </span>
        Play reel <span className="font-mono text-xs text-paper/60">{reel.length}</span>
      </button>
      <LiquidSurface open={open} onClose={() => setOpen(false)} origin="bottom" size="full" tone="cinema" label="Showreel">
        <div className="grid min-h-[calc(100svh-7rem)] content-center">
          {open ? (
            <ReelPlayer
              reel={reel}
              autoPlay
              className="reel--popup"
              head={<p className="label">Reel · {reel.length} · No sound</p>}
            />
          ) : null}
        </div>
      </LiquidSurface>
    </>
  );
}
