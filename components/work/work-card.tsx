"use client";

import { getImageProps } from "next/image";
import { flushSync } from "react-dom";
import { useId, useRef, useState, ViewTransition } from "react";
import { FlowLink } from "@/components/ui/flow-link";

type Poster = { src: string; alt: string; width: number; height: number };

export type WorkCardData = {
  slug: string;
  client: string;
  headline: string;
  year: number;
  industry: string;
  disciplines: string[];
  platform: string;
  tier: "flagship" | "standard";
  chapters: number;
  accent: string;
  onAccent: string;
  poster: Poster;
  /** The same screen captured on a phone; shown under 768px. */
  posterPhone?: Poster;
  /** The study's lead metric (sourced in its content file; the source is never sent here). */
  metric?: { value: string; label: string };
  /** Its two lead metrics and its palette (background, text, accent), for the home-style case rows. */
  metrics?: { value: string; label: string }[];
  palette?: string[];
  previewVideo?: string;
};

const PHONE = "(max-width: 767px)";

/**
 * A case study card. Hover or focus plays a short muted preview where one exists and pours a
 * "Read the case" pill up in the client's colour. The poster morphs into the study's exhibit on
 * navigation. `compact` is the quiet version for lists of proof (poster, client, one line).
 */
export function WorkCard({
  study,
  large = false,
  priority = false,
  headingLevel = "h3",
  compact = false,
  showChapters = false,
}: {
  study: WorkCardData;
  large?: boolean;
  priority?: boolean;
  /** h2 on /work (cards sit directly under the page title); h3 inside a home-page section. */
  headingLevel?: "h2" | "h3";
  /** Poster (decorative), client and a one-line headline. No chips, metric, pill or preview. */
  compact?: boolean;
  /** Adds the chapter count to the meta line (the /work index). */
  showChapters?: boolean;
}) {
  const Heading = headingLevel;
  const id = useId();
  const titleId = `${id}-title`;
  const lineId = `${id}-line`;
  const video = useRef<HTMLVideoElement>(null);
  const play = () => {
    const v = video.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().catch(() => undefined);
  };
  const stop = () => video.current?.pause();
  // The poster takes its shared name only once this card is being opened, so a page (or a route
  // Next keeps alive in the background) never holds two posters with the same name.
  const [opening, setOpening] = useState(false);

  const phonePoster = compact ? undefined : study.posterPhone;
  const sizes = compact
    ? "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 90vw"
    : large
      ? "(min-width: 768px) 92vw, 100vw"
      : "(min-width: 1024px) 46vw, (min-width: 768px) 50vw, 92vw";
  const alt = compact ? "" : study.poster.alt;
  const eager = priority ? ({ loading: "eager", fetchPriority: "high" } as const) : {};
  const {
    props: { srcSet: wideSet, ...img },
  } = getImageProps({ src: study.poster.src, width: study.poster.width, height: study.poster.height, alt, sizes, ...eager });
  const phoneSet = phonePoster
    ? getImageProps({ src: phonePoster.src, width: phonePoster.width, height: phonePoster.height, alt, sizes: "92vw" }).props.srcSet
    : undefined;

  const picture = (
    <picture className="absolute inset-0 block overflow-hidden">
      {phoneSet ? <source media={PHONE} srcSet={phoneSet} sizes="92vw" /> : null}
      <source srcSet={wideSet} sizes={sizes} />
      <img
        {...img}
        alt={alt}
        className={`h-full w-full object-cover object-top transition-transform duration-700 ease-flow group-hover:scale-[1.03] ${large ? "lg:object-center" : ""}`}
      />
    </picture>
  );

  const frame = [
    "relative overflow-hidden bg-ink-2 aspect-[16/10]",
    large ? "lg:aspect-[21/9]" : "",
    phonePoster ? "max-md:aspect-[1170/1992]" : "",
  ].join(" ");

  // Each segment ("Odour control", "2026", "7 chapters") stays whole; lines break only between them, with
  // the dot left at the end of the line. Compact cards keep one line: the industry alone.
  const segments = compact
    ? [study.industry]
    : [...study.industry.split(" · "), String(study.year), ...(showChapters ? [`${study.chapters} chapters`] : [])];
  const meta = segments.map((segment, i) => (
    <span key={segment}>
      <span className="whitespace-nowrap">
        {segment}
        {i < segments.length - 1 ? " ·" : ""}
      </span>
      {i < segments.length - 1 ? " " : ""}
    </span>
  ));

  return (
    <FlowLink
      href={`/work/${study.slug}`}
      direction="deeper"
      className="group flex h-full flex-col"
      aria-labelledby={titleId}
      aria-describedby={lineId}
      // Committed before the link navigates, so the outgoing snapshot already carries the name.
      onClick={compact ? undefined : () => flushSync(() => setOpening(true))}
      onMouseEnter={compact ? undefined : play}
      onMouseLeave={compact ? undefined : stop}
      onFocus={compact ? undefined : play}
      onBlur={compact ? undefined : stop}
    >
      <div className={frame}>
        {compact ? (
          picture
        ) : (
          <ViewTransition name={opening ? `poster-${study.slug}` : undefined} share="poster-morph" default="none">
            {picture}
          </ViewTransition>
        )}
        {!compact && study.previewVideo ? (
          <video
            ref={video}
            src={study.previewVideo}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:hidden"
          />
        ) : null}
        {compact ? null : (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-4 left-4 translate-y-[calc(100%+1.25rem)] rounded-[2px] px-4 py-2 text-sm font-medium opacity-0 shadow-lg shadow-black/30 transition-[translate,opacity] duration-500 ease-flow group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 md:bottom-5 md:left-5"
            style={{ background: study.accent, color: study.onAccent }}
          >
            Read the case →
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${large ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-16" : ""}`}>
        <div>
          <p className={`font-mono text-[0.7rem] tracking-[0.14em] text-(--text-2) uppercase ${compact ? "mt-4 truncate" : "mt-5 text-balance"}`}>
            {meta}
          </p>
          <Heading
            id={titleId}
            className={`mt-2 font-display font-medium tracking-tight ${compact ? "text-xl md:text-2xl" : large ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}
          >
            {study.client}
            <span className="stop">.</span>
          </Heading>
          <p id={lineId} className={`mt-2 text-(--text-2) ${compact ? "line-clamp-2" : "max-w-[48ch]"}`}>
            {study.headline}
          </p>
        </div>

        {compact ? null : (
          <div className={large ? "mt-auto lg:mt-0 lg:self-end" : "mt-auto"}>
            {study.metric ? (
              <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-paper/10 pt-4">
                <span className="font-display text-2xl font-medium tracking-tight md:text-3xl">{study.metric.value}</span>
                <span className="text-sm text-(--text-2)">{study.metric.label}</span>
              </p>
            ) : null}
            <ul className="mt-4 hidden flex-wrap gap-1.5 md:flex" aria-label="Disciplines">
              {study.disciplines.map((d) => (
                <li key={d} className="rounded-[2px] border border-paper/15 px-2.5 py-0.5 text-xs text-(--text-2)">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FlowLink>
  );
}
