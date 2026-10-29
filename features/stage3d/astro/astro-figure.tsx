"use client";

import { useLayoutEffect, useRef } from "react";
import { useThree3D, type Mount } from "../use-three";
import { bestBox, boxOf, occupied, type Box } from "./place";
import "./astro.css";

// The astronaut on /work, /about, the 404 and the offline page (Karan, 29 Oct 2026: "add 3D elements
// to all the pages left"). Each is a canvas laid over the page where it covers no word (place.ts):
// measured from the page's own lines whenever it changes size, and not shown at all where there is no
// room. The scenes (astro.scene.ts) and three.js load only once a figure comes near the screen.

const loadFall = () => import("./astro.scene").then((m) => m.mountFall);
const loadEase = () => import("./astro.scene").then((m) => m.mountEase);
const loadLost = () => import("./astro.scene").then((m) => m.mountLost);
const loadLostFling = () => import("./astro.scene").then((m) => m.mountLostFling);

/** Where a figure goes in its host (or null: nowhere it fits). */
type Solve = (host: HTMLElement, wrap: HTMLElement) => Box | null;

/** A page head's content area: inside its side padding, from its first line down to `bottom`. */
function headArea(host: HTMLElement, head: HTMLElement, bottom: number): Box | null {
  const h = boxOf(host, head);
  const first = boxOf(host, head.firstElementChild);
  if (!h || !first) return null;
  const css = getComputedStyle(head);
  return { l: h.l + parseFloat(css.paddingLeft), r: h.r - parseFloat(css.paddingRight), t: first.t, b: bottom };
}

/** /work, out of the shaft (phones, reduced motion): beside the title, above the filter. */
const solveWorkHead: Solve = (host, wrap) => {
  const head = host.querySelector<HTMLElement>(".dn-page__head");
  if (!head) return null;
  const filter = boxOf(host, host.querySelector(".wa-filter"));
  const h = boxOf(host, head);
  const area = headArea(host, head, (filter?.t ?? h?.b ?? 0) - 12);
  if (!area) return null;
  return bestBox(area, occupied(host, [head], wrap), { aspect: 0.9, gap: 24, min: 72, max: 380, room: 1.3, align: "start" });
};

/** /work, in the shaft: in the band below the study in front of you, clear of the instruments. */
const solveShaft: Solve = (host, wrap) => {
  const w = host.clientWidth;
  const h = host.clientHeight;
  let tallest = 0;
  for (const el of host.querySelectorAll<HTMLElement>(".wa-box, .wa-facts__in")) tallest = Math.max(tallest, el.offsetHeight);
  const area: Box = { l: w * 0.27, r: w * 0.73, t: (h + tallest) / 2 + 20, b: h - 12 };
  const blocks = occupied(host, [host.querySelector(".wa-cue"), host.querySelector(".wa-readout"), host.querySelector(".wa-rail")], wrap);
  return bestBox(area, blocks, { aspect: 1, gap: 16, min: 100, max: 300, room: 1.6, align: "center" });
};

/** /about: beside the title, above the team photo. */
const solveAbout: Solve = (host, wrap) => {
  const head = host.querySelector<HTMLElement>(".dn-page__head");
  const photo = boxOf(host, host.querySelector(".team-photo"));
  if (!head || !photo) return null;
  const area = headArea(host, head, photo.t - 12);
  if (!area) return null;
  return bestBox(area, occupied(host, [head], wrap), { aspect: 0.55, gap: 20, min: 60, max: 420, room: 1.5, align: "start" });
};

/** The short pages: beside the head on wide screens, under its links on narrow ones. */
const solveLost: Solve = (host, wrap) => {
  const head = host.querySelector<HTMLElement>(".dn-page__head");
  if (!head) return null;
  const area = headArea(host, head, host.clientHeight - 24);
  if (!area) return null;
  return bestBox(area, occupied(host, [head], wrap), { aspect: 1, gap: 32, min: 140, max: 620, room: 1.15, align: "center", below: 0.8 });
};

function Figure({
  host,
  solve,
  load,
  className,
  still = false,
  watch = false,
}: {
  host: string;
  solve: Solve;
  load: () => Promise<Mount>;
  className: string;
  still?: boolean;
  watch?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  // Its place: solved before paint, then again whenever its host changes size, the fonts arrive or
  // (with `watch`) the host's content changes.
  useLayoutEffect(() => {
    const el = wrap.current;
    const root = el?.closest<HTMLElement>(host);
    if (!el || !root) return;
    let raf = 0;
    let live = true;
    const run = () => {
      raf = 0;
      const b = solve(root, el);
      if (!b) {
        el.removeAttribute("data-placed");
        return;
      }
      el.style.left = `${b.l.toFixed(1)}px`;
      el.style.top = `${b.t.toFixed(1)}px`;
      el.style.width = `${(b.r - b.l).toFixed(1)}px`;
      el.style.height = `${(b.b - b.t).toFixed(1)}px`;
      el.setAttribute("data-placed", "");
    };
    const later = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    const ro = new ResizeObserver(later);
    ro.observe(root);
    const mo = watch ? new MutationObserver(later) : null;
    mo?.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", later);
    void document.fonts?.ready.then(() => {
      if (live) later();
    });
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", later);
      el.removeAttribute("data-placed");
      for (const k of ["left", "top", "width", "height"] as const) el.style[k] = "";
    };
  }, [host, solve, watch]);

  useThree3D(wrap, load);
  return (
    <div ref={wrap} className={`s3 s3a ${className}`} aria-hidden>
      {still ? (
        // A plain image, not next/image: offline, the optimiser's URLs can't load, the file may be cached.
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/models/astronaut/gate-settled-8.webp" alt="" width={610} height={920} loading="lazy" decoding="async" className="s3__still s3a__still" />
      ) : null}
      <canvas className="s3__gl" />
    </div>
  );
}

/** /work, in the shaft (wide screens with motion): falling with you, below the study in front of you. */
export function ShaftAstronaut() {
  return <Figure host=".wa-stage" solve={solveShaft} load={loadFall} className="s3a--shaft" watch />;
}

/** /work, everywhere else: beside the page's title. */
export function WorkHeadAstronaut() {
  return <Figure host="main" solve={solveWorkHead} load={loadFall} className="s3a--workhead" />;
}

/** /about: at ease beside the title; the X waves at the team photo. */
export function AboutAstronaut() {
  return <Figure host="main" solve={solveAbout} load={loadEase} className="s3a--about" />;
}

/** The 404 (`fling`: it can be spun round) and the offline page: adrift, with its still for when 3D can't load. */
export function LostAstronaut({ fling = false }: { fling?: boolean }) {
  return <Figure host="main" solve={solveLost} load={fling ? loadLostFling : loadLost} className={fling ? "s3a--lost s3a--fling" : "s3a--lost"} still />;
}
