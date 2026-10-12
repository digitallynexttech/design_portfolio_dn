"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, ViewTransition, type ComponentType } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import type { CaseStudy, ExhibitKey } from "@/content/types";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier, type Tier } from "@/features/stage/tier";

export type ExhibitProps = { study: CaseStudy; onReady: () => void };

type Entry = { component: ComponentType<ExhibitProps>; webgl: boolean };

const load = (loader: () => Promise<{ default: ComponentType<ExhibitProps> }>) => dynamic(loader, { ssr: false });

// Exhibits that need WebGL fall back to the poster on devices without it; DOM exhibits always run.
const REGISTRY: Partial<Record<ExhibitKey, Entry>> = {
  skelmet: { component: load(() => import("./skelmet-exhibit")), webgl: true },
  kyg: { component: load(() => import("./kyg-exhibit")), webgl: true },
  dnms: { component: load(() => import("./dnms-exhibit")), webgl: false },
  h2s: { component: load(() => import("./h2s-exhibit")), webgl: false },
  "happy-ganga": { component: load(() => import("./happy-ganga-exhibit")), webgl: false },
  leocym: { component: load(() => import("./leocym-exhibit")), webgl: false },
  "kyg-network": { component: load(() => import("./kyg-network-exhibit")), webgl: false },
  talentifix: { component: load(() => import("./talentifix-exhibit")), webgl: false },
  chetan: { component: load(() => import("./chetan-exhibit")), webgl: false },
  "realty-canvas": { component: load(() => import("./realty-canvas-exhibit")), webgl: false },
  "making-of": { component: load(() => import("./making-of-exhibit")), webgl: false },
};

/** How long the "how to play" hint stays before it lets the exhibit speak for itself. */
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
    <section
      ref={ref}
      aria-label={`${study.client}: interactive exhibit`}
      aria-busy={loading || undefined}
      className="exhibit relative isolate h-[calc(100svh-15rem)] min-h-[22rem] overflow-hidden bg-(--c-surface) md:h-[max(26rem,calc(100svh-21rem))]"
    >
      <ViewTransition name={`poster-${study.slug}`} share="poster-morph" default="none">
        <Image
          src={study.poster.src}
          alt={study.poster.alt}
          fill
          preload
          sizes="100vw"
          className="object-cover transition-opacity duration-700"
          style={{ opacity: ready ? 0 : 1 }}
        />
      </ViewTransition>
      {mount && Component ? (
        <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
          <Component study={study} onReady={() => setReady(true)} />
        </div>
      ) : null}

      {loading ? <span aria-hidden className="exhibit__loading" /> : null}

      <p
        aria-hidden={hintGone || undefined}
        className="pointer-events-none absolute right-(--gutter) bottom-4 left-(--gutter) z-10 flex w-fit max-w-[34rem] items-start gap-2.5 rounded-2xl bg-black/55 px-4 py-2.5 text-sm leading-snug text-white backdrop-blur-md transition-opacity duration-700 md:bottom-5"
        style={{ opacity: hintGone ? 0 : 1 }}
      >
        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-(--c-accent) ${paused ? "" : "animate-pulse"}`} aria-hidden />
        {hint}
      </p>

      <button
        type="button"
        onClick={() => setInfo(true)}
        aria-haspopup="dialog"
        className="absolute top-4 right-4 z-10 rounded-full bg-black/55 px-4 py-2 text-sm text-white backdrop-blur-md md:top-auto md:right-(--gutter) md:bottom-5"
      >
        More<span className="sr-only"> about this exhibit</span>
      </button>

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
