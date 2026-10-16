import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import { ClientWall } from "@/components/proof/client-wall";
import { Recognition } from "@/components/proof/recognition";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { LEADERSHIP, TEAM, creditsFor, type Person } from "@/content/team";
import {
  PRINCIPLES,
  STUDIO_PHOTOS,
  TEAM_PHOTO_PORTRAIT,
} from "@/content/studio";
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
    <picture className="team-photo relative mt-10 block aspect-[4/5] overflow-hidden bg-ink-2 md:mx-(--gutter) md:mt-14 md:aspect-[16/8] md:rounded-3xl">
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

export default function AboutPage() {
  const [, ...studio] = STUDIO_PHOTOS;

  return (
    <PageFlow>
      <main id="main" className="pt-page-top pb-24">
        <header>
          <div className="px-(--gutter)">
            <p className="label">(04) About</p>
            <h1 className="mt-4 max-w-6xl font-display text-d1 font-semibold">
              A studio that takes your shape<span className="stop">.</span>
            </h1>
          </div>
          <TeamPhoto />
          <div className="mt-12 grid max-w-5xl gap-8 px-(--gutter) text-lg text-paper/75 md:mt-16 lg:grid-cols-2">
            <p>
              We are the design and development studio inside Digitally Next -{" "}
              {FACTS.years} years and {FACTS.brands} brands in, working from{" "}
              {FACTS.city}. Designers, developers and motion artists in one
              room, building websites, stores, platforms and 3D for brands in
              India and beyond.
            </p>
            <p>
              We don&apos;t have a house style. Like water, we take the shape of
              what each client needs - a garage glow for a helmet brand, an
              editorial calm for a DNA lab, an operating system for our own
              company. Digitally Next is led by {LEADERSHIP.name},{" "}
              {LEADERSHIP.title}.
            </p>
          </div>
        </header>

        <section aria-labelledby="principles" className="mt-section px-(--gutter)">
          <h2 id="principles" className="label">
            How we think
          </h2>
          <ul className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            {PRINCIPLES.map((principle) => (
              <li key={principle.title} className="reveal">
                <h3 className="font-display text-d3 font-semibold">
                  {principle.title}
                  <span className="stop">.</span>
                </h3>
                <p className="mt-4 max-w-[40ch] text-paper/70">
                  {principle.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="people" className="mt-section px-(--gutter)">
          <h2
            id="people"
            className="font-display text-d2 font-semibold"
          >
            The people<span className="stop">.</span>
          </h2>
          {GROUPS.map((group) => {
            const people = TEAM.filter((p) => p.group === group.key);
            const makers = group.key !== "Studio";
            return (
              <div key={group.key} className="mt-16">
                <h3 className="label">
                  {makers ? `${group.key} · ${group.title}` : group.title} -{" "}
                  {group.note}
                </h3>
                <ul
                  className={`people-list mt-6 grid border-t border-paper/10 ${makers ? "" : "md:grid-cols-2 md:gap-x-10"}`}
                >
                  {people.map((p) => {
                    const shipped = creditsFor(p.id);
                    return (
                      <li
                        key={p.id}
                        className={`grid content-start gap-2 border-b border-paper/10 py-6 ${
                          makers
                            ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)] lg:items-baseline lg:gap-6"
                            : ""
                        }`}
                      >
                        <p
                          className={`font-display font-semibold tracking-tight ${
                            makers
                              ? "text-4xl md:text-5xl xl:text-6xl"
                              : "text-2xl md:text-3xl"
                          }`}
                        >
                          {p.name}
                        </p>
                        <p className="text-paper/60">{p.title}</p>
                        {shipped.length ? (
                          <ul
                            className="flex flex-wrap gap-2"
                            aria-label={`Projects ${p.name} worked on`}
                          >
                            {shipped.map((study) => (
                              <li key={study.slug}>
                                <FlowLink
                                  href={`/work/${study.slug}`}
                                  direction="deeper"
                                  className="chip whitespace-nowrap text-(--text-2)"
                                >
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

        <section aria-labelledby="inside" className="mt-section px-(--gutter)">
          <h2 id="inside" className="label">
            Inside the studio
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-8">
            {studio.map((photo) => (
              <li key={photo.src} className="reveal">
                <figure>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-2">
                    <Image
                      src={photo.src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 31vw, 47vw"
                      className="object-cover"
                      style={{ objectPosition: photo.position }}
                    />
                  </div>
                  <figcaption className="mt-2.5 text-xs text-paper/60 md:text-sm">
                    {photo.alt}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-stack px-(--gutter)">
          <FlowLink
            href="/services#process"
            className="flex min-h-11 w-fit items-center font-display text-2xl font-semibold tracking-tight transition-colors hover:text-teal md:text-3xl"
          >
            <span>
              How we work: six steps, each with proof <span aria-hidden>→</span>
            </span>
          </FlowLink>
        </p>

        <section aria-labelledby="proof" className="mt-section px-(--gutter)">
          <h2 id="proof" className="label">
            Clients &amp; recognition
          </h2>
          <div className="mt-8">
            <ClientWall />
          </div>
          <div className="mt-12">
            <Recognition />
          </div>
        </section>
      </main>
    </PageFlow>
  );
}
