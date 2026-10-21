"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { pad } from "./dot-engine";

export type ServiceKey = {
  id: string;
  title: string;
  line: string;
  proof: string[];
  image: string;
};

/**
 * Six latching keys under a screen. Press one and it stays down, its lamp lights, and the screen
 * cuts to that service: its picture, its line, and the clients whose case studies prove it.
 * A tab list (← → Home End between the keys); every panel is in the page for crawlers, only the
 * selected one is shown.
 */
export function ServiceKeys({ services }: { services: ServiceKey[] }) {
  const [sel, setSel] = useState(0);
  const [changes, setChanges] = useState(0);
  const keys = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (i: number, focus = false) => {
    if (i !== sel) {
      setSel(i);
      setChanges((n) => n + 1);
    }
    if (focus) keys.current[i]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = services.length;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (sel + 1) % n
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (sel - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  };

  return (
    <div className="ds-svc">
      <div className="ds-svc__screen ds-screen ds-stack" data-power>
        {services.map((s, i) => (
          <div
            key={s.id}
            id={`ds-svc-panel-${s.id}`}
            role="tabpanel"
            aria-labelledby={`ds-svc-key-${s.id}`}
            className="ds-svc__panel"
            data-on={i === sel || undefined}
          >
            <div className="ds-svc__pic">
              <Image src={s.image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="ds-cover" />
            </div>
            <div className="ds-svc__text">
              <p className="ds-k ds-num ds-svc__no">
                S.{pad(i + 1)} / {pad(services.length)}
              </p>
              <h3 className="ds-svc__title">
                <FlowLink href={`/services#${s.id}`} className="ds-svc__link">
                  {s.title} <span aria-hidden>→</span>
                </FlowLink>
              </h3>
              <p className="ds-svc__line">{s.line}</p>
              {s.proof.length ? (
                <div className="ds-svc__proof">
                  <p className="ds-k">Proof</p>
                  <ul className="ds-svc__clients">
                    {s.proof.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {changes ? <span key={changes} className="ds-svc__scan" aria-hidden /> : null}
      </div>

      <div className="ds-svc__keys" role="tablist" aria-label="Services" onKeyDown={onKey}>
        {services.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              keys.current[i] = el;
            }}
            id={`ds-svc-key-${s.id}`}
            type="button"
            role="tab"
            aria-selected={i === sel}
            aria-controls={`ds-svc-panel-${s.id}`}
            tabIndex={i === sel ? 0 : -1}
            className="ds-svkey"
            onClick={() => choose(i)}
          >
            <span className="ds-svkey__top" aria-hidden>
              <span className="ds-num">{pad(i + 1)}</span>
              <span className="ds-svkey__lamp" />
            </span>
            <span className="ds-svkey__label">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
