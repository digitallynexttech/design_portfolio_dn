import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { ChapterNav } from "@/components/case-study/chapter-nav";
import { CASE_STUDIES, chapterHref, chapterMinutes, chaptersFor, getCaseStudy } from "@/content/work";
import { ReadingWalker } from "@/features/stage3d/reading-walker/reading-walker";
import { WaterPause } from "@/features/water/water-pause";
import { clientFontVariables, fontFamily } from "@/lib/client-fonts";

// Every case-study page (overview and chapters) must be complete static output: no server work
// per view. The build fails if anything here starts reading request data or uncached work.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

/** The theme takeover: every chapter of a case study wears the client's colours and type. */
export default async function StudyLayout({ children, params }: LayoutProps<"/work/[slug]">) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  const t = study.theme;
  const style = {
    "--c-bg": t.bg,
    "--c-surface": t.surface,
    "--c-text": t.text,
    // Computed, not taken from the theme: a 70% mix of text into background always clears 4.5:1.
    "--c-muted": `color-mix(in oklab, ${t.text} 70%, ${t.bg})`,
    "--c-accent": t.accent,
    // Small accent text (numerals, kickers): the accent pulled a quarter of the way toward the text
    // colour, which keeps the hue and clears 4.5:1 on bg and surface in every theme.
    "--c-accent-ink": `color-mix(in oklab, ${t.accent} 75%, ${t.text})`,
    "--c-on-accent": t.onAccent,
    "--c-line": `color-mix(in oklab, ${t.text} 14%, transparent)`,
    "--c-display": fontFamily[t.display],
    "--c-body": fontFamily[t.body],
  } as CSSProperties;

  const chapters = chaptersFor(study);
  const items = chapters.map((chapter) => ({
    label: chapter.label,
    href: chapterHref(study, chapter),
    minutes: chapterMinutes(study, chapter),
  }));

  return (
    <div className={`study ${clientFontVariables}`} data-scheme={t.scheme} style={style}>
      {/* The site header's scrim takes the client's background while this study is open. */}
      <style>{`:root{--chrome-bg:${t.bg}}`}</style>
      <WaterPause />
      <ChapterNav client={study.client} items={items} />
      {children}
      {/* The X reads along with you, overview and chapters alike (after the page, so the chapter
          bar stays right before it: `.chapter-nav + main`). */}
      <ReadingWalker />
    </div>
  );
}
