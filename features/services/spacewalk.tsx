"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { pad } from "@/features/drafts/depth/lift";
import type { Climber, Rope } from "./climber";
import { decideMode, metresOf, PAST_FIST, WIDE, type Mode } from "./mode";
import "./spacewalk.css";

/** The tip of the tether is level with this line (a share of the screen's height). */
const LINE = 0.58;
/** A station's service rises in as its top passes this line. */
const ARRIVE = 0.86;
/** Where the line meets the astronaut: the top of the backpack, as a share of the picture's height. */
const ATTACH = 0.2;
/** One sample of the path every this many pixels of line, for finding the tip by height. */
const STEP = 6;
/** The live astronaut (climber.ts) catches up with the tip at this rate, and is never further behind. */
const CATCH = 5;
const BEHIND = 900;

/** A stop on the tether: a service, or the airlock (the process) at the end. */
export type Stop = { id: string; name: string };

type Geo = { total: number; xs: Float32Array; ys: Float32Array; lens: Float32Array; stops: number[]; aw: number; ah: number };

/**
 * /services, "Spacewalk" (Karan, 27 Oct 2026: drafted after astronaut sites like In Space We Trust
 * and tethered EVA footage; chosen 29 Oct from ten drafts). One tether runs from a hatch under the
 * page's head down to the airlock at the end; each service is a station clipped on to it, left and
 * right of the line on wide screens, beside it on phones. The line pays out as you scroll and the
 * astronaut rides its tip, tilting with the line; the clips behind you turn red, the one you are at
 * is ringed. The stations are the page's server-rendered children; the path is drawn from their clips'
 * real positions and redrawn whenever the page's size changes. With motion, once the model is in, the
 * astronaut is the home's own, live (climber.ts): hanging from the line by one hand and swinging from
 * it as the hand slides down; until then, and without WebGL, the still rides the tip. Reduced motion:
 * the tether drawn whole and the still parked at the hatch. No script: a plain hairline.
 */
export function Spacewalk({ stops, children }: { stops: Stop[]; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("static");

  // The mode: on <html> already from the inline script after a full load; set here before paint on a
  // client navigation, and kept up as the window or the motion setting changes.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const apply = () => {
      const next = decideMode();
      html.setAttribute("data-sh", next);
      setMode(next);
    };
    apply();
    const queries = [window.matchMedia("(prefers-reduced-motion: reduce)"), window.matchMedia(WIDE)];
    for (const q of queries) q.addEventListener("change", apply);
    return () => {
      for (const q of queries) q.removeEventListener("change", apply);
      html.removeAttribute("data-sh");
    };
  }, []);

  useEffect(() => {
    const r = root.current;
    if (!r) return;
    const svg = r.querySelector<SVGSVGElement>(".sh-tether");
    const ghost = r.querySelector<SVGPathElement>(".sh-tether__ghost");
    const line = r.querySelector<SVGPathElement>(".sh-tether__line");
    const hatch = r.querySelector<HTMLElement>(".sh-hatch__box");
    const astro = r.querySelector<HTMLElement>(".sh-astro");
    const body = r.querySelector<HTMLElement>(".sh-astro__body");
    const lenEl = r.querySelector<HTMLElement>("[data-sh-len]");
    const atEl = r.querySelector<HTMLElement>("[data-sh-at]");
    const stations = Array.from(r.querySelectorAll<HTMLElement>(".sh-station"));
    const canvas = r.querySelector<HTMLCanvasElement>(".sh-astro__gl");
    if (!svg || !ghost || !line || !hatch || !astro || !body || !canvas) return;
    const still = mode === "static";
    let geo: Geo | null = null;
    let raf = 0;
    let built = 0;
    let cur = -2;
    let first = true;
    // The live astronaut: where the scroll has the tip, where the climber is (it follows), its loop.
    let gl: Climber | null = null;
    let tipNow = 0;
    let s = Number.NaN;
    let loop = 0;
    let then = 0;
    let seen = false;
    let ppm = 0;
    const point = { x: 0, y: 0 };
    // The line as the climber reads it: a point at any length, from the samples (STEP px apart).
    const rope: Rope = {
      total: 0,
      at(len, out) {
        const g = geo;
        if (!g) return;
        const n = g.xs.length;
        const f = Math.max(0, len) / STEP;
        const i = Math.min(n - 1, Math.floor(f));
        const j = Math.min(n - 1, i + 1);
        const u = Math.min(1, f - i);
        out.x = g.xs[i] + (g.xs[j] - g.xs[i]) * u;
        out.y = g.ys[i] + (g.ys[j] - g.ys[i]) * u;
      },
    };
    // Arriving at /services#process (or a service's id): that station stands open when you land.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? (document.getElementById(hash)?.closest<HTMLElement>(".sh-station") ?? null) : null;

    // Once open, a station stays open. `instant`: already passed, landed on or focused, so no rise.
    const open = (el: HTMLElement, instant: boolean) => {
      if (el.hasAttribute("data-open")) return;
      if (instant) {
        el.setAttribute("data-instant", "");
        requestAnimationFrame(() => requestAnimationFrame(() => el.removeAttribute("data-instant")));
      }
      el.setAttribute("data-open", "");
    };

    // The path, from the hatch through each station's clip, in the walk's own pixels. Between two
    // clips the line goes slack into the empty side beside the station above (wide screens), or
    // sways a little in the margin (phones).
    const build = () => {
      const box = r.getBoundingClientRect();
      const w = r.offsetWidth;
      const h = r.offsetHeight;
      const centre = (el: Element) => {
        const b = el.getBoundingClientRect();
        return { x: b.left - box.left + b.width / 2, y: b.top - box.top + b.height / 2 };
      };
      const clips = stations.map((s) => s.querySelector(".sh-clip")).filter((c): c is HTMLElement => c !== null);
      const pts = [centre(hatch), ...clips.map(centre)];
      const wide = window.matchMedia(WIDE).matches;
      const amp = wide ? Math.min(w * 0.22, 300) : 7;
      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1];
        const b = pts[k];
        // (the first stretch, above the first station, only drifts; after that, away from the station)
        const side = wide ? (k === 1 ? -0.35 : k % 2 === 0 ? 1 : -1) : k % 2 === 0 ? 1 : -1;
        const off = (amp * side) / 0.75;
        const dy = b.y - a.y;
        d += ` C${(a.x + off).toFixed(1)} ${(a.y + dy * 0.28).toFixed(1)} ${(b.x + off).toFixed(1)} ${(a.y + dy * 0.72).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      ghost.setAttribute("d", d);
      line.setAttribute("d", d);
      const total = line.getTotalLength();
      const n = Math.max(2, Math.ceil(total / STEP) + 1);
      const xs = new Float32Array(n);
      const ys = new Float32Array(n);
      const lens = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const l = Math.min(total, i * STEP);
        const p = line.getPointAtLength(l);
        xs[i] = p.x;
        ys[i] = p.y;
        lens[i] = l;
      }
      // Each clip's place along the line (the first sample level with it or below).
      const marks = pts.slice(1).map((p) => {
        let i = 0;
        while (i < n - 1 && ys[i] < p.y - 0.5) i++;
        return lens[i];
      });
      line.style.strokeDasharray = `${total} ${total}`;
      geo = { total, xs, ys, lens, stops: marks, aw: astro.offsetWidth, ah: astro.offsetHeight };
      r.setAttribute("data-drawn", "");
    };

    // The sample at a height: the last whose y is at or above it (y only grows along the line).
    const at = (g: Geo, y: number) => {
      let lo = 0;
      let hi = g.ys.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (g.ys[mid] <= y) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };

    const frame = () => {
      raf = 0;
      if (!geo) return;
      const g = geo;
      const vh = window.innerHeight;
      const top = r.getBoundingClientRect().top;
      const n = g.ys.length;
      const y = Math.min(g.ys[n - 1], Math.max(g.ys[0], vh * LINE - top));
      const i = at(g, y);
      // (between two samples, by height, so the tip glides rather than steps)
      const j = Math.min(n - 1, i + 1);
      const f = g.ys[j] > g.ys[i] ? (y - g.ys[i]) / (g.ys[j] - g.ys[i]) : 0;
      const tip = g.lens[i] + (g.lens[j] - g.lens[i]) * f;

      tipNow = still ? 0 : tip;
      // (the live astronaut draws the line and moves itself, from its own loop: tick())
      if (gl) wake();
      else {
        const drawn = still ? g.total : tip;
        line.style.strokeDashoffset = (g.total - drawn).toFixed(1);
        const k = still ? 0 : i;
        const x = still ? g.xs[0] : g.xs[i] + (g.xs[j] - g.xs[i]) * f;
        const yy = still ? g.ys[0] : y;
        // The still leans the way the line runs (a few samples either side, eased, held in).
        const a = Math.max(0, k - 3);
        const b = Math.min(n - 1, k + 3);
        const lean = still ? 0 : Math.max(-22, Math.min(22, -0.6 * ((Math.atan2(g.xs[b] - g.xs[a], g.ys[b] - g.ys[a] || 1) * 180) / Math.PI)));
        astro.style.transform = `translate3d(${(x - g.aw / 2).toFixed(1)}px, ${(yy - g.ah * ATTACH).toFixed(1)}px, 0)`;
        body.style.transform = `rotate(${lean.toFixed(2)}deg)`;
      }

      // The clips behind you, and the one you are at.
      let c = -1;
      for (let s = 0; s < stations.length; s++) {
        const passed = g.stops[s] <= tip + 1;
        if (passed) c = s;
        stations[s].toggleAttribute("data-passed", passed);
      }
      if (c !== cur) {
        if (cur >= 0) stations[cur]?.removeAttribute("data-current");
        if (c >= 0) stations[c].setAttribute("data-current", "");
        if (atEl) atEl.textContent = c >= 0 ? `${pad(c + 1)} · ${stops[c]?.name ?? ""}` : "Hatch";
        // The readout sits on the slack side of the stretch you are on, clear of the station.
        const seg = c + 2;
        astro.setAttribute("data-side", seg === 1 || seg % 2 === 1 ? "l" : "r");
        cur = c;
      }
      if (lenEl && !gl) lenEl.textContent = metresOf(still ? 0 : tip);

      for (const s of stations) {
        const t = s.getBoundingClientRect().top;
        if (t < vh * ARRIVE) open(s, t < 0 || (first && s === target));
      }
      first = false;
    };

    // The live astronaut's loop: it follows the tip (eased, so the line's run shows as speed), draws
    // the line to where its hands are, and swings. Runs while the walk is on screen.
    const tick = (now: number) => {
      loop = 0;
      const g = geo;
      if (!gl || !g) return;
      const dt = then ? (now - then) / 1000 : 1 / 60;
      then = now;
      if (Number.isNaN(s)) s = tipNow;
      s += (tipNow - s) * (1 - Math.exp(-Math.min(dt, 0.1) * CATCH));
      if (Math.abs(tipNow - s) > BEHIND) s = tipNow - Math.sign(tipNow - s) * BEHIND;
      rope.total = g.total;
      rope.at(s, point);
      // (the line runs on through the fist, a hand's length, before it goes slack)
      line.style.strokeDashoffset = Math.max(0, g.total - s - PAST_FIST * ppm).toFixed(1);
      astro.style.transform = `translate3d(${(point.x - g.aw / 2).toFixed(1)}px, ${(point.y - g.ah * ATTACH).toFixed(1)}px, 0)`;
      if (lenEl) lenEl.textContent = metresOf(s);
      gl.frame(dt, now / 1000, s, rope);
      if (seen && !document.hidden) loop = requestAnimationFrame(tick);
    };
    function wake() {
      if (!loop && gl && seen && !document.hidden) {
        then = 0;
        loop = requestAnimationFrame(tick);
      }
    }
    // The canvas, scaled from the still's box (the live figure a little larger: it hangs below its
    // hands rather than standing), its line point on the tip.
    const sizeGl = () => {
      if (!gl || !geo) return;
      ppm = Math.max(window.matchMedia(WIDE).matches ? 70 : 46, (geo.ah * 1.08) / 1.92);
      const place = gl.resize(ppm);
      canvas.style.width = `${place.width}px`;
      canvas.style.height = `${place.height}px`;
      canvas.style.left = `${(geo.aw / 2 - place.x).toFixed(1)}px`;
      canvas.style.top = `${(geo.ah * ATTACH - place.y).toFixed(1)}px`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    // A change of size redraws the line (once a frame, however many observers fire).
    const rebuild = () => {
      if (built) return;
      built = requestAnimationFrame(() => {
        built = 0;
        build();
        sizeGl();
        frame();
      });
    };
    // Whatever takes focus is shown at once: nothing a keyboard reaches is ever still rising.
    const onFocus = (e: FocusEvent) => {
      const s = (e.target as Element).closest<HTMLElement>(".sh-station");
      if (s) open(s, true);
    };

    // (before the browser has scrolled to it: open now, so it is never seen rising)
    if (target) open(target, true);
    build();
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", rebuild);
    r.addEventListener("focusin", onFocus);
    const ro = new ResizeObserver(rebuild);
    ro.observe(r);
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) rebuild();
    });

    // The live astronaut, with motion only: three.js and the model come in after the page; if WebGL or
    // the model fails, the still simply stays on the line.
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      wake();
    });
    io.observe(r);
    const onVisible = () => wake();
    document.addEventListener("visibilitychange", onVisible);
    if (!still) {
      void import("./climber")
        .then(({ createClimber }) => createClimber(canvas, !window.matchMedia(WIDE).matches))
        .then((made) => {
          if (!live) return made.dispose();
          gl = made;
          s = tipNow;
          sizeGl();
          body.style.transform = "";
          astro.setAttribute("data-gl", "");
          wake();
        })
        .catch(() => {});
    }

    return () => {
      live = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", rebuild);
      document.removeEventListener("visibilitychange", onVisible);
      r.removeEventListener("focusin", onFocus);
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(built);
      cancelAnimationFrame(loop);
      gl?.dispose();
      gl = null;
      astro.removeAttribute("data-gl");
      r.removeAttribute("data-drawn");
      astro.style.transform = "";
      body.style.transform = "";
      for (const s of stations) {
        s.removeAttribute("data-current");
        s.removeAttribute("data-passed");
        s.removeAttribute("data-instant");
      }
    };
  }, [stops, mode]);

  return (
    <div ref={root} className="sh-walk">
      <svg className="sh-tether" aria-hidden focusable="false">
        <path className="sh-tether__ghost" />
        <path className="sh-tether__line" />
      </svg>

      {/* Where the tether is made fast: a hatch under the page's head. */}
      <div className="sh-hatch" aria-hidden>
        <span className="sh-hatch__box" />
        <span className="dp-k sh-hatch__k">Hatch · EVA {pad(stops.length)} stops</span>
      </div>

      {/* The astronaut on the end of the line, and what it reads (a picture; the stations' headings
          are what readers and keys move by). */}
      <div className="sh-astro" aria-hidden>
        <span className="sh-astro__body">
          <Image src="/models/astronaut/gate-settled-8.webp" alt="" width={610} height={920} sizes="(min-width: 900px) 8rem, 3rem" className="sh-astro__img" />
        </span>
        <canvas className="sh-astro__gl" />
        <span className="dp-k sh-astro__read">
          <span data-sh-len>{metresOf(0)}</span>
          <span data-sh-at className="sh-astro__at">
            Hatch
          </span>
        </span>
      </div>

      <div className="sh-stations">{children}</div>
    </div>
  );
}
