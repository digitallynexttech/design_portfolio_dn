"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FlowLink } from "@/components/ui/flow-link";

export type StripService = { id: string; title: string; line: string; proof: string[]; image: string };

/**
 * The six services on one strip. It is a native horizontal scroller with snap points, so a finger
 * swipes it, a trackpad pans it and, once focused, the arrow keys move it. A mouse can also drag it,
 * and the two buttons step one card at a time. Each card leans back as it leaves the strip (CSS
 * scroll-driven, where supported).
 */
export function ServicesStrip({ services }: { services: StripService[] }) {
  const track = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    // Buttons go quiet at either end.
    const ends = () => {
      const max = el.scrollWidth - el.clientWidth - 2;
      if (prev.current) prev.current.disabled = el.scrollLeft <= 2;
      if (next.current) next.current.disabled = el.scrollLeft >= max;
    };
    ends();
    el.addEventListener("scroll", ends, { passive: true });
    const ro = new ResizeObserver(ends);
    ro.observe(el);

    // Mouse drag: move the scroller with the pointer, then let snap settle it. A drag never clicks.
    let drag: { id: number; x: number; left: number; moved: boolean } | null = null;
    let swallow = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, left: el.scrollLeft, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        el.setPointerCapture(e.pointerId);
        el.setAttribute("data-drag", "");
      }
      if (drag.moved) el.scrollLeft = drag.left - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      if (drag.moved) {
        swallow = true;
        window.setTimeout(() => (swallow = false), 0);
        el.removeAttribute("data-drag");
        // Snap from where the hand let go.
        const card = el.querySelector<HTMLElement>("li");
        const list = el.firstElementChild;
        const step = card && list ? card.offsetWidth + (parseFloat(getComputedStyle(list).columnGap) || 0) : el.clientWidth;
        el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: "smooth" });
      }
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      drag = null;
    };
    const onClick = (e: MouseEvent) => {
      if (!swallow) return;
      e.preventDefault();
      e.stopPropagation();
      swallow = false;
    };
    const onDragStart = (e: DragEvent) => e.preventDefault();
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("scroll", ends);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    const reduced = document.documentElement.dataset.motion === "off";
    el.scrollBy({ left: dir * (card.offsetWidth + 1), behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="dp-svc">
      <div className="dp-svc__bar">
        <p className="dp-k" aria-hidden>
          S.01–S.{String(services.length).padStart(2, "0")}
        </p>
        <div className="dp-svc__btns">
          <button ref={prev} type="button" className="dp-sq" aria-label="Previous service" onClick={() => step(-1)}>
            <span aria-hidden>←</span>
          </button>
          <button ref={next} type="button" className="dp-sq" aria-label="Next service" onClick={() => step(1)}>
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
      {/* Focusable so the arrow keys scroll it; its links are reachable with Tab as usual. */}
      <div ref={track} className="dp-svc__track" role="region" aria-label="Services" tabIndex={0}>
        <ol className="dp-svc__list">
        {services.map((service, i) => (
          <li key={service.id} className="dp-svc__card">
            <div className="dp-svc__img">
              <Image src={service.image} alt="" fill sizes="(min-width: 1024px) 26vw, 78vw" className="dp-cover" draggable={false} />
            </div>
            <p className="dp-k" aria-hidden>
              S.{String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="dp-svc__title">
              <FlowLink href={`/services#${service.id}`} className="dp-svc__link" draggable={false}>
                {service.title}
              </FlowLink>
            </h3>
            <p className="dp-svc__line">{service.line}</p>
            {service.proof.length ? (
              <p className="dp-svc__proof">
                <span className="dp-svc__proof-k">Proof</span>
                {service.proof.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
        </ol>
      </div>
    </div>
  );
}
