import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { CaseStudy } from "@/content/types";
import { visibleTestimonial } from "@/content/work";
import { FormAnchor } from "@/features/water/forms/anchors";
import type { FormId } from "@/features/water/forms/shapes";
import { FormVessel } from "./form-vessel";
import { MetaParts } from "./meta-parts";

// Which shape the water takes for each flagship.
const FORM_BY_SLUG: Record<string, FormId> = {
  skelmet: "skull",
  "know-your-genes": "helix",
  hard2soft: "drop",
  dnms: "screens",
};

// A real frame of each study, shown in the water's place when the device draws no water.
const FALLBACK: Record<string, string> = {
  skelmet: "/work/skelmet/preview-poster.webp",
  "know-your-genes": "/work/know-your-genes/preview-poster.webp",
  hard2soft: "/work/hard2soft/preview-poster.webp",
  dnms: "/work/dnms/poster.webp",
};

function Fallback({ slug }: { slug: string }) {
  const src = FALLBACK[slug];
  if (!src) return null;
  return <Image src={src} alt="" fill sizes="(min-width: 1024px) 44vw, 90vw" className="rounded-3xl object-cover" />;
}

/**
 * (01) Selected work. On wide screens one vessel stays beside the cases and the water reshapes for
 * each client as it scrolls past. On phones each case has its own stage that holds while its card
 * slides over it, so the shape is always in view while you read.
 */
export function SelectedWork({ flagships }: { flagships: CaseStudy[] }) {
  const forms = flagships.map((s) => FORM_BY_SLUG[s.slug] ?? "pool");
  // The same rhythm as every home section: padding above, and the last case's margin below (forms.css).
  // The negative scroll margin keeps "See the work" landing on the label, as before the padding.
  return (
    <section
      id="work"
      aria-labelledby="selected-title"
      className="relative scroll-mt-[calc(5rem-var(--spacing-section))] px-(--gutter) pt-section"
    >
      <p className="label">(01) Selected work</p>
      <h2 id="selected-title" className="mt-4 font-display text-showpiece font-semibold">
        Shapes we&apos;ve taken<span className="stop">.</span>
      </h2>

      <div className="sw-grid mt-10 lg:mt-6">
        <div className="sw-vessel-col" aria-hidden>
          <div className="sw-vessel-sticky">
            <FormVessel
              first={forms[0]}
              className="sw-vessel"
              fallbacks={flagships.map((s, i) => ({ form: forms[i], node: <Fallback slug={s.slug} /> }))}
            />
          </div>
        </div>

        <ol className="sw-list">
          {flagships.map((study, i) => {
            const t = visibleTestimonial(study.testimonial);
            return (
              <li key={study.slug} data-case-form={forms[i]} className="sw-case">
                <div className="sw-stage" aria-hidden>
                  <FormAnchor form={forms[i]} className="relative h-full w-full" fallback={<Fallback slug={study.slug} />} />
                </div>
                <div className="sw-card">
                  <p className="flex items-center gap-2 font-mono text-sm text-(--text-3)">
                    {/* Lifted halfway to paper, so even a dark client colour shows on ink. */}
                    <span className="size-2 shrink-0 rounded-full" style={{ background: `color-mix(in oklab, ${study.theme.accent}, var(--paper))` }} aria-hidden />
                    <span>
                      <MetaParts parts={[String(i + 1).padStart(2, "0"), ...study.industry.split(" · ")]} />
                    </span>
                  </p>
                  <h3 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-7xl">
                    {study.client}
                    <span className="stop">.</span>
                  </h3>
                  <p className="mt-5 max-w-[34ch] text-xl leading-snug text-paper/85 md:text-2xl">{study.headline}</p>
                  {/* Two equal columns while the numbers fit; a long number takes the room it needs (it
                      never breaks), and a pair that can't share a line at all stacks instead. */}
                  <dl className="mt-8 flex flex-wrap gap-6 md:mt-10">
                    {study.metrics.slice(0, 2).map((m) => (
                      <div key={m.label} className="flex-1 border-t border-paper/15 pt-4">
                        <dt className="sr-only">{m.label}</dt>
                        <dd>
                          <span className="block font-display text-3xl font-semibold tracking-tight whitespace-nowrap md:text-4xl">{m.value}</span>
                          <span className="mt-1 block text-sm text-(--text-3)">{m.label}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {t ? <p className="mt-8 max-w-[44ch] text-(--text-3) italic">“{t.quote}”</p> : null}
                  <FlowLink
                    href={`/work/${study.slug}`}
                    direction="deeper"
                    className="btn btn--accent btn--lg mt-8 md:mt-10"
                    style={{ "--c-accent": study.theme.accent, "--c-on-accent": study.theme.onAccent } as CSSProperties}
                  >
                    View case study <span aria-hidden>→</span>
                  </FlowLink>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
