"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { pad } from "./dot-engine";

export type TickerClient = {
  name: string;
  src: string;
  width: number;
  height: number;
};

/**
 * The client wall as an LED ticker: the logos run across a strip of lamps (a dot mask over the
 * moving track, so the lamps stay put and the marks travel through them). Hover or touch a logo and
 * the readout names it; HOLD stops the strip (and a pointer resting on it holds it too). With reduced
 * motion it stands still and wraps, every logo in view.
 */
export function Ticker({ clients }: { clients: TickerClient[] }) {
  const [held, setHeld] = useState(false);
  const [name, setName] = useState<{ no: string; name: string } | null>(null);

  const strip = (copy: boolean) => (
    <ul className="ds-tick__run" aria-hidden={copy || undefined} aria-label={copy ? undefined : "Clients"}>
      {clients.map((c, i) => {
        // Every mark gets the same visual weight: wide wordmarks shorter, square marks taller.
        const aspect = c.width / c.height;
        const h = Math.max(0.62, Math.min(1, Math.sqrt(2.4 / aspect)));
        return (
          <li
            key={c.name}
            className="ds-tick__item"
            style={
              {
                "--h": h.toFixed(3),
                "--ar": aspect.toFixed(3),
              } as CSSProperties
            }
            onPointerEnter={() => setName({ no: pad(i + 1), name: c.name })}
            onPointerDown={() => setName({ no: pad(i + 1), name: c.name })}
          >
            <Image
              src={c.src}
              alt={copy ? "" : c.name}
              width={c.width}
              height={c.height}
              sizes={`${Math.ceil(aspect * 56 * h)}px`}
              className="ds-tick__logo"
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="ds-tick" data-held={held || undefined}>
      <div className="ds-tick__panel" onPointerLeave={() => setName(null)}>
        <div className="ds-tick__lamps">
          <div className="ds-tick__track" style={{ "--n": clients.length } as CSSProperties}>
            {strip(false)}
            {strip(true)}
          </div>
        </div>
      </div>
      <div className="ds-tick__deck">
        <button type="button" className="ds-key ds-key--sm" aria-pressed={held} onClick={() => setHeld((h) => !h)}>
          <span className="ds-key__lamp" aria-hidden />
          {held ? "Run" : "Hold"}
          <span className="sr-only"> the client ticker</span>
        </button>
        <p className="ds-tick__read ds-k" aria-hidden>
          {name ? (
            <>
              <span className="ds-num">C{name.no}</span> <span className="ds-tick__name">{name.name}</span>
            </>
          ) : (
            <span className="ds-num">
              C01–C{pad(clients.length)} · {clients.length} clients
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
