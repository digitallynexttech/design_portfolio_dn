import Image from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import type { CaseStudy } from "@/content/types";
import { visibleTestimonial } from "@/content/work";
import { FormAnchor } from "@/features/water/forms/anchors";
import type { FormId } from "@/features/water/forms/shapes";
import { FormVessel } from "./form-vessel";

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
  return <Image src={src} alt="" fill sizes="(min-width: 768px) 44vw, 90vw" className="rounded-3xl object-cover" />;
}

/**
 * (02) Selected work. On wide screens one vessel stays beside the cases and the water reshapes for
 * each client as it scrolls past. On phones each case has its own stage that holds while its card
 * slides over it, so the shape is always in view while you read.
 */
export function SelectedWork({ flagships }: { flagships: CaseStudy[] }) {
  const forms = flagships.map((s) => FORM_BY_SLUG[s.slug] ?? "pool");
  return (
    <section id="work" aria-labelledby="selected-title" className="relative scroll-mt-20 px-(--gutter)">
      <p className="label">(02) Selected work</p>
      <h2 id="selected-title" className="mt-4 font-display text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.92] font-semibold tracking-[-0.035em]">
        Shapes we&apos;ve taken<span className="stop">.</span>
      </h2>

      <div className="sw-grid mt-10 md:mt-6">
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
                  <p className="flex items-center gap-2 font-mono text-sm text-paper/70">
                    <span className="size-2 rounded-full" style={{ background: study.theme.accent }} aria-hidden />
                    {String(i + 1).padStart(2, "0")} · {study.industry}
                  </p>
                  <h3 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-7xl">
                    {study.client}
                    <span className="stop">.</span>
                  </h3>
                  <p className="mt-5 max-w-[34ch] text-xl leading-snug text-paper/85 md:text-2xl">{study.headline}</p>
                  <dl className="mt-8 grid grid-cols-2 gap-6 md:mt-10">
                    {study.metrics.slice(0, 2).map((m) => (
                      <div key={m.label} className="border-t border-paper/15 pt-4">
                        <dt className="sr-only">{m.label}</dt>
                        <dd>
                          <span className="block font-display text-3xl font-semibold tracking-tight md:text-4xl">{m.value}</span>
                          <span className="mt-1 block text-sm text-paper/60">{m.label}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {t ? <p className="mt-8 max-w-[44ch] text-paper/60 italic">“{t.quote}”</p> : null}
                  <FlowLink
                    href={`/work/${study.slug}`}
                    direction="deeper"
                    className="mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-medium md:mt-10"
                    style={{ background: study.theme.accent, color: study.theme.onAccent }}
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
