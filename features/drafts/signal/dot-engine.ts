// The dot-matrix display's maths, kept apart from React: set a line of type onto a grid of dots,
// and paint the dot sprites the display stamps every frame.
//
// Type is drawn with the real headline face onto a small canvas at 4x the dot grid, and each dot
// is lit when the glyphs cover enough of its cell. Larger sizes keep the face recognisable; small
// ones fall back to the coarse, honest look of a real matrix.

export const TAU = Math.PI * 2;

/** 0 = unlit, 1 = lit (paper white), 2 = lit in the accent red. */
export type DotMap = Uint8Array;

export type SetType = {
  words: string[];
  /** Trailing characters of the last word drawn in red (the tagline's full stop, the stats' "+"). */
  accentTail?: string;
  cols: number;
  rows: number;
  family: string;
  weight: number;
  /** Clear dots kept around the type. */
  margin: number;
  justify: "start" | "center";
  align: "start" | "center" | "end";
  /** Extra space between letters, in em: matrix type reads better a little open. */
  tracking: number;
};

const SS = 4; // supersampling: canvas pixels per dot, per axis
const COVER = 0.42; // share of a cell the glyph must cover to light it

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

/** Lays the words out as large as they fit (greedy wrapping), then lights the covered dots. */
export function setType(spec: SetType): { map: DotMap; em: number; lines: number } {
  const { cols, rows, margin } = spec;
  const map: DotMap = new Uint8Array(cols * rows);
  const canvas = document.createElement("canvas");
  canvas.width = cols * SS;
  canvas.height = rows * SS;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as Ctx | null;
  if (!ctx || cols < 4 || rows < 4) return { map, em: 0, lines: 0 };

  const availW = cols - margin * 2;
  const availH = rows - margin * 2;
  const tail = spec.accentTail ?? "";

  const apply = (em: number) => {
    ctx.font = `${spec.weight} ${em * SS}px ${spec.family}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${(em * spec.tracking * SS).toFixed(2)}px`;
  };
  const width = (s: string) => ctx.measureText(s).width / SS;

  let chosen: { em: number; lines: string[]; asc: number; lh: number; height: number } | null = null;
  for (let em = Math.min(availH, 200); em >= 5; em--) {
    apply(em);
    const lines: string[] = [];
    let line = "";
    let fits = true;
    for (const word of spec.words) {
      if (width(word) > availW) {
        fits = false;
        break;
      }
      const next = line ? `${line} ${word}` : word;
      if (width(next) <= availW) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (!fits) continue;
    if (line) lines.push(line);
    const m = ctx.measureText("Hdgy");
    const asc = m.actualBoundingBoxAscent / SS;
    const desc = m.actualBoundingBoxDescent / SS;
    const gap = Math.max(1, Math.round(em * 0.1));
    const lh = Math.ceil(asc + desc) + gap;
    // The last line needs room for its descenders only if it has any.
    const last = lines[lines.length - 1] ?? "";
    const lastDesc = /[gjpqy,]/.test(last) ? desc : desc * 0.15;
    const height = (lines.length - 1) * lh + asc + lastDesc;
    if (height <= availH) {
      chosen = { em, lines, asc, lh, height };
      break;
    }
  }
  if (!chosen) return { map, em: 0, lines: 0 };

  const { em, lines, asc, lh, height } = chosen;
  apply(em);
  const top =
    spec.align === "start" ? margin : spec.align === "end" ? margin + (availH - height) : margin + Math.round((availH - height) / 2);

  // Two passes: the type itself, then the accent alone, so each dot knows its colour.
  const pass = (accent: boolean) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.textBaseline = "alphabetic";
    lines.forEach((text, i) => {
      const isLast = i === lines.length - 1;
      const hasTail = isLast && tail && text.endsWith(tail);
      const body = hasTail ? text.slice(0, -tail.length) : text;
      const full = width(text);
      const x = spec.justify === "center" ? margin + Math.round((availW - full) / 2) : margin;
      const y = Math.round(top + i * lh + asc);
      if (!accent) ctx.fillText(body, x * SS, y * SS);
      else if (hasTail) ctx.fillText(tail, (x + width(body)) * SS, y * SS);
    });
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  };

  const stamp = (data: Uint8ClampedArray, value: 1 | 2) => {
    const need = COVER * 255 * SS * SS;
    const stride = canvas.width * 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        const x0 = c * SS;
        const y0 = r * SS;
        for (let y = 0; y < SS; y++) {
          let o = (y0 + y) * stride + x0 * 4 + 3;
          for (let x = 0; x < SS; x++, o += 4) sum += data[o];
        }
        if (sum >= need) map[r * cols + c] = value;
      }
    }
  };

  stamp(pass(false), 1);
  if (tail) stamp(pass(true), 2);
  return { map, em, lines: lines.length };
}

// ---------- Colour and size of a dot at a given level ----------

export const LEVELS = 48;
export const VMAX = 1.6;

type RGB = [number, number, number];
export type Palette = { bg: RGB; off: RGB; on: RGB; red: RGB; redHot: RGB };

const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/** A dot's radius as a share of the pitch: a lit dot swells a little, an over-driven one a little more. */
export const radiusAt = (v: number) => 0.27 + 0.11 * Math.min(1, v) + 0.07 * Math.max(0, Math.min(1, (v - 1) / (VMAX - 1)));

export function colourAt(p: Palette, family: 0 | 1, v: number): RGB {
  const lit = family === 1 ? p.red : p.on;
  const hot = family === 1 ? p.redHot : ([255, 255, 255] as RGB);
  if (v <= 1) return mix(p.off, lit, v);
  return mix(lit, hot, Math.min(1, (v - 1) / (VMAX - 1)));
}

/** level index for a value */
export const levelOf = (v: number) => Math.max(0, Math.min(LEVELS - 1, Math.round((v / VMAX) * (LEVELS - 1))));

/**
 * One row of dot sprites per family (paper, red), LEVELS wide, each `cell` device pixels square.
 * A frame is then nothing but drawImage calls, which the browser batches.
 */
export function paintSprites(p: Palette, cell: number): HTMLCanvasElement {
  const sheet = document.createElement("canvas");
  sheet.width = cell * LEVELS;
  sheet.height = cell * 2;
  const g = sheet.getContext("2d");
  if (!g) return sheet;
  for (const f of [0, 1] as const) {
    for (let k = 0; k < LEVELS; k++) {
      const v = (k / (LEVELS - 1)) * VMAX;
      const [r, gg, b] = colourAt(p, f, v);
      g.fillStyle = `rgb(${r} ${gg} ${b})`;
      g.beginPath();
      g.arc(k * cell + cell / 2, f * cell + cell / 2, cell * radiusAt(v), 0, TAU);
      g.fill();
    }
  }
  return sheet;
}

/** Small deterministic noise per dot (so the reveal sparkles the same way every time). */
export function hash(i: number): number {
  let x = (i + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export const pad = (n: number) => String(n).padStart(2, "0");
