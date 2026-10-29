"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { WorkCardData } from "@/components/work/work-card";
import { lift, pad } from "@/features/drafts/depth/lift";
import { ShaftAstronaut } from "@/features/stage3d/astro/astro-figure";
import "./shaft.css";

/**
 * /work, "The Shaft" (Karan chose it from five falling drafts, 26 Oct 2026). One list of studies,
 * three ways to read it, chosen before the first paint
 * (html[data-wa]):
 * - shaft: wide screens with motion. A sticky stage looks straight down a shaft (hairline rings
 *   receding to a vanishing point). Each study's poster hangs flat on a wall, left and right in
 *   turn; as you fall, the next one comes up the shaft, swings off its wall to face you, and its
 *   facts stand beside it. A mono depth readout and a rail of stations (red marker: you are here)
 *   keep count. One passive rAF driver writes transforms and opacity only.
 * - drop: phones and upright tablets. One column; each poster rises out of the depth as it reaches
 *   the middle of the screen (CSS scroll-driven), its facts under it.
 * - static: reduced motion, or no script: the same rows, still.
 */
export const WA_MODE_SCRIPT = `(function(){try{var d=document.documentElement,r=matchMedia('(prefers-reduced-motion: reduce)').matches,w=matchMedia('(min-width: 900px) and (min-height: 560px)').matches;d.setAttribute('data-wa',r?'static':w?'shaft':'drop')}catch(e){}})()`;

type Mode = "shaft" | "drop" | "static";

const ALL = "All";
/** The fall, in stations: it starts with the first study still coming up, ends with the last at rest. */
const START = -0.6;
const END = 0.15;
/** Metres per station, for the readout and each study's depth line. */
const METRES = 140;
const PERSPECTIVE = 1100;
const SPACING = 1300;
const WALL = 78;
const FACE = 9;
const RINGS = 9;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const depthOf = (stationFromOne: number) => `−${String(Math.max(0, Math.round(stationFromOne * METRES))).padStart(4, "0")} m`;

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const readUrl = () => new URLSearchParams(window.location.search).get("discipline") ?? ALL;
const readServer = () => ALL;

function decide(): Mode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  return window.matchMedia("(min-width: 900px) and (min-height: 560px)").matches ? "shaft" : "drop";
}

/** Where the track is, and how far it scrolls: measured on layout, read by the driver and the jumps. */
type Geometry = { top: number; span: number; n: number };

export function Shaft({ studies }: { studies: WorkCardData[] }) {
  const disciplines = useMemo(() => [ALL, ...Array.from(new Set(studies.flatMap((s) => s.disciplines))).sort()], [studies]);
  const fromUrl = useSyncExternalStore(subscribe, readUrl, readServer);
  const [picked, setPicked] = useState<string | null>(null);
  const wanted = picked ?? fromUrl;
  const active = disciplines.includes(wanted) ? wanted : ALL;
  const shown = active === ALL ? studies : studies.filter((s) => s.disciplines.includes(active));
  const n = shown.length;

  const [mode, setMode] = useState<Mode>("static");
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const geometry = useRef<Geometry>({ top: 0, span: 1, n });

  // The mode: already on <html> from the inline script after a full load; set here before paint on a
  // client navigation, and kept up as the window or the motion setting changes.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const apply = () => {
      const next = decide();
      html.setAttribute("data-wa", next);
      setMode(next);
    };
    apply();
    const queries = [window.matchMedia("(prefers-reduced-motion: reduce)"), window.matchMedia("(min-width: 900px) and (min-height: 560px)")];
    for (const q of queries) q.addEventListener("change", apply);
    return () => {
      for (const q of queries) q.removeEventListener("change", apply);
      html.removeAttribute("data-wa");
    };
  }, []);

  // A station's scroll position in the shaft.
  const stationY = useCallback((i: number) => {
    const g = geometry.current;
    const steps = Math.max(0.0001, g.n - 1 - START + END);
    return g.top + ((i - START) / steps) * g.span;
  }, []);

  const jump = useCallback(
    (i: number, behavior: ScrollBehavior) => {
      window.scrollTo({ top: stationY(i), behavior });
    },
    [stationY],
  );

  // The shaft's driver: transforms and opacity, from the scroll position, once a frame at most.
  useEffect(() => {
    const t = track.current;
    const s = stage.current;
    if (mode !== "shaft" || !t || !s) return;
    const items = Array.from(t.querySelectorAll<HTMLElement>(".wa-item"));
    const boxes = items.map((li) => li.querySelector<HTMLElement>(".wa-box"));
    const facts = items.map((li) => li.querySelector<HTMLElement>(".wa-facts__in"));
    const sides = items.map((li) => (li.dataset.side === "left" ? -1 : 1));
    const rings = Array.from(s.querySelectorAll<HTMLElement>(".wa-ring"));
    const depthEl = s.querySelector<HTMLElement>("[data-wa-depth]");
    const stationEl = s.querySelector<HTMLElement>("[data-wa-station]");
    const nameEl = s.querySelector<HTMLElement>("[data-wa-name]");
    const marker = s.querySelector<HTMLElement>(".wa-rail__marker");
    const cue = s.querySelector<HTMLElement>(".wa-cue");
    const count = items.length;
    let W = 1;
    let railH = 1;
    let current = -1;
    let raf = 0;

    const measure = () => {
      const r = t.getBoundingClientRect();
      geometry.current = { top: r.top + window.scrollY, span: Math.max(1, t.offsetHeight - window.innerHeight), n: count };
      W = s.clientWidth;
      railH = s.querySelector<HTMLElement>(".wa-rail__line")?.clientHeight ?? 1;
    };

    const frame = () => {
      raf = 0;
      const g = geometry.current;
      const raw = clamp((window.scrollY - g.top) / g.span, 0, 1);
      const p = START + raw * (count - 1 - START + END);

      for (let i = 0; i < count; i++) {
        const box = boxes[i];
        const fact = facts[i];
        if (!box || !fact) continue;
        const side = sides[i];
        const d = i - p;
        const ad = Math.abs(d);
        const face = smooth(1 - ad);
        const z = Math.min(-d * SPACING, PERSPECTIVE * 0.62);
        const xWall = side * (W / 2) * 0.92;
        const x = xWall + (side * W * 0.2 - xWall) * face;
        const rot = -side * (WALL + (FACE - WALL) * face);
        // Past you: gone within half a station. Coming up: dim (the next one rises on the facts' side
        // of the shaft, behind them) until it is nearly in front of you; far down, lost in the dark.
        const op =
          (d < 0 ? 1 - smooth((-d - 0.3) / 0.5) : 1 - 0.8 * smooth((d - 0.55) / 0.45)) * (1 - smooth((d - 2.4) / 2));
        // Each poster has its own perspective, so nothing sorts them by depth: nearer paints on top.
        items[i].style.zIndex = String(500 - Math.round(d * 10));
        box.style.transform = `perspective(${PERSPECTIVE}px) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`;
        box.style.opacity = op.toFixed(3);
        box.style.visibility = op < 0.01 ? "hidden" : "";
        const f = smooth((0.5 - ad) / 0.35);
        fact.style.transform = `translate3d(${(-side * W * 0.215 + d * 70).toFixed(1)}px, ${(d * 36).toFixed(1)}px, 0)`;
        fact.style.opacity = f.toFixed(3);
      }

      // The shaft's rings come up past you and go round again.
      const loop = RINGS * (SPACING / 2);
      const cam = (p - START) * SPACING;
      for (let k = 0; k < rings.length; k++) {
        const depth = (((k * (SPACING / 2) - cam) % loop) + loop) % loop;
        const frac = depth / loop;
        rings[k].style.transform = `perspective(${PERSPECTIVE}px) translate3d(0, 0, ${(-depth).toFixed(1)}px)`;
        rings[k].style.opacity = (smooth(frac / 0.12) * (1 - smooth((frac - 0.55) / 0.45))).toFixed(3);
      }

      const cur = clamp(Math.round(p), 0, count - 1);
      if (depthEl) depthEl.textContent = depthOf(p + 1);
      if (marker) marker.style.transform = `translate3d(0, ${(clamp(count > 1 ? p / (count - 1) : 0, 0, 1) * railH).toFixed(1)}px, 0)`;
      if (cue) cue.style.opacity = (1 - smooth((p - START) / 0.45)).toFixed(3);
      if (cur !== current) {
        if (current >= 0) items[current]?.removeAttribute("data-current");
        items[cur]?.setAttribute("data-current", "");
        if (stationEl) stationEl.textContent = `${pad(cur + 1)} / ${pad(count)}`;
        if (nameEl) nameEl.textContent = items[cur]?.dataset.client ?? "";
        current = cur;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(raf);
      for (const el of [...boxes, ...facts, ...rings]) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.visibility = "";
      }
      for (const li of items) {
        li.removeAttribute("data-current");
        li.style.zIndex = "";
      }
    };
  }, [mode, n, active]);

  const choose = (value: string) => {
    const url = new URL(window.location.href);
    if (value === ALL) url.searchParams.delete("discipline");
    else url.searchParams.set("discipline", value);
    window.history.replaceState(window.history.state, "", url);
    setPicked(value);
    // Back to the top of the fall, so the first of the new set is the one in front of you.
    const top = filterRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) filterRef.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="wa-shaft">
      <div ref={filterRef} className="wa-filter">
        <ul className="wa-chips" aria-label="Filter by discipline">
          {disciplines.map((d) => (
            <li key={d}>
              <button type="button" aria-pressed={active === d} onClick={() => choose(d)} className="dn-chip">
                {d}
              </button>
            </li>
          ))}
        </ul>
        <p className="dp-k wa-count" aria-live="polite">
          {n} {n === 1 ? "study" : "studies"}
          {active === ALL ? "" : ` · ${active}`}
        </p>
      </div>

      <div ref={track} className="wa-track" style={{ "--n": n } as CSSProperties}>
        <div ref={stage} className="wa-stage">
          <div className="wa-rings" aria-hidden>
            <svg className="wa-vanish" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M4 6 L50 50 M96 6 L50 50 M4 94 L50 50 M96 94 L50 50" />
            </svg>
            {Array.from({ length: RINGS }, (_, k) => (
              <span key={k} className="wa-ring" />
            ))}
          </div>
          {/* The astronaut falling with you, below the study in front of you (features/stage3d/astro). */}
          <ShaftAstronaut />

          <ol
            className="wa-list"
            onFocus={(e) => {
              if (mode !== "shaft") return;
              const li = (e.target as Element).closest<HTMLElement>("[data-i]");
              if (li) jump(Number(li.dataset.i), "instant");
            }}
          >
            {shown.map((study, i) => (
              <li
                key={study.slug}
                className="wa-item"
                data-i={i}
                data-side={i % 2 === 0 ? "right" : "left"}
                data-client={study.client}
                style={{ "--accent": lift(study.accent), "--ar": `${study.poster.width} / ${study.poster.height}` } as CSSProperties}
              >
                <Study study={study} index={i} />
              </li>
            ))}
          </ol>

          <p className="wa-cue dp-k" aria-hidden>
            Scroll to fall <span>↓</span>
          </p>
          <div className="wa-readout dp-k" aria-hidden>
            <p>
              Depth <span data-wa-depth>{depthOf(1 + START)}</span>
            </p>
            <p>
              <span data-wa-station>{`${pad(1)} / ${pad(n)}`}</span> · <span data-wa-name>{shown[0]?.client}</span>
            </p>
          </div>
          {/* The stations, for the pointer (keyboards reach each study by its own link). */}
          <div className="wa-rail" aria-hidden>
            <span className="wa-rail__line">
              {shown.map((study, i) => (
                <button
                  key={study.slug}
                  type="button"
                  tabIndex={-1}
                  className="wa-rail__tick"
                  style={{ "--k": n > 1 ? i / (n - 1) : 0 } as CSSProperties}
                  onClick={() => jump(i, "smooth")}
                  title={study.client}
                >
                  <span />
                </button>
              ))}
              <span className="wa-rail__marker" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Study({ study, index }: { study: WorkCardData; index: number }) {
  const titleId = `wa-${study.slug}`;
  const href = `/work/${study.slug}`;
  return (
    <article className="wa-study" aria-labelledby={titleId}>
      <div className="wa-panel">
        <div className="dp-box wa-box">
          <Image
            src={study.poster.src}
            alt={study.poster.alt}
            fill
            sizes="(min-width: 900px) 42vw, 92vw"
            priority={index === 0}
            className="dp-plate dp-cover"
          />
          <FlowLink href={href} direction="deeper" className="wa-hit" tabIndex={-1} aria-hidden />
        </div>
      </div>
      <div className="wa-facts">
        <div className="wa-facts__in">
          <p className="dp-k wa-meta">
            <span className="wa-no">{pad(index + 1)}</span>
            <span>{depthOf(index + 1)}</span>
            <span>{study.industry}</span>
          </p>
          <h2 id={titleId} className="wa-client">
            {study.client}
          </h2>
          <p className="wa-line">{study.headline}</p>
          {study.metrics?.length ? (
            <dl className="dp-metrics wa-metrics">
              {study.metrics.map((m) => (
                <div key={m.label} className="dp-metric">
                  <dt className="dp-metric__label">{m.label}</dt>
                  <dd className="dp-metric__value">{m.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <dl className="dp-spec wa-spec">
            <div className="dp-spec__row">
              <dt className="dp-k">Stack</dt>
              <dd>{study.platform}</dd>
            </div>
            {study.palette ? (
              <div className="dp-spec__row">
                <dt className="dp-k">Palette</dt>
                <dd className="dp-swatches">
                  {study.palette.map((hex, k) => (
                    <span key={k} className="dp-swatch">
                      <span className="dp-swatch__chip" style={{ background: hex }} aria-hidden />
                      {hex.toUpperCase()}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          <FlowLink href={href} direction="deeper" className="dp-link wa-go">
            View case study <span aria-hidden>→</span>
          </FlowLink>
        </div>
      </div>
    </article>
  );
}
