import Image from "next/image";
import { ViewTransition } from "react";
import { person } from "@/content/team";
import type { CaseStudy, Metric, Testimonial } from "@/content/types";
import { FlowLink } from "@/components/ui/flow-link";

export function ChapterHeader({
  index,
  total,
  title,
  intro,
  minutes,
}: {
  index: number;
  total: number;
  title: string;
  intro?: string;
  minutes?: number;
}) {
  return (
    <header className="pt-16 pb-10 md:pt-24">
      <p className="label">
        Chapter {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        {minutes ? ` · ${minutes} min` : ""}
      </p>
      <h1 tabIndex={-1} className="study-h1 mt-4">
        {title}
        <span className="text-(--c-accent)">.</span>
      </h1>
      {intro ? <p className="mt-6 max-w-[52ch] text-lg text-(--c-muted) md:text-xl">{intro}</p> : null}
    </header>
  );
}

export function Metrics({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="grid gap-8 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="reveal border-t border-(--c-line) pt-5">
          <dt className="sr-only">{metric.label}</dt>
          <dd>
            <span className="block font-(family-name:--c-display) text-5xl leading-none tracking-tight lining-nums md:text-6xl">{metric.value}</span>
            <span className="mt-3 block text-(--c-muted)">{metric.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Credits({ study }: { study: CaseStudy }) {
  return (
    <section aria-labelledby="credits" className="reveal">
      <h2 id="credits" className="label">
        Credits
      </h2>
      <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {study.credits.map((credit) => (
          <div key={credit.team}>
            <dt className="text-sm text-(--c-muted)">{credit.team}</dt>
            <dd className="mt-1">{credit.people.map((id) => person(id).name).join(", ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Quote({ testimonial, size = "lg" }: { testimonial: Testimonial; size?: "md" | "lg" }) {
  return (
    <figure className="reveal">
      {testimonial.approved ? null : (
        <p className="mb-4 inline-block rounded-full border border-dashed border-(--c-muted) px-3 py-1 font-mono text-[0.65rem] tracking-widest text-(--c-muted) uppercase">
          Draft · awaiting client approval
        </p>
      )}
      <blockquote
        className={`font-(family-name:--c-display) leading-[1.08] tracking-tight ${size === "lg" ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl"}`}
      >
        <span className="text-(--c-accent)">“</span>
        {testimonial.quote}
        <span className="text-(--c-accent)">”</span>
      </blockquote>
      <figcaption className="mt-6 text-(--c-muted)">
        {testimonial.name} · {testimonial.role}, {testimonial.company}
      </figcaption>
    </figure>
  );
}

type PagerLink = { href: string; label: string; kicker: string; minutes?: number };

/** End-of-chapter hand-off: there is always a next place to go (flow rule 4). */
export function ChapterPager({ prev, next }: { prev?: PagerLink; next: PagerLink }) {
  return (
    <nav aria-label="Chapter" className="mt-24 grid gap-4 border-t border-(--c-line) pt-10 md:grid-cols-2">
      {prev ? (
        <FlowLink href={prev.href} direction="back" className="group rounded-2xl p-5 transition-colors hover:bg-(--c-surface)">
          <span className="label">← {prev.kicker}</span>
          <span className="mt-2 block text-2xl">{prev.label}</span>
        </FlowLink>
      ) : (
        <span />
      )}
      <FlowLink
        href={next.href}
        direction="forward"
        className="group rounded-2xl bg-(--c-surface) p-5 text-right transition-colors hover:bg-(--c-accent) hover:text-(--c-on-accent)"
      >
        <span className="label">
          {next.kicker}
          {next.minutes ? ` · ${next.minutes} min` : ""} →
        </span>
        <span className="mt-2 block font-(family-name:--c-display) text-3xl md:text-4xl">{next.label}</span>
      </FlowLink>
    </nav>
  );
}

/** The next study's poster, which morphs into that study's exhibit on the way there. */
export function NextStudyTeaser({ study }: { study: CaseStudy }) {
  return (
    <FlowLink href={`/work/${study.slug}`} direction="forward" className="group relative mt-24 block overflow-hidden rounded-3xl">
      <ViewTransition name={`poster-${study.slug}`} share="poster-morph" default="none">
        <Image
          src={study.poster.src}
          alt=""
          width={study.poster.width}
          height={study.poster.height}
          sizes="(min-width: 1216px) 1120px, 92vw"
          className="h-[50svh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </ViewTransition>
      <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/20 to-transparent p-6 text-white md:p-10">
        <span className="label">Next project →</span>
        <span className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">{study.client}</span>
        <span className="mt-2 max-w-[48ch] text-white/75">{study.headline}</span>
      </div>
    </FlowLink>
  );
}
