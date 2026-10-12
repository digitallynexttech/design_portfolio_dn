"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { WorkCardData } from "./work-card";

/**
 * Projects as rows, the way an index is read: number, client, sector, the lead number. With a mouse,
 * the project's own screen floats beside the pointer as you move down the list and pours from one
 * project into the next; keyboard focus shows it beside the row. On touch screens, where there is
 * no hover, each row carries its screen as a thumbnail instead.
 */
export function WorkRows({ studies, start = 1 }: { studies: WorkCardData[]; start?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const target = useRef({ x: 0, y: 0, shown: false, anchored: false });

  const show = (slug: string | null) => {
    setActive((current) => {
      if (current !== slug && current) setPrevious(current);
      return slug;
    });
  };

  // The preview trails the pointer, a little behind and tilted by its speed, like something carried
  // on water. With less motion it simply sits where the pointer is.
  useEffect(() => {
    const el = root.current;
    const card = preview.current;
    if (!el || !card) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pos = { x: 0, y: 0, tilt: 0 };
    let raf = 0;
    let placed = false;

    const frame = () => {
      raf = 0;
      const t = target.current;
      if (!placed || reduced.matches) {
        pos.x = t.x;
        pos.y = t.y;
        placed = true;
      }
      const dx = t.x - pos.x;
      pos.x += dx * 0.14;
      pos.y += (t.y - pos.y) * 0.14;
      pos.tilt += ((reduced.matches ? 0 : Math.max(-7, Math.min(7, dx * 0.06))) - pos.tilt) * 0.12;
      card.style.translate = `${pos.x.toFixed(1)}px ${pos.y.toFixed(1)}px`;
      card.style.rotate = `${pos.tilt.toFixed(2)}deg`;
      if (Math.abs(dx) > 0.3 || Math.abs(t.y - pos.y) > 0.3 || Math.abs(pos.tilt) > 0.05) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // The card sits just right of the pointer (left of it near the edge), centred on it vertically,
    // so the row being read is never covered and the card never spills off the list.
    const onMove = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      let x = cx + 40;
      if (x + w > rect.width) x = cx - 40 - w;
      target.current.x = Math.max(0, Math.min(rect.width - w, x));
      target.current.y = Math.max(-h * 0.25, Math.min(rect.height - h * 0.75, cy - h / 2));
      target.current.anchored = false;
      kick();
    };
    // Keyboard: beside the focused row, at the right of the list.
    const onFocus = (event: FocusEvent) => {
      const row = (event.target as HTMLElement).closest<HTMLElement>("[data-row]");
      if (!row || !row.matches(":focus-visible")) return;
      const rect = el.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      target.current.x = rect.width - card.offsetWidth;
      target.current.y = r.top - rect.top + r.height / 2 - card.offsetHeight / 2;
      target.current.anchored = true;
      placed = false;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <div ref={root} className="work-rows" data-active={active ?? undefined} onPointerLeave={() => show(null)}>
      <ol>
        {studies.map((study, i) => (
          <li key={study.slug} className="work-row" data-on={active === study.slug ? "" : undefined}>
            <FlowLink
              href={`/work/${study.slug}`}
              direction="deeper"
              data-row
              className="work-row__link"
              style={{ "--accent": study.accent } as React.CSSProperties}
              onPointerEnter={(event) => event.pointerType === "mouse" && show(study.slug)}
              onFocus={(event) => event.currentTarget.matches(":focus-visible") && show(study.slug)}
              onBlur={() => show(null)}
              aria-describedby={`${study.slug}-row-d`}
            >
              <span className="work-row__thumb" aria-hidden>
                <Image src={study.poster.src} alt="" fill sizes="7.5rem" className="object-cover object-top" />
              </span>
              <span className="work-row__index" aria-hidden>
                {String(start + i).padStart(2, "0")}
              </span>
              <span className="work-row__client">
                {study.client}
                <span className="stop" aria-hidden>
                  .
                </span>
              </span>
              <span className="work-row__meta" id={`${study.slug}-row-d`}>
                <span className="work-row__industry">
                  {study.industry} · {study.year}
                </span>
                <span className="sr-only">. {study.headline}</span>
              </span>
              {study.metric ? (
                <span className="work-row__metric">
                  <span className="work-row__value">{study.metric.value}</span> {study.metric.label}
                </span>
              ) : (
                <span className="work-row__metric" />
              )}
              <span className="work-row__arrow" aria-hidden>
                →
              </span>
            </FlowLink>
          </li>
        ))}
      </ol>

      {/* The floating screen: every poster is loaded, the active one pours up over the last. */}
      <div ref={preview} className="work-preview" aria-hidden data-shown={active ? "" : undefined}>
        <div className="work-preview__frame">
          {studies.map((study) => (
            <div
              key={study.slug}
              className="work-preview__layer"
              data-state={active === study.slug ? "on" : previous === study.slug ? "under" : undefined}
            >
              <Image src={study.poster.src} alt="" fill sizes="(min-width: 1536px) 28rem, 24rem" className="object-cover object-top" />
            </div>
          ))}
        </div>
        {studies.map((study) => (
          <span
            key={study.slug}
            className="work-preview__pill"
            data-on={active === study.slug ? "" : undefined}
            style={{ background: study.accent, color: study.onAccent }}
          >
            Read the case →
          </span>
        ))}
      </div>
    </div>
  );
}
