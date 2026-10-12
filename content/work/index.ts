import type { Block, CaseStudy, ChapterKey, Hurdle, Testimonial } from "../types";
import chetan from "./chetan-mangalwedhe";
import dnms from "./dnms";
import happyGanga from "./happy-ganga";
import hard2soft from "./hard2soft";
import knowYourGenes from "./know-your-genes";
import kygNetwork from "./kyg-network";
import leocym from "./leocym";
import makingOf from "./making-of";
import realtyCanvas from "./realty-canvas";
import skelmet from "./skelmet";
import talentifix from "./talentifix";

// Every published case study. Content agents add their files; register them here in any order.
const ALL: CaseStudy[] = [skelmet, knowYourGenes, kygNetwork, hard2soft, happyGanga, leocym, talentifix, chetan, dnms, realtyCanvas, makingOf];

export const CASE_STUDIES: CaseStudy[] = [...ALL].sort((a, b) => a.order - b.order);

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}

export type Chapter = {
  key: ChapterKey;
  label: string;
  /** Path segment after /work/<slug>; empty for the overview. */
  segment: string;
};

const HURDLE_SPLIT = 5;

export function hurdlePages(study: CaseStudy): { hurdles: Hurdle[]; systems: Hurdle[] } {
  if (study.hurdles.length <= HURDLE_SPLIT) return { hurdles: study.hurdles, systems: [] };
  return {
    hurdles: study.hurdles.filter((h) => h.group === "experience"),
    systems: study.hurdles.filter((h) => h.group === "engineering"),
  };
}

export function chaptersFor(study: CaseStudy): Chapter[] {
  const split = hurdlePages(study);
  const splitting = split.systems.length > 0 && split.hurdles.length > 0;
  const hurdles: Chapter[] = splitting
    ? [
        { key: "hurdles", label: "Hurdles: on screen", segment: "hurdles" },
        { key: "systems", label: "Hurdles: under the hood", segment: "systems" },
      ]
    : [{ key: "hurdles", label: "Hurdles & fixes", segment: "hurdles" }];

  const middle: Chapter[] =
    study.tier === "flagship"
      ? [
          { key: "brief", label: "Brief", segment: "brief" },
          { key: "design", label: "Design", segment: "design" },
          { key: "build", label: "Build", segment: "build" },
        ]
      : [{ key: "approach", label: "Approach", segment: "approach" }];

  return [
    { key: "overview", label: "Overview", segment: "" },
    ...middle,
    ...hurdles,
    { key: "outcome", label: "Outcome", segment: "outcome" },
  ];
}

export function chapterHref(study: CaseStudy, chapter: Chapter): string {
  return chapter.segment ? `/work/${study.slug}/${chapter.segment}` : `/work/${study.slug}`;
}

// ---------- Reading time (wayfinding) ----------

const WORDS_PER_MINUTE = 220;

const countWords = (...texts: (string | undefined)[]) =>
  texts.reduce((sum, text) => sum + (text ? text.split(/\s+/).filter(Boolean).length : 0), 0);

function blockWords(block: Block): number {
  switch (block.kind) {
    case "prose":
      return countWords(block.heading, ...block.paragraphs);
    case "figure":
      return countWords(block.caption);
    case "pair":
      return countWords(block.caption);
    case "palette":
      return countWords(block.heading, ...block.colors.flatMap((c) => [c.name, c.note]));
    case "typeface":
      return countWords(block.sample, ...block.families.flatMap((f) => [f.name, f.role]));
    case "facts":
      return countWords(block.heading, ...block.items.flatMap((i) => [i.label, i.value]));
    case "list":
    case "stack":
      return countWords(block.heading, ...block.items);
    case "timeline":
      return countWords(block.heading, ...block.items.flatMap((i) => [i.date, i.label]));
    case "architecture":
      return countWords(block.heading, block.caption, ...block.nodes.flatMap((n) => [n.label, n.note]), ...block.links.map((l) => l.label));
  }
}

const hurdleWords = (h: Hurdle) => countWords(h.title, h.hard, h.tried, h.fix, h.result);
const blocksWords = (blocks: Block[]) => blocks.reduce((sum, block) => sum + blockWords(block), 0);

/** Minutes to read a chapter at 220 words a minute, never less than one. */
export function chapterMinutes(study: CaseStudy, chapter: Chapter): number {
  const pages = hurdlePages(study);
  const testimonial = visibleTestimonial(study.testimonial);
  let words = 0;
  switch (chapter.key) {
    case "overview":
      words = countWords(study.headline, study.summary, ...study.metrics.flatMap((m) => [m.value, m.label]), testimonial?.quote);
      break;
    case "brief":
      words = blocksWords(study.brief);
      break;
    case "design":
      words = blocksWords(study.design);
      break;
    case "build":
      words = blocksWords(study.build);
      break;
    case "approach":
      words = blocksWords(study.brief) + blocksWords(study.design) + blocksWords(study.build);
      break;
    case "hurdles":
      words = pages.hurdles.reduce((sum, h) => sum + hurdleWords(h), 0);
      break;
    case "systems":
      words = pages.systems.reduce((sum, h) => sum + hurdleWords(h), 0);
      break;
    case "outcome":
      words = blocksWords(study.outcome) + countWords(testimonial?.quote);
      break;
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Unapproved testimonials are visible in development and draft previews only. */
export function visibleTestimonial(testimonial?: Testimonial): Testimonial | undefined {
  if (!testimonial) return undefined;
  if (testimonial.approved) return testimonial;
  const drafts = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1";
  return drafts ? testimonial : undefined;
}
