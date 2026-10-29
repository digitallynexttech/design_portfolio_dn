import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { PROCESS, SERVICES } from "@/content/studio";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { pad } from "@/features/drafts/depth/lift";
import { ProofCard } from "@/features/drafts/depth/proof-card";
import { SH_MODE_SCRIPT } from "@/features/services/mode";
import { Spacewalk, type Stop } from "@/features/services/spacewalk";
import { FACTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Brand and digital identity, UI/UX and design systems, creative development, e-commerce, platforms and search - each backed by real case studies.",
  alternates: { canonical: "/services" },
};

/** A station's clip on the tether, and its number big and hollow in the empty side beside it. */
function Clip({ no }: { no: string }) {
  return (
    <>
      <span className="sh-clip" aria-hidden>
        <span className="sh-clip__no">{no}</span>
      </span>
      <span className="sh-numeral" aria-hidden>
        {no}
      </span>
    </>
  );
}

/**
 * Services: "Spacewalk" (Karan picked it on 29 Oct 2026 from ten drafts in the home's depth theme).
 * The six services are stations clipped on to one tether, the process the airlock at its end; the
 * astronaut hangs from the line by one hand and swings down the page (features/services/spacewalk.tsx).
 */
export default function ServicesPage() {
  const facts = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(CASE_STUDIES.filter((s) => s.slug !== "making-of").length), label: "case studies" },
  ];
  const stops: Stop[] = [...SERVICES.map((s) => ({ id: s.id, name: s.title })), { id: "process", name: "Airlock" }];
  const last = stops.length - 1;

  return (
    <PageFlow>
      <main id="main" className="dn-theme dn-page sh">
        {/* Picks the walk, the slim line or the still one before the first paint (mode.ts). */}
        <script dangerouslySetInnerHTML={{ __html: SH_MODE_SCRIPT }} />
        <header className="dn-page__head">
          <div className="dp-studio__top">
            <div>
              <p className="dp-k">(03) Services</p>
              <h1 className="dp-title__h dn-page__title">
                What we pour into<span className="dp-stop">.</span>
              </h1>
              <p className="dn-page__lead">
                Six kinds of work, one studio. Every service below links to the case studies that prove it - not a list of
                skills, but the places we have actually done it.
              </p>
            </div>
            <dl className="dp-facts">
              {facts.map((fact) => (
                <div key={fact.label} className="dp-fact">
                  <dt className="dp-fact__label">{fact.label}</dt>
                  <dd className="dp-fact__value">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {/* Smaller screens: the stations in order (wide screens read them off the line). */}
          <nav aria-label="Stations" className="dn-index sh-directory">
            <ol>
              {stops.map((stop, i) => (
                <li key={stop.id}>
                  <a href={`#${stop.id}`} className="dn-index__link">
                    <span className="dp-k dn-index__no">{pad(i + 1)}</span>
                    <span className="dn-index__name">{i === last ? "How we work" : stop.name}</span>
                    <span aria-hidden className="dn-index__go">
                      ↓
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        <Spacewalk stops={stops}>
          {SERVICES.map((service, i) => {
            const proof = service.proof.map(getCaseStudy).filter((s) => s !== undefined);
            return (
              <section
                key={service.id}
                id={service.id}
                className="sh-station"
                data-side={i % 2 === 0 ? "l" : "r"}
                aria-labelledby={`${service.id}-title`}
              >
                <Clip no={pad(i + 1)} />
                <div className="sh-station__in">
                  <p className="dp-k sh-kicker">
                    <span className="sh-kicker__no">Station {pad(i + 1)}</span> · Service
                    <span className="sh-kicker__here" aria-hidden>
                      {" "}
                      · You are here
                    </span>
                  </p>
                  <h2 id={`${service.id}-title`} className="dp-h2 sh-title">
                    {service.title}
                    <span className="dp-stop">.</span>
                  </h2>
                  <p className="sh-line">{service.line}</p>
                  <p className="sh-text">{service.body}</p>
                  <dl className="dp-spec sh-spec">
                    <div className="dp-spec__row">
                      <dt className="dp-k">What you get</dt>
                      <dd>
                        <ul className="sh-list">
                          {service.deliverables.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                    <div className="dp-spec__row">
                      <dt className="dp-k">Tools</dt>
                      <dd>{service.tools.join(" · ")}</dd>
                    </div>
                  </dl>
                  {proof.length ? (
                    <div className="sh-proof">
                      <p id={`${service.id}-proof`} className="dp-k">
                        Proof · {proof.length} case {proof.length === 1 ? "study" : "studies"}
                      </p>
                      <ul aria-labelledby={`${service.id}-proof`} className="dn-cards">
                        {proof.map((study) => (
                          <li key={study.slug}>
                            <ProofCard study={toCard(study)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}

          <section id="process" className="sh-station sh-station--airlock" aria-labelledby="process-title">
            <Clip no={pad(last + 1)} />
            <div className="sh-station__in">
              <p className="dp-k sh-kicker">
                <span className="sh-kicker__no">Airlock</span> · How we work
                <span className="sh-kicker__here" aria-hidden>
                  {" "}
                  · You are here
                </span>
              </p>
              <h2 id="process-title" className="dp-h2 sh-title">
                Six steps, every time<span className="dp-stop">.</span>
              </h2>
              <p className="sh-line">Back inside, the same way every time: from the first call to the work going live.</p>
              <ol className="dn-steps sh-steps">
                {PROCESS.map((step, i) => (
                  <li key={step.title} className="dn-step">
                    <p className="dp-k dn-step__no">{pad(i + 1)}</p>
                    <h3 className="dn-step__title">{step.title}</h3>
                    <p className="dn-step__body">{step.body}</p>
                    <FlowLink href={step.evidence.href} direction="deeper" className="dp-link dn-step__proof">
                      {/* One run of text, so a wrapped label keeps the arrow beside its last word. */}
                      <span>
                        Proof: {step.evidence.label}&nbsp;<span aria-hidden>→</span>
                      </span>
                    </FlowLink>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </Spacewalk>
      </main>
    </PageFlow>
  );
}
