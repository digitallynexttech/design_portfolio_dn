"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { LoopVideo } from "./loop-video";
import { Frame } from "./parts";

export type IndexRow = {
  no: string;
  slug: string;
  client: string;
  industry: string;
  platform: string;
  headline: string;
  metric?: { value: string; label: string };
  poster: { src: string; alt: string; width: number; height: number };
  video?: { src: string; poster: string; width: number; height: number };
};

type Key = "no" | "client" | "industry";
const COLUMNS: { key: Key; label: string }[] = [
  { key: "no", label: "No." },
  { key: "client", label: "Client" },
  { key: "industry", label: "Industry" },
];

/**
 * (03) More work as an index: a sortable table of the standard studies, and, beside it on wide
 * screens, a fixed viewer that shows the row under the pointer or keyboard focus (its preview loop,
 * or its screen). On touch screens and narrow ones each record carries its own screen instead.
 * The sort is real; rows glide to their new places (FLIP), unless motion is reduced.
 */
export function IndexTable({ rows }: { rows: IndexRow[] }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "no", dir: 1 });
  const [active, setActive] = useState(rows[0]?.slug ?? "");
  const list = useRef<HTMLOListElement>(null);
  const before = useRef<Map<string, number> | null>(null);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => a[sort.key].localeCompare(b[sort.key], "en", { numeric: true }) * sort.dir);
    return out;
  }, [rows, sort]);

  const choose = (key: Key) => {
    // Record where every row is, so the new order can animate from there.
    const el = list.current;
    if (el) {
      before.current = new Map(
        Array.from(el.querySelectorAll<HTMLElement>("[data-slug]")).map((li) => [li.dataset.slug!, li.getBoundingClientRect().top]),
      );
    }
    setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));
  };

  useLayoutEffect(() => {
    const el = list.current;
    const prev = before.current;
    before.current = null;
    if (!el || !prev || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const li of el.querySelectorAll<HTMLElement>("[data-slug]")) {
      const from = prev.get(li.dataset.slug!);
      if (from === undefined) continue;
      const dy = from - li.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], {
        duration: 520,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    }
  }, [sorted]);

  const shown = rows.find((r) => r.slug === active) ?? rows[0];

  return (
    <div className="dg-index">
      <div className="dg-index__table">
        <div className="dg-index__cols" role="group" aria-label="Sort the index">
          {COLUMNS.map((c) => {
            const on = sort.key === c.key;
            return (
              <button
                key={c.key}
                type="button"
                className={`dg-index__sort dg-index__sort--${c.key}`}
                aria-pressed={on}
                onClick={() => choose(c.key)}
              >
                {c.label}
                <span className="dg-index__arrow" aria-hidden>
                  {on ? (sort.dir === 1 ? "↑" : "↓") : "↕"}
                </span>
                {on ? <span className="sr-only">{sort.dir === 1 ? ", ascending" : ", descending"}</span> : null}
              </button>
            );
          })}
          <span className="dg-index__colhead" aria-hidden>
            Result
          </span>
        </div>

        <ol ref={list} className="dg-index__rows">
          {sorted.map((row) => (
            <li key={row.slug} data-slug={row.slug} className="dg-index__row" data-on={row.slug === shown?.slug ? "" : undefined}>
              <FlowLink
                href={`/work/${row.slug}`}
                direction="deeper"
                className="dg-index__link"
                aria-describedby={`dg-ix-${row.slug}`}
                onPointerEnter={() => setActive(row.slug)}
                onFocus={() => setActive(row.slug)}
              >
                <span className="dg-index__media" aria-hidden>
                  <Image
                    src={row.poster.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 1px, (min-width: 640px) 45vw, 92vw"
                    className="dg-cover"
                  />
                </span>
                <span className="dg-index__no dg-num">{row.no}</span>
                <span className="dg-index__client">{row.client}</span>
                <span className="dg-index__industry">{row.industry}</span>
                <span className="dg-index__result">
                  {row.metric ? (
                    <>
                      <span className="dg-index__value dg-num">{row.metric.value}</span>
                      <span className="dg-index__label">{row.metric.label}</span>
                    </>
                  ) : null}
                </span>
                <span className="dg-index__go" aria-hidden>
                  →
                </span>
                <span id={`dg-ix-${row.slug}`} className="sr-only">
                  {row.headline}
                </span>
              </FlowLink>
            </li>
          ))}
        </ol>
      </div>

      {/* The viewer repeats what the table says, as pictures; screen readers have the table. */}
      <div className="dg-viewer" aria-hidden>
        <div className="dg-viewer__inner">
          <p className="dg-k dg-viewer__head">
            <span>Viewer</span>
            <span className="dg-num">
              {shown?.no} / {rows.length ? rows[rows.length - 1].no : ""}
            </span>
          </p>
          <Frame w={shown?.video?.width ?? shown?.poster.width ?? 16} h={shown?.video?.height ?? shown?.poster.height ?? 10} ratio="16 / 9">
            {rows.map((row) => (
              <div key={row.slug} className="dg-viewer__layer" data-on={row.slug === shown?.slug ? "" : undefined}>
                {row.video ? (
                  <LoopVideo src={row.video.src} poster={row.video.poster} active={row.slug === shown?.slug} className="dg-cover" />
                ) : (
                  <Image src={row.poster.src} alt="" fill sizes="(min-width: 1536px) 30vw, (min-width: 1024px) 32vw, 1px" className="dg-cover dg-cover--top" />
                )}
              </div>
            ))}
          </Frame>
          <p className="dg-viewer__cap">
            <span className="dg-num">Fig. 3.{shown ? Number(shown.no) : ""}</span>
            <span>{shown?.video ? "Preview loop" : "Screen"}</span>
            <span className="dg-num">
              {shown?.video ? `${shown.video.width} × ${shown.video.height}` : `${shown?.poster.width} × ${shown?.poster.height}`}
            </span>
          </p>
          <p className="dg-viewer__client">{shown?.client}</p>
          <p className="dg-viewer__line">{shown?.headline}</p>
          <p className="dg-viewer__platform dg-k">{shown?.platform}</p>
        </div>
      </div>
    </div>
  );
}
