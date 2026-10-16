"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { KYG_SITES } from "@/content/exhibits/kyg-network";
import type { ExhibitProps } from "./exhibit";

// mygenesmap.in's home shows made-up expert personas; we show its identity, not that screenshot.
const NO_SCREENSHOT = new Set(["mygenesmap.in"]);

/** Thirteen identities on one codebase: one body of content, poured into thirteen different glasses. */
export default function KygNetworkExhibit({ onReady }: ExhibitProps) {
  const [active, setActive] = useState(0);
  useEffect(() => onReady(), [onReady]);
  const site = KYG_SITES[active];
  const n = KYG_SITES.length;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden transition-colors duration-500" style={{ background: site.palette.bg, color: site.palette.text }}>
      <div className="relative min-h-0 flex-1" style={{ perspective: "1800px" }}>
        {KYG_SITES.map((s, i) => {
          let offset = i - active;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          if (Math.abs(offset) > 3) return null;
          const hidden = NO_SCREENSHOT.has(s.domain);
          return (
            <button
              key={s.domain}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${s.domain}`}
              aria-current={offset === 0}
              className="absolute top-1/2 left-1/2 aspect-[16/10] w-[min(78vw,44rem)] overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 transition-all duration-700 ease-flow"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 38}%) rotateY(${offset * -28}deg) scale(${1 - Math.abs(offset) * 0.14})`,
                zIndex: 10 - Math.abs(offset),
                opacity: 1 - Math.abs(offset) * 0.22,
                background: s.palette.bg,
              }}
            >
              {hidden ? (
                <span className="grid h-full place-items-center p-6 text-center" style={{ color: s.palette.text }}>
                  <span>
                    <span className="block text-3xl font-semibold">{s.domain}</span>
                    <span className="mt-2 block opacity-75">{s.concept}</span>
                  </span>
                </span>
              ) : (
                <Image src={s.desktop.src} alt={s.desktop.alt} fill sizes="(min-width: 904px) 44rem, 78vw" className="object-cover object-top" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-(--gutter) pt-3 pb-28 md:pb-20">
        <div aria-live="polite">
          <p className="text-2xl font-semibold">{site.domain}</p>
          <p className="opacity-75">{site.concept}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            {[site.palette.bg, site.palette.text, site.palette.accent].map((c) => (
              <span key={c} className="size-5 rounded-full ring-1 ring-black/15" style={{ background: c }} />
            ))}
          </span>
          <button type="button" onClick={() => setActive((a) => (a - 1 + n) % n)} className="hit rounded-full border border-current/30 px-4 py-2 text-sm">
            ←
          </button>
          <span className="font-mono text-xs opacity-70">
            {active + 1}/{n}
          </span>
          <button type="button" onClick={() => setActive((a) => (a + 1) % n)} className="hit rounded-full px-4 py-2 text-sm" style={{ background: site.palette.accent, color: site.palette.bg }}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}
