import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { RECOGNITION } from "@/content/recognition";
import { SERVICES, STUDIO_PHOTOS } from "@/content/studio";
import type { CaseStudy, Testimonial } from "@/content/types";
import { getCaseStudy } from "@/content/work";
import { FACTS } from "@/lib/site";
import { FIELDS, fieldStyle } from "./colour";
import { LogoRiver } from "./logo-river";
import { Wave } from "./wave";

const drop = (accent: string) => ({ "--drop": accent }) as CSSProperties;

/** The studio: a statement on warm paper, three numbers set as posters, the clients and the proof. */
export function Studio({ caseCount }: { caseCount: number }) {
  const featured = RECOGNITION.filter((item) => item.featured && item.image);
  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(caseCount), label: "case studies, told in full" },
  ];
  return (
    <section aria-labelledby="dc-studio-title" className="dc-field dc-studio" data-field style={fieldStyle(FIELDS.cream)}>
      <div className="dc-studio__lead">
        <p className="dc-tag">The studio</p>
        <h2 id="dc-studio-title" className="dc-statement dc-rise">
          We are the <span className="dc-statement__hue">designers, developers and motion artists</span> inside Digitally Next.
        </h2>
        <p className="dc-studio__sub dc-rise">Every client is a different container. We take its shape.</p>
      </div>

      <dl className="dc-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="dc-stat dc-rise">
            <dt className="dc-stat__label">{stat.label}</dt>
            <dd className="dc-stat__value">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <LogoRiver />

      <ul aria-label="Recognition" className="dc-honours">
        {featured.map((item) => {
          const image = item.image!;
          const badge = image.width / image.height < 2;
          return (
            <li key={item.title} className="dc-honour" data-badge={badge ? "" : undefined}>
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                sizes={badge ? "80px" : "(min-width: 768px) 360px, 260px"}
                className="dc-honour__mark"
              />
              <p className="dc-honour__text">
                <span className="dc-honour__title">{item.title}</span>
                <span className="dc-honour__detail">{item.detail}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Each service's picture sits in a different vessel: the water takes the shape of what holds it.
const VESSELS = ["arch", "pill", "leaf", "tank", "bowl", "lens"] as const;

/** How we adapt: six services as bold tiles on deep water. Phones swipe through them. */
export function Services({ after }: { after: string }) {
  return (
    <section aria-labelledby="dc-services-title" className="dc-field dc-services" data-field style={fieldStyle(FIELDS.navy)}>
      <div className="dc-services__head">
        <p className="dc-tag">How we adapt</p>
        <h2 id="dc-services-title" className="dc-title dc-rise">
          Six kinds of work, one studio
        </h2>
      </div>
      <ul className="dc-tiles">
        {SERVICES.map((service, i) => {
          const proof = service.proof.flatMap((slug) => getCaseStudy(slug) ?? []);
          return (
            <li key={service.id} className="dc-tile" data-vessel={VESSELS[i % VESSELS.length]}>
              <div className="dc-tile__vessel" aria-hidden>
                <Image src={`/services/${service.id}.webp`} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 80vw" className="dc-cover" />
              </div>
              <h3 className="dc-tile__title">
                <FlowLink href={`/services#${service.id}`} className="dc-tile__link">
                  {service.title}
                </FlowLink>
              </h3>
              <p className="dc-tile__line">{service.line}</p>
              {proof.length ? (
                <p className="dc-tile__proof">
                  <span className="dc-sr">Proof: </span>
                  {proof.map((study, k) => (
                    <span key={study.slug} className="dc-dropname" style={drop(study.theme.accent)}>
                      {study.client}
                      {k < proof.length - 1 ? <span className="dc-sr">, </span> : null}
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Wave color={after} variant={0} />
    </section>
  );
}

/** "Founder, Happy Ganga" when the name only restates the company; otherwise "Name, Role". */
function attribution(t: Testimonial) {
  return t.name.includes(t.company) ? `${t.role}, ${t.company}` : `${t.name}, ${t.role}`;
}

/** Client voices, on mist. Rendered only when there are quotes to show. */
export function Voices({ voices, after }: { voices: { study: CaseStudy; t: Testimonial }[]; after: string }) {
  return (
    <section aria-labelledby="dc-voices-title" className="dc-field dc-voices" data-field style={fieldStyle(FIELDS.mist)}>
      <p className="dc-tag">Clients</p>
      <h2 id="dc-voices-title" className="dc-title dc-rise">
        In their words
      </h2>
      <ul className="dc-quotes">
        {voices.map(({ study, t }) => (
          <li key={study.slug} className="dc-quote" style={drop(study.theme.accent)}>
            {t.approved ? null : <p className="dc-quote__draft">Draft · awaiting approval</p>}
            <figure>
              <blockquote className="dc-quote__text">“{t.quote}”</blockquote>
              <figcaption className="dc-quote__by">{attribution(t)}</figcaption>
            </figure>
            <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dc-textlink">
              Read the {study.client} story <span aria-hidden>→</span>
            </FlowLink>
          </li>
        ))}
      </ul>
      <Wave color={after} variant={1} reverse />
    </section>
  );
}

type Maker = { id: string; name: string; title: string; shipped: CaseStudy[] };

/** The people: the team in an arch of the studio's own red room, and what each maker shipped. */
export function People({ makers, after }: { makers: Maker[]; after: string }) {
  const photo = STUDIO_PHOTOS[0];
  return (
    <section aria-labelledby="dc-people-title" className="dc-field dc-people" data-field style={fieldStyle(FIELDS.blush)}>
      <div className="dc-people__grid">
        <div className="dc-people__head">
          <p className="dc-tag">The people</p>
          <h2 id="dc-people-title" className="dc-mega dc-rise">
            Who poured it
          </h2>
        </div>
        <div className="dc-people__photo">
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 52vw, 100vw" className="dc-cover" />
        </div>
        <div className="dc-people__list">
          <ul className="dc-makers">
            {makers.map((p) => (
              <li key={p.id} className="dc-maker">
                <p className="dc-maker__name">{p.name}</p>
                <p className="dc-maker__title">{p.title}</p>
                {p.shipped.length ? (
                  <p className="dc-maker__shipped">
                    <span className="dc-sr">Shipped: </span>
                    {p.shipped.map((study, k) => (
                      <span key={study.slug} className="dc-dropname" style={drop(study.theme.accent)}>
                        {study.client}
                        {k < p.shipped.length - 1 ? <span className="dc-sr">, </span> : null}
                      </span>
                    ))}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <FlowLink href="/about" className="dc-btn dc-btn--solid dc-btn--lg">
            Meet the studio <span aria-hidden>→</span>
          </FlowLink>
        </div>
      </div>
      <Wave color={after} variant={2} />
    </section>
  );
}
