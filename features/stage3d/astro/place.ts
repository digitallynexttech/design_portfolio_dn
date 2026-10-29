// Where the astronaut can float on a page without covering a word (features/stage3d/astro): the free
// rectangles beside or below a head's own line boxes, measured from the page as laid out. No three.js
// here: the pages run this before any 3D loads, and hide the figure where there is no room.

/** A rectangle in the host's own coordinates (px from its top left). */
export type Box = { l: number; t: number; r: number; b: number };

const CONTROLS = "a, button, input, img, svg, picture, video, canvas, [data-s3-block]";

/**
 * What a block of content covers: the rectangle of every line of its text, and of every control or
 * picture in it (not its block boxes, which run the full width whether or not anything is in them).
 */
export function occupied(host: Element, roots: (Element | null | undefined)[], skip?: Element | null): Box[] {
  const origin = host.getBoundingClientRect();
  const out: Box[] = [];
  const add = (r: DOMRect) => {
    if (r.width > 0 && r.height > 0) out.push({ l: r.left - origin.left, t: r.top - origin.top, r: r.right - origin.left, b: r.bottom - origin.top });
  };
  const range = document.createRange();
  for (const root of roots) {
    if (!root) continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => (skip && skip.contains(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n: Node | null = walker.currentNode; n; n = walker.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) add(r);
      } else if ((n as Element).matches?.(CONTROLS)) {
        // (an invisible one, e.g. a hidden mode's, covers nothing)
        if ((n as HTMLElement).offsetParent !== null || n === root) add((n as Element).getBoundingClientRect());
      }
    }
  }
  return out;
}

export type Fit = {
  /** The figure's width for its height (a tumbling one needs a square). */
  aspect: number;
  /** Clear space kept round every line (px). */
  gap: number;
  /** Smaller than this (px tall), it doesn't come at all. */
  min: number;
  /** The tallest it is ever drawn (px). */
  max?: number;
  /** How much wider than the figure the canvas may be (room to drift and turn). */
  room: number;
  /** Where it sits in the free space across: by the text, or in the middle of it. */
  align: "start" | "center";
  /** How much a place under all the text counts against one beside it (1: the same; less: beside wins). */
  below?: number;
};

/**
 * The best place for the figure in `area`, clear of every `block`: the free rectangles to the right
 * of the lines (or under all of them), tried from each line's bottom to each line's top; the one
 * that takes the tallest figure wins. Returns the canvas's box, or null when nothing fits.
 */
export function bestBox(area: Box, blocks: Box[], fit: Fit): Box | null {
  const { gap, aspect } = fit;
  const inside = blocks.filter((k) => k.b > area.t && k.t < area.b && k.r > area.l && k.l < area.r);
  const tops = [area.t, ...inside.map((k) => k.b + gap)].filter((y) => y >= area.t && y < area.b);
  const bottoms = [area.b, ...inside.map((k) => k.t - gap)].filter((y) => y > area.t && y <= area.b);
  let best: { s: number; score: number; box: Box } | null = null;
  for (const t of tops) {
    for (const b of bottoms) {
      if (b - t < fit.min) continue;
      let l = area.l;
      for (const k of inside) if (k.b > t && k.t < b) l = Math.max(l, k.r + gap);
      const w = area.r - l;
      if (w <= 0) continue;
      const s = Math.min(b - t, w / aspect, fit.max ?? Infinity);
      // (a place with nothing beside it is under everything)
      const score = l === area.l ? s * (fit.below ?? 1) : s;
      if (!best || score > best.score + 0.5) best = { s, score, box: { l, t, r: area.r, b } };
    }
  }
  if (!best || best.s < fit.min) return null;
  const { s, box } = best;
  const w = Math.min(box.r - box.l, s * aspect * fit.room);
  const l = fit.align === "start" ? box.l : box.l + (box.r - box.l - w) / 2;
  const t = box.t + (box.b - box.t - s) / 2;
  return { l, t, r: l + w, b: t + s };
}

/** A box relative to the host, from an element's rectangle. */
export function boxOf(host: Element, el: Element | null | undefined): Box | null {
  if (!el) return null;
  const o = host.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { l: r.left - o.left, t: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top };
}
