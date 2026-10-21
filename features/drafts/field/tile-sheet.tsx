"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { FieldStudy, FieldTile } from "./types";

/**
 * A frame, opened: a panel from the right on wide screens, a sheet from the bottom on phones (drag
 * its bar down to put it away). A native modal dialog, so focus stays inside and the page behind is
 * inert; Esc, the close button or a click outside closes it, and the field puts focus back on the
 * frame. A flagship shows its headline, first two numbers and theme colours; a standard study shows
 * its card. The study's other frames sit under the picture and swap into it.
 */
export function TileSheet({
  tile,
  study,
  frames,
  onClose,
}: {
  tile: FieldTile | undefined;
  study: FieldStudy | undefined;
  frames: FieldTile[];
  onClose: () => void;
}) {
  if (!tile || !study) return null;
  // Remounted per frame, so the picked frame and the motion state start fresh each time.
  return <Sheet key={tile.id} tile={tile} study={study} frames={frames} onClose={onClose} />;
}

function Sheet({ tile, study, frames, onClose }: { tile: FieldTile; study: FieldStudy; frames: FieldTile[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [frameId, setFrameId] = useState(tile.id);
  const frame = frames.find((f) => f.id === frameId) ?? tile;
  const flagship = study.tier === "flagship";

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const id = requestAnimationFrame(() => (d.dataset.state = "open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = useCallback(() => {
    const d = dialog.current;
    if (!d || d.dataset.state === "closing") return;
    if (document.documentElement.dataset.motion === "off") {
      d.close();
      return;
    }
    d.dataset.state = "closing";
    d.style.removeProperty("--pull");
    const done = () => d.open && d.close();
    d.addEventListener("transitionend", (e) => e.target === d && done(), { once: true });
    window.setTimeout(done, 420);
  }, []);

  // Phones: pull the sheet down by its bar to put it away.
  const pull = useRef<{ id: number; y: number; dy: number } | null>(null);
  const onBarDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || (e.target as Element).closest("button")) return;
    pull.current = { id: e.pointerId, y: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    dialog.current?.setAttribute("data-pulling", "on");
  };
  const onBarMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = pull.current;
    if (!p || p.id !== e.pointerId) return;
    p.dy = Math.max(0, e.clientY - p.y);
    dialog.current?.style.setProperty("--pull", `${p.dy}px`);
  };
  const onBarUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = pull.current;
    if (!p || p.id !== e.pointerId) return;
    pull.current = null;
    const d = dialog.current;
    d?.removeAttribute("data-pulling");
    if (p.dy > 96) close();
    else d?.style.removeProperty("--pull");
  };

  return (
    <dialog
      ref={dialog}
      className="df-sheet"
      aria-labelledby="df-sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{ "--ac": study.accent } as CSSProperties}
    >
      <div className="df-sheet__in">
        <div className="df-sheet__bar" onPointerDown={onBarDown} onPointerMove={onBarMove} onPointerUp={onBarUp} onPointerCancel={onBarUp}>
          <span className="df-sheet__grip" aria-hidden />
          <p className="df-k">
            <span className="df-num">{study.no}</span> / 10 · {flagship ? "Flagship" : "Case study"}
          </p>
          <button type="button" className="df-sheet__close" onClick={close}>
            Close <span className="df-key" aria-hidden>Esc</span>
          </button>
        </div>

        <div className="df-sheet__media" style={{ "--ar": `${frame.iw} / ${frame.ih}` } as CSSProperties}>
          <Image key={frame.id} src={frame.src} alt={frame.alt} fill sizes="(max-width: 767px) 100vw, 520px" className="df-sheet__img" />
          <span className="df-sheet__size df-num" aria-hidden>
            {frame.code} · {frame.iw} × {frame.ih}
          </span>
        </div>

        {frames.length > 1 ? (
          <div className="df-sheet__frames" role="group" aria-label={`${study.client}: frames`}>
            {frames.map((f, i) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={f.id === frame.id}
                aria-label={`Frame ${i + 1} of ${frames.length}`}
                onClick={() => setFrameId(f.id)}
                className="df-sheet__thumb"
              >
                <Image src={f.src} alt="" fill sizes="96px" className="df-sheet__thumbimg" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="df-sheet__body">
          <p className="df-k">{study.industry}</p>
          <h2 id="df-sheet-title" className="df-sheet__client">
            {study.client}
          </h2>
          <p className="df-sheet__headline">{study.headline}</p>

          <dl className={`df-sheet__metrics${study.metrics.length > 1 ? "" : " df-sheet__metrics--one"}`}>
            {study.metrics.map((m) => (
              <div key={m.label} className="df-sheet__metric">
                <dt className="df-sheet__mlabel">{m.label}</dt>
                <dd className="df-sheet__mvalue df-num">{m.value}</dd>
              </div>
            ))}
          </dl>

          <dl className="df-spec">
            <div className="df-spec__row">
              <dt className="df-k">Year</dt>
              <dd className="df-num">{study.year}</dd>
            </div>
            <div className="df-spec__row">
              <dt className="df-k">Stack</dt>
              <dd>{study.platform}</dd>
            </div>
            <div className="df-spec__row">
              <dt className="df-k">Disciplines</dt>
              <dd>{study.disciplines.join(", ")}</dd>
            </div>
            {flagship ? (
              <div className="df-spec__row">
                <dt className="df-k">Theme</dt>
                <dd className="df-swatches">
                  <span className="df-swatch" style={{ background: study.accent }} aria-hidden />
                  <span className="df-num">{study.accent.toUpperCase()}</span>
                  <span className="df-swatch" style={{ background: study.bg }} aria-hidden />
                  <span className="df-num">{study.bg.toUpperCase()}</span>
                </dd>
              </div>
            ) : (
              <div className="df-spec__row">
                <dt className="df-k">Chapters</dt>
                <dd className="df-num">{study.chapters}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* The way on stays in reach, however far the panel scrolls. */}
        <div className="df-sheet__foot">
          <FlowLink href={`/work/${study.slug}`} direction="deeper" className="df-btn df-btn--red df-sheet__cta">
            View case study <span aria-hidden>→</span>
          </FlowLink>
        </div>
      </div>
    </dialog>
  );
}
