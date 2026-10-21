import { REEL } from "@/content/reel";
import type { CaseStudy, Img } from "@/content/types";
import { chaptersFor } from "@/content/work";
import type { FieldStudy, FieldTile } from "./types";

/**
 * The field, in field units (fu). One period is 2800 × 2000: five rows of eight 350 × 400 cells, odd
 * rows shifted half a cell like brickwork, and the period repeats in both directions. Each row holds
 * one large frame (a flagship's poster, or the reel) and six singles; no study touches itself and no
 * two phones sit side by side. The arrangement was searched offline and fixed here, so it is the same
 * for every visitor: loose, but deliberate. Every frame keeps at least 60 fu from its neighbours.
 */
export const PERIOD = { w: 2800, h: 2000 } as const;

/** Where the crosshair rests on arrival: on SKELMET, the first flagship. */
export const START = { x: 510, y: 600 } as const;

// [study, src, x, y, w, h] - the frame's top-left corner and size in one period.
const PLACES: [string, string, number, number, number, number][] = [
  ["dnms", "/work/dnms/ai-connections.webp", 30, 210, 252, 158],
  ["kyg-network", "/work/kyg-network/knowourgenes-com-desktop.webp", 380, 30, 280, 176],
  ["leocym", "/work/leocym/difference-phone.webp", 790, 30, 176, 300],
  ["skelmet", "/work/skelmet/gallery-garage-night.webp", 1120, 60, 250, 250],
  ["hard2soft", "/work/hard2soft/city-page-desktop.webp", 1430, 30, 544, 340],
  ["dnms", "/work/dnms/phone-dashboard.webp", 2220, 30, 118, 256],
  ["realty-canvas", "/work/realty-canvas/home-desktop.webp", 2480, 110, 290, 120],
  ["skelmet", "/work/skelmet/hero-skull.webp", 205, 430, 610, 340],
  ["chetan-mangalwedhe", "/work/chetan-mangalwedhe/watch-phone.webp", 1015, 430, 176, 300],
  ["talentifix", "/work/talentifix/solutions-desktop.webp", 1255, 430, 280, 176],
  ["leocym", "/work/leocym/installation-hero.webp", 1605, 470, 182, 228],
  ["talentifix", "/work/talentifix/home-phone.webp", 2065, 440, 176, 300],
  ["happy-ganga", "/work/happy-ganga/home-desktop.webp", 2325, 490, 252, 158],
  ["chetan-mangalwedhe", "/work/chetan-mangalwedhe/talks-desktop.webp", 2655, 540, 280, 176],
  ["know-your-genes", "/work/know-your-genes/gen-e-blender.webp", 30, 840, 184, 300],
  ["hard2soft", "/work/hard2soft/home-desktop.webp", 380, 830, 252, 158],
  ["happy-ganga", "/work/happy-ganga/home-phone.webp", 840, 840, 176, 300],
  ["talentifix", "/work/talentifix/home-desktop.webp", 1150, 1030, 224, 140],
  ["know-your-genes", "/work/know-your-genes/hero-poster.webp", 1450, 830, 604, 340],
  ["dnms", "/work/dnms/org-chart.webp", 2160, 960, 224, 140],
  ["hard2soft", "/work/hard2soft/product-desktop.webp", 2480, 890, 280, 176],
  ["realty-canvas", "/work/realty-canvas/project-phone.webp", 205, 1260, 176, 300],
  ["dnms", "/work/dnms/poster.webp", 655, 1230, 544, 340],
  ["happy-ganga", "/work/happy-ganga/range.webp", 1295, 1390, 246, 180],
  ["hard2soft", "/work/hard2soft/symptom-check-phone.webp", 1735, 1230, 158, 270],
  ["kyg-network", "/work/kyg-network/mapmygenes-co-in-desktop.webp", 1955, 1390, 280, 176],
  ["know-your-genes", "/work/know-your-genes/life-curve-desktop.webp", 2305, 1340, 280, 176],
  ["skelmet", "/work/skelmet/colourway-lineup.webp", 2655, 1410, 280, 156],
  ["leocym", "/work/leocym/home-desktop.webp", 30, 1630, 224, 140],
  ["skelmet", "/work/skelmet/product-front.webp", 420, 1690, 206, 254],
  ["kyg-network", "/work/kyg-network/mapmygenes-co-in-phone.webp", 900, 1710, 118, 256],
  ["chetan-mangalwedhe", "/work/chetan-mangalwedhe/home-desktop.webp", 1080, 1630, 280, 176],
  ["know-your-genes", "/work/know-your-genes/meet-genee-phone.webp", 1500, 1630, 158, 270],
  ["realty-canvas", "/work/realty-canvas/project-desktop.webp", 1780, 1740, 280, 176],
  ["reel", REEL.poster, 2170, 1630, 604, 340],
];

// Each study's frames in reading order: its poster first (the frame that plays its preview loop).
const FRAMES: Record<string, string[]> = {
  skelmet: ["hero-skull", "colourway-lineup", "gallery-garage-night", "product-front"],
  "know-your-genes": ["hero-poster", "meet-genee-phone", "gen-e-blender", "life-curve-desktop"],
  hard2soft: ["city-page-desktop", "home-desktop", "symptom-check-phone", "product-desktop"],
  dnms: ["poster", "phone-dashboard", "org-chart", "ai-connections"],
  "happy-ganga": ["home-desktop", "home-phone", "range"],
  leocym: ["home-desktop", "installation-hero", "difference-phone"],
  "kyg-network": ["mapmygenes-co-in-desktop", "mapmygenes-co-in-phone", "knowourgenes-com-desktop"],
  talentifix: ["home-desktop", "home-phone", "solutions-desktop"],
  "chetan-mangalwedhe": ["home-desktop", "watch-phone", "talks-desktop"],
  "realty-canvas": ["project-desktop", "project-phone", "home-desktop"],
};

// Studies with a 5-second muted loop recorded from the live site (as content/work/cards.ts).
const PREVIEWS = new Set(["skelmet", "know-your-genes", "hard2soft", "happy-ganga", "talentifix", "chetan-mangalwedhe", "realty-canvas"]);

export const pad = (n: number) => String(n).padStart(2, "0");

/** Every image a study's content describes, so a frame's alt text is the content's own. */
function imagesOf(study: CaseStudy): Img[] {
  const out: Img[] = [study.poster];
  if (study.posterPhone) out.push(study.posterPhone);
  for (const block of [...study.brief, ...study.design, ...study.build, ...study.outcome]) {
    if (block.kind === "figure") out.push(block.image);
    else if (block.kind === "pair") out.push(...block.images);
  }
  for (const hurdle of study.hurdles) {
    if (hurdle.demo?.kind === "compare") out.push(hurdle.demo.before, hurdle.demo.after);
  }
  return out;
}

export function loopFor(slug: string): FieldStudy["loop"] {
  return PREVIEWS.has(slug) ? { src: `/work/${slug}/preview.mp4`, poster: `/work/${slug}/preview-poster.webp` } : undefined;
}

/** Serializable study data for the field's sheet: what the card and the flagship sheet show. */
export function toFieldStudy(study: CaseStudy, no: number): FieldStudy {
  const flagship = study.tier === "flagship";
  return {
    slug: study.slug,
    no: pad(no),
    client: study.client,
    headline: study.headline,
    industry: study.industry,
    platform: study.platform,
    year: study.year,
    disciplines: study.disciplines,
    tier: study.tier,
    chapters: chaptersFor(study).length,
    // Flagships show their first two numbers; a card shows its lead number (as toCard).
    metrics: study.metrics.slice(0, flagship ? 2 : 1).map(({ value, label }) => ({ value, label })),
    accent: study.theme.accent,
    bg: study.theme.bg,
    loop: loopFor(study.slug),
  };
}

/**
 * The tiles, joined with their studies on the server: alt text from the content, the frame's code
 * ("01.2" = study 01, frame 2), and where the camera's first frame puts it (so the field paints
 * in place before any script runs).
 */
export function fieldTiles(studies: CaseStudy[]): FieldTile[] {
  const bySlug = new Map(studies.map((s, i) => [s.slug, { study: s, no: i + 1 }]));
  return PLACES.flatMap(([slug, src, x, y, w, h], i): FieldTile[] => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    // Offset of the frame's centre from the start, wrapped into the period around it.
    const dx = ((((cx - START.x + PERIOD.w / 2) % PERIOD.w) + PERIOD.w) % PERIOD.w) - PERIOD.w / 2;
    const dy = ((((cy - START.y + PERIOD.h / 2) % PERIOD.h) + PERIOD.h) % PERIOD.h) - PERIOD.h / 2;
    const base = { id: `t${i}`, cx, cy, w, h, dx: Math.round(dx - w / 2), dy: Math.round(dy - h / 2) };
    // Frames near the start are on the first screen: they load at once; the rest wait.
    const near = Math.abs(dx) < 820 && Math.abs(dy) < 640;
    if (slug === "reel") {
      return [{ ...base, kind: "reel", slug: null, src, alt: "", iw: REEL.width, ih: REEL.height, code: "Reel", near }];
    }
    const hit = bySlug.get(slug);
    if (!hit) return [];
    const image = imagesOf(hit.study).find((img) => img.src === src);
    if (!image) return [];
    const name = src.slice(src.lastIndexOf("/") + 1, src.lastIndexOf("."));
    const frame = (FRAMES[slug]?.indexOf(name) ?? 0) + 1;
    return [
      {
        ...base,
        kind: "study",
        slug,
        src,
        alt: image.alt,
        iw: image.width,
        ih: image.height,
        code: `${pad(hit.no)}.${frame}`,
        loop: frame === 1 && PREVIEWS.has(slug),
        near,
      },
    ];
  });
}
