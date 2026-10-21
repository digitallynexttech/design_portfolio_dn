"use client";

import Image from "next/image";
import { useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";

export type ServiceRow = { id: string; title: string; line: string; proof: string[] };

/**
 * The six services as an index. On wide screens the plate beside the list shows the service under
 * the pointer or focus (each row is a link to its section on /services); on phones every row
 * carries its own plate.
 */
export function ServiceIndex({ services }: { services: ServiceRow[] }) {
  const [on, setOn] = useState(0);
  return (
    <div className="df-svc">
      <ol className="df-svc__list">
        {services.map((s, i) => (
          <li key={s.id} className="df-svc__row" data-on={i === on || undefined} onPointerEnter={() => setOn(i)}>
            <span className="df-svc__no df-num" aria-hidden>
              S.{i + 1}
            </span>
            <span className="df-svc__plate df-svc__plate--row">
              <Image src={`/services/${s.id}.webp`} alt="" fill sizes="(max-width: 767px) 30vw, 1px" className="df-cover" />
            </span>
            <div className="df-svc__text">
              <h3 className="df-svc__title">
                <FlowLink href={`/services#${s.id}`} className="df-svc__link" onFocus={() => setOn(i)}>
                  {s.title}
                </FlowLink>
              </h3>
              <p className="df-svc__line">{s.line}</p>
              {s.proof.length ? (
                <p className="df-svc__proof df-k">
                  <span className="sr-only">Proof: </span>
                  {s.proof.join(" · ")}
                </p>
              ) : null}
            </div>
            <span className="df-svc__arrow" aria-hidden>
              →
            </span>
          </li>
        ))}
      </ol>
      <div className="df-svc__view" aria-hidden>
        {services.map((s, i) => (
          <span key={s.id} className="df-svc__plate df-svc__plate--view" data-on={i === on || undefined}>
            <Image src={`/services/${s.id}.webp`} alt="" fill sizes="(min-width: 768px) 40vw, 1px" className="df-cover" />
          </span>
        ))}
        <span className="df-svc__caption df-k">
          <span className="df-num">S.{on + 1}</span> {services[on]?.title}
        </span>
      </div>
    </div>
  );
}
