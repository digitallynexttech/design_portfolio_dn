"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useThree3D } from "../use-three";
import { walkers, type WalkState } from "./state";
import "./reading-walker.css";

const load = () => import("./walker.scene").then((m) => m.mount);

/** The read is done (the X at the end of the rail) this share of a screen before its end comes into view. */
const EARLY = 0.15;
/** How fast the X catches up with where the read has got to (per second), and how close is there. */
const CATCH = 6;
const NEAR = 0.15;

/**
 * Every case-study page, overview and chapters (Karan, 29 Oct 2026: 3D on the pages that had none):
 * the X reads along with you. A hairline rail low on the screen fills as the page is read, and the
 * 3D X (walker.scene.ts) walks along it to where the read has got to, turning round when you scroll
 * back, and waves when the next chapter or project is next. The band rises once the overview's
 * exhibit has gone by, and steps down out of the way as the page's end (the pager, or the next
 * project's poster: [data-reading-end]) comes up, so it never sits on the exhibit, the hand-off or the
 * footer; a fade under it keeps the lines that pass beneath it from reading through the X. Reduced
 * motion: the X stands where the read has got to, and doesn't walk. No WebGL: the rail alone.
 */
export function ReadingWalker() {
  const band = useRef<HTMLDivElement>(null);
  const walker = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useThree3D(walker, load, "0px");

  useEffect(() => {
    const b = band.current;
    const w = walker.current;
    const fill = b?.querySelector<HTMLElement>(".xw__fill");
    const rail = b?.querySelector<HTMLElement>(".xw__rail");
    if (!b || !w || !fill || !rail) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state: WalkState = { v: 0, dir: 1, end: false, h: 0 };
    walkers.set(w, state);
    let x = Number.NaN;
    let target = 0;
    let room = 0;
    let raf = 0;
    let then = 0;

    // Where the read has got to (0…1), and whether the band shows: past the exhibit, short of the end.
    const read = () => {
      const vh = window.innerHeight;
      const exhibit = document.querySelector<HTMLElement>("main .exhibit");
      const end = document.querySelector<HTMLElement>("main [data-reading-end]");
      const y = window.scrollY;
      // (on an overview the read starts once its exhibit is half gone: the X never competes with it)
      const start = exhibit ? Math.max(0, exhibit.getBoundingClientRect().bottom + y - vh * 0.5) : 0;
      const endTop = end ? end.getBoundingClientRect().top + y : document.documentElement.scrollHeight;
      const finish = endTop - vh * (1 + EARLY);
      const p = finish > start ? Math.min(1, Math.max(0, (y - start) / (finish - start))) : 1;
      const on = y >= start && endTop - y > vh - 4;
      return { p, on };
    };

    const measure = () => {
      room = Math.max(0, rail.offsetWidth - w.offsetWidth);
      state.h = w.offsetHeight / 1.18;
    };

    const place = (px: number) => {
      w.style.transform = `translate3d(${px.toFixed(1)}px, 0, 0)`;
    };

    // The X going to where the read has got to: eased, so a scroll reads as a walk, not a jump.
    const tick = (now: number) => {
      raf = 0;
      const dt = then ? Math.min(0.1, (now - then) / 1000) : 1 / 60;
      then = now;
      const before = x;
      x += (target - x) * (1 - Math.exp(-dt * CATCH));
      if (Math.abs(target - x) < NEAR) x = target;
      state.v = (x - before) / dt;
      if (Math.abs(state.v) > 1) state.dir = state.v > 0 ? 1 : -1;
      place(x);
      if (x !== target) raf = requestAnimationFrame(tick);
      else {
        state.v = 0;
        then = 0;
      }
    };

    const update = (snap = false) => {
      const { p, on } = read();
      b.toggleAttribute("data-on", on);
      fill.style.transform = `scaleX(${p.toFixed(4)})`;
      target = p * room;
      state.end = p >= 0.999;
      if (snap || reduced || Number.isNaN(x)) {
        x = target;
        state.v = 0;
        place(x);
        return;
      }
      if (!raf && x !== target) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => update();
    const onResize = () => {
      measure();
      update(true);
    };
    measure();
    update(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // (the page grows as its images and exhibit come in: the read's length changes with it)
    const ro = new ResizeObserver(() => update());
    const main = document.getElementById("main");
    if (main) ro.observe(main);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(raf);
      walkers.delete(w);
      b.removeAttribute("data-on");
    };
    // a new page (another chapter): read it from the start, the X put straight at its place
  }, [pathname]);

  return (
    <div ref={band} className="xw" aria-hidden>
      <span className="xw__rail">
        <span className="xw__fill" />
      </span>
      <div ref={walker} className="s3 xw__walker">
        <canvas className="s3__gl" />
      </div>
    </div>
  );
}
