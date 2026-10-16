import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { WorkCardData } from "@/components/work/work-card";
import { MetaParts } from "@/features/home/meta-parts";
import { CreditsDirector } from "./credits-director";

/**
 * More work as a credits list beside a strip of film. Each row is one study; the strip holds a frame
 * of each, and the frame of the row you point at, focus or scroll past slides into the gate. Phones
 * carry each frame inside its row instead.
 */
export function DeepCredits({ studies, start }: { studies: WorkCardData[]; start: number }) {
  return (
    <section id="dd-more" className="dd-section dd-more" aria-labelledby="more-title">
      <div className="dd-more__head">
        <div>
          <p className="dd-label">More work</p>
          <h2 id="more-title" className="dd-more__title dd-rise">
            Different containers.
          </h2>
        </div>
        <FlowLink href="/work" className="dd-btn dd-btn--line dd-more__all">
          All work <span aria-hidden>→</span>
        </FlowLink>
      </div>

      <div className="dd-credits" data-active="0" style={{ "--active": 0 } as CSSProperties}>
        <ol className="dd-credits__list">
          {studies.map((study, i) => (
            <li key={study.slug} className="dd-credits__item" data-i={i} style={{ "--accent": study.accent } as CSSProperties}>
              <FlowLink
                href={`/work/${study.slug}`}
                direction="deeper"
                className="dd-credits__row"
                aria-describedby={`dd-${study.slug}-d`}
              >
                <span className="dd-credits__thumb" aria-hidden>
                  <Image src={study.poster.src} alt="" fill sizes="7rem" className="dd-cover" />
                </span>
                <span className="dd-credits__index" aria-hidden>
                  {String(start + i).padStart(2, "0")}
                </span>
                <span className="dd-credits__client">{study.client}</span>
                <span className="dd-credits__meta" id={`dd-${study.slug}-d`}>
                  <span className="dd-credits__industry">
                    <MetaParts parts={study.industry.split(" · ")} />
                  </span>
                  <span className="sr-only">. {study.headline}</span>
                  {study.metric ? (
                    <span className="dd-credits__metric">
                      <span className="dd-credits__value">{study.metric.value}</span> {study.metric.label}
                    </span>
                  ) : null}
                </span>
                <span className="dd-credits__arrow" aria-hidden>
                  →
                </span>
              </FlowLink>
            </li>
          ))}
        </ol>

        <div className="dd-strip" aria-hidden>
          <div className="dd-strip__gate">
            <div className="dd-strip__reel">
              {studies.map((study, i) => (
                <div key={study.slug} className="dd-strip__frame" data-i={i}>
                  <Image src={study.poster.src} alt="" fill sizes="(min-width: 1536px) 30rem, 34vw" className="dd-cover" />
                  <span className="dd-strip__code">DN {String(start + i).padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FlowLink href="/work" className="dd-btn dd-btn--line dd-btn--lg dd-more__all dd-more__all--foot">
        All work <span aria-hidden>→</span>
      </FlowLink>
      <CreditsDirector />
    </section>
  );
}
