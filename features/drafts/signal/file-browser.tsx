"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { LoopVideo } from "./loop-video";

export type FileRow = {
  no: string;
  slug: string;
  client: string;
  industry: string;
  platform: string;
  year: number;
  headline: string;
  metric?: { value: string; label: string };
  still: { src: string; alt: string; width: number; height: number };
  video?: string;
};

function Cells({ row }: { row: FileRow }) {
  return (
    <>
      <span className="ds-file__no ds-num">{row.no}</span>
      <span className="ds-file__client">{row.client}</span>
      <span className="ds-file__industry">{row.industry}</span>
      <span className="ds-file__stack">{row.platform}</span>
      <span className="ds-file__result">
        {row.metric ? (
          <>
            <span className="ds-file__value ds-num">{row.metric.value}</span>
            <span className="ds-file__label">{row.metric.label}</span>
          </>
        ) : null}
      </span>
      <span className="ds-file__go" aria-hidden>
        →
      </span>
    </>
  );
}

/**
 * (02) More work as the device's file browser: a list of the studies with their index numbers,
 * a selection bar, and a preview pane. The pointer or keyboard focus selects a row (↑ ↓, Home, End
 * move through the list; Enter opens). The bar is a window onto an inverted copy of the list, and the
 * two slide in opposite directions, so the selection glides from row to row with its text already
 * inverted. On phones each row carries its own picture instead of the pane.
 */
export function FileBrowser({ rows }: { rows: FileRow[] }) {
  const [sel, setSel] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const inv = useRef<HTMLDivElement>(null);

  // Keep the bar on the selected row (and on it through resizes and the font swap).
  useEffect(() => {
    const ol = list.current;
    const b = bar.current;
    const copy = inv.current;
    if (!ol || !b || !copy) return;
    const place = () => {
      const row = ol.children[sel] as HTMLElement | undefined;
      if (!row) return;
      const y = row.offsetTop;
      b.style.height = `${row.offsetHeight}px`;
      b.style.transform = `translate3d(0, ${y}px, 0)`;
      copy.style.transform = `translate3d(0, ${-y}px, 0)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(ol);
    return () => ro.disconnect();
  }, [sel]);

  const onKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const links = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>("a[data-i]") ?? []);
    const at = links.findIndex((a) => a === document.activeElement);
    if (at < 0) return;
    const to =
      e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? links.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    links[Math.max(0, Math.min(links.length - 1, to))]?.focus();
  };

  return (
    <div className="ds-files ds-screen" data-power>
      <div className="ds-files__head" aria-hidden>
        <span className="ds-files__path">Work /</span>
        <span className="ds-num">{String(rows.length).padStart(2, "0")} files</span>
        <span className="ds-files__keys">
          <kbd>↑</kbd>
          <kbd>↓</kbd> Select <kbd>↵</kbd> Open
        </span>
      </div>

      <div className="ds-files__body">
        <div className="ds-files__table">
          <div className="ds-files__cols ds-file" aria-hidden>
            <span>No.</span>
            <span>Client</span>
            <span className="ds-file__industry">Industry</span>
            <span className="ds-file__stack">Stack</span>
            <span className="ds-file__result">Result</span>
            <span />
          </div>
          <div className="ds-files__listwrap">
            <ol ref={list} className="ds-files__list" onKeyDown={onKey}>
              {rows.map((row, i) => (
                <li key={row.slug}>
                  <FlowLink
                    href={`/work/${row.slug}`}
                    direction="deeper"
                    className="ds-file"
                    data-i={i}
                    data-on={i === sel || undefined}
                    aria-describedby={`ds-file-${row.slug}`}
                    onPointerEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                  >
                    <span className="ds-file__thumb" aria-hidden>
                      <Image src={row.still.src} alt="" fill sizes="(max-width: 1023px) 112px, 1px" className="ds-cover ds-cover--top" />
                    </span>
                    <Cells row={row} />
                    <span id={`ds-file-${row.slug}`} className="sr-only">
                      {row.headline}
                    </span>
                  </FlowLink>
                </li>
              ))}
            </ol>
            <div ref={bar} className="ds-files__sel" aria-hidden>
              <div ref={inv} className="ds-files__inv">
                {rows.map((row) => (
                  <div key={row.slug} className="ds-file">
                    <Cells row={row} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* The pane repeats the selected row as a picture; screen readers have the list. */}
        <div className="ds-files__preview" aria-hidden>
          <div className="ds-files__frame ds-stack">
            {rows.map((row, i) => (
              <div key={row.slug} className="ds-files__layer" data-on={i === sel || undefined}>
                <Image src={row.still.src} alt="" fill sizes="(min-width: 1024px) 34vw, 1px" className="ds-cover ds-cover--top" />
                {row.video ? <LoopVideo src={row.video} active={i === sel} /> : null}
              </div>
            ))}
          </div>
          <div className="ds-files__caption ds-stack">
            {rows.map((row, i) => (
              <div key={row.slug} className="ds-files__cap" data-on={i === sel || undefined}>
                <p className="ds-files__capno ds-num">
                  {row.no} · {row.year}
                </p>
                <p className="ds-files__capclient">{row.client}</p>
                <p className="ds-files__capline">{row.headline}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
