"use client";

import Image from "next/image";
import { useState } from "react";
import type { WorkCardData } from "@/components/work/work-card";
import { FlowLink } from "@/components/ui/flow-link";
import { MetaParts } from "@/features/home/meta-parts";
import { useNear } from "./near";

/**
 * More work, set as a book's index: number, client, sector, result. With a mouse or keyboard the
 * facing column shows the entry's own screen as a plate; on touch screens, where nothing hovers,
 * every entry carries its screen as a thumbnail instead.
 */
export function WorkIndex({ studies, start, heading }: { studies: WorkCardData[]; start: number; heading: React.ReactNode }) {
  const [active, setActive] = useState(0);
  // The plates waiting under the active one are clipped away, and a browser never lazy-loads a
  // picture it cannot see; so once the index is near, all of them load at once. Phones never show
  // this column (display: none), so they never load them.
  const [frame, near] = useNear<HTMLDivElement>();
  const shown = studies[active];

  return (
    <div className="m-index">
      <div className="m-index__aside">
        {heading}
        <figure className="m-index__plate" aria-hidden>
          <div ref={frame} className="m-index__frame">
            {studies.map((study, i) => (
              <div key={study.slug} className="m-index__layer" data-on={i === active ? "" : undefined}>
                <Image src={study.poster.src} alt="" fill sizes="30vw" loading={near ? "eager" : "lazy"} className="m-index__img" />
              </div>
            ))}
          </div>
          <figcaption className="m-caption">
            <span className="m-caption__no">No. {String(start + active).padStart(2, "0")}</span> {shown.headline}
          </figcaption>
        </figure>
      </div>

      <div className="m-index__table">
        <p className="m-index__cols" aria-hidden>
          <span>No.</span>
          <span>Client</span>
          <span>Industry</span>
          <span>Result</span>
        </p>
        <ol className="m-index__rows">
          {studies.map((study, i) => (
            <li key={study.slug}>
              <FlowLink
                href={`/work/${study.slug}`}
                direction="deeper"
                className="m-index__row"
                data-on={i === active ? "" : undefined}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-describedby={`m-${study.slug}-d`}
              >
                <span className="m-index__thumb" aria-hidden>
                  <Image src={study.poster.src} alt="" fill sizes="7rem" className="m-index__img" />
                </span>
                <span className="m-index__no" aria-hidden>
                  {String(start + i).padStart(2, "0")}
                </span>
                <span className="m-index__client">{study.client}</span>
                <span className="m-index__industry" id={`m-${study.slug}-d`}>
                  <MetaParts parts={study.industry.split(" · ")} />
                  <span className="sr-only">. {study.headline}</span>
                </span>
                <span className="m-index__result">
                  {study.metric ? (
                    <>
                      <span className="m-index__value">{study.metric.value}</span> <span className="m-index__label">{study.metric.label}</span>
                    </>
                  ) : null}
                </span>
                <span className="m-index__arrow" aria-hidden>
                  →
                </span>
              </FlowLink>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
