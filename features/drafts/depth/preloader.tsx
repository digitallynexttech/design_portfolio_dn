"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { loadBus, type LoadState } from "./loader-bus";
import { decideMode, wantsLoader } from "./mode";
import { reveal } from "./preloader-reveal";
import { X_GLYPH } from "./x-glyph";
import "./preloader.css";

/** The longest anyone waits (ms): then it lifts onto the hero's stills and the 3D finishes behind. */
const MAX_WAIT = 6500;
/** The quickest the number fills (s): from the cache it is still a beat, not a flash. */
const MIN_FILL = 0.9;
/** The number's split: downloads, then the build (compiling, the first frame). */
const DOWNLOAD_SHARE = 0.84;

const WORD = "DIGITALLY NEXT".split("");
const LABEL: Record<string, string> = {
  engine: "the engine",
  draco: "the decoder",
  astronaut: "the astronaut",
  x: "the X",
  weave: "the suit’s weave",
  visor: "the visor’s reflection",
  "earth-day": "Earth",
  "earth-extra": "clouds and city lights",
  scene: "the corridor",
  astro: "the suit",
  earth: "Earth’s light",
  frame: "the first frame",
};

const size = (kb: number) => (kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);

function describe(now: LoadState["now"]) {
  if (!now) return "Ready";
  if (now.total === 0) return `Building ${LABEL[now.key]}`;
  return `Loading ${LABEL[now.key]} · ${size(now.loaded)} / ${size(now.total)}`;
}

/** An element's one text node, written in place every time (never replaced). */
function textOf(el: Element | null) {
  if (!el) return { data: "" } as { data: string };
  if (!(el.firstChild instanceof Text)) el.textContent = el.textContent ?? "";
  return el.firstChild as Text;
}

/**
 * Whether this visit is showing it. Kept here as well as on <html>: in development React mounts
 * effects twice, and the first cleanup takes the attribute down.
 */
let pending = false;

function XGlyph() {
  return (
    <svg className="dp-loader__x" viewBox={`0 0 ${X_GLYPH.width} ${X_GLYPH.height}`} aria-hidden>
      <path d={X_GLYPH.d} />
    </svg>
  );
}

/** One layer of the wordmark: "line" the outline, "fill" the white that wipes in over it (--p). */
function Layer({ layer }: { layer: "line" | "fill" }) {
  return (
    <span className={`dp-loader__layer dp-loader__layer--${layer}`}>
      {WORD.map((ch, i) =>
        ch === "X" ? (
          <XGlyph key={i} />
        ) : (
          <span key={i} className={ch === " " ? "dp-loader__sp" : "dp-loader__ch"}>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/**
 * The Depth home's preloader, after the one on digitallynext.com: the brand red, DIGITALLY NEXT in
 * outline filling with white, "Think. Act. Disrupt." and the number. Ours fills with what has really
 * arrived (the astronaut, the X, Earth, the visor's world, then compiling and the first frame; the
 * line under it says which), its tagline is its steps (Think: downloading, Act: building, Disrupt:
 * the reveal), and it lifts the moment the first frame is drawn: the X in NEXT becomes a window onto
 * the live hero and grows as it flies to the 3D X on the astronaut's shoulder (preloader-reveal.ts).
 * Every visit, never longer than MAX_WAIT, never under reduced motion (mode.ts decides, before the
 * first paint). Decorative: the page under it stays in reach of a screen reader.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  // A visit by a link (a client navigation) never ran LOADER_SCRIPT: the same rule, before the
  // first paint.
  useLayoutEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-loader") && wantsLoader(html.dataset.dp ?? decideMode(), location.search)) {
      html.setAttribute("data-loader", "");
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    const face = el?.querySelector<HTMLElement>(".dp-loader__face");
    if (!el || !face || !(html.hasAttribute("data-loader") || pending)) return;
    pending = true;
    html.setAttribute("data-loader", "");
    window.scrollTo(0, 0);

    const count = textOf(face.querySelector("[data-count]"));
    const status = textOf(face.querySelector("[data-now]"));
    const words = Array.from(face.querySelectorAll<HTMLElement>("[data-word]"));
    let alive = true;
    let raf = 0;
    let shown = 0;
    let last = 0;
    let pct = -1;
    let said = "";
    let phase = -1;
    const t0 = performance.now();

    const setPhase = (p: number) => {
      if (p === phase) return;
      phase = p;
      words.forEach((w, i) => (w.dataset.on = i < p ? "2" : i === p ? "1" : "0"));
    };
    const setFill = (p: number) => face.style.setProperty("--p", p.toFixed(4));

    const lift = async (complete: boolean) => {
      setPhase(2);
      // Out of time: the wordmark finishes filling (the reveal starts from a whole word), but the
      // number stays honest; the stills stand in while the 3D finishes behind.
      if (complete) count.data = "100";
      else {
        const from = shown;
        await new Promise<void>((resolve) => {
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / 260);
            setFill(from + (1 - from) * t);
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
      }
      setFill(1);
      if (!alive) return;
      await reveal(el, face, {
        begin: () => html.setAttribute("data-loader-state", "reveal"),
        arrive: () => loadBus.lifted(),
      });
      if (!alive) return;
      pending = false;
      html.removeAttribute("data-loader");
      html.removeAttribute("data-loader-state");
    };

    const tick = (t: number) => {
      raf = 0;
      if (!alive) return;
      const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
      last = t;
      const s = loadBus.state();
      const target = s.failed ? 1 : DOWNLOAD_SHARE * s.download + (1 - DOWNLOAD_SHARE) * s.build;
      // Eases toward what has arrived, never faster than MIN_FILL for the whole way, never back.
      if (target > shown) shown = Math.min(target, shown + Math.min(dt / MIN_FILL, (target - shown) * (1 - Math.exp(-dt * 6)) + dt * 0.04));
      setFill(shown);
      const n = Math.floor(shown * 100);
      if (n !== pct) {
        pct = n;
        count.data = String(n);
      }
      const line = describe(s.now);
      if (line !== said) {
        said = line;
        status.data = line;
      }
      setPhase(s.download < 1 ? 0 : 1);
      if ((s.done && shown >= 0.999) || s.failed || t - t0 > MAX_WAIT) {
        void lift(s.done || s.failed);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      // Leaving mid-load (or development's double mount): nothing may stay locked behind it.
      html.removeAttribute("data-loader");
      html.removeAttribute("data-loader-state");
    };
  }, []);

  return (
    <div ref={root} className="dp-loader" aria-hidden>
      <svg className="dp-loader__sheet">
        <defs>
          <mask id="dp-loader-hole" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#fff" />
            <path data-hole d={X_GLYPH.d} fill="#000" transform="scale(0)" />
          </mask>
        </defs>
        <rect data-sheet width="100%" height="100%" mask="url(#dp-loader-hole)" />
      </svg>

      <div className="dp-loader__face">
        <p className="dp-loader__word">
          <Layer layer="line" />
          <Layer layer="fill" />
        </p>
        <div className="dp-loader__row" data-fade>
          <p className="dp-loader__tag">
            <span data-word data-on="1">
              Think.
            </span>
            <span data-word data-on="0">
              Act.
            </span>
            <span data-word data-on="0">
              Disrupt.
            </span>
          </p>
          <p className="dp-loader__count">
            <span data-count>0</span>
            <small>%</small>
          </p>
        </div>
        <p className="dp-loader__now" data-now data-fade>
          Loading the engine
        </p>
      </div>
    </div>
  );
}
