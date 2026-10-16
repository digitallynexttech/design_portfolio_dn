import { PageFlow } from "@/components/ui/page-flow";
import { TEAM, creditsFor } from "@/content/team";
import { CASE_STUDIES, visibleTestimonial } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { WaterPause } from "@/features/water/water-pause";
import { AwayFlag } from "./away-flag";
import { Colophon } from "./colophon";
import { serif } from "./fonts";
import { Hero } from "./hero";
import { Masthead } from "./masthead";
import { People, Voices } from "./people";
import { SelectedWork } from "./plates";
import { Ripple } from "./ripple";
import { Services } from "./services";
import { Studio } from "./studio";
import { WorkIndex } from "./work-index";
import { Folio } from "./parts";
import { FlowLink } from "@/components/ui/flow-link";
import "./monograph.css";

/**
 * Draft 1, "Monograph": the home page as a printed studio monograph. Same sections, same words and
 * the same data as the home page (app/page.tsx), set on paper in ink with one red.
 */
export function Monograph() {
  // The making-of is told on its own page and in the world; home keeps to client work.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Client voices never repeat one: skip companies already quoted in the plates, our own
  // self-quote, and a second quote from the same company (same logic as the home page).
  const heard = new Set(flagships.flatMap((s) => visibleTestimonial(s.testimonial)?.company ?? []));
  heard.add("Digitally Next");
  const voices = standard.flatMap((study) => {
    const t = visibleTestimonial(study.testimonial);
    if (!t || heard.has(t.company)) return [];
    heard.add(t.company);
    return [{ study, t }];
  });

  const makers = TEAM.filter((p) => p.group !== "Studio").map((p) => ({
    id: p.id,
    name: p.name,
    title: p.title,
    shipped: creditsFor(p.id)
      .filter((s) => s.slug !== "making-of")
      .map((s) => s.client),
  }));

  // Folios (page numbers) follow what renders: the studio is page 1, the Selected work opener the
  // next, one page per plate, then the index, services, voices (if any) and the people.
  let page = 1;
  const studioPage = page;
  const workPage = ++page;
  page += flagships.length;
  const morePage = standard.length ? ++page : 0;
  const servicesPage = ++page;
  const voicesPage = voices.length ? ++page : 0;
  const peoplePage = ++page;

  return (
    <PageFlow>
      <div className={`d-monograph ${serif.variable}`}>
        <WaterPause />
        <AwayFlag />
        <Ripple />
        <Masthead />
        <main id="main" className="m-main">
          <Hero />
          <Studio studies={clientStudies.length} folio={studioPage} />
          <SelectedWork flagships={flagships} firstFolio={workPage} />

          {morePage ? (
            <section aria-labelledby="more-title" className="m-more m-block" data-chapter="More work" data-folio={morePage}>
              <WorkIndex
                studies={standard.map(toCard)}
                start={flagships.length + 1}
                heading={
                  <>
                    <p className="m-sidehead">More work</p>
                    <h2 id="more-title" className="m-more__title">
                      Different <em>containers.</em>
                    </h2>
                  </>
                }
              />
              <p className="m-more__all">
                <FlowLink href="/work" className="m-btn m-btn--lg">
                  All work <span aria-hidden>→</span>
                </FlowLink>
              </p>
              <Folio n={morePage} />
            </section>
          ) : null}

          <Services folio={servicesPage} />
          {voicesPage ? <Voices voices={voices} folio={voicesPage} /> : null}
          <People makers={makers} folio={peoplePage} />
        </main>
        <Colophon />
      </div>
    </PageFlow>
  );
}
