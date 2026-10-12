import type { MetadataRoute } from "next";
import { CASE_STUDIES, chapterHref, chaptersFor } from "@/content/work";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/work", "/services", "/about", "/reel"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const chapters = CASE_STUDIES.flatMap((study) =>
    chaptersFor(study).map((chapter) => ({
      url: `${SITE_URL}${chapterHref(study, chapter)}`,
      changeFrequency: "yearly" as const,
      priority: chapter.segment ? 0.6 : 0.9,
    })),
  );
  return [...pages, ...chapters];
}
