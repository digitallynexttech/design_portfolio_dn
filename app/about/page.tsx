import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { LEADERSHIP, TEAM, creditsFor, type Person } from "@/content/team";
import {
  PRINCIPLES,
  STUDIO_PHOTOS,
  TEAM_PHOTO_PORTRAIT,
} from "@/content/studio";
import { ClientLogos, RecognitionList } from "@/features/drafts/depth/clients";
import { AboutAstronaut } from "@/features/stage3d/astro/astro-figure";
import { FACTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Digitally Next's design and development studio in New Delhi: 12+ years, 50+ brands, and the people who designed and built the work.",
  alternates: { canonical: "/about" },
};

const GROUPS: { key: Person["group"]; title: string; note: string }[] = [
  {
    key: "VIM",
    title: "Visual Impact Management",
    note: "Designers, motion and video",
  },
  { key: "WEM", title: "Web Essentials Management", note: "Developers" },
  {
    key: "Studio",
    title: "Also in the studio",
    note: "Accounts, partnerships, PR and people",
  },
];

/** The team, art-directed: the wide group shot from 768px, the same group in portrait on phones. */
function TeamPhoto() {
  const [wide] = STUDIO_PHOTOS;
  const tall = TEAM_PHOTO_PORTRAIT;
  const common = {
    alt: wide.alt,
    sizes: "(min-width: 768px) calc(100vw - 6rem), 100vw",
  };
  const {
    props: { srcSet: wideSet },
  } = getImageProps({
    ...common,
    src: wide.src,
    width: wide.width,
    height: wide.height,
  });
  const {
    props: { srcSet: tallSet, style, ...rest },
  } = getImageProps({
    ...common,
    src: tall.src,
    width: tall.width,
    height: tall.height,
  });
  const position = {
    "--tall": tall.position ?? "50% 50%",
    "--wide": wide.position ?? "50% 50%",
  } as CSSProperties;

  return (
    <picture className="team-photo dp-box dn-photo">
      <source media="(min-width: 768px)" srcSet={wideSet} sizes="calc(100vw - 6rem)" />
      <source srcSet={tallSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- getImageProps supplies alt, src, srcSet and sizes */}
      <img
        {...rest}
        style={{ ...style, ...position }}
        fetchPriority="high"
        loading="eager"
        className="absolute inset-0 size-full object-cover"
      />
    </picture>
  );
}

/** Built from the home's pieces (Karan, 26 Oct 2026): the page head, a framed photo, hairline columns
 *  and rows, and the home's own clients grid and recognition list. */
export default function AboutPage() {
  const [, ...studio] = STUDIO_PHOTOS;

  return (
    <PageFlow>
      <main id="main" className="dn-theme dn-page s3-host">
        <header className="dn-page__head">
          <p className="dp-k">(04) About</p>
          <h1 className="dp-title__h">
            A studio that takes your shape<span className="dp-stop">.</span>
          </h1>
        </header>
        {/* The astronaut at ease beside the title; the X on its shoulder waves at the team photo. */}
        <AboutAstronaut />
        <TeamPhoto />
        <div className="dn-intro">
          <p>
            We are the design and development studio inside Digitally Next - {FACTS.years} years and {FACTS.brands} brands in,
            working from {FACTS.city}. Designers, developers and motion artists in one room, building websites, stores,
            platforms and 3D for brands in India and beyond.
          </p>
          <p>
            We don&apos;t have a house style. Like water, we take the shape of what each client needs - a garage glow for a
            helmet brand, an editorial calm for a DNA lab, an operating system for our own company. Digitally Next is led by{" "}
            {LEADERSHIP.name}, {LEADERSHIP.title}.
          </p>
        </div>

        <section aria-labelledby="principles" className="dp-sec">
          <div className="dp-sec__head">
            <h2 id="principles" className="dp-k">
              How we think
            </h2>
          </div>
          <ul className="dn-steps dn-steps--4">
            {PRINCIPLES.map((principle) => (
              <li key={principle.title} className="dn-step">
                <h3 className="dn-step__title">
                  {principle.title}
                  <span className="dp-stop">.</span>
                </h3>
                <p className="dn-step__body">{principle.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="people" className="dp-sec">
          <div className="dp-sec__head">
            <h2 id="people" className="dp-h2">
              The people<span className="dp-stop">.</span>
            </h2>
          </div>
          {GROUPS.map((group) => {
            const people = TEAM.filter((p) => p.group === group.key);
            const makers = group.key !== "Studio";
            return (
              <div key={group.key} className="dn-group">
                <h3 className="dp-k">
                  {makers ? `${group.key} · ${group.title}` : group.title} - {group.note}
                </h3>
                <ul className={makers ? "dn-people" : "dn-people dn-people--quiet"}>
                  {people.map((p) => {
                    const shipped = creditsFor(p.id);
                    return (
                      <li key={p.id} className="dn-person">
                        <p className="dn-person__name">{p.name}</p>
                        <p className="dn-person__role">{p.title}</p>
                        {shipped.length ? (
                          <ul className="dn-person__work" aria-label={`Projects ${p.name} worked on`}>
                            {shipped.map((study) => (
                              <li key={study.slug}>
                                <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dn-tag">
                                  {study.client}
                                </FlowLink>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>

        <section aria-labelledby="inside" className="dp-sec">
          <div className="dp-sec__head">
            <h2 id="inside" className="dp-k">
              Inside the studio
            </h2>
          </div>
          <ul className="dn-shots">
            {studio.map((photo) => (
              <li key={photo.src}>
                <figure>
                  <div className="dp-box" style={{ "--ar": "4 / 3" } as CSSProperties}>
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 31vw, 47vw"
                      className="dp-plate dp-cover"
                      style={{ objectPosition: photo.position }}
                    />
                  </div>
                  <figcaption className="dn-shots__caption">{photo.alt}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="dn-onward">
            <FlowLink href="/services#process" className="dp-link dn-onward__link">
              <span>
                How we work: six steps, each with proof <span aria-hidden>→</span>
              </span>
            </FlowLink>
          </p>
        </section>

        <section aria-labelledby="proof" className="dp-sec">
          <div className="dp-sec__head">
            <p className="dp-k">Clients and awards</p>
            <h2 id="proof" className="dp-h2">
              Who we&apos;ve built for<span className="dp-stop">.</span>
            </h2>
          </div>
          <ClientLogos />
          <RecognitionList />
        </section>
      </main>
    </PageFlow>
  );
}
