import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ClientWall } from "@/components/proof/client-wall";
import { Recognition } from "@/components/proof/recognition";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { WorkRows } from "@/components/work/work-rows";
import { SERVICES } from "@/content/studio";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { FormsStage } from "@/features/home/forms-stage";
import { Hero } from "@/features/home/hero";
import { SelectedWork } from "@/features/home/selected-work";
import { ServiceReel } from "@/features/home/service-reel";
import { Showreel } from "@/features/home/showreel";
import { FACTS } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// One rhythm for every home section, from the design-system scales in globals.css.
const SECTION = "relative px-(--gutter) py-section";
// One heading size for (02)–(04); (01) is the showpiece, so it runs larger.
const HEADING = "mt-4 font-display text-d2 font-semibold";
// Heading → content.
const CONTENT = "mt-stack";

const label = (n: number) => `(${String(n).padStart(2, "0")})`;
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Home, in the order agreed on 19 Oct 2026: hero (tagline, the X) · the showreel, scroll to enlarge ·
 * the 4 flagships · the rest of the work · clients and awards · studio and services · contact and
 * footer (the site footer).
 * The team, client quotes and studio photo live on /about and in each case study, not here.
 */
export default function Home() {
  // The making-of is told on its own page and in the world; home keeps to client work.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Section numbers come from what renders, so the labels never skip. (01) is Selected work.
  let n = 1;
  const moreN = standard.length ? ++n : 0;
  const clientsN = ++n;
  const studioN = ++n;

  return (
    <PageFlow>
      <main id="main">
        <FormsStage />

        <Hero />

        {/* The showreel: a small card that grows to the whole screen as you scroll */}
        <Showreel />

        {/* (01) Selected work: the water pours into each flagship's shape */}
        <SelectedWork flagships={flagships} />

        {/* (02) More work: rows; with a mouse, each project's screen follows the pointer */}
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

        {/* (03) Clients and awards: the logos on a slow current, then the recognition row */}
        <section aria-labelledby="clients-title" className={SECTION}>
          <p className="label">{label(clientsN)} Clients and awards</p>
          <h2 id="clients-title" className={`reveal ${HEADING}`}>
            Who we&apos;ve built for<span className="stop">.</span>
          </h2>
          <div className={CONTENT}>
            <ClientWall />
            <div className="mt-8 border-t border-paper/10 pt-8 md:mt-10">
              <Recognition variant="compact" />
            </div>
          </div>
        </section>

        {/* (04) Studio and services: who we are in a line and three numbers, then a ribbon of
            pictures that bends like water as it moves */}
        <section aria-labelledby="studio-title" className={SECTION}>
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-24">
            <div>
              <p className="label">{label(studioN)} Studio and services</p>
              <h2 id="studio-title" className={`reveal max-w-[18ch] text-balance ${HEADING}`}>
                One studio, six kinds of work<span className="stop">.</span>
              </h2>
              <p className="reveal mt-6 max-w-[34ch] text-xl leading-snug text-balance text-paper/75 md:text-2xl">
                The designers, developers and motion artists inside Digitally Next.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-4 md:gap-8">
              {[
                { value: FACTS.years, label: "years in digital" },
                { value: FACTS.brands, label: "brands served" },
                { value: String(clientStudies.length), label: "case studies" },
              ].map((stat, i) => (
                <div key={stat.label} className="reveal stagger flex flex-col-reverse justify-end border-t border-paper/15 pt-5" style={stagger(i)}>
                  <dt className="mt-2 text-sm text-(--text-3) md:text-base">{stat.label}</dt>
                  <dd className="font-display text-4xl font-semibold tracking-tight md:text-6xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
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
          <div className="mt-10 flex flex-wrap gap-3">
            <FlowLink href="/services" className="btn">
              All services <span aria-hidden>→</span>
            </FlowLink>
            <FlowLink href="/about" className="btn">
              Meet the studio <span aria-hidden>→</span>
            </FlowLink>
          </div>
        </section>
      </main>
    </PageFlow>
  );
}
