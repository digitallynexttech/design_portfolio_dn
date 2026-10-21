"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";

export type ServiceRow = { id: string; title: string; line: string; proof: string[] };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The six services as a typographic list. With a mouse or keyboard, the row you're on takes the
 * weight and swaps its picture and its proof (the clients it was done for) into the plate beside
 * the list; on touch, a tap opens the row in place with the same.
 */
export function ServiceList({ services }: { services: ServiceRow[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const uid = useId();
  const now = services[active];

  return (
    <div className="dk-svc">
      <ol className="dk-svc__list">
        {services.map((s, i) => {
          const panel = `${uid}-s${i}`;
          const isOpen = open === i;
          return (
            <li key={s.id} className="dk-svc__row" data-on={active === i || undefined} data-open={isOpen || undefined}>
              <h3 className="dk-svc__h">
                <FlowLink
                  href={`/services#${s.id}`}
                  className="dk-svc__link"
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setActive(i);
                  }}
                  onFocus={() => setActive(i)}
                >
                  <span className="dk-svc__no dk-mono" aria-hidden>
                    {pad(i + 1)}
                  </span>
                  <span className="dk-svc__title">{s.title}</span>
                </FlowLink>
                <button
                  type="button"
                  className="dk-svc__tog"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="dk-svc__no dk-mono" aria-hidden>
                    {pad(i + 1)}
                  </span>
                  <span className="dk-svc__title">{s.title}</span>
                  <span className="dk-row__plus" aria-hidden />
                </button>
              </h3>
              <div id={panel} className="dk-svc__body">
                <span className="dk-svc__media">
                  <Image src={`/services/${s.id}.webp`} alt="" width={1440} height={960} sizes="(max-width: 1023px) 92vw, 1px" />
                </span>
                <p className="dk-svc__line">{s.line}</p>
                {s.proof.length ? (
                  <p className="dk-svc__proof dk-mono">
                    <span className="dk-svc__k">Proof</span> {s.proof.join(" · ")}
                  </p>
                ) : null}
                <FlowLink href={`/services#${s.id}`} className="dk-svc__cta">
                  {s.title} <span aria-hidden>→</span>
                </FlowLink>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="dk-svc__plate" aria-hidden>
        <div className="dk-svc__frame">
          {services.map((s, i) => (
            <Image
              key={s.id}
              src={`/services/${s.id}.webp`}
              alt=""
              fill
              sizes="(min-width: 1024px) 36vw, 1px"
              className="dk-svc__shot"
              data-on={active === i || undefined}
            />
          ))}
          <span className="dk-svc__count dk-mono">
            {pad(active + 1)} / {pad(services.length)}
          </span>
        </div>
        <p className="dk-svc__cap">
          <span className="dk-mono dk-svc__k">Proof</span>
          <span key={now.id} className="dk-svc__names">
            {now.proof.join(" · ")}
          </span>
        </p>
      </div>
    </div>
  );
}
