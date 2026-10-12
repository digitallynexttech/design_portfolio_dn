"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { FormId } from "./shapes";

/** A place on the page where the water takes a shape. `form` can change while it is registered. */
export type Anchor = { form: FormId; el: HTMLElement };

const anchors = new Set<Anchor>();
// Which anchors are on screen at all, kept by an observer, so the shapes only measure those (and
// can rest when there are none) instead of measuring every anchor on every frame.
const inView = new Set<Element>();
const listeners = new Set<() => void>();
let observer: IntersectionObserver | null = null;

function watch(el: Element) {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) inView.add(entry.target);
      else inView.delete(entry.target);
    }
    for (const listener of listeners) listener();
  });
  observer.observe(el);
}

export function registerAnchor(anchor: Anchor): () => void {
  anchors.add(anchor);
  watch(anchor.el);
  return () => {
    anchors.delete(anchor);
    if (![...anchors].some((a) => a.el === anchor.el)) {
      observer?.unobserve(anchor.el);
      inView.delete(anchor.el);
    }
  };
}

/** Called whenever an anchor comes on screen or leaves it. */
export function onAnchorsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether any anchor is on screen (even partly). */
export function anchorsInView(): boolean {
  return inView.size > 0;
}

/** The anchor closest to the middle of the viewport, if one is meaningfully on screen. */
export function activeAnchor(): { form: FormId; rect: DOMRect } | null {
  if (!inView.size) return null;
  const vh = window.innerHeight;
  let best: { form: FormId; rect: DOMRect; score: number } | null = null;
  for (const anchor of anchors) {
    if (!inView.has(anchor.el)) continue;
    const rect = anchor.el.getBoundingClientRect();
    // Anchors hidden at this breakpoint have no box.
    if (rect.width < 1 || rect.height < 1) continue;
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    if (visible < Math.min(rect.height, vh) * 0.35) continue;
    const score = Math.abs(rect.top + rect.height / 2 - vh / 2);
    if (!best || score < best.score) best = { form: anchor.form, rect, score };
  }
  return best ? { form: best.form, rect: best.rect } : null;
}

/**
 * Marks where the water should take a shape. It is decorative, so it is hidden from assistive tech.
 * `fallback` (a real image) shows instead when the device draws no water at all.
 */
export function FormAnchor({ form, className = "", fallback }: { form: FormId; className?: string; fallback?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return registerAnchor({ form, el });
  }, [form]);
  return (
    <div ref={ref} aria-hidden data-form={form} className={className}>
      {fallback ? <div className="form-fallback">{fallback}</div> : null}
    </div>
  );
}
