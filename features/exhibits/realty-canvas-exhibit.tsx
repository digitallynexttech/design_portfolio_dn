"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RC_DECK } from "@/content/exhibits/realty-canvas";
import type { ExhibitProps } from "./exhibit";

/** A swipeable deck of art-directed project banners, like the site's deck of video Shorts. */
export default function RealtyCanvasExhibit({ onReady }: ExhibitProps) {
  const [top, setTop] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  useEffect(() => onReady(), [onReady]);

  const advance = (dir: 1 | -1) => setTop((t) => (t + dir + RC_DECK.length) % RC_DECK.length);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 overflow-hidden text-white" style={{ background: "radial-gradient(80% 70% at 50% 40%, #14314B, #0D1B25 70%)" }}>
      <div
        className="relative h-[52%] w-[min(86vw,34rem)] touch-pan-y select-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          start.current = event.clientX;
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (start.current !== null) setDrag(event.clientX - start.current);
        }}
        onPointerUp={() => {
          if (Math.abs(drag) > 100) advance(drag < 0 ? 1 : -1);
          setDrag(0);
          setDragging(false);
          start.current = null;
        }}
        onPointerCancel={() => {
          setDrag(0);
          setDragging(false);
          start.current = null;
        }}
      >
        {RC_DECK.map((card, i) => {
          const depth = (i - top + RC_DECK.length) % RC_DECK.length;
          if (depth > 3) return null;
          const isTop = depth === 0;
          return (
            <figure
              key={card.image.src}
              className="absolute inset-0 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10"
              style={{
                zIndex: 10 - depth,
                transform: isTop
                  ? `translateX(${drag}px) rotate(${drag / 18}deg)`
                  : `translateY(${depth * 18}px) scale(${1 - depth * 0.06}) rotate(${depth % 2 ? 3 : -3}deg)`,
                transition: dragging && isTop ? "none" : "transform 450ms cubic-bezier(0.16,1,0.3,1)",
                cursor: isTop ? "grab" : undefined,
              }}
              aria-hidden={!isTop}
            >
              <Image src={card.image.src} alt={card.image.alt} fill sizes="34rem" className="pointer-events-none object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent p-4 text-sm">{card.title}</figcaption>
            </figure>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => advance(-1)} className="rounded-full border border-[#FEB711]/50 px-4 py-2 text-sm text-[#FEB711]">
          ← Back
        </button>
        <span className="font-mono text-xs text-white/60" aria-live="polite">
          {top + 1} / {RC_DECK.length}
        </span>
        <button type="button" onClick={() => advance(1)} className="rounded-full bg-[#FEB711] px-4 py-2 text-sm font-medium text-[#0D1B25]">
          Next →
        </button>
      </div>
    </div>
  );
}
