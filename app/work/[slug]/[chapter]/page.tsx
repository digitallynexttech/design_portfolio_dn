import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/case-study/blocks";
import { HurdleCard } from "@/components/case-study/hurdle-card";
import { ChapterHeader, ChapterPager, Credits, NextStudyTeaser, Quote } from "@/components/case-study/study-parts";
import { PageFlow } from "@/components/ui/page-flow";
import { RouteFocus } from "@/components/work/route-focus";
import {
  CASE_STUDIES,
  chapterHref,
  chapterMinutes,
  chaptersFor,
  getCaseStudy,
  hurdlePages,
  visibleTestimonial,
} from "@/content/work";
import type { Block, CaseStudy, ChapterKey, Hurdle } from "@/content/types";

export function generateStaticParams() {
  return CASE_STUDIES.flatMap((study) =>
    chaptersFor(study)
      .filter((chapter) => chapter.segment)
      .map((chapter) => ({ slug: study.slug, chapter: chapter.segment })),
  );
}

function resolve(slug: string, segment: string) {
  const study = getCaseStudy(slug);
  if (!study) return null;
  const chapters = chaptersFor(study);
  const index = chapters.findIndex((chapter) => chapter.segment === segment);
  if (index < 1) return null;
  return { study, chapters, index, chapter: chapters[index] };
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]/[chapter]">): Promise<Metadata> {
  const { slug, chapter } = await params;
  const found = resolve(slug, chapter);
  if (!found) return {};
  return {
    title: `${found.study.client}: ${found.chapter.label}`,
    description: found.study.summary,
    alternates: { canonical: chapterHref(found.study, found.chapter) },
  };
}

// ---------- Chapter intros, computed from what the chapter actually holds ----------

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const spell = (n: number) => NUMBER_WORDS[n] ?? String(n);
const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const join = (parts: string[]) => (parts.length < 2 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`);

function tally(blocks: Block[]) {
  let colours = 0;
  let typefaces = 0;
  let images = 0;
  let tools = 0;
  let parts = 0;
  for (const block of blocks) {
    if (block.kind === "palette") colours += block.colors.length;
    else if (block.kind === "typeface") typefaces += block.families.length;
    else if (block.kind === "figure") images += 1;
    else if (block.kind === "pair") images += 2;
    else if (block.kind === "stack") tools += block.items.length;
    else if (block.kind === "architecture") parts += block.nodes.length;
  }
  return { colours, typefaces, images, tools, parts };
}

function facts(blocks: Block[], keys: ("colours" | "typefaces" | "images" | "tools" | "parts")[]): string {
  const t = tally(blocks);
  const words = { colours: "colour", typefaces: "typeface", images: "image", tools: "tool", parts: "connected part" } as const;
  return join(keys.filter((k) => t[k] > 0).map((k) => count(t[k], words[k])));
}

function hurdleIntro(list: Hurdle[], where = "") {
  const demos = list.filter((h) => h.demo).length;
  const lead = `${spell(list.length)} ${list.length === 1 ? "hurdle" : "hurdles"}${where}, each with the fix and who solved it.`;
  if (!demos) return lead;
  return `${lead} ${spell(demos)} you can see for yourself.`;
}

function introFor(study: CaseStudy, key: ChapterKey): string | undefined {
  const pages = hurdlePages(study);
  switch (key) {
    case "brief":
      return `Who ${study.client} is, what they needed, and what success had to look like.`;
    case "approach": {
      const f = facts([...study.brief, ...study.design, ...study.build], ["colours", "typefaces", "tools", "images"]);
      return `The brief, the design and the build behind ${study.client}${f ? `: ${f}` : ""}.`;
    }
    case "design": {
      const f = facts(study.design, ["colours", "typefaces", "images"]);
      return f ? `${f.charAt(0).toUpperCase()}${f.slice(1)}, shown as they ship.` : "The identity, shown as it ships.";
    }
    case "build": {
      const f = facts(study.build, ["tools", "parts", "images"]);
      return `What runs underneath, in plain language${f ? `: ${f}` : ""}.`;
    }
    case "hurdles":
      return hurdleIntro(pages.hurdles);
    case "systems":
      return hurdleIntro(pages.systems, " below the surface");
    case "outcome": {
      const next = getCaseStudy(study.next);
      return `Where it landed and who built it${next ? `, then on to ${next.client}` : ""}.`;
    }
    default:
      return undefined;
  }
}

export default async function StudyChapter({ params }: PageProps<"/work/[slug]/[chapter]">) {
  const { slug, chapter: segment } = await params;
  const found = resolve(slug, segment);
  if (!found) notFound();
  const { study, chapters, index, chapter } = found;

  const prev = chapters[index - 1];
  const nextChapter = chapters[index + 1];
  const nextStudy = getCaseStudy(study.next);
  const pages = hurdlePages(study);
  const testimonial = visibleTestimonial(study.testimonial);

  const next = nextChapter
    ? {
        href: chapterHref(study, nextChapter),
        label: nextChapter.label,
        kicker: `Chapter ${String(index + 2).padStart(2, "0")}`,
        minutes: chapterMinutes(study, nextChapter),
      }
    : { href: `/work/${study.next}`, label: nextStudy?.client ?? "Next project", kicker: "Next project" };

  let body: React.ReactNode;
  switch (chapter.key) {
    case "brief":
      body = <Blocks blocks={study.brief} />;
      break;
    case "design":
      body = <Blocks blocks={study.design} />;
      break;
    case "build":
      body = <Blocks blocks={study.build} />;
      break;
    case "approach":
      body = (
        <>
          <h2 className="study-h2 mt-10">Brief</h2>
          <Blocks blocks={study.brief} level={3} />
          <h2 className="study-h2 mt-24">Design</h2>
          <Blocks blocks={study.design} level={3} />
          <h2 className="study-h2 mt-24">Build</h2>
          <Blocks blocks={study.build} level={3} />
        </>
      );
      break;
    case "hurdles":
    case "systems": {
      const list = chapter.key === "systems" ? pages.systems : pages.hurdles;
      const offset = chapter.key === "systems" ? pages.hurdles.length : 0;
      body = (
        <>
          <nav aria-label="Hurdles in this chapter" className="mb-6 flex flex-wrap gap-2">
            {list.map((hurdle, i) => (
              <a key={hurdle.id} href={`#${hurdle.id}`} className="rounded-full border border-(--c-line) px-3 py-1.5 text-sm hover:border-(--c-accent)">
                <span className="font-mono text-xs text-(--c-accent-ink)">{String(offset + i + 1).padStart(2, "0")}</span> {hurdle.title}
              </a>
            ))}
          </nav>
          {list.map((hurdle, i) => (
            <HurdleCard key={hurdle.id} hurdle={hurdle} index={offset + i} />
          ))}
        </>
      );
      break;
    }
    case "outcome":
      body = (
        <>
          <Blocks blocks={study.outcome} />
          {testimonial ? (
            <div className="my-24 max-w-5xl">
              <Quote testimonial={testimonial} />
            </div>
          ) : null}
          <Credits study={study} />
          {nextStudy ? <NextStudyTeaser study={nextStudy} /> : null}
        </>
      );
      break;
    default:
      notFound();
  }

  return (
    <PageFlow>
      <main id="main" data-chapter={chapter.key} className="study-wrap pb-24">
        <RouteFocus />
        <ChapterHeader
          index={index}
          total={chapters.length}
          title={chapter.label}
          intro={introFor(study, chapter.key)}
          minutes={chapterMinutes(study, chapter)}
        />
        {body}
        <ChapterPager prev={{ href: chapterHref(study, prev), label: prev.label, kicker: "Previous" }} next={next} />
      </main>
    </PageFlow>
  );
}
