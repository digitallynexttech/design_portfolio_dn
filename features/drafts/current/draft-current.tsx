import { PageFlow } from "@/components/ui/page-flow";
import { TEAM, creditsFor } from "@/content/team";
import { CASE_STUDIES, visibleTestimonial } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { FIELDS } from "./colour";
import { display } from "./fonts";
import { DraftFooter } from "./footer";
import { DraftHeader } from "./header";
import { Hero } from "./hero";
import { People, Services, Studio, Voices } from "./sections";
import { MoreWork, SelectedWork } from "./work";
import "./current.css";

/**
 * Draft 3, "Colour current": water takes the colour of whatever holds it. The page is one liquid
 * field that flows from the studio's red, through each flagship's own brand colour, into calmer
 * water for the services and the people, and back to red. Same content and order as the home page.
 */
export function DraftCurrent() {
  // The making-of is told on its own page and in the world; home keeps to client work.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Client voices never repeat one: skip companies already quoted in the flagships, our own
  // self-quote, and a second quote from the same company (the home page's rule).
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
    shipped: creditsFor(p.id).filter((s) => s.slug !== "making-of"),
  }));

  return (
    <PageFlow>
      <div className={`d-current ${display.variable}`}>
        <DraftHeader />
        <main id="main">
          <Hero />
          <Studio caseCount={clientStudies.length} />
          <SelectedWork flagships={flagships} after={standard.length ? FIELDS.paper.bg : FIELDS.navy.bg} />
          {standard.length ? <MoreWork studies={standard.map(toCard)} after={FIELDS.navy.bg} /> : null}
          <Services after={voices.length ? FIELDS.mist.bg : FIELDS.blush.bg} />
          {voices.length ? <Voices voices={voices} after={FIELDS.blush.bg} /> : null}
          <People makers={makers} after={FIELDS.red.bg} />
        </main>
        <DraftFooter />
      </div>
    </PageFlow>
  );
}
