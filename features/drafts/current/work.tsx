import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { WorkCardData } from "@/components/work/work-card";
import type { CaseStudy } from "@/content/types";
import { visibleTestimonial } from "@/content/work";
import { MetaParts } from "@/features/home/meta-parts";
import { FIELDS, fieldStyle, inkFor } from "./colour";
import { LoopVideo } from "./loop-video";
import { Wave } from "./wave";

type Screen =
  | { kind: "video"; src: string; poster: string }
  | { kind: "image"; src: string; width: number; height: number };
type Side = { kind: "phone" | "photo"; src: string; width: number; height: number };

// What each flagship shows: its live site in a browser frame (a preview loop where one was recorded,
// otherwise the real screen), and beside it the same work in the hand: a phone screen or the product.
const MEDIA: Record<string, { screen: Screen; side: Side }> = {
  skelmet: {
    screen: { kind: "video", src: "/work/skelmet/preview.mp4", poster: "/work/skelmet/preview-poster.webp" },
    side: { kind: "photo", src: "/work/skelmet/gallery-garage-night.webp", width: 1400, height: 1400 },
  },
  "know-your-genes": {
    screen: { kind: "video", src: "/work/know-your-genes/preview.mp4", poster: "/work/know-your-genes/preview-poster.webp" },
    side: { kind: "phone", src: "/work/know-your-genes/meet-genee-phone.webp", width: 800, height: 1362 },
  },
  hard2soft: {
    screen: { kind: "video", src: "/work/hard2soft/preview.mp4", poster: "/work/hard2soft/preview-poster.webp" },
    side: { kind: "phone", src: "/work/hard2soft/symptom-check-phone.webp", width: 1170, height: 1992 },
  },
  dnms: {
    screen: { kind: "image", src: "/work/dnms/poster.webp", width: 1600, height: 1000 },
    side: { kind: "phone", src: "/work/dnms/phone-dashboard.webp", width: 780, height: 1688 },
  },
};

const host = (url?: string) => (url ? new URL(url).hostname.replace(/^www\./, "") : undefined);

function Device({ study }: { study: CaseStudy }) {
  const media = MEDIA[study.slug];
  if (!media) {
    return (
      <div className="dc-device">
        <div className="dc-browser">
          <div className="dc-browser__screen">
            <Image src={study.poster.src} alt="" fill sizes="(min-width: 1024px) 50vw, 92vw" className="dc-cover" />
          </div>
        </div>
      </div>
    );
  }
  const { screen, side } = media;
  const url = host(study.liveUrl);
  return (
    <div className="dc-device" aria-hidden>
      <div className="dc-browser">
        <div className="dc-browser__bar">
          <span className="dc-browser__dots">
            <i />
            <i />
            <i />
          </span>
          {url ? <span className="dc-browser__url">{url}</span> : null}
        </div>
        <div className="dc-browser__screen">
          {screen.kind === "video" ? (
            <>
              <Image src={screen.poster} alt="" fill sizes="(min-width: 1024px) 50vw, 92vw" className="dc-cover" />
              <LoopVideo src={screen.src} />
            </>
          ) : (
            <Image src={screen.src} alt="" fill sizes="(min-width: 1024px) 50vw, 92vw" className="dc-cover dc-cover--top" />
          )}
        </div>
      </div>
      <div className={side.kind === "phone" ? "dc-phone" : "dc-photo"}>
        <div className="dc-phone__screen">
          <Image src={side.src} alt="" fill sizes="(min-width: 1024px) 15vw, 34vw" className="dc-cover dc-cover--top" />
        </div>
      </div>
    </div>
  );
}

/**
 * Selected work. The cream of the studio carries the title; then each flagship pours in as a field
 * of its own brand colour (the text colour computed to keep AA on it), with the work itself large:
 * the live site in a browser, the phone or the product beside it, and the numbers set big.
 */
export function SelectedWork({ flagships, after }: { flagships: CaseStudy[]; after: string }) {
  return (
    <section id="work" aria-labelledby="dc-selected-title" className="dc-selected">
      <div className="dc-field dc-selected__head" data-field style={fieldStyle(FIELDS.cream)}>
        <p className="dc-tag">Selected work</p>
        <h2 id="dc-selected-title" className="dc-mega dc-rise">
          Shapes we&apos;ve taken
        </h2>
        {flagships.length ? <Wave color={flagships[0].theme.accent} variant={0} /> : null}
      </div>

      <ol className="dc-cases">
        {flagships.map((study, i) => {
          const bg = study.theme.accent;
          const fg = inkFor(bg, study.theme.onAccent);
          const t = visibleTestimonial(study.testimonial);
          return (
            <li
              key={study.slug}
              className="dc-field dc-case"
              data-field
              data-flip={i % 2 ? "" : undefined}
              style={fieldStyle({ bg, fg, soft: fg }) as CSSProperties}
            >
              <article className="dc-case__grid" aria-labelledby={`dc-case-${study.slug}`}>
                <div className="dc-case__head">
                  <p className="dc-case__meta">
                    <span className="dc-case__count">
                      {String(i + 1).padStart(2, "0")}
                      <span aria-hidden> / </span>
                      <span className="dc-sr"> of </span>
                      {String(flagships.length).padStart(2, "0")}
                    </span>
                    <span>
                      <MetaParts parts={study.industry.split(" · ")} />
                    </span>
                  </p>
                  <h3 id={`dc-case-${study.slug}`} className="dc-case__client">
                    {study.client}
                  </h3>
                  <p className="dc-case__line">{study.headline}</p>
                </div>
                <div className="dc-case__media">
                  <Device study={study} />
                </div>
                <dl className="dc-case__metrics">
                  {study.metrics.slice(0, 2).map((m) => (
                    <div key={m.label} className="dc-metric">
                      <dt className="dc-metric__label">{m.label}</dt>
                      <dd className="dc-metric__value">{m.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="dc-case__cta">
                  {t ? <p className="dc-case__quote">“{t.quote}”</p> : null}
                  <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dc-btn dc-btn--solid dc-btn--lg">
                    View case study <span aria-hidden>→</span>
                  </FlowLink>
                </div>
              </article>
              <Wave color={flagships[i + 1]?.theme.accent ?? after} variant={i + 1} reverse={i % 2 === 0} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * More work: an index on paper. Each row floods with its client's colour from the bottom, like a
 * glass filling, and its screen opens out of a pill. On touch screens the screen is always shown.
 */
export function MoreWork({ studies, after }: { studies: WorkCardData[]; after: string }) {
  return (
    <section aria-labelledby="dc-more-title" className="dc-field dc-more" data-field style={fieldStyle(FIELDS.paper)}>
      <div className="dc-more__head">
        <div>
          <p className="dc-tag">More work</p>
          <h2 id="dc-more-title" className="dc-title dc-rise">
            Different containers
          </h2>
        </div>
        <FlowLink href="/work" className="dc-btn dc-btn--lg dc-more__all">
          All work <span aria-hidden>→</span>
        </FlowLink>
      </div>
      <ol className="dc-rows">
        {studies.map((study) => {
          const fg = inkFor(study.accent, study.onAccent);
          return (
            <li key={study.slug} className="dc-row" style={{ "--row-bg": study.accent, "--row-fg": fg } as CSSProperties}>
              <FlowLink
                href={`/work/${study.slug}`}
                direction="deeper"
                className="dc-row__link"
                aria-describedby={`dc-row-${study.slug}`}
              >
                <span className="dc-row__pic" aria-hidden>
                  <Image src={study.poster.src} alt="" fill sizes="(min-width: 768px) 15rem, 7.5rem" className="dc-cover dc-cover--top" />
                </span>
                <span className="dc-row__client">{study.client}</span>
                <span className="dc-row__meta" id={`dc-row-${study.slug}`}>
                  <span className="dc-row__industry">
                    <MetaParts parts={study.industry.split(" · ")} />
                  </span>
                  <span className="dc-sr">. {study.headline}</span>
                </span>
                {study.metric ? (
                  <span className="dc-row__metric">
                    <span className="dc-row__value">{study.metric.value}</span>
                    <span className="dc-row__label">{study.metric.label}</span>
                  </span>
                ) : (
                  <span className="dc-row__metric" />
                )}
                <span className="dc-row__arrow" aria-hidden>
                  →
                </span>
              </FlowLink>
            </li>
          );
        })}
      </ol>
      <FlowLink href="/work" className="dc-btn dc-btn--lg dc-more__all dc-more__all--foot">
        All work <span aria-hidden>→</span>
      </FlowLink>
      <Wave color={after} variant={2} reverse />
    </section>
  );
}
