"use client";

import { useEffect, useRef } from "react";
import { MODE_EVENT } from "./chrome";

const TEXTY = new Set(["h1", "h2", "h3", "p", "a", "dd", "li"]);
const four = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");

/**
 * Inspect mode, as in a design tool: point at anything marked [data-x] and a red selection box
 * settles on it, tagged with what it is, its size in px and, for text, its type. It works in the
 * hero all the time and across the whole page in Build mode. Keyboard focus selects the focused
 * control; a tap selects on touch screens (Build mode). The header shows the pointer's page
 * coordinates. One rAF loop, which stops as soon as the box has settled.
 */
export function Inspector() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    const root = box?.closest<HTMLElement>(".d-xray");
    if (!box || !root) return;
    const [top, right, bottom, left] = (["t", "r", "b", "l"] as const).map((k) => box.querySelector<HTMLElement>(`[data-l="${k}"]`)!);
    const corners = (["tl", "tr", "br", "bl"] as const).map((k) => box.querySelector<HTMLElement>(`[data-c="${k}"]`)!);
    const tag = box.querySelector<HTMLElement>("[data-tag]")!;
    const tagName = box.querySelector<HTMLElement>("[data-tag-name]")!;
    const tagSize = box.querySelector<HTMLElement>("[data-tag-size]")!;
    const tagFont = box.querySelector<HTMLElement>("[data-tag-font]")!;
    const cx = root.querySelector<HTMLElement>('[data-coord="x"]');
    const cy = root.querySelector<HTMLElement>('[data-coord="y"]');
    const still = document.documentElement.dataset.motion === "off";

    let target: Element | null = null;
    const cur = { x: 0, y: 0, w: 0, h: 0 };
    let raf = 0;
    let last = 0;
    let shownSize = "";
    let pointer: { x: number; y: number } | null = null;
    let coordsDirty = false;

    const inZone = (el: Element) => root.dataset.mode === "build" || !!el.closest(".dx-hero");

    const describe = (el: Element) => {
      const label = el.getAttribute("data-x") ?? el.tagName.toLowerCase();
      tagName.textContent = label;
      if (TEXTY.has(label)) {
        const cs = getComputedStyle(el);
        tagFont.textContent = `${cs.fontWeight} · ${Math.round(parseFloat(cs.fontSize))}/${Math.round(parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2)}`;
      } else tagFont.textContent = "";
    };

    const setTarget = (el: Element | null) => {
      if (el === target) return;
      const was = target;
      target = el;
      if (el) {
        describe(el);
        if (!was) {
          const r = el.getBoundingClientRect();
          Object.assign(cur, { x: r.left, y: r.top, w: r.width, h: r.height });
        }
        box.dataset.on = "";
      } else delete box.dataset.on;
      kick();
    };

    const draw = () => {
      const { x, y, w, h } = cur;
      top.style.transform = `translate3d(${x}px,${y}px,0) scale(${w},1)`;
      bottom.style.transform = `translate3d(${x}px,${y + h - 1}px,0) scale(${w},1)`;
      left.style.transform = `translate3d(${x}px,${y}px,0) scale(1,${h})`;
      right.style.transform = `translate3d(${x + w - 1}px,${y}px,0) scale(1,${h})`;
      corners[0].style.transform = `translate3d(${x - 3}px,${y - 3}px,0)`;
      corners[1].style.transform = `translate3d(${x + w - 4}px,${y - 3}px,0)`;
      corners[2].style.transform = `translate3d(${x + w - 4}px,${y + h - 4}px,0)`;
      corners[3].style.transform = `translate3d(${x - 3}px,${y + h - 4}px,0)`;
      // The tag sits above the box, or inside its top edge when there's no room under the header.
      const ty = y > 92 ? y - 26 : y + 6;
      tag.style.transform = `translate3d(${Math.max(4, Math.min(x, window.innerWidth - 220))}px,${ty}px,0)`;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (coordsDirty && pointer) {
        coordsDirty = false;
        if (cx) cx.textContent = four(pointer.x);
        if (cy) cy.textContent = four(pointer.y + window.scrollY);
      }
      if (!target) {
        last = 0;
        return;
      }
      if (!target.isConnected) {
        setTarget(null);
        return;
      }
      const r = target.getBoundingClientRect();
      const k = still ? 1 : 1 - Math.exp(-dt * 20);
      const dx = r.left - cur.x;
      const dy = r.top - cur.y;
      const dw = r.width - cur.w;
      const dh = r.height - cur.h;
      cur.x += dx * k;
      cur.y += dy * k;
      cur.w += dw * k;
      cur.h += dh * k;
      draw();
      const size = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      if (size !== shownSize) {
        shownSize = size;
        tagSize.textContent = size;
      }
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(dw) + Math.abs(dh) > 0.4) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      coordsDirty = true;
      const el = (e.target as Element | null)?.closest?.("[data-x]") ?? null;
      setTarget(el && inZone(el) ? el : null);
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || root.dataset.mode !== "build") return;
      const el = (e.target as Element | null)?.closest?.("[data-x]") ?? null;
      setTarget(el);
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Element | null;
      if (!t?.matches?.(":focus-visible")) return;
      const el = t.closest("[data-x]");
      if (el && inZone(el)) setTarget(el);
    };
    const onBlur = () => setTarget(null);
    const onLeave = () => setTarget(null);
    const onScroll = () => {
      if (pointer) coordsDirty = true;
      if (target) kick();
      else if (coordsDirty) kick();
    };
    const onMode = () => {
      if (target && !inZone(target)) setTarget(null);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener(MODE_EVENT, onMode);
    document.documentElement.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener(MODE_EVENT, onMode);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
    };
  }, []);

  return (
    <div ref={ref} className="dx-insp" aria-hidden>
      <span className="dx-insp__l" data-l="t" />
      <span className="dx-insp__l" data-l="r" />
      <span className="dx-insp__l" data-l="b" />
      <span className="dx-insp__l" data-l="l" />
      <span className="dx-insp__c" data-c="tl" />
      <span className="dx-insp__c" data-c="tr" />
      <span className="dx-insp__c" data-c="br" />
      <span className="dx-insp__c" data-c="bl" />
      <span className="dx-insp__tag" data-tag>
        <b data-tag-name>div</b>
        <span data-tag-size>0 × 0</span>
        <span data-tag-font />
      </span>
    </div>
  );
}
