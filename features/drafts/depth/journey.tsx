"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { whenEngaged } from "@/features/stage/engage";
import { detectTier } from "@/features/stage/tier";
import type { DepthScene } from "./scene";
import { STATION_DEPTH, type DepthPlane, type DepthStop } from "./types";

/** The camera's smoothing time (seconds): long enough to glide, short enough to feel attached. */
const SMOOTH = 0.5;
/** The share of each segment's scroll where the camera rests at a station, at either end. */
const DWELL = 0.17;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const pad = (n: number) => String(n).padStart(2, "0");

/** A critically damped spring toward `to` (no overshoot): returns the new value and velocity. */
function damp(x: number, v: number, to: number, time: number, dt: number): [number, number] {
  const omega = 2 / time;
  const k = omega * dt;
  const decay = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
  const change = x - to;
  const temp = (v + omega * change) * dt;
  return [to + (change + temp) * decay, (v - omega * temp) * decay];
}

type Item = { node: HTMLElement; at: number; kind: string; o: number; d: number; on: boolean; near: boolean };

/**
 * The flight. The page scrolls through a tall track; a sticky stage holds the canvas, the HTML
 * overlays and the depth gauge. Scroll maps to a station coordinate (with a rest at each station),
 * a critically damped spring turns that into the camera's position, and the same smoothed number
 * drives the overlays, so text and planes arrive together. Nothing re-renders on scroll: one rAF
 * loop writes transforms and opacity, and stops as soon as everything has settled.
 *
 * Only in the "3d" layout. The WebGL scene loads after the visitor engages; until then (or without
 * it) each overlay's box shows its hairline frame and, near its station, the poster itself.
 */
export function Journey({
  planes,
  stops,
  exit,
  children,
}: {
  planes: DepthPlane[];
  stops: DepthStop[];
  /** The station coordinate where the flight ends (the camera has passed everything). */
  exit: number;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  // Keyed on the content, not the props' identity: a refreshed server payload with the same data
  // must not tear the scene down and rebuild it.
  const signature = JSON.stringify({ planes, stops, exit });

  useEffect(() => {
    const { planes, stops, exit } = JSON.parse(signature) as { planes: DepthPlane[]; stops: DepthStop[]; exit: number };
    let alive = true;
    const el = root.current;
    const st = stage.current;
    const hostEl = host.current;
    const gg = gauge.current;
    const cur = cursor.current;
    if (!el || !st || !hostEl || !gg || !cur) return;
    if (document.documentElement.dataset.dp !== "3d") return;
    const draft = el.closest<HTMLElement>(".d-depth");

    const items: Item[] = Array.from(st.querySelectorAll<HTMLElement>("[data-at]")).map((node) => ({
      node,
      at: Number(node.dataset.at),
      kind: node.dataset.kind ?? "work",
      o: -1,
      d: Number.NaN,
      on: false,
      near: false,
    }));
    const rail = gg.querySelector<HTMLElement>("[data-rail]");
    const ticks = Array.from(gg.querySelectorAll<HTMLElement>("[data-tick]"));
    const tickLinks = ticks.map((t) => t.querySelector("a"));
    const marker = gg.querySelector<HTMLElement>("[data-marker]");
    const readZ = gg.querySelector<HTMLElement>("[data-z]");
    const readNow = gg.querySelector<HTMLElement>("[data-now]");
    const cursorText = cur.querySelector<HTMLElement>("[data-cursor-text]");

    // A fresh canvas per mount: a disposed renderer leaves its canvas with a lost context.
    const canvas = document.createElement("canvas");
    hostEl.appendChild(canvas);

    // ---------- Geometry of the scroll ----------
    let top = 0;
    let len = 1;
    let tickPos: number[] = [];
    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
      len = Math.max(1, el.offsetHeight - st.offsetHeight);
      tickPos = ticks.map((t) => t.offsetLeft + t.offsetWidth / 2);
    };
    const mapScroll = () => {
      const p = clamp01((window.scrollY - top) / len);
      const s = p * exit;
      const k = Math.min(Math.floor(s), exit - 1);
      const t = clamp01((s - k - DWELL) / (1 - 2 * DWELL));
      return k + t * t * (3 - 2 * t);
    };
    // Station k rests in the middle of its dwell, at exactly k / exit of the track.
    const jump = (at: number) => window.scrollTo({ top: top + (at / exit) * len, behavior: "instant" });

    measure();
    let target = mapScroll();
    let c = target;
    let vel = 0;
    let ptx = 0;
    let pty = 0;
    let px = 0;
    let py = 0;
    let pvx = 0;
    let pvy = 0;
    let mx = 0;
    let my = 0;
    let over = false;
    let scene: DepthScene | null = null;
    let raf = 0;
    let last = 0;
    let visible = true;
    let shown = document.visibilityState === "visible";
    let past = false;
    let fadeShown = -1;
    let gaugeShown = -1;
    let zShown = "";
    let current = -1;

    const running = () => visible && shown;

    // ---------- Overlays, gauge and the exit fade, from the smoothed camera ----------
    const sync = () => {
      for (const it of items) {
        const d = c - it.at;
        let o: number;
        let s: number;
        let ty = 0;
        if (it.kind === "hero") {
          // The opening words: the camera flies through them.
          o = 1 - smoothstep(0.05, 0.34, d);
          s = 1 + Math.max(0, d) * 0.42;
        } else if (it.kind === "title") {
          o = 1 - smoothstep(0.07, 0.3, Math.abs(d));
          s = 1 + d * 1.15;
        } else {
          o = 1 - smoothstep(0.15, 0.4, Math.abs(d));
          s = 1 + d * 0.05;
          ty = -d * 44;
        }
        if (o < 0.002) o = 0;
        if (o !== it.o || (o > 0 && Math.abs(d - it.d) > 1e-4)) {
          it.node.style.opacity = o.toFixed(3);
          if (o > 0) {
            it.node.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
            it.node.style.setProperty("--d", d.toFixed(3));
          }
          it.o = o;
          it.d = d;
        }
        const on = it.kind === "hero" ? d < 0.2 : Math.abs(d) < 0.22;
        if (on !== it.on) {
          it.on = on;
          it.node.toggleAttribute("data-on", on);
        }
        const near = d > -1.3 && d < 0.8;
        if (near !== it.near) {
          it.near = near;
          it.node.toggleAttribute("data-near", near);
        }
      }

      // The gauge: a red marker between the stops, the current stop named.
      const lastStop = stops.length - 1;
      const g = Math.min(Math.max(c, 0), lastStop);
      const k = Math.min(Math.floor(g), lastStop - 1);
      if (marker && tickPos.length > 1) {
        const x = tickPos[k] + (tickPos[k + 1] - tickPos[k]) * (g - k);
        marker.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      }
      const now = Math.round(g);
      if (now !== current) {
        if (current >= 0) {
          ticks[current]?.removeAttribute("data-cur");
          tickLinks[current]?.removeAttribute("aria-current");
        }
        current = now;
        ticks[now]?.setAttribute("data-cur", "");
        tickLinks[now]?.setAttribute("aria-current", "step");
        if (readNow) readNow.textContent = `${pad(now)} ${stops[now]?.label ?? ""}`;
      }
      const z = `Z −${(c * STATION_DEPTH).toFixed(1).padStart(4, "0")}`;
      if (z !== zShown && readZ) {
        zShown = z;
        readZ.textContent = z;
      }

      // Past the last plane the void closes: the canvas and the gauge fade out.
      // The gauge goes first, before the next section rises over the stage.
      const fade = 1 - smoothstep(exit - 0.68, exit - 0.25, c);
      const f = Math.round(fade * 1000) / 1000;
      if (f !== fadeShown) {
        fadeShown = f;
        hostEl.style.opacity = String(f);
      }
      const gf = Math.round((1 - smoothstep(exit - 0.85, exit - 0.58, c)) * 1000) / 1000;
      if (gf !== gaugeShown) {
        gaugeShown = gf;
        gg.style.opacity = String(gf);
        gg.toggleAttribute("data-gone", gf === 0);
      }
    };

    // ---------- The loop: runs while anything moves, then stops ----------
    const frame = (t: number) => {
      raf = 0;
      if (!alive) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      [c, vel] = damp(c, vel, target, SMOOTH, dt);
      [px, pvx] = damp(px, pvx, ptx, 0.6, dt);
      [py, pvy] = damp(py, pvy, pty, 0.6, dt);
      let busy = Math.abs(c - target) > 1e-4 || Math.abs(vel) > 1e-3 || Math.abs(px - ptx) > 1e-3 || Math.abs(py - pty) > 1e-3;
      if (!busy) {
        c = target;
        vel = 0;
      }
      sync();
      if (scene) busy = scene.frame({ c, vel, px, py, dt, mx, my, over }) || busy;
      if (busy && running()) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const kick = () => {
      if (alive && !raf && running()) raf = requestAnimationFrame(frame);
    };

    // ---------- Input ----------
    const onScroll = () => {
      target = mapScroll();
      const nextPast = window.scrollY > top + len - st.offsetHeight * 0.3;
      if (nextPast !== past) {
        past = nextPast;
        draft?.toggleAttribute("data-past", past);
      }
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ptx = (e.clientX / window.innerWidth) * 2 - 1;
      pty = -((e.clientY / window.innerHeight) * 2 - 1);
      const r = st.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const tgt = e.target as Element | null;
      over = !!tgt && st.contains(tgt) && !tgt.closest("a, button, [data-text], .dp-gauge");
      cur.style.transform = `translate3d(${(e.clientX - r.left).toFixed(1)}px, ${(e.clientY - r.top).toFixed(1)}px, 0)`;
      kick();
    };
    const onLeave = () => {
      over = false;
      kick();
    };

    const activate = (key: string) => {
      if (key === "reel") st.querySelector<HTMLButtonElement>(".dp-reel__play button")?.click();
      else st.querySelector<HTMLAnchorElement>(`[data-case-link="${key}"]`)?.click();
    };
    let down: { x: number; y: number; t: number; id: number } | null = null;
    const ndcOf = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)] as const;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button, [data-text], .dp-gauge")) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      // A finger has no hover: while it presses a plane, the plane leans toward it.
      if (e.pointerType === "touch") {
        [mx, my] = ndcOf(e);
        over = true;
        kick();
      }
    };
    const onUp = (e: PointerEvent) => {
      const start = down;
      down = null;
      if (e.pointerType === "touch") {
        over = false;
        kick();
      }
      if (!start || !scene || start.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8 || performance.now() - start.t > 600) return;
      const [x, y] = ndcOf(e);
      const key = scene.pick(x, y);
      if (key && key !== "x") activate(key);
    };
    const onCancel = () => {
      down = null;
      over = false;
      kick();
    };

    const onHover = (key: string | null) => {
      st.toggleAttribute("data-hover", Boolean(key && key !== "x"));
      st.style.cursor = key ? "pointer" : "";
      if (cursorText && key && key !== "x") cursorText.textContent = key === "reel" ? "Play reel" : "View case study";
    };

    // "See the work" and the gauge's stops: the camera flies there (the scroll jumps; the spring glides).
    let suppressClick = false;
    const onClick = (e: MouseEvent) => {
      const go = (e.target as Element).closest<HTMLElement>("[data-go]");
      if (!go) return;
      e.preventDefault();
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const at = Number(go.dataset.go);
      jump(at);
      // Keyboard focus follows the camera, so the next Tab continues from the new station.
      if (!go.closest(".dp-gauge")) {
        const dest = items.find((it) => it.at === at && it.kind !== "title")?.node;
        dest?.focus({ preventScroll: true });
      }
    };
    // Tabbing into a station that isn't in front of the camera flies there.
    const onFocus = (e: FocusEvent) => {
      const it = (e.target as Element).closest<HTMLElement>("[data-at]");
      if (!it) return;
      const at = Number(it.dataset.at);
      if (Math.abs(target - at) > 0.2) jump(at);
    };

    // The gauge also scrubs: drag along it and the camera follows.
    let drag: { id: number; x: number; moved: boolean } | null = null;
    const scrub = (clientX: number) => {
      if (!rail || tickPos.length < 2) return;
      const x = clientX - rail.getBoundingClientRect().left;
      let at = 0;
      if (x >= tickPos[tickPos.length - 1]) at = tickPos.length - 1;
      else if (x > tickPos[0]) {
        const k = tickPos.findIndex((p) => p > x) - 1;
        at = k + (x - tickPos[k]) / (tickPos[k + 1] - tickPos[k]);
      }
      jump(at);
    };
    const onRailDown = (e: PointerEvent) => {
      if (!rail || (e.pointerType === "mouse" && e.button !== 0)) return;
      drag = { id: e.pointerId, x: e.clientX, moved: false };
    };
    // A link's native drag would cancel the scrub.
    const onRailDrag = (e: DragEvent) => e.preventDefault();
    const onRailMove = (e: PointerEvent) => {
      if (!drag || !rail || drag.id !== e.pointerId) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) > 5) {
        drag.moved = true;
        rail.setPointerCapture(e.pointerId);
        rail.setAttribute("data-scrub", "");
      }
      if (drag.moved) scrub(e.clientX);
    };
    const onRailUp = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      if (drag.moved) suppressClick = true;
      drag = null;
      rail?.removeAttribute("data-scrub");
      if (rail?.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
      // A drag ends without a click on some browsers: don't swallow the next real one.
      window.setTimeout(() => (suppressClick = false), 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    st.addEventListener("pointerdown", onDown);
    st.addEventListener("pointerup", onUp);
    st.addEventListener("pointercancel", onCancel);
    el.addEventListener("click", onClick);
    st.addEventListener("focusin", onFocus);
    rail?.addEventListener("pointerdown", onRailDown);
    rail?.addEventListener("pointermove", onRailMove);
    rail?.addEventListener("pointerup", onRailUp);
    rail?.addEventListener("pointercancel", onRailUp);
    rail?.addEventListener("dragstart", onRailDrag);

    // ---------- Size, visibility ----------
    const relayout = () => {
      measure();
      scene?.layout();
      target = mapScroll();
      kick();
    };
    const ro = new ResizeObserver(relayout);
    ro.observe(st);
    ro.observe(el);
    void document.fonts?.ready.then(relayout);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scene?.setRunning(running());
      kick();
    });
    io.observe(el);
    const onVisibility = () => {
      shown = document.visibilityState === "visible";
      scene?.setRunning(running());
      kick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // A deep link to a station lands there.
    const hashStop = location.hash === "#work" ? 2 : stops.find((s) => `#${s.id}` === location.hash)?.at;
    if (hashStop !== undefined) {
      jump(hashStop);
      target = mapScroll();
      c = target;
    }
    sync();
    onScroll();

    // ---------- WebGL, once someone is here ----------
    let cancelled = false;
    const lost = () => {
      scene?.dispose();
      scene = null;
      el.removeAttribute("data-live");
      draft?.removeAttribute("data-x");
    };
    const boot = async () => {
      const { createScene } = await import("./scene");
      if (cancelled) return;
      try {
        const made = await createScene({
          canvas,
          stage: st,
          planes,
          exit,
          box: (key) => st.querySelector<HTMLElement>(`[data-box="${key}"]`),
          xBox: st.querySelector<HTMLElement>("[data-xbox]"),
          maxDpr: detectTier({ ignoreMotion: true }) <= 1 ? 1.25 : 1.5,
          onHover,
          onReady: (key) => st.querySelector(`[data-box="${key}"]`)?.closest("[data-at]")?.setAttribute("data-ready", ""),
          onXReady: () => draft?.setAttribute("data-x", "live"),
          onLost: lost,
          invalidate: kick,
        });
        if (cancelled) return made.dispose();
        scene = made;
        // Posters already on screen stay until their own plane has its texture, then cross-fade.
        for (const it of items) if (it.near) it.node.setAttribute("data-keep", "");
        el.setAttribute("data-live", "");
        scene.setRunning(running());
        kick();
      } catch {
        // No context: the frames and posters stay, and the flight still works without the planes.
      }
    };
    const stopEngage = whenEngaged(() => void boot());

    const teardown = () => {
      if (!alive) return;
      alive = false;
      cancelled = true;
      stopEngage();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      st.removeEventListener("pointerdown", onDown);
      st.removeEventListener("pointerup", onUp);
      st.removeEventListener("pointercancel", onCancel);
      el.removeEventListener("click", onClick);
      st.removeEventListener("focusin", onFocus);
      rail?.removeEventListener("pointerdown", onRailDown);
      rail?.removeEventListener("pointermove", onRailMove);
      rail?.removeEventListener("pointerup", onRailUp);
      rail?.removeEventListener("pointercancel", onRailUp);
      rail?.removeEventListener("dragstart", onRailDrag);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      io.disconnect();
      scene?.dispose();
      scene = null;
      canvas.remove();
      el.removeAttribute("data-live");
      draft?.removeAttribute("data-x");
      draft?.removeAttribute("data-past");
      mq.removeEventListener("change", onMotion);
    };

    // Reduced motion switched on mid-visit: the flight stands down and the page becomes the plain
    // stacked layout, with every overlay's inline motion cleared.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      if (!mq.matches) return;
      teardown();
      for (const it of items) {
        it.node.style.removeProperty("opacity");
        it.node.style.removeProperty("transform");
        it.node.style.removeProperty("--d");
        for (const name of ["data-on", "data-near", "data-ready", "data-keep"]) it.node.removeAttribute(name);
      }
      document.documentElement.dataset.dp = "flat";
    };
    mq.addEventListener("change", onMotion);

    return teardown;
  }, [signature]);

  return (
    <div ref={root} className="dp-journey" style={{ "--n": exit } as CSSProperties}>
      <div ref={stage} className="dp-stage">
        <div ref={host} className="dp-canvas" aria-hidden />
        <div className="dp-veil" aria-hidden />
        <div className="dp-layers">{children}</div>
        <span ref={cursor} className="dp-cursor" aria-hidden>
          <span data-cursor-text>View case study</span>
          <span className="dp-cursor__arrow">→</span>
        </span>
        <nav ref={gauge} className="dp-gauge" aria-label="Flight">
          <span className="dp-gauge__z" data-z aria-hidden>
            Z {"−"}00.0
          </span>
          <span className="dp-gauge__now" data-now aria-hidden>
            00 {stops[0]?.label}
          </span>
          <div className="dp-gauge__rail" data-rail>
            <span className="dp-gauge__line" aria-hidden />
            <ol className="dp-gauge__ticks">
              {stops.map((s, i) => (
                <li key={s.id} data-tick className="dp-gauge__tick" style={{ "--t": i / Math.max(1, stops.length - 1) } as CSSProperties}>
                  <a href={`#${s.id}`} data-go={s.at} className="dp-gauge__link" draggable={false}>
                    <span className="dp-gauge__no" aria-hidden>
                      {pad(i)}
                    </span>
                    <span className="dp-gauge__name">{s.label}</span>
                  </a>
                </li>
              ))}
            </ol>
            <span className="dp-gauge__marker" data-marker aria-hidden />
          </div>
        </nav>
      </div>
    </div>
  );
}
