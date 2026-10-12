import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { WorkCard } from "@/components/work/work-card";
import { PROCESS, SERVICES } from "@/content/studio";
import { getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Brand and digital identity, UI/UX and design systems, creative development, e-commerce, platforms and search - each backed by real case studies.",
  alternates: { canonical: "/services" },
};

const number = (i: number) => String(i + 1).padStart(2, "0");

const NAV_LINK =
  "inline-flex min-h-11 items-center gap-3 whitespace-nowrap rounded-full border border-paper/20 px-4 text-sm transition-colors hover:border-teal lg:flex lg:rounded-none lg:border-0 lg:border-b lg:border-paper/10 lg:px-0 lg:text-base lg:hover:text-teal";

export default function ServicesPage() {
  return (
    <PageFlow>
      <main id="main" className="px-(--gutter) pt-36 pb-24">
        <header className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="label">(03) Services</p>
            <h1 className="mt-4 font-display text-d1 font-semibold">
              What we pour into<span className="stop">.</span>
            </h1>
            <p className="mt-8 max-w-[52ch] text-lg text-paper/70">
              Six kinds of work, one studio. Every service below links to the
              case studies that prove it - not a list of skills, but the places
              we have actually done it.
            </p>
          </div>
          <nav aria-label="Services" className="services-nav">
            <ol className="flex gap-2 lg:block lg:border-t lg:border-paper/10">
              {SERVICES.map((service, i) => (
                <li key={service.id} className="shrink-0">
                  <a href={`#${service.id}`} className={NAV_LINK}>
                    <span className="font-mono text-xs text-teal">
                      {number(i)}
                    </span>
                    {service.title}
                  </a>
                </li>
              ))}
            </ol>
            <a
              href="#process"
              className={`${NAV_LINK} shrink-0 lg:mt-6 lg:w-fit lg:border-b-0 lg:text-sm lg:text-paper/70`}
            >
              How we work <span aria-hidden>↓</span>
            </a>
          </nav>
        </header>

        <ol className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-paper/10 md:mt-24">
          {SERVICES.map((service, i) => {
            const proof = service.proof
              .map(getCaseStudy)
              .filter((s) => s !== undefined);
            return (
              <li
                key={service.id}
                id={service.id}
                className="service-row reveal scroll-mt-28 bg-ink p-6 md:p-12"
              >
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14">
                  <div>
                    <p className="font-mono text-sm text-teal">{number(i)}</p>
                    <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                      {service.title}
                    </h2>
                    <p className="mt-4 text-xl text-paper/80">{service.line}</p>
                  </div>
                  <div className="grid content-start gap-8 lg:pt-9">
                    <p className="text-lg leading-relaxed text-paper/70">
                      {service.body}
                    </p>
                    <dl className="grid gap-8 sm:grid-cols-2">
                      <div>
                        <dt className="label">What you get</dt>
                        <dd className="mt-3">
                          <ul className="grid gap-1.5">
                            {service.deliverables.map((d) => (
                              <li key={d}>{d}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                      <div>
                        <dt className="label">Tools</dt>
                        <dd className="mt-3 text-paper/70">
                          {service.tools.join(" · ")}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                {proof.length ? (
                  <div className="mt-12">
                    <p id={`${service.id}-proof`} className="label">
                      Proof · {proof.length} case studies
                    </p>
                    <ul
                      aria-labelledby={`${service.id}-proof`}
                      className="proof-row mt-4"
                    >
                      {proof.map((study) => (
                        <li key={study.slug}>
                          <WorkCard study={toCard(study)} compact />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        <section
          id="process"
          aria-labelledby="process-title"
          className="process-section mt-32 scroll-mt-28"
        >
          <p className="label">How we work</p>
          <h2
            id="process-title"
            className="mt-4 font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] font-semibold tracking-[-0.03em]"
          >
            Six steps, every time<span className="stop">.</span>
          </h2>
          <ol className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((step, i) => (
              <li
                key={step.title}
                className="reveal border-t border-paper/15 pt-6"
              >
                <p className="font-mono text-sm text-teal">{number(i)}</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-paper/70">{step.body}</p>
                <FlowLink
                  href={step.evidence.href}
                  direction="deeper"
                  className="mt-2 inline-flex min-h-11 items-center text-sm text-teal underline-offset-4 hover:underline"
                >
                  Proof: {step.evidence.label} <span aria-hidden>&nbsp;→</span>
                </FlowLink>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </PageFlow>
  );
}
