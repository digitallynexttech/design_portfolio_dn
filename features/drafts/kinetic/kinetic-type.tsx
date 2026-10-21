"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";

/** The font's weight axis (Stack Sans, 200–700), and a midpoint for a better width curve. */
const W_MIN = 200;
const W_MID = 450;
const W_MAX = 700;
/** Extra tracking a letter gains at full weight (in em), so heavy neighbours never touch. */
const TRACK = 0.025;

/** An event a control sends to a KineticType heading to set its resting weight. */
export const BASE_EVENT = "dk-kt-base";

type Line = { text: string; /** Set flush right: it grows to the left. */ end?: boolean };

type Pulse = { kind: "sweep" | "ring"; x: number; y: number; v: number; amp: number; t0: number; life: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Type as the interface: a heading whose letters answer the pointer like iron filings. Each letter's
 * weight (wght 200–700) and a slight vertical pull follow the pointer's distance; a tap or a click
 * sends a ring of weight out from that point, and a horizontal drag on a touch screen sweeps the
 * field through the line. One sweep plays once if the visitor hasn't touched it yet.
 *
 * Heavier letters are wider, but the reflow is done with transforms: each letter's box is locked to
 * its resting width (measured after the font loads), and the extra width of every heavier letter
 * before it on the line is added as a translateX. The page's layout never moves, so it costs no CLS,
 * and only weight and transform are written per frame. The loop runs while the pointer moves or a
 * wave is travelling, and stops once everything has eased back to rest.
 */
export function KineticType({
  as: Tag = "h2",
  id,
  label,
  lines,
  className = "",
  rest = 300,
  peak = W_MAX,
  intro = false,
}: {
  as?: "h1" | "h2";
  id?: string;
  /** The heading's accessible name: the letters themselves are hidden from assistive tech. */
  label: string;
  lines: Line[];
  className?: string;
  rest?: number;
  peak?: number;
  intro?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>("[data-ch]"));
    const n = chars.length;
    if (!n) return;
    const area = el.closest<HTMLElement>("[data-kt-area]") ?? el;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const still = () => reducedQuery.matches || document.documentElement.dataset.motion === "off";

    // Widths at three points on the axis, the locked resting width, and resting positions.
    const a200 = new Float64Array(n);
    const a450 = new Float64Array(n);
    const a700 = new Float64Array(n);
    const box = new Float64Array(n);
    const x0 = new Float64Array(n);
    const y0 = new Float64Array(n);
    const h0 = new Float64Array(n);
    // Each letter's own size: on phones the headline's lines are set at different sizes.
    const fsc = new Float64Array(n).fill(16);
    // Current state.
    const w = new Float64Array(n).fill(rest);
    const yOff = new Float64Array(n);
    const xOff = new Float64Array(n);
    const shownW = new Int32Array(n).fill(-1);
    const shownT: string[] = new Array(n).fill("");
    let groups: { idx: number[]; end: boolean }[] = [];

    let ready = false;
    let fs = 16;
    let base = rest;
    let baseGoal = rest;
    const ptr = { x: 0, y: 0, on: false };
    const pulses: Pulse[] = [];
    let touched = false;
    let visible = false;
    let raf = 0;
    let last = 0;

    // A letter's advance at a weight: the font's own (measured at three points, interpolated), plus
    // the extra tracking heavier letters get, relative to the resting weight the boxes were set at.
    const adv = (i: number, wt: number) =>
      (wt <= W_MID
        ? a200[i] + ((a450[i] - a200[i]) * (wt - W_MIN)) / (W_MID - W_MIN)
        : a450[i] + ((a700[i] - a450[i]) * (wt - W_MID)) / (W_MAX - W_MID)) +
      (fsc[i] * TRACK * (wt - rest)) / (W_MAX - W_MIN);

    const setAll = (wt: number | null) => {
      for (const c of chars) c.style.fontVariationSettings = wt === null ? "" : `"wght" ${wt}`;
    };
    const readWidths = (out: Float64Array) => {
      for (let i = 0; i < n; i++) out[i] = chars[i].getBoundingClientRect().width;
    };

    const write = () => {
      for (let i = 0; i < n; i++) {
        const c = chars[i];
        const wr = Math.round(w[i]);
        if (wr !== shownW[i]) {
          shownW[i] = wr;
          c.style.fontVariationSettings = `"wght" ${wr}`;
        }
        const t =
          Math.abs(xOff[i]) < 0.05 && Math.abs(yOff[i]) < 0.05
            ? ""
            : `translate3d(${xOff[i].toFixed(2)}px, ${yOff[i].toFixed(2)}px, 0)`;
        if (t !== shownT[i]) {
          shownT[i] = t;
          c.style.transform = t;
        }
      }
    };

    // Each line's letters shift by the extra width of the heavier letters before them (or after
    // them, on a line set flush right).
    const reflow = () => {
      for (const g of groups) {
        let run = 0;
        if (g.end) {
          for (let k = g.idx.length - 1; k >= 0; k--) {
            const i = g.idx[k];
            run += adv(i, Math.round(w[i])) - box[i];
            xOff[i] = -run;
          }
        } else {
          for (const i of g.idx) {
            xOff[i] = run;
            run += adv(i, Math.round(w[i])) - box[i];
          }
        }
      }
    };

    const measure = () => {
      for (const c of chars) {
        c.style.width = "";
        c.style.transform = "";
      }
      shownT.fill("");
      setAll(W_MIN);
      readWidths(a200);
      setAll(W_MID);
      readWidths(a450);
      setAll(W_MAX);
      readWidths(a700);
      setAll(null);
      readWidths(box);
      const sizeOf = new Map<Element, number>();
      for (let i = 0; i < n; i++) {
        x0[i] = chars[i].offsetLeft;
        y0[i] = chars[i].offsetTop;
        h0[i] = chars[i].offsetHeight;
        const line = chars[i].parentElement?.parentElement ?? el;
        if (!sizeOf.has(line)) sizeOf.set(line, parseFloat(getComputedStyle(line).fontSize) || 16);
        fsc[i] = sizeOf.get(line) ?? 16;
      }
      for (let i = 0; i < n; i++) chars[i].style.width = `${box[i]}px`;
      // A visual line is the letters of one source line that share a top (a line can wrap).
      // A line set flush right (by its computed alignment, which can change with the layout) grows
      // to the left.
      const map = new Map<string, { idx: number[]; end: boolean }>();
      const flush = new Map<Element, boolean>();
      for (let i = 0; i < n; i++) {
        const line = chars[i].closest<HTMLElement>("[data-line]");
        const key = `${line?.dataset.line ?? 0}:${Math.round(y0[i])}`;
        let g = map.get(key);
        if (!g) {
          let end = false;
          if (line) {
            if (!flush.has(line)) flush.set(line, /right|end/.test(getComputedStyle(line).textAlign));
            end = flush.get(line) ?? false;
          }
          g = { idx: [], end };
          map.set(key, g);
        }
        g.idx.push(i);
      }
      groups = [...map.values()];
      fs = parseFloat(getComputedStyle(el).fontSize) || 16;
      shownW.fill(-1);
      ready = true;
      reflow();
      write();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!ready) return;
      const dt = Math.min(64, last ? now - last : 16);
      last = now;
      const instant = still();
      const r = el.getBoundingClientRect();
      const px = ptr.x - r.left;
      const py = ptr.y - r.top;
      let busy = false;

      base += (baseGoal - base) * (instant ? 1 : 1 - Math.exp(-dt / 140));
      if (Math.abs(baseGoal - base) < 0.4) base = baseGoal;
      else busy = true;
      // A heavy resting weight makes the field thin letters out instead.
      const far = base > W_MID ? W_MIN : peak;

      for (let p = pulses.length - 1; p >= 0; p--) if (now - pulses[p].t0 > pulses[p].life) pulses.splice(p, 1);
      if (pulses.length) busy = true;

      for (let i = 0; i < n; i++) {
        const cx = x0[i] + xOff[i] + adv(i, w[i]) / 2;
        const cy = y0[i] + h0[i] / 2;
        const size = fsc[i];
        const R = size * 0.95;
        const inv2R2 = 1 / (2 * R * R);
        const W = size * 0.7;
        const inv2W2 = 1 / (2 * W * W);
        let f = 0;
        let pull = 0;
        let lift = 0;
        if (ptr.on && !instant) {
          const dx = cx - px;
          const dy = (cy - py) * 1.3;
          f = Math.exp(-(dx * dx + dy * dy) * inv2R2);
          pull = clamp((py - cy) * 0.14, -0.06 * size, 0.06 * size) * f;
        }
        for (const p of pulses) {
          const age = (now - p.t0) / 1000;
          let g: number;
          if (p.kind === "sweep") {
            const d = cx - (p.x + p.v * age);
            g = Math.exp(-d * d * inv2W2);
          } else {
            const d = Math.hypot(cx - p.x, cy - p.y) - p.v * age;
            g = Math.exp(-d * d * inv2W2) * Math.exp(-age * 1.6);
          }
          g *= p.amp;
          if (g > f) f = g;
          if (g > lift) lift = g;
        }
        const tw = base + (far - base) * f;
        const ty = pull - lift * 0.05 * size;
        if (instant) {
          w[i] = tw;
          yOff[i] = ty;
          continue;
        }
        // Quick to answer the field, slow to let go of it.
        const rising = Math.abs(tw - base) > Math.abs(w[i] - base);
        w[i] += (tw - w[i]) * (1 - Math.exp(-dt / (rising ? 55 : 260)));
        yOff[i] += (ty - yOff[i]) * (1 - Math.exp(-dt / (rising ? 70 : 280)));
        if (Math.abs(tw - w[i]) > 0.4 || Math.abs(ty - yOff[i]) > 0.04) busy = true;
        else {
          w[i] = tw;
          yOff[i] = ty;
        }
      }
      reflow();
      write();
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (still()) return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.on = true;
      touched = true;
      kick();
    };
    const onLeave = () => {
      ptr.on = false;
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (still() || !ready) return;
      touched = true;
      const r = el.getBoundingClientRect();
      pulses.push({ kind: "ring", x: e.clientX - r.left, y: e.clientY - r.top, v: fs * 9, amp: 1, t0: performance.now(), life: 1400 });
      if (e.pointerType !== "mouse") {
        ptr.x = e.clientX;
        ptr.y = e.clientY;
        ptr.on = true;
      }
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onLeave();
    };
    const onScroll = () => {
      if (ptr.on) kick();
    };
    const onBase = (e: Event) => {
      const v = Number((e as CustomEvent<number>).detail);
      if (!Number.isFinite(v)) return;
      baseGoal = clamp(v, W_MIN, W_MAX);
      kick();
    };

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener(BASE_EVENT, onBase);
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(el);

    // Re-measure when the type is re-set: a new width (its size is in vw) or the font arriving.
    let width = el.clientWidth;
    let pending = 0;
    const remeasure = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        measure();
        kick();
      });
    };
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      remeasure();
    });
    ro.observe(el);
    document.fonts.addEventListener("loadingdone", remeasure);

    let introTimer = 0;
    let alive = true;
    void document.fonts.ready.then(() => {
      if (!alive) return;
      measure();
      kick();
      if (!intro || still()) return;
      introTimer = window.setTimeout(() => {
        if (touched || !visible) return;
        const wide = el.getBoundingClientRect().width;
        pulses.push({ kind: "sweep", x: -fs * 1.5, y: 0, v: (wide + fs * 3) / 1.6, amp: 0.8, t0: performance.now(), life: 1700 });
        kick();
      }, 700);
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pending);
      window.clearTimeout(introTimer);
      io.disconnect();
      ro.disconnect();
      document.fonts.removeEventListener("loadingdone", remeasure);
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener(BASE_EVENT, onBase);
      window.removeEventListener("scroll", onScroll);
    };
  }, [rest, peak, intro]);

  return (
    <Tag ref={ref} id={id} aria-label={label} className={`dk-kt ${className}`} style={{ "--kt-rest": rest } as CSSProperties}>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li ? " " : null}
          <span aria-hidden className="dk-kt__line" data-line={li} data-anchor={line.end ? "end" : undefined}>
            {line.text.split(" ").map((word, wi) => (
              <Fragment key={wi}>
                {wi ? " " : null}
                <span className="dk-kt__w">
                  {Array.from(word).map((ch, ci) => (
                    <span key={ci} data-ch className={/[.?]/.test(ch) ? "dk-kt__ch dk-stop" : "dk-kt__ch"}>
                      {ch}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
