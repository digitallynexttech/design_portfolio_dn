import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { SERVICES, STUDIO_PHOTOS } from "@/content/studio";
import { TEAM, creditsFor } from "@/content/team";
import type { Testimonial } from "@/content/types";
import { CASE_STUDIES, getCaseStudy, visibleTestimonial } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { DeepCast } from "./deep-cast";
import { DeepCredits } from "./deep-credits";
import { DeepFooter } from "./deep-footer";
import { DeepHeader, DeepMenu } from "./deep-header";
import { DeepHero } from "./deep-hero";
import { DeepScenes } from "./deep-scenes";
import { DeepServices } from "./deep-services";
import { DeepStudio } from "./deep-studio";
import { DepthGauge } from "./depth-gauge";
import { ddDisplay } from "./fonts";
import { Sea } from "./sea";
import { WaterRest } from "./water-rest";
import "./deep.css";

/** "Founder, Happy Ganga" when the name only restates the company; otherwise "Name, Role". */
function attribution(t: Testimonial) {
  return t.name.includes(t.company) ? `${t.role}, ${t.company}` : `${t.name}, ${t.role}`;
}

/**
 * Draft 2, "Deep Water": the home page as one dive. The same sections, content and order as the home
 * page; the page sinks from a letterboxed opening at the surface to the abyss at the footer.
 */
export function DeepHome() {
  // The same selection as the home page: the making-of lives on its own page and in the world.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Client voices never repeat one already heard, as on the home page.
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

  return (
    <div className={`d-deep ${ddDisplay.variable}`}>
      <WaterRest />
      <DeepHeader />
      <PageFlow>
        <main id="main" className="dd-main">
          <DeepHero />
          <DeepStudio studies={clientStudies.length} />
          <DeepScenes flagships={flagships} />
          {standard.length ? <DeepCredits studies={standard.map(toCard)} start={flagships.length + 1} /> : null}
          <DeepServices
            services={SERVICES.map((service) => ({
              id: service.id,
              title: service.title,
              line: service.line,
              proof: service.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
              image: `/services/${service.id}.webp`,
            }))}
          />

          {voices.length ? (
            <section id="dd-voices" className="dd-section dd-voices" aria-labelledby="voices-title">
              <p className="dd-label">Clients</p>
              <h2 id="voices-title" className="dd-voices__title dd-rise">
                In their words.
              </h2>
              <ul className="dd-voices__list">
                {voices.map(({ study, t }) => (
                  <li key={study.slug} className="dd-voice dd-rise">
                    {t.approved ? null : <p className="dd-voice__draft">Draft · awaiting approval</p>}
                    <figure>
                      <blockquote className="dd-voice__quote">“{t.quote}”</blockquote>
                      <figcaption className="dd-voice__who">{attribution(t)}</figcaption>
                    </figure>
                    <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dd-voice__link">
                      Read the {study.client} story <span aria-hidden>→</span>
                    </FlowLink>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <DeepCast photo={STUDIO_PHOTOS[0]} makers={makers} />
        </main>
      </PageFlow>
      <DeepFooter />
      {/* Fixed layers (the sea sits behind everything at z-index -1) and the closed menu sheet come
          last in the HTML, so the opening shot arrives in the browser's first chunk. */}
      <Sea />
      <DepthGauge />
      <DeepMenu />
    </div>
  );
}
