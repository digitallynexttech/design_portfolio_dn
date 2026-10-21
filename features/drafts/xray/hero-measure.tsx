"use client";

import { useEffect, useRef } from "react";
import { pad } from "./parts";

const round = (n: number) => String(Math.round(n));

/**
 * The hero's live annotations. Reads the title as it is actually set (size, leading, tracking,
 * weight, the measure of its first line and how many of the page's columns that spans), measures
 * the face's cap height and x-height from the font itself, and writes all of it into the drawing:
 * the dimension line over the first line, the metric lines beside "tomorrow." and the spec table.
 * It follows every resize and the font swap. Nothing re-renders; it writes text and custom
 * properties only.
 */
export function HeroMeasure() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>(".dx-hero");
    const h1 = hero?.querySelector<HTMLElement>(".dx-h1");
    const a = hero?.querySelector<HTMLElement>(".dx-h1__w--a");
    const b = hero?.querySelector<HTMLElement>(".dx-h1__w--b");
    const c = hero?.querySelector<HTMLElement>(".dx-h1__w--c");
    const ctx = document.createElement("canvas").getContext("2d");
    if (!hero || !h1 || !a || !b || !c || !ctx) return;
    const cells = Array.from(hero.querySelectorAll<HTMLElement>(".dx-ruler12__c"));

    const out = (key: string, value: string) => {
      for (const node of hero.querySelectorAll<HTMLElement>(`[data-o="${key}"]`)) {
        if (node.textContent !== value) node.textContent = value;
      }
    };
    const set = (key: string, px: number) => hero.style.setProperty(key, `${px.toFixed(1)}px`);

    // Each word's text, measured as glyphs (a Range), not as its box.
    const textRect = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      range.detach();
      return r;
    };

    const measure = () => {
      const hr = hero.getBoundingClientRect();
      const ra = textRect(a);
      const rb = textRect(b);
      const rc = textRect(c);
      const oneLine = Math.abs(ra.top - rb.top) < 4;
      const w1 = oneLine ? rb.right - ra.left : ra.width;
      set("--w1", w1);
      set("--x1", ra.left - hr.left);
      set("--y1", a.getBoundingClientRect().top - hr.top);

      // The page grid, read off the hero's own column ruler.
      const shown = cells.filter((cell) => cell.offsetWidth > 0);
      if (shown.length > 1) {
        const c0 = shown[0].getBoundingClientRect();
        const c1 = shown[1].getBoundingClientRect();
        const gap = c1.left - c0.right;
        const span = Math.max(1, Math.min(shown.length, Math.round((w1 + gap) / (c0.width + gap))));
        out("cols", String(shown.length));
        out("gut", round(gap));
        out("mar", round(c0.left));
        out("colw", round(c0.width));
        out("span", pad(span));
      }

      // The type, as set.
      const cs = getComputedStyle(a);
      const size = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight) || size;
      const ls = parseFloat(cs.letterSpacing) || 0;
      ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      const box = ctx.measureText("Hxg");
      const cap = ctx.measureText("H").actualBoundingBoxAscent;
      const xh = ctx.measureText("x").actualBoundingBoxAscent;
      const base = (lh - (box.fontBoundingBoxAscent + box.fontBoundingBoxDescent)) / 2 + box.fontBoundingBoxAscent;

      // The metric lines run from the end of "tomorrow." to the margin.
      const cTop = c.getBoundingClientRect().top - hr.top;
      set("--mx", rc.right - hr.left);
      set("--m-base", cTop + base);
      set("--m-cap", cTop + base - cap);
      set("--m-x", cTop + base - xh);

      out("w1", round(w1));
      out("size", round(size));
      out("lh", round(lh));
      out("lead", (lh / size).toFixed(2));
      out("ls", ls.toFixed(1));
      out("wt", cs.fontWeight);
      out("cap", round(cap));
      out("xh", round(xh));
      out("vw", `${window.innerWidth} × ${window.innerHeight}`);
      hero.dataset.ready = "";
    };

    let raf = 0;
    const kick = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          measure();
        });
    };
    const ro = new ResizeObserver(kick);
    ro.observe(h1);
    ro.observe(hero);
    window.addEventListener("resize", kick);
    void document.fonts.ready.then(kick);
    kick();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", kick);
    };
  }, []);

  return <span ref={ref} hidden />;
}
