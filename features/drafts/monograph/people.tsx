import Image from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import { STUDIO_PHOTOS } from "@/content/studio";
import type { CaseStudy, Testimonial } from "@/content/types";
import { Folio } from "./parts";

type Maker = { id: string; name: string; title: string; shipped: string[] };

/** The people: the team as the book's frontispiece photograph, and the makers as its list of contributors. */
export function People({ makers, folio }: { makers: Maker[]; folio: number }) {
  const photo = STUDIO_PHOTOS[0];
  return (
    <section aria-labelledby="people-title" className="m-people m-block" data-chapter="The people" data-folio={folio}>
      <h2 id="people-title" className="m-people__title">
        Who <em>poured</em> it.
      </h2>
      <figure className="m-people__photo">
        <div className="m-people__frame m-rise" data-ripple>
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1100px) 62vw, 100vw" className="m-people__img" />
        </div>
        <figcaption className="m-caption">
          <span className="m-caption__no">Fig. 2</span> {photo.alt}
        </figcaption>
      </figure>
      <div className="m-people__list">
        <ul className="m-makers">
          {makers.map((p) => (
            <li key={p.id} className="m-maker">
              <p className="m-maker__name">{p.name}</p>
              <p className="m-maker__title">{p.title}</p>
              {p.shipped.length ? (
                <p className="m-maker__shipped">
                  <span className="sr-only">Shipped: </span>
                  {p.shipped.join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <FlowLink href="/about" className="m-btn">
          Meet the studio <span aria-hidden>→</span>
        </FlowLink>
      </div>
      <Folio n={folio} />
    </section>
  );
}

/** "Founder, Happy Ganga" when the name only restates the company; otherwise "Name, Role". */
function attribution(t: Testimonial) {
  return t.name.includes(t.company) ? `${t.role}, ${t.company}` : `${t.name}, ${t.role}`;
}

/** Client voices, set as pull quotes. Rendered only when a quote may be shown. */
export function Voices({ voices, folio }: { voices: { study: CaseStudy; t: Testimonial }[]; folio: number }) {
  return (
    <section aria-labelledby="voices-title" className="m-voices m-block" data-chapter="Clients" data-folio={folio}>
      <h2 id="voices-title" className="m-voices__title">
        In their <em>words.</em>
      </h2>
      <ul className="m-voices__list">
        {voices.map(({ study, t }) => (
          <li key={study.slug} className="m-voice">
            {t.approved ? null : <p className="m-voice__draft">Draft · awaiting approval</p>}
            <figure>
              <blockquote className="m-voice__quote">
                <p>“{t.quote}”</p>
              </blockquote>
              <figcaption className="m-voice__by">{attribution(t)}</figcaption>
            </figure>
            <FlowLink href={`/work/${study.slug}`} direction="deeper" className="m-link">
              Read the {study.client} story <span aria-hidden>→</span>
            </FlowLink>
          </li>
        ))}
      </ul>
      <Folio n={folio} />
    </section>
  );
}
