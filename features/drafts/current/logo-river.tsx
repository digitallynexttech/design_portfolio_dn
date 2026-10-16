import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { CLIENTS } from "@/content/clients";
import { RiverToggle } from "./river-toggle";

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

/** Optical size per logo (--k = √(2.6 / aspect)), mirrored in current.css, and an honest `sizes`. */
function fit(width: number, height: number) {
  const aspect = width / height;
  const k = Math.sqrt(2.6 / aspect);
  const phone = Math.ceil(aspect * clamp(1.1, k * 1.6, 2.3) * 16);
  const wide = Math.ceil(aspect * clamp(1.5, k * 2.25, 3.1) * 16);
  return { k: k.toFixed(3), sizes: `(min-width: 768px) ${wide}px, ${phone}px` };
}

/**
 * "Trusted by": the client logos carried along a pill-shaped channel. Rendered on the server as
 * plain optimised images (54 of them, the set twice for a seamless loop), so none of them hydrate;
 * only the Pause switch is client code (WCAG 2.2.2). A pointer rests the current too; with reduced
 * motion every logo shows once, still, in a wrap.
 */
export function LogoRiver() {
  const row = [...CLIENTS, ...CLIENTS];
  return (
    <div className="dc-river">
      <div className="dc-river__head">
        <p className="dc-tag">Trusted by</p>
        <RiverToggle />
      </div>
      <div className="dc-river__channel">
        <ul className="dc-river__track" aria-label="Clients">
          {row.map((client, i) => {
            const f = fit(client.logo.width, client.logo.height);
            const copy = i >= CLIENTS.length;
            const { props } = getImageProps({
              src: client.logo.src,
              alt: copy ? "" : client.name,
              width: client.logo.width,
              height: client.logo.height,
              sizes: f.sizes,
            });
            return (
              <li key={`${client.name}-${i}`} aria-hidden={copy || undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- getImageProps supplies alt, src, srcSet and sizes */}
                <img {...props} style={{ ...props.style, "--k": f.k } as CSSProperties} className="dc-river__logo" />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
