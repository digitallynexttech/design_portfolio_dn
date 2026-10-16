import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { ClientWall } from "@/components/proof/client-wall";
import { Recognition } from "@/components/proof/recognition";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { WorkRows } from "@/components/work/work-rows";
import { TEAM, creditsFor } from "@/content/team";
import { SERVICES, STUDIO_PHOTOS } from "@/content/studio";
import type { Testimonial } from "@/content/types";
import { CASE_STUDIES, getCaseStudy, visibleTestimonial } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { FormsStage } from "@/features/home/forms-stage";
import { Hero } from "@/features/home/hero";
import { SelectedWork } from "@/features/home/selected-work";
import { ServiceReel } from "@/features/home/service-reel";
import { FACTS } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// One rhythm for every home section, from the design-system scales in globals.css.
const SECTION = "relative px-(--gutter) py-section";
// One heading size for (03)–(06); (01) is the statement and (02) the showpiece, so they run larger.
const HEADING = "mt-4 font-display text-d2 font-semibold";
// Heading → content.
const CONTENT = "mt-stack";

const label = (n: number) => `(${String(n).padStart(2, "0")})`;
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/** "Founder, Happy Ganga" when the name only restates the company; otherwise "Name, Role". */
function attribution(t: Testimonial) {
  return t.name.includes(t.company) ? `${t.role}, ${t.company}` : `${t.name}, ${t.role}`;
}

export default function Home() {
  // The making-of is told on its own page and in the world; home keeps to client work.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // (05) never repeats a voice: skip companies already quoted in the flagship rows, our own
  // self-quote, and a second quote from the same company. Unapproved quotes exist only in development.
  const heard = new Set(flagships.flatMap((s) => visibleTestimonial(s.testimonial)?.company ?? []));
  heard.add("Digitally Next");
  const voices = standard.flatMap((study) => {
    const t = visibleTestimonial(study.testimonial);
    if (!t || heard.has(t.company)) return [];
    heard.add(t.company);
    return [{ study, t }];
  });

  const makers = TEAM.filter((p) => p.group !== "Studio").map((p) => ({
    ...p,
    shipped: creditsFor(p.id)
      .filter((s) => s.slug !== "making-of")
      .map((s) => s.client),
  }));

  // Section numbers come from what renders, so the labels never skip. (02) is Selected work.
  let n = 2;
  const moreN = standard.length ? ++n : 0;
  const servicesN = ++n;
  const voicesN = voices.length ? ++n : 0;
  const peopleN = ++n;

  return (
    <PageFlow>
      <main id="main">
        <FormsStage />

        <Hero />

        {/* (01) Positioning: waits under the hero, which slides off it like a sheet */}
        <div className="hero-underlay">
          <section aria-labelledby="studio-title" className={SECTION}>
            <div className="grid gap-14 md:gap-20 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-end xl:gap-24">
              <div>
                <p className="label">(01) The studio</p>
                <h2
                  id="studio-title"
                  className="reveal mt-4 max-w-[22ch] font-display text-statement font-semibold"
                >
                  We are the designers, developers and motion artists inside Digitally Next<span className="stop">.</span>
                </h2>
                <p className="reveal mt-6 max-w-[34ch] text-xl leading-snug text-balance text-paper/75 md:mt-8 md:text-3xl">
                  Every client is a different container. We take its shape.
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-4 md:gap-6 xl:grid-cols-1 xl:gap-8">
                {[
                  { value: FACTS.years, label: "years in digital" },
                  { value: FACTS.brands, label: "brands served" },
                  { value: String(clientStudies.length), label: "case studies, told in full" },
                ].map((stat, i) => (
                  <div key={stat.label} className="reveal stagger flex flex-col-reverse justify-end border-t border-paper/15 pt-5" style={stagger(i)}>
                    <dt className="mt-2 text-sm text-(--text-3) md:text-base">{stat.label}</dt>
                    <dd className="font-display text-5xl font-semibold tracking-tight md:text-7xl">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-20 md:mt-28">
              <ClientWall label="Trusted by" />
              <div className="mt-8 border-t border-paper/10 pt-8 md:mt-10">
                <Recognition variant="compact" />
              </div>
            </div>
          </section>
        </div>

        {/* (02) Selected work: the water pours into each flagship's shape */}
        <SelectedWork flagships={flagships} />

        {/* (03) More work: rows; with a mouse, each project's screen follows the pointer */}
        {moreN ? (
          <section aria-labelledby="more-title" className={SECTION}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label">{label(moreN)} More work</p>
                <h2 id="more-title" className={`reveal ${HEADING}`}>
                  Different containers<span className="stop">.</span>
                </h2>
              </div>
              <FlowLink href="/work" className="btn max-md:hidden">
                All work <span aria-hidden>→</span>
              </FlowLink>
            </div>
            <div className={CONTENT}>
              <WorkRows studies={standard.map(toCard)} start={flagships.length + 1} />
            </div>
            <FlowLink
              href="/work"
              className="btn btn--lg mt-8 w-full md:hidden"
            >
              All work <span aria-hidden>→</span>
            </FlowLink>
          </section>
        ) : null}

        {/* (04) Services: a ribbon of pictures that bends like water as it moves */}
        <section aria-labelledby="services-title" className={SECTION}>
          <p className="label">{label(servicesN)} How we adapt</p>
          <h2 id="services-title" className={`reveal max-w-[18ch] text-balance ${HEADING}`}>
            Six kinds of work, one studio<span className="stop">.</span>
          </h2>
          {/* Full width, so the ribbon runs edge to edge; the first card lines up with the gutter. */}
          <div className={`${CONTENT} -mx-(--gutter)`}>
            <ServiceReel
              services={SERVICES.map((service) => ({
                id: service.id,
                title: service.title,
                line: service.line,
                proof: service.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
                image: `/services/${service.id}.webp`,
              }))}
            />
          </div>
        </section>

        {/* (05) Client voices. Rendered only when there is a quote to show (none until approved in production). */}
        {voicesN ? (
          <section aria-labelledby="voices-title" className={SECTION}>
            <p className="label">{label(voicesN)} Clients</p>
            <h2 id="voices-title" className={`reveal ${HEADING}`}>
              In their words<span className="stop">.</span>
            </h2>
            {/* Phones swipe through the voices like the work above; wider screens read them as a grid. */}
            <ul
              className={`${CONTENT} -mx-(--gutter) flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-(--gutter) scroll-px-(--gutter) [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-14 md:overflow-visible md:px-0`}
            >
              {voices.map(({ study, t }, i) => (
                <li
                  key={study.slug}
                  className="reveal stagger flex w-[85vw] max-w-96 shrink-0 snap-start flex-col items-start border-t border-paper/15 pt-8 md:w-auto md:max-w-none"
                  style={stagger(i % 2)}
                >
                  {t.approved ? null : (
                    <p className="mb-4 rounded-full border border-dashed border-paper/30 px-3 py-1 font-mono text-[0.65rem] tracking-widest text-(--text-3) uppercase">
                      Draft · awaiting approval
                    </p>
                  )}
                  <figure className="mb-4">
                    <blockquote className="font-display text-xl leading-snug tracking-tight md:text-2xl lg:text-3xl">
                      <span className="text-paper/40">“</span>
                      {t.quote}
                      <span className="text-paper/40">”</span>
                    </blockquote>
                    <figcaption className="mt-5 text-(--text-3)">{attribution(t)}</figcaption>
                  </figure>
                  <FlowLink
                    href={`/work/${study.slug}`}
                    direction="deeper"
                    className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-medium text-paper/85 underline decoration-paper/30 underline-offset-4 transition-colors hover:text-teal hover:decoration-teal"
                  >
                    Read the {study.client} story <span aria-hidden>→</span>
                  </FlowLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* (06) The people who made it, and what each of them shipped */}
        <section aria-labelledby="people-title" className={SECTION}>
          <p className="label">{label(peopleN)} The people</p>
          <h2 id="people-title" className={`reveal ${HEADING}`}>
            Who poured it<span className="stop">.</span>
          </h2>
          <div className={`${CONTENT} grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-16`}>
            <div className="reveal-fill relative aspect-[16/10] overflow-hidden rounded-3xl">
              {/* The water rises through the frame while the picture inside it holds still. */}
              <div className="reveal-fill__water absolute inset-0 overflow-hidden">
                <div className="reveal-fill__still absolute inset-0">
                  <Image src={STUDIO_PHOTOS[0].src} alt={STUDIO_PHOTOS[0].alt} fill sizes="(min-width: 1024px) 56vw, 100vw" className="object-cover" />
                </div>
              </div>
            </div>
            <div>
              <ul className="border-t border-paper/10">
                {makers.map((p) => (
                  <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-paper/10 py-4 md:gap-x-6">
                    <p className="text-lg font-semibold tracking-tight md:text-xl">{p.name}</p>
                    <p className="text-right text-sm text-(--text-3)">{p.title}</p>
                    {p.shipped.length ? (
                      <p className="col-span-2 text-sm text-(--text-3)">
                        <span className="sr-only">Shipped: </span>
                        {p.shipped.join(" · ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <FlowLink href="/about" className="btn mt-8">
                Meet the studio <span aria-hidden>→</span>
              </FlowLink>
            </div>
          </div>
        </section>
      </main>
    </PageFlow>
  );
}
