// What the server hands the world: a compact, serialisable digest of the content, so the client
// bundle never carries the full case-study chapters.
import type { Img } from "@/content/types";

export type WorldStudy = {
  slug: string;
  client: string;
  headline: string;
  summary: string;
  industry: string;
  year: number;
  platform: string;
  disciplines: string[];
  accent: string;
  onAccent: string;
  liveUrl?: string;
  chapters: number;
  poster: Img;
  gallery: Img[];
  metrics: { value: string; label: string }[];
  tier: "flagship" | "standard";
};

export type WorldService = { id: string; title: string; line: string; proof: { slug: string; client: string }[] };

export type WorldArchive = { client: string; sector: string; platform: string; year?: number; url: string; note: string; image: Img };

export type WorldData = {
  studies: WorldStudy[];
  services: WorldService[];
  team: { name: string; title: string; group: string }[];
  studioPhotos: Img[];
  recognition: { title: string; detail: string }[];
  archive: WorldArchive[];
  facts: { years: string; brands: string; city: string };
};
