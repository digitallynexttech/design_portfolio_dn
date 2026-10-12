import Image from "next/image";
import { ARCHIVE } from "@/content/archive";

/**
 * Earlier work: screenshot cards that link out to the live sites (the work is real and still running).
 * Phones get a swipe rail that snaps card by card; wider screens get the grid.
 */
export function ArchiveGrid() {
  return (
    <ul className="-mx-(--gutter) flex snap-x snap-mandatory scroll-px-(--gutter) gap-4 overflow-x-auto overscroll-x-contain px-(--gutter) pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
      {ARCHIVE.map((entry) => {
        const card = (
          <>
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-ink-2 ring-1 ring-paper/10">
              <Image
                src={entry.image.src}
                alt={entry.image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <p className="text-xl font-semibold">
                {entry.client}
                {entry.url ? (
                  <>
                    <span aria-hidden className="ml-1 text-paper/40">
                      ↗
                    </span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </>
                ) : null}
              </p>
              <p className="shrink-0 font-mono text-xs text-paper/60">
                {entry.platform}
                {entry.year ? ` · ${entry.year}` : ""}
              </p>
            </div>
            <p className="mt-1 text-sm text-paper/60">{entry.sector}</p>
            <p className="mt-2 text-paper/70">{entry.note}</p>
          </>
        );
        return (
          <li key={entry.client} className="relative w-[80vw] max-w-[22rem] shrink-0 snap-start sm:w-auto sm:max-w-none">
            {entry.url ? (
              <a href={entry.url} className="group block rounded-xl" target="_blank" rel="noopener">
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
