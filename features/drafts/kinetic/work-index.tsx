"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { Img } from "@/content/types";

export type WorkRow = {
  slug: string;
  no: string;
  client: string;
  industry: string;
  year: number;
  platform: string;
  headline: string;
  metrics: { value: string; label: string }[];
  /** The client's own colours, shown as data (the page's one accent stays red). */
  theme?: { bg: string; accent: string };
  poster: Img;
  posterFocus?: string;
  /** The 5-second muted loop recorded from the live site, where there is one. */
  video?: string;
  /** What the floating frame shows, when it should differ from the poster (the disc plays the loop). */
  frame?: string;
  /** What the cursor's disc shows for a study without a loop. */
  still?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where the index is a hover list (kinetic.css uses the same query); elsewhere rows open on tap. */
const DESK = "(hover: hover) and (pointer: fine) and (min-width: 768px)";
const subscribeDesk = (cb: () => void) => {
  const mq = window.matchMedia(DESK);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isDesk = () => window.matchMedia(DESK).matches;
const noDesk = () => false;

/**
 * The work as a typographic index. With a mouse, the row under the pointer takes the weight, the
 * others step back, its headline and numbers replace its specs, and (for the flagships) its screen
 * rides a frame that follows the pointer a beat behind, tilting with its speed. The cursor's disc
 * plays the project's loop. On touch, a tap opens the row in place: the screen, the numbers and a
 * link to the study. With a keyboard, focus does what hover does.
 */
export function WorkIndex({ rows, variant }: { rows: WorkRow[]; variant: "flag" | "compact" }) {
  const list = useRef<HTMLOListElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [frameOn, setFrameOn] = useState(false);
  const desk = useSyncExternalStore(subscribeDesk, isDesk, noDesk);
  const uid = useId();

  // Hover and focus mark the active row straight on the DOM: nothing re-renders.
  useEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const items = Array.from(ol.querySelectorAll<HTMLElement>(":scope > [data-i]"));
    const shots = () => Array.from(frame.current?.querySelectorAll<HTMLElement>("[data-shot]") ?? []);
    let current = -1;
    const activate = (i: number) => {
      if (i === current) return;
      current = i;
      ol.toggleAttribute("data-active", i >= 0);
      items.forEach((li, k) => li.toggleAttribute("data-on", k === i));
      if (i >= 0) shots().forEach((s, k) => s.toggleAttribute("data-on", k === i));
    };
    const indexOf = (node: EventTarget | null) => {
      const li = node instanceof Element ? node.closest<HTMLElement>("[data-i]") : null;
      return li && ol.contains(li) ? Number(li.dataset.i) : -1;
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse") activate(indexOf(e.target));
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") activate(-1);
    };
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as Element).matches?.(":focus-visible")) activate(indexOf(e.target));
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!ol.contains(e.relatedTarget as Node | null)) activate(-1);
    };
    ol.addEventListener("pointerover", onOver);
    ol.addEventListener("pointerleave", onLeave);
    ol.addEventListener("focusin", onFocusIn);
    ol.addEventListener("focusout", onFocusOut);
    return () => {
      ol.removeEventListener("pointerover", onOver);
      ol.removeEventListener("pointerleave", onLeave);
      ol.removeEventListener("focusin", onFocusIn);
      ol.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // The flagships' floating frame: mice only, motion on. Its pictures mount as the list nears.
  useEffect(() => {
    const ol = list.current;
    const fr = frame.current;
    if (variant !== "flag" || !ol || !fr || !desk) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";
    if (reduced) return;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setFrameOn(true);
        near.disconnect();
      },
      { rootMargin: "60% 0px" },
    );
    near.observe(ol);

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let rot = 0;
    let fw = 0;
    let fh = 0;
    let maxX = Infinity;
    let raf = 0;
    let last = 0;
    let shown = false;

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(64, last ? now - last : 16);
      last = now;
      const gx = Math.min(tx, maxX);
      const k = 1 - Math.exp(-dt / 120);
      const px = x;
      x += (gx - x) * k;
      y += (ty - y) * k;
      const vx = (x - px) / dt;
      rot += (clamp(vx * 2.2, -5, 5) - rot) * (1 - Math.exp(-dt / 90));
      fr.style.transform = `translate3d(${(x - fw / 2).toFixed(1)}px, ${(y - fh / 2).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      if (Math.abs(gx - x) > 0.2 || Math.abs(ty - y) > 0.2 || Math.abs(rot) > 0.02) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      fw = fr.offsetWidth;
      fh = fr.offsetHeight;
      // The frame keeps clear of the specs column, so it never covers the numbers it brings up.
      const side = ol.querySelector<HTMLElement>(".dk-row__body");
      maxX = side ? side.getBoundingClientRect().left - fw / 2 - 24 : Infinity;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        x = Math.min(tx, maxX);
        y = ty;
      }
      shown = true;
      fr.dataset.on = "";
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      kick();
    };
    const onLeave = () => {
      shown = false;
      delete fr.dataset.on;
    };
    ol.addEventListener("pointerenter", onEnter);
    ol.addEventListener("pointermove", onMove);
    ol.addEventListener("pointerleave", onLeave);
    return () => {
      near.disconnect();
      cancelAnimationFrame(raf);
      ol.removeEventListener("pointerenter", onEnter);
      ol.removeEventListener("pointermove", onMove);
      ol.removeEventListener("pointerleave", onLeave);
      delete fr.dataset.on;
    };
  }, [variant, desk]);

  return (
    <>
      <ol ref={list} className={`dk-idx dk-idx--${variant}`}>
        {rows.map((row, i) => {
          const panel = `${uid}-p${i}`;
          const isOpen = open === i;
          return (
            <li key={row.slug} data-i={i} className="dk-row" data-open={isOpen || undefined}>
              <h3 className="dk-row__h">
                <FlowLink
                  href={`/work/${row.slug}`}
                  direction="deeper"
                  className="dk-row__link"
                  data-cursor="view"
                  data-cursor-video={row.video}
                  data-cursor-poster={row.video ? undefined : (row.still ?? row.poster.src)}
                >
                  <span className="dk-row__no dk-mono" aria-hidden>
                    {row.no}
                  </span>
                  <span className="dk-row__name">{row.client}</span>
                </FlowLink>
                <button
                  type="button"
                  className="dk-row__tog"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="dk-row__no dk-mono" aria-hidden>
                    {row.no}
                  </span>
                  <span className="dk-row__name">{row.client}</span>
                  <span className="dk-row__plus" aria-hidden />
                </button>
              </h3>

              <div id={panel} className="dk-row__body">
                <div className="dk-row__media">
                  <Image
                    src={row.poster.src}
                    alt={row.poster.alt}
                    width={row.poster.width}
                    height={row.poster.height}
                    sizes="(max-width: 767px) 92vw, 60vw"
                    style={row.posterFocus ? { objectPosition: row.posterFocus } : undefined}
                  />
                </div>
                <div className="dk-row__rest">
                  <p className="dk-mono">{row.industry}</p>
                  <p className="dk-mono dk-row__dim">
                    {row.year} · {row.platform}
                  </p>
                  {row.theme ? (
                    <p className="dk-swatches dk-mono">
                      <span className="sr-only">Colours: </span>
                      {[row.theme.bg, row.theme.accent].map((hex) => (
                        <span key={hex} className="dk-swatch">
                          <span className="dk-swatch__chip" style={{ "--c": hex } as CSSProperties} aria-hidden />
                          {hex.toUpperCase()}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
                <div className="dk-row__more">
                  <p className="dk-row__headline">{row.headline}</p>
                  {row.metrics.length ? (
                    <dl className="dk-metrics">
                      {row.metrics.map((m) => (
                        <div key={m.label} className="dk-metric">
                          <dt className="dk-mono dk-metric__label">{m.label}</dt>
                          <dd className="dk-metric__value">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
                <FlowLink href={`/work/${row.slug}`} direction="deeper" className="dk-row__cta">
                  View case study <span aria-hidden>→</span>
                </FlowLink>
              </div>
            </li>
          );
        })}
      </ol>
      {variant === "flag" ? (
        <div ref={frame} className="dk-frame" aria-hidden>
          <div className="dk-frame__in">
            {frameOn
              ? rows.map((row, i) => (
                  <Image
                    key={row.slug}
                    data-shot
                    data-on={i === 0 || undefined}
                    src={row.frame ?? row.poster.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, 1px"
                    className="dk-frame__shot"
                  />
                ))
              : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
