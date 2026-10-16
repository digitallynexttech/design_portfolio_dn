"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

export type LogoPart = { name: string; src: string; width: number; height: number; sizes: string; k: string };

/**
 * "Trusted by" as a parts list: numbered cells, one client each. The page is served with each
 * client's name set in type, so it reads without script and costs nothing at first paint; the
 * logos replace the names as the list comes within a screen of the viewport.
 */
export function LogoParts({ parts }: { parts: LogoPart[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={ref} className="dg-parts__grid" aria-label="Clients">
      {parts.map((part, i) => (
        <li key={part.name} className="dg-part">
          <span className="dg-part__no dg-num" aria-hidden>
            C{String(i + 1).padStart(2, "0")}
          </span>
          {near ? (
            <Image
              src={part.src}
              alt={part.name}
              width={part.width}
              height={part.height}
              sizes={part.sizes}
              className="dg-part__logo"
              style={{ "--k": part.k } as CSSProperties}
            />
          ) : (
            <span className="dg-part__name">{part.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
