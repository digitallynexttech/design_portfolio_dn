"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { Dial, Thumbwheel } from "./controls";
import { pad } from "./dot-engine";
import { LoopVideo } from "./loop-video";

export type Channel = {
  slug: string;
  client: string;
  industry: string;
  year: number;
  platform: string;
  headline: string;
  metrics: { value: string; label: string }[];
  palette: { name: string; hex: string }[];
  still: { src: string; alt: string; width: number; height: number };
  video?: string;
};

/**
 * (01) Selected work as a selector: one screen, four channels, and a detented dial to turn between
 * them (a thumbwheel on phones; a sideways swipe on the screen works too). Every channel's readout is
 * in the page, stacked in one cell, so the panel never changes height and crawlers read all four;
 * only the selected one is shown. Each change sends a scan line down the screen.
 */
export function Selector({ channels }: { channels: Channel[] }) {
  const [index, setIndex] = useState(0);
  const [changes, setChanges] = useState(0);
  const swipe = useRef({ x: 0, y: 0, id: -1 });
  const count = channels.length;

  const select = (i: number) => {
    if (i === index) return;
    setIndex(i);
    setChanges((n) => n + 1);
  };

  const marks = channels.map((c, i) => ({ no: pad(i + 1), name: c.client }));
  const valueText = (i: number) => `${pad(i + 1)} of ${pad(count)}: ${channels[i]?.client ?? ""}`;
  const control = {
    index,
    count,
    marks,
    onChange: select,
    label: "Selected work",
    valueText,
  };

  return (
    <div className="ds-sel">
      <div className="ds-sel__screenwrap">
        <div
          className="ds-sel__screen ds-screen"
          data-power
          onPointerDown={(e) => {
            swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          }}
          onPointerUp={(e) => {
            const s = swipe.current;
            if (s.id !== e.pointerId) return;
            const dx = e.clientX - s.x;
            const dy = e.clientY - s.y;
            s.id = -1;
            if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) select(Math.min(count - 1, Math.max(0, index + (dx < 0 ? 1 : -1))));
          }}
        >
          <div className="ds-sel__media">
            {channels.map((c, i) => (
              <div key={c.slug} className="ds-sel__ch" data-on={i === index || undefined}>
                <Image
                  src={c.still.src}
                  alt={i === index ? c.still.alt : ""}
                  fill
                  sizes="(min-width: 1024px) 62vw, 100vw"
                  className="ds-cover ds-cover--top"
                />
                {c.video ? <LoopVideo src={c.video} active={i === index} /> : null}
              </div>
            ))}
            {changes ? <span key={changes} className="ds-sel__scan" aria-hidden /> : null}
          </div>
          <p className="ds-osd" aria-hidden>
            <span className="ds-osd__tag ds-num">
              CH {pad(index + 1)}/{pad(count)}
            </span>
          </p>
        </div>
        <p className="ds-meta" aria-hidden>
          <span>C1 · Screen</span>
          <span className="ds-num">
            {channels[index]?.video
              ? "Preview loop · 640 × 360"
              : `Still · ${channels[index]?.still.width} × ${channels[index]?.still.height}`}
          </span>
          <span className="ds-meta__rule" />
          <span className="ds-num ds-meta__opt">{channels[index]?.client}</span>
        </p>
      </div>

      <div className="ds-sel__ctrl">
        <Dial {...control} />
        <Thumbwheel {...control} />
        {/* The panel's printed legend; a press on a name turns the dial there (the dial is the control). */}
        <ol
          className="ds-sel__legend"
          aria-hidden
          onPointerDown={(e) => {
            const li = (e.target as Element).closest<HTMLElement>("[data-i]");
            if (li) select(Number(li.dataset.i));
          }}
        >
          {channels.map((c, i) => (
            <li key={c.slug} data-i={i} data-on={i === index || undefined}>
              <span className="ds-k ds-num">{pad(i + 1)}</span>
              {c.client}
            </li>
          ))}
        </ol>
        <p className="ds-sel__hint ds-k" aria-hidden>
          <span className="ds-sel__hint-fine">Drag the dial · ← → · Wheel</span>
          <span className="ds-sel__hint-touch">Roll the wheel · or swipe the screen</span>
        </p>
      </div>

      <div className="ds-sel__read ds-stack">
        {channels.map((c, i) => (
          <article key={c.slug} className="ds-sel__card" data-on={i === index || undefined} aria-labelledby={`ds-ch-${c.slug}`}>
            <p className="ds-k ds-sel__meta">
              <span className="ds-num">CH {pad(i + 1)}</span>
              <span>{c.industry}</span>
              <span className="ds-num">{c.year}</span>
            </p>
            <h3 id={`ds-ch-${c.slug}`} className="ds-h3">
              {c.client}
            </h3>
            <p className="ds-sel__line">{c.headline}</p>
            <dl className="ds-sel__metrics">
              {c.metrics.map((m, k) => (
                <div key={m.label} className="ds-metric">
                  <dt className="ds-metric__label">
                    <span className="ds-k ds-num" aria-hidden>
                      M.{k + 1}
                    </span>
                    {m.label}
                  </dt>
                  <dd className="ds-metric__value ds-num">{m.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="ds-sel__aux ds-stack">
        {channels.map((c, i) => (
          <div key={c.slug} className="ds-sel__auxcard" data-on={i === index || undefined}>
            <div className="ds-palette">
              <p className="ds-k">Theme · {c.platform}</p>
              <ul className="ds-palette__list" aria-label={`${c.client} theme colours`}>
                {c.palette.map((p) => (
                  <li key={p.name} className="ds-palette__chip">
                    <span className="ds-palette__swatch" style={{ "--sw": p.hex } as CSSProperties} aria-hidden />
                    <span className="ds-k">{p.name}</span>
                    <span className="ds-palette__hex ds-num">{p.hex.toUpperCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
            <FlowLink href={`/work/${c.slug}`} direction="deeper" className="ds-key ds-key--ink ds-key--lg ds-sel__go">
              View case study<span className="sr-only">: {c.client}</span> <span aria-hidden>→</span>
            </FlowLink>
          </div>
        ))}
      </div>
    </div>
  );
}
