import Image from "next/image";
import type { CSSProperties } from "react";
import { ARCHIVE } from "@/content/archive";

/**
 * Earlier work, in the home's style (inside .dn-theme): each site's screenshot in a hairline frame,
 * a mono line for its sector and stack, the client, and a note. The cards link out to the live sites
 * (the work is real and still running). Phones get a swipe rail that snaps card by card; wider
 * screens get the grid.
 */
export function ArchiveGrid() {
  return (
    <ul className="dn-cards">
      {ARCHIVE.map((entry) => {
        const card = (
          <>
            <div className="dp-box" style={{ "--ar": "16 / 10" } as CSSProperties}>
              <Image
                src={entry.image.src}
                alt={entry.image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw"
                className="dp-plate dp-cover dp-cover--top"
              />
            </div>
            <p className="dp-k dn-card__meta">
              {entry.sector} · {entry.platform}
              {entry.year ? ` · ${entry.year}` : ""}
            </p>
            <p className="dn-card__title">
              {entry.client}
              {entry.url ? (
                <>
                  <span aria-hidden className="dn-card__out">
                    ↗
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </>
              ) : null}
            </p>
            <p className="dn-card__note">{entry.note}</p>
          </>
        );
        return (
          <li key={entry.client}>
            {entry.url ? (
              <a href={entry.url} className="dn-card__link" target="_blank" rel="noopener">
                {card}
              </a>
            ) : (
              <div>{card}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
