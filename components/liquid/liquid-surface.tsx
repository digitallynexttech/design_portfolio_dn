"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { emitEdgeWave, setWaterCovered } from "@/features/water/bus";

export type Origin = "left" | "right" | "bottom";

type Props = {
  open: boolean;
  onClose: () => void;
  origin: Origin;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
  /** "sheet" sizes to its content along the travel axis; "full" covers the viewport. */
  size?: "sheet" | "full";
  /** "glass" shows the water through frosted glass; "cinema" is near-opaque, for film. */
  tone?: "glass" | "cinema";
};

// Slightly under-damped spring: the surface overshoots a touch and settles, like liquid.
const STIFFNESS = 210;
const DAMPING = 23;

/** The leading edge of the surface, bulging while it moves and flat once it rests. */
function edgePath(origin: Origin, w: number, h: number, p: number, v: number): string {
  const travel = Math.min(1.08, Math.max(0, p));
  const bulge = Math.sin(Math.PI * Math.min(travel, 1)) * 0.16 + Math.max(-0.12, Math.min(0.12, v * 0.018));
  if (origin === "bottom") {
    const y = h * (1 - travel);
    const b = h * bulge;
    return `M0,${h} L0,${y} C${w * 0.3},${y - b} ${w * 0.7},${y - b} ${w},${y} L${w},${h} Z`;
  }
  const b = w * bulge;
  if (origin === "right") {
    const x = w * (1 - travel);
    return `M${w},0 L${x},0 C${x - b},${h * 0.3} ${x - b},${h * 0.7} ${x},${h} L${w},${h} Z`;
  }
  const x = w * travel;
  return `M0,0 L${x},0 C${x + b},${h * 0.3} ${x + b},${h * 0.7} ${x},${h} L0,${h} Z`;
}

export function LiquidSurface({ open, onClose, origin, label, children, size = "sheet", tone = "glass" }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const spring = useRef({ p: 0, v: 0, target: 0, raf: 0 });
  const closing = useRef(false);
  // A full surface hides the water entirely, so the water rests while one is open.
  const coverReason = `surface${useId()}`;

  const paint = useCallback(() => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) return;
    const { p, v } = spring.current;
    // At rest the surface is a plain box: no clip to composite, and none to go stale on resize.
    if (p === 1 && v === 0) {
      panel.style.clipPath = "none";
    } else {
      const { width, height } = panel.getBoundingClientRect();
      panel.style.clipPath = `path('${edgePath(origin, width, height, p, v)}')`;
    }
    content.style.opacity = String(Math.max(0, Math.min(1, (p - 0.55) / 0.4)));
  }, [origin]);

  const settle = useCallback(
    (target: number, done?: () => void) => {
      const s = spring.current;
      cancelAnimationFrame(s.raf);
      s.target = target;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        s.p = target;
        s.v = 0;
        paint();
        done?.();
        return;
      }
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        // Closing drains faster than opening fills (flow-out is shorter than flow-in).
        const k = target === 0 ? STIFFNESS * 1.6 : STIFFNESS;
        const accel = k * (s.target - s.p) - DAMPING * s.v;
        s.v += accel * dt;
        s.p += s.v * dt;
        paint();
        const resting = Math.abs(s.target - s.p) < 0.002 && Math.abs(s.v) < 0.02;
        if (resting || (target === 0 && s.p <= 0)) {
          s.p = target;
          s.v = 0;
          paint();
          done?.();
          return;
        }
        s.raf = requestAnimationFrame(tick);
      };
      s.raf = requestAnimationFrame(tick);
    },
    [paint],
  );

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setWaterCovered(coverReason, false);
    // The backdrop clears while the surface drains.
    dialogRef.current?.setAttribute("data-closing", "");
    settle(0, () => {
      dialogRef.current?.close();
      dialogRef.current?.removeAttribute("data-closing");
      closing.current = false;
      onClose();
      returnFocus.current?.focus();
    });
  }, [coverReason, onClose, settle]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      spring.current.p = 0;
      spring.current.v = 0;
      paint();
      dialog.showModal();
      emitEdgeWave(origin, 0.5);
      settle(1, () => {
        if (size === "full") setWaterCovered(coverReason, true);
      });
    } else if (!open && dialog.open) {
      requestClose();
    }
  }, [open, origin, size, coverReason, paint, requestClose, settle]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const observer = new ResizeObserver(() => paint());
    observer.observe(panel);
    const s = spring.current;
    return () => {
      observer.disconnect();
      cancelAnimationFrame(s.raf);
    };
  }, [paint]);

  // Never leave the water paused behind an unmounted surface.
  useEffect(() => () => setWaterCovered(coverReason, false), [coverReason]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className={`liquid liquid--${origin} liquid--${size} liquid--${tone}`}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
    >
      <div ref={panelRef} className="liquid__panel">
        <div ref={contentRef} className="liquid__content">
          <button type="button" className="liquid__close" onClick={requestClose} aria-label="Close">
            <span aria-hidden>×</span>
          </button>
          {children}
        </div>
      </div>
    </dialog>
  );
}
