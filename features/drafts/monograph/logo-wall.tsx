"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useNear } from "./near";

export type Logo = { name: string; src: string; width: number; height: number };

/** Optical size for a logo: wide wordmarks get less height, compact marks more, so none shouts. */
function logoK(width: number, height: number) {
  return Math.sqrt(2.6 / (width / height));
}

/**
 * "Trusted by", set as a colophon: every client in a hairline grid of equal cells. The names are
 * in the page from the start; the marks themselves load only as the wall comes near, so twenty-seven
 * small files never queue ahead of the title page.
 */
export function LogoWall({ clients }: { clients: Logo[] }) {
  const [ref, near] = useNear<HTMLUListElement>();
  return (
    <ul ref={ref} className="m-logos" aria-label="Clients">
      {clients.map((client) => {
        const k = logoK(client.width, client.height);
        const aspect = client.width / client.height;
        // Drawn at most 2.4rem tall (see .m-logos__img).
        const h = Math.min(2.4, Math.max(1, k * 1.6)) * 16;
        return (
          <li key={client.name} className="m-logos__cell">
            {near ? (
              <Image
                src={client.src}
                alt={client.name}
                width={client.width}
                height={client.height}
                sizes={`${Math.ceil(aspect * h)}px`}
                style={{ "--k": k.toFixed(3) } as CSSProperties}
                className="m-logos__img"
              />
            ) : (
              <span className="sr-only">{client.name}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
