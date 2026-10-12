// The digest of the site's content that the 3D world needs: small, serialisable, built on the
// server, so the full case-study chapters never ship to the client with the world.
import type { WorldData, WorldStudy } from "@/features/world/data";
import { FACTS } from "@/lib/site";
import { ARCHIVE } from "./archive";
import { RECOGNITION } from "./recognition";
import { SERVICES, STUDIO_PHOTOS } from "./studio";
import { TEAM } from "./team";
import type { Block, CaseStudy, Img } from "./types";
import { CASE_STUDIES, chaptersFor, getCaseStudy } from "./work";

function gallery(study: CaseStudy): Img[] {
  const seen = new Set<string>([study.poster.src]);
  const out: Img[] = [study.poster];
  const blocks: Block[] = [...study.brief, ...study.design, ...study.build, ...study.outcome];
  for (const block of blocks) {
    const images = block.kind === "figure" ? [block.image] : block.kind === "pair" ? block.images : [];
    for (const image of images) {
      // Landscape screens read best in the panel; phone shots are too tall for it.
      if (seen.has(image.src) || image.width < image.height) continue;
      seen.add(image.src);
      out.push(image);
    }
    if (out.length >= 5) break;
  }
  return out;
}

function digest(study: CaseStudy): WorldStudy {
  return {
    slug: study.slug,
    client: study.client,
    headline: study.headline,
    summary: study.summary,
    industry: study.industry,
    year: study.year,
    platform: study.platform,
    disciplines: study.disciplines,
    accent: study.theme.accent,
    onAccent: study.theme.onAccent,
    liveUrl: study.liveUrl,
    chapters: chaptersFor(study).length,
    poster: study.poster,
    gallery: gallery(study),
    metrics: study.metrics.slice(0, 3).map(({ value, label }) => ({ value, label })),
    tier: study.tier,
  };
}

export function worldData(): WorldData {
  return {
    studies: CASE_STUDIES.map(digest),
    services: SERVICES.map((s) => ({
      id: s.id,
      title: s.title,
      line: s.line,
      proof: s.proof.flatMap((slug) => {
        const study = getCaseStudy(slug);
        return study ? [{ slug, client: study.client }] : [];
      }),
    })),
    team: TEAM.map(({ name, title, group }) => ({ name, title, group })),
    studioPhotos: STUDIO_PHOTOS.filter((p) => p.width > p.height),
    recognition: RECOGNITION.map(({ title, detail }) => ({ title, detail })),
    archive: ARCHIVE.map(({ client, sector, platform, year, url, note, image }) => ({ client, sector, platform, year, url, note, image })),
    facts: { years: FACTS.years, brands: FACTS.brands, city: FACTS.city },
  };
}
