import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterPager, Credits, Metrics, Quote } from "@/components/case-study/study-parts";
import { PageFlow } from "@/components/ui/page-flow";
import { RouteFocus } from "@/components/work/route-focus";
import { chapterHref, chapterMinutes, chaptersFor, getCaseStudy, visibleTestimonial } from "@/content/work";
import { Exhibit } from "@/features/exhibits/exhibit";
import { JsonLd } from "@/components/ui/json-ld";
import { person } from "@/content/team";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  return {
    title: `${study.client} case study`,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
  };
}

export default async function StudyOverview({ params }: PageProps<"/work/[slug]">) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();

  const chapters = chaptersFor(study);
  const second = chapters[1];
  const testimonial = visibleTestimonial(study.testimonial);

  return (
    <PageFlow>
      <main id="main" data-chapter="overview">
        <RouteFocus />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: `${study.client} case study`,
            headline: study.headline,
            description: study.summary,
            url: `${SITE_URL}/work/${study.slug}`,
            image: `${SITE_URL}${study.poster.src}`,
            dateCreated: String(study.year),
            creator: { "@type": "Organization", name: "Digitally Next Design", url: SITE_URL },
            contributor: study.credits.flatMap((c) => c.people.map((id) => ({ "@type": "Person", name: person(id).name }))),
            about: { "@type": "Organization", name: study.client, ...(study.liveUrl ? { url: study.liveUrl } : {}) },
            hasPart: chapters.map((c) => ({ "@type": "WebPage", name: `${study.client}: ${c.label}`, url: `${SITE_URL}${chapterHref(study, c)}` })),
          }}
        />
        <Exhibit study={study} />

        <div className="study-wrap pb-24">
          <header className="grid gap-10 pt-8 md:grid-cols-[1.4fr_1fr] md:pt-10">
            <div>
              <p className="label">
                {study.industry} · {study.year}
              </p>
              <h1 tabIndex={-1} className="study-h1 mt-4">
                {study.client}
                <span className="text-(--c-accent)">.</span>
              </h1>
              <p className="mt-6 max-w-[30ch] font-(family-name:--c-display) text-2xl leading-tight md:text-3xl">{study.headline}</p>
            </div>
            <div className="grid content-end gap-6">
              <p className="text-lg leading-relaxed">{study.summary}</p>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-(--c-muted)">Platform</dt>
                  <dd>{study.platform}</dd>
                </div>
                <div>
                  <dt className="text-(--c-muted)">Disciplines</dt>
                  <dd>{study.disciplines.join(", ")}</dd>
                </div>
              </dl>
              {study.liveUrl ? (
                <a
                  href={study.liveUrl}
                  target="_blank"
                  rel="noopener"
                  className="w-fit rounded-full bg-(--c-accent) px-5 py-3 text-sm font-medium text-(--c-on-accent)"
                >
                  Visit the live site <span aria-hidden>↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </div>
          </header>

          <div className="mt-20">
            <Metrics metrics={study.metrics} />
          </div>

          {testimonial ? (
            <div className="mt-24 max-w-4xl">
              <Quote testimonial={testimonial} size="md" />
            </div>
          ) : null}

          <div className="mt-24">
            <Credits study={study} />
          </div>

          <ChapterPager
            next={{ href: chapterHref(study, second), label: second.label, kicker: "Chapter 02", minutes: chapterMinutes(study, second) }}
          />
        </div>
      </main>
    </PageFlow>
  );
}
