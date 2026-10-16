"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { MetaParts } from "@/features/home/meta-parts";
import type { WorkCardData } from "./work-card";

/**
 * Projects as rows, the way an index is read: number, client, sector, the lead number. With a mouse,
 * the project's own screen floats beside the pointer as you move down the list and pours from one
 * project into the next (a wheel scroll carries it along); keyboard focus shows it just under the
 * row. On touch screens, where there is no hover, each row carries its screen as a thumbnail instead.
 */
export function WorkRows({ studies, start = 1 }: { studies: WorkCardData[]; start?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const target = useRef({ x: 0, y: 0, shown: false, anchored: false });

  // Set by the effect below: puts the preview beside a pointer at these client coordinates.
  const placeAt = useRef<(clientX: number, clientY: number) => void>(() => undefined);

  const show = useCallback((slug: string | null) => {
    setActive((current) => {
      if (current !== slug && current) setPrevious(current);
      return slug;
    });
  }, []);

  // The preview trails the pointer, a little behind and tilted by its speed, like something carried
  // on water. With less motion it simply sits where the pointer is.
  useEffect(() => {
    const el = root.current;
    const card = preview.current;
    if (!el || !card) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pos = { x: 0, y: 0, tilt: 0 };
    // Where the mouse last was, anywhere on the page: a wheel scroll moves the list under a pointer
    // that sends no events of its own.
    const mouse = { x: 0, y: 0, known: false };
    let raf = 0;
    let placed = false;
    let listTop = 0; // where the list was on screen when the card was last placed

    const paint = () => {
      card.style.translate = `${pos.x.toFixed(1)}px ${pos.y.toFixed(1)}px`;
      card.style.rotate = `${pos.tilt.toFixed(2)}deg`;
    };
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
      paint();
      if (Math.abs(dx) > 0.3 || Math.abs(t.y - pos.y) > 0.3 || Math.abs(pos.tilt) > 0.05) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // The card sits just right of the pointer (left of it near the edge), centred on it vertically,
    // so the row being read is never covered and the card never spills off the list.
    const place = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      listTop = rect.top;
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      let x = cx + 40;
      if (x + w > rect.width) x = cx - 40 - w;
      target.current.x = Math.max(0, Math.min(rect.width - w, x));
      target.current.y = Math.max(-h * 0.25, Math.min(rect.height - h * 0.75, cy - h / 2));
      target.current.anchored = false;
      // Hidden, it appears where it is wanted instead of gliding over from where it was last.
      if (!el.hasAttribute("data-active")) placed = false;
      kick();
    };
    placeAt.current = (clientX, clientY) => {
      if (fine.matches) place(clientX, clientY);
    };
    const onMouse = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.known = true;
    };
    const onMove = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse") return;
      place(event.clientX, event.clientY);
    };
    // A wheel scroll under a still pointer: the row now under it lights up and the card follows,
    // without waiting for the browser's own hover to catch up.
    let scrollRaf = 0;
    let near = false;
    const onScrollFrame = () => {
      scrollRaf = 0;
      // A row with keyboard focus keeps the card.
      if (el.querySelector("[data-row]:focus-visible")) return;
      const rect = el.getBoundingClientRect();
      const inside = mouse.x >= rect.left && mouse.x <= rect.right && mouse.y >= rect.top && mouse.y <= rect.bottom;
      const row = inside ? document.elementFromPoint(mouse.x, mouse.y)?.closest<HTMLElement>(".work-row") : null;
      if (!row?.dataset.slug || !el.contains(row)) {
        if (el.hasAttribute("data-active")) show(null);
        return;
      }
      // The list slid under the card; the card stays put on screen, beside the pointer.
      if (el.hasAttribute("data-active")) {
        pos.y += listTop - rect.top;
        paint();
      }
      place(mouse.x, mouse.y);
      show(row.dataset.slug);
    };
    const onScroll = () => {
      if (near && mouse.known && fine.matches && !scrollRaf) scrollRaf = requestAnimationFrame(onScrollFrame);
    };
    // Only while the list is on screen.
    const io = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
    });
    io.observe(el);
    // Keyboard: at the right of the list, just below the focused row (above it near the end), so
    // the row's own line stays readable.
    const onFocus = (event: FocusEvent) => {
      const row = (event.target as HTMLElement).closest<HTMLElement>("[data-row]");
      if (!row || !row.matches(":focus-visible")) return;
      const rect = el.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      const h = card.offsetHeight;
      const below = r.bottom - rect.top + 12;
      target.current.x = rect.width - card.offsetWidth;
      target.current.y = below + h <= rect.height ? below : r.top - rect.top - 12 - h;
      target.current.anchored = true;
      placed = false;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("focusin", onFocus);
    window.addEventListener("pointermove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      io.disconnect();
      placeAt.current = () => undefined;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("focusin", onFocus);
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("scroll", onScroll);
    };
  }, [show]);

  return (
    <div ref={root} className="work-rows" data-active={active ?? undefined} onPointerLeave={() => show(null)}>
      <ol>
        {studies.map((study, i) => (
          <li key={study.slug} className="work-row" data-slug={study.slug} data-on={active === study.slug ? "" : undefined}>
            <FlowLink
              href={`/work/${study.slug}`}
              direction="deeper"
              data-row
              className="work-row__link"
              style={{ "--accent": study.accent } as React.CSSProperties}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                // Placed before it shows, so it never appears anywhere but beside the pointer.
                placeAt.current(event.clientX, event.clientY);
                show(study.slug);
              }}
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
                {/* No year: it is the same on every row. */}
                <span className="work-row__industry">
                  <MetaParts parts={study.industry.split(" · ")} />
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
