"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";

type Pic = { src: string; alt: string; width: number; height: number };

export type MoreCard = {
  slug: string;
  no: string;
  client: string;
  industry: string;
  accent: string;
  metric?: { value: string; label: string };
  poster: Pic;
  phone: Pic;
  video?: string;
};

/**
 * More work, two ways from one list. Wide screens: an index on the left and, on the right, every
 * study's screen stacked in depth (CSS 3D); pointing at or focusing a row brings its screen to the
 * front, the ones above it fly past the viewer, and with a mouse resting on the list the front screen
 * plays its loop. Narrower screens: the rows become a swipeable strip of phone screens.
 */
export function MoreWork({ cards }: { cards: MoreCard[] }) {
  const [active, setActive] = useState(0);
  const [resting, setResting] = useState(false);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const allowed =
      window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches &&
      document.documentElement.dataset.motion !== "off" &&
      !nav.connection?.saveData;
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (allowed && resting && i === active) {
        if (!video.getAttribute("src") && video.dataset.src) video.src = video.dataset.src;
        void video.play().catch(() => undefined);
      } else if (!video.paused) video.pause();
    });
  }, [active, resting]);

  return (
    <div className="dp-more__body" onPointerEnter={() => setResting(true)} onPointerLeave={() => setResting(false)}>
      <ol className="dp-rows">
        {cards.map((card, i) => (
          <li key={card.slug} className="dp-row" data-on={i === active || undefined} style={{ "--accent": card.accent } as CSSProperties}>
            <FlowLink
              ref={(node) => {
                links.current[i] = node;
              }}
              href={`/work/${card.slug}`}
              direction="deeper"
              className="dp-row__link"
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
            >
              <span className="dp-row__fig">
                <Image src={card.phone.src} alt={card.phone.alt} fill sizes="(max-width: 1023px) 72vw, 1px" className="dp-cover dp-cover--top" />
              </span>
              <span className="dp-row__no" aria-hidden>
                {card.no}
              </span>
              <span className="dp-row__main">
                <span className="dp-row__client">{card.client}</span>
                <span className="dp-row__ind">{card.industry}</span>
              </span>
              {card.metric ? (
                <span className="dp-row__metric">
                  <span className="dp-row__value">{card.metric.value}</span>
                  <span className="dp-row__label">{card.metric.label}</span>
                </span>
              ) : null}
              <span className="dp-row__arrow" aria-hidden>
                →
              </span>
            </FlowLink>
          </li>
        ))}
      </ol>

      {/* A pointer shortcut only: the rows are the links for everyone else. */}
      <div className="dp-stack" aria-hidden onClick={() => links.current[active]?.click()}>
        {cards.map((card, i) => {
          const r = i - active;
          return (
            <div
              key={card.slug}
              className="dp-stack__card"
              data-rel={r < 0 ? "past" : String(r)}
              style={{ "--r": Math.max(0, r), "--accent": card.accent } as CSSProperties}
            >
              <Image src={card.poster.src} alt="" fill sizes="(min-width: 1024px) 40vw, 1px" className="dp-cover dp-cover--top" />
              {card.video ? (
                <video
                  ref={(node) => {
                    videos.current[i] = node;
                  }}
                  data-src={card.video}
                  className="dp-stack__video"
                  muted
                  loop
                  playsInline
                  preload="none"
                  tabIndex={-1}
                  disablePictureInPicture
                  onPlaying={(e) => e.currentTarget.setAttribute("data-playing", "")}
                  onPause={(e) => e.currentTarget.removeAttribute("data-playing")}
                />
              ) : null}
              <span className="dp-stack__tag">
                {card.no} · {card.client}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
