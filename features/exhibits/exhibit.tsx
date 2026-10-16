"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, ViewTransition, type ComponentType, type CSSProperties } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import type { CaseStudy, ExhibitKey } from "@/content/types";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier, type Tier } from "@/features/stage/tier";

export type ExhibitProps = { study: CaseStudy; onReady: () => void };

type Entry = {
  component: ComponentType<ExhibitProps>;
  webgl: boolean;
  /** Focus ring colour inside the exhibit, where the client accent is too faint on the exhibit's own ground. */
  focus?: string;
};

const load = (loader: () => Promise<{ default: ComponentType<ExhibitProps> }>) => dynamic(loader, { ssr: false });

// Exhibits that need WebGL fall back to the poster on devices without it; DOM exhibits always run.
const REGISTRY: Partial<Record<ExhibitKey, Entry>> = {
  skelmet: { component: load(() => import("./skelmet-exhibit")), webgl: true },
  kyg: { component: load(() => import("./kyg-exhibit")), webgl: true },
  dnms: { component: load(() => import("./dnms-exhibit")), webgl: false },
  // The H2S blue all but vanishes on the exhibit's navy water; the gauge's own yellow reads on all of it.
  h2s: { component: load(() => import("./h2s-exhibit")), webgl: false, focus: "#FFD56A" },
  "happy-ganga": { component: load(() => import("./happy-ganga-exhibit")), webgl: false },
  leocym: { component: load(() => import("./leocym-exhibit")), webgl: false },
  "kyg-network": { component: load(() => import("./kyg-network-exhibit")), webgl: false },
  talentifix: { component: load(() => import("./talentifix-exhibit")), webgl: false },
  chetan: { component: load(() => import("./chetan-exhibit")), webgl: false },
  "realty-canvas": { component: load(() => import("./realty-canvas-exhibit")), webgl: false },
  "making-of": { component: load(() => import("./making-of-exhibit")), webgl: false },
};

/** How long the "how to play" hint stays over a phone's exhibit before it lets the exhibit speak for itself. */
const HINT_MS = 6000;

// detectTier() opens a throwaway WebGL context, so ask once per page load.
let tier: Tier | undefined;
const deviceTier = () => (tier ??= detectTier());
const never = () => () => undefined;

export function Exhibit({ study }: { study: CaseStudy }) {
  const ref = useRef<HTMLElement>(null);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState(false);
  const [hintGone, setHintGone] = useState(false);
  const entry = REGISTRY[study.exhibit];
  // A WebGL exhibit on a device that draws none (reduced motion, data saver, no WebGL2) stays a still.
  const paused = useSyncExternalStore(never, () => Boolean(entry?.webgl) && deviceTier() === 0, () => false);

  // Load only once the exhibit is near the viewport, and only if the device can run it.
  useEffect(() => {
    const el = ref.current;
    if (!el || !entry || paused) return;
    let stopEngage: (() => void) | undefined;
    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        observer.disconnect();
        // WebGL exhibits wait for the first touch, scroll or key; the poster is a real frame meanwhile.
        if (entry.webgl) stopEngage = whenEngaged(() => setMount(true));
        else setMount(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      stopEngage?.();
    };
  }, [entry, paused]);

  // The hint drains away on the first interaction with the exhibit, or after a few seconds.
  useEffect(() => {
    const el = ref.current;
    if (!el || paused) return;
    const gone = () => setHintGone(true);
    const timer = window.setTimeout(gone, HINT_MS);
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const name of events) el.addEventListener(name, gone, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const name of events) el.removeEventListener(name, gone);
    };
  }, [paused]);

  const Component = entry?.component;
  const loading = mount && !ready;
  const hint = paused ? "The live 3D is paused on this device. This is a real frame from it." : study.exhibitHint;

  return (
    <section ref={ref} aria-label={`${study.client}: interactive exhibit`} aria-busy={loading || undefined} className="exhibit relative isolate">
      <div
        className="exhibit__frame relative isolate h-[calc(100svh-15rem)] min-h-[22rem] overflow-hidden bg-(--c-surface) md:h-[max(26rem,calc(100svh-21rem))]"
        style={entry?.focus ? ({ "--exhibit-focus": entry.focus } as CSSProperties) : undefined}
      >
        <ViewTransition name={`poster-${study.slug}`} share="poster-morph" default="none">
          {/* The page's LCP: in the server HTML already, so fetched eagerly at high priority. */}
          <Image
            src={study.poster.src}
            alt={study.poster.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover transition-opacity duration-700"
            style={{ opacity: ready ? 0 : 1, objectPosition: study.posterFocus }}
          />
        </ViewTransition>
        {mount && Component ? (
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
            <Component study={study} onReady={() => setReady(true)} />
          </div>
        ) : null}

        {loading ? <span aria-hidden className="exhibit__loading" /> : null}

        {/* Top-right at every width: each exhibit keeps its own controls along the foot. The wrapper
            places it, since .hit makes the button itself position: relative. */}
        <div className="absolute top-4 right-4 z-10 md:top-5 md:right-(--gutter)">
          <button
            type="button"
            onClick={() => setInfo(true)}
            aria-haspopup="dialog"
            className="hit rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm text-white backdrop-blur-md"
          >
            More<span className="sr-only"> about this exhibit</span>
          </button>
        </div>
      </div>

      {/* Phones: a pill over the foot of the exhibit that drains away on the first touch. From 768px a
          caption under the frame, in line with the text below, so it never covers the exhibit. */}
      <p
        data-gone={hintGone || undefined}
        className="pointer-events-none absolute right-(--gutter) bottom-4 left-(--gutter) z-10 flex w-fit max-w-[34rem] items-start gap-2.5 rounded-2xl bg-black/55 px-4 py-2.5 text-sm leading-snug text-white backdrop-blur-md transition-[opacity,visibility] duration-700 data-gone:invisible data-gone:opacity-0 md:static md:mx-auto md:mt-3 md:w-full md:max-w-[76rem] md:rounded-none md:bg-transparent md:px-(--gutter) md:py-0 md:text-(--c-muted) md:backdrop-blur-none md:data-gone:visible md:data-gone:opacity-100"
      >
        {/* As a caption the dot hangs in the margin (its 6px and the 10px gap), so the words line up with the title. */}
        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-(--c-accent) md:-ml-4 ${paused ? "" : "animate-pulse"}`} aria-hidden />
        <span className="max-w-[68ch]">{hint}</span>
      </p>

      <LiquidSurface open={info} onClose={() => setInfo(false)} origin="bottom" label={`About the ${study.client} exhibit`}>
        <p className="label text-(--c-muted)">{study.client} · exhibit</p>
        <p className="mt-4 max-w-[40ch] font-(family-name:--c-display) text-2xl leading-snug text-(--c-text) md:text-3xl">{study.exhibitHint}</p>
        {paused ? (
          <p className="mt-6 max-w-[52ch] text-(--c-text)">
            The live 3D is paused on this device (reduced motion, data saving or no WebGL), so you&apos;re looking at a real frame from it.
          </p>
        ) : null}
        <p className="mt-6 max-w-[52ch] text-(--c-muted)">
          Built from the real project: the same assets, colours and behaviour that shipped. Keyboard users can tab into the exhibit;
          everything it shows is also written out in the chapters below.
        </p>
      </LiquidSurface>
    </section>
  );
}
