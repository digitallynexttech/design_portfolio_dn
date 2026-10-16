import Image from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import { SERVICES } from "@/content/studio";
import { getCaseStudy } from "@/content/work";
import { Folio, roman } from "./parts";

/**
 * How we adapt: six services as six plates in two staggered columns. The pictures are water
 * studies shot on black; printed here as negatives they read as ink spreading through water on
 * the page, so the chapter stays in the book's two colours.
 */
export function Services({ folio }: { folio: number }) {
  return (
    <section aria-labelledby="services-title" className="m-services m-block" data-chapter="How we adapt" data-folio={folio}>
      <p className="m-sidehead">How we adapt</p>
      <h2 id="services-title" className="m-services__title">
        Six kinds of work, <em>one studio.</em>
      </h2>
      <ol className="m-services__list">
        {SERVICES.map((service, i) => {
          const proof = service.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []);
          return (
            <li key={service.id} className="m-service">
              <div className="m-service__frame m-rise" data-ripple>
                <Image src={`/services/${service.id}.webp`} alt="" fill sizes="(min-width: 1100px) 44vw, (min-width: 700px) 50vw, 100vw" className="m-service__img" />
              </div>
              <div className="m-service__cap">
                <span className="m-service__no" aria-hidden>
                  {roman(i + 1)}
                </span>
                <h3 className="m-service__name">
                  <FlowLink href={`/services#${service.id}`} className="m-service__link">
                    {service.title}
                  </FlowLink>
                </h3>
                <p className="m-service__line">{service.line}</p>
                {proof.length ? (
                  <p className="m-service__proof">
                    <span className="m-service__proof-label">Proof</span>
                    <span className="sr-only">: </span>
                    {proof.join(" · ")}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <Folio n={folio} />
    </section>
  );
}
