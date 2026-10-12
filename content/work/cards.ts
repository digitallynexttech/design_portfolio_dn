import type { WorkCardData } from "@/components/work/work-card";
import type { CaseStudy } from "../types";
import { CASE_STUDIES, chaptersFor } from "./index";

// Studies with a 5-second muted preview loop recorded from the live site (scratch/assets).
const PREVIEWS = new Set(["skelmet", "know-your-genes", "hard2soft", "happy-ganga", "talentifix", "chetan-mangalwedhe", "realty-canvas"]);

/** Serializable card data for client components (no functions, no full chapter content, no sources). */
export function toCard(study: CaseStudy): WorkCardData {
  const metric = study.metrics[0];
  return {
    slug: study.slug,
    client: study.client,
    headline: study.headline,
    year: study.year,
    industry: study.industry,
    disciplines: study.disciplines,
    platform: study.platform,
    tier: study.tier,
    chapters: chaptersFor(study).length,
    accent: study.theme.accent,
    onAccent: study.theme.onAccent,
    poster: study.poster,
    posterPhone: study.posterPhone,
    // The study's lead number, already sourced in its content file. The source stays server-side.
    metric: metric ? { value: metric.value, label: metric.label } : undefined,
    previewVideo: study.previewVideo ?? (PREVIEWS.has(study.slug) ? `/work/${study.slug}/preview.mp4` : undefined),
  };
}

export const WORK_CARDS: WorkCardData[] = CASE_STUDIES.map(toCard);
