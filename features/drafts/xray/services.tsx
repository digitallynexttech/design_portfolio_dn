"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { Plate, pad } from "./parts";

export type ServiceItem = { id: string; title: string; line: string; proof: string[]; image: string };

/**
 * The six services as a component library: an index of components on the left (each with its
 * one-line description, so nothing hides), a canvas that renders the selected one, and its props.
 * The index is a tablist: hover or click a component to render it, arrow keys move through them.
 * Phones get every component as its own specimen, stacked (CSS swaps the two layouts).
 */
export function ServiceLibrary({ items }: { items: ServiceItem[] }) {
  const [on, setOn] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = items.length;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (i + 1) % n
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (i - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setOn(next);
    tabs.current[next]?.focus();
  };

  return (
    <>
      <div className="dx-lib">
        <div className="dx-lib__index">
          <p className="dx-lib__head dx-k">
            <span>Components</span>
            <span>{pad(items.length)}</span>
          </p>
          <div role="tablist" aria-label="Services" aria-orientation="vertical" className="dx-lib__tabs">
            {items.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`dx-svc-tab-${s.id}`}
                aria-selected={on === i}
                aria-controls={`dx-svc-panel-${s.id}`}
                tabIndex={on === i ? 0 : -1}
                className="dx-lib__tab"
                data-x="button"
                onClick={() => setOn(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setOn(i);
                }}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="dx-lib__no dx-k" aria-hidden>
                  S.{pad(i + 1)}
                </span>
                <span className="dx-lib__title">{s.title}</span>
                <span className="dx-lib__line">{s.line}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dx-lib__stage">
          {items.map((s, i) => (
            <div
              key={s.id}
              role="tabpanel"
              id={`dx-svc-panel-${s.id}`}
              aria-labelledby={`dx-svc-tab-${s.id}`}
              className="dx-lib__panel"
              data-on={on === i || undefined}
              inert={on !== i}
            >
              <div className="dx-lib__canvas">
                <p className="dx-lib__path dx-k" aria-hidden>
                  <span>services/{s.id}</span>
                  <span>1440 × 960</span>
                </p>
                <Plate w={1440} h={960} file={`${s.id}.webp`} className="dx-lib__plate">
                  <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 40vw, 1px" className="dx-cover" />
                </Plate>
              </div>
              <div className="dx-props">
                <p className="dx-props__head dx-k" aria-hidden>
                  <span>Props</span>
                  <span>
                    &lt;Service id=&quot;{s.id}&quot; /&gt;
                  </span>
                </p>
                <dl className="dx-props__list">
                <div className="dx-props__row">
                  <dt>title</dt>
                  <dd>{s.title}</dd>
                </div>
                <div className="dx-props__row">
                  <dt>line</dt>
                  <dd>{s.line}</dd>
                </div>
                <div className="dx-props__row">
                  <dt>proof</dt>
                  <dd>
                    <ul className="dx-props__proof">
                      {s.proof.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="dx-props__row">
                  <dt>href</dt>
                  <dd>
                    <FlowLink href={`/services#${s.id}`} className="dx-textlink">
                      /services#{s.id} <span aria-hidden>→</span>
                    </FlowLink>
                  </dd>
                </div>
                </dl>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phones: every component, stacked. */}
      <ol className="dx-svcs">
        {items.map((s, i) => (
          <li key={s.id} className="dx-svc">
            <p className="dx-svc__path dx-k" aria-hidden>
              <span>S.{pad(i + 1)}</span>
              <span>services/{s.id}</span>
            </p>
            <Plate w={1440} h={960} file={`${s.id}.webp`} className="dx-svc__plate">
              <Image src={s.image} alt="" fill sizes="(max-width: 1023px) 92vw, 1px" className="dx-cover" />
            </Plate>
            <h3 className="dx-svc__title" data-x="h3">
              <FlowLink href={`/services#${s.id}`} className="dx-svc__link">
                {s.title}
              </FlowLink>
            </h3>
            <p className="dx-svc__line">{s.line}</p>
            {s.proof.length ? (
              <p className="dx-svc__proof dx-k">
                <span className="sr-only">Proof: </span>
                {s.proof.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </>
  );
}
