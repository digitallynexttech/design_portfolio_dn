"use client";

import { addTransitionType, startTransition, useMemo, useState, useSyncExternalStore, ViewTransition } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { WorkCard, type WorkCardData } from "./work-card";

const ALL = "All";
const FILTER = "work-filter";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const readUrl = () => new URLSearchParams(window.location.search).get("discipline") ?? ALL;
const readServer = () => ALL;

type Slot = { study: WorkCardData; wide: boolean };

/**
 * The "All" view as an editorial rhythm: a flagship takes a full row, then two standards share the
 * next, and so on (F, S S, F, S S…). Spare flagships run full width, and an unpaired standard widens
 * to fill its row, so the grid never shows a hole at any width.
 */
function editorial(studies: WorkCardData[]): Slot[] {
  const flagships = studies.filter((s) => s.tier === "flagship");
  const standards = studies.filter((s) => s.tier !== "flagship");
  const rows: Slot[][] = [];
  for (let i = 0; i < standards.length; i += 2) {
    const pair = standards.slice(i, i + 2);
    rows.push(pair.map((study) => ({ study, wide: pair.length === 1 })));
  }
  const slots: Slot[] = [];
  for (let i = 0; i < Math.max(flagships.length, rows.length); i++) {
    if (flagships[i]) slots.push({ study: flagships[i], wide: true });
    if (rows[i]) slots.push(...rows[i]);
  }
  return slots;
}

/**
 * Filterable grid. The filter lives in the URL (?discipline=…) so it can be shared, but is read on
 * the client so the page itself stays fully prerendered. Picking a filter runs as a transition, so
 * the cards flow to their new places instead of jumping.
 */
export function WorkGrid({ studies }: { studies: WorkCardData[] }) {
  const disciplines = useMemo(
    () => [ALL, ...Array.from(new Set(studies.flatMap((s) => s.disciplines))).sort()],
    [studies],
  );
  const fromUrl = useSyncExternalStore(subscribe, readUrl, readServer);
  const [picked, setPicked] = useState<string | null>(null);
  const wanted = picked ?? fromUrl;
  const active = disciplines.includes(wanted) ? wanted : ALL;
  const [sheet, setSheet] = useState(false);

  const choose = (value: string) => {
    const url = new URL(window.location.href);
    if (value === ALL) url.searchParams.delete("discipline");
    else url.searchParams.set("discipline", value);
    window.history.replaceState(window.history.state, "", url);
    startTransition(() => {
      addTransitionType(FILTER);
      setPicked(value);
    });
  };

  const all = active === ALL;
  const slots: Slot[] = all ? editorial(studies) : studies.filter((s) => s.disciplines.includes(active)).map((study) => ({ study, wide: false }));

  const chips = (onPick?: () => void) => (
    <ul className="flex flex-wrap gap-2" aria-label="Filter by discipline">
      {disciplines.map((d) => (
        <li key={d}>
          <button
            type="button"
            aria-pressed={active === d}
            onClick={() => {
              choose(d);
              onPick?.();
            }}
            className="rounded-full border border-paper/20 px-4 py-2 text-sm text-paper/70 transition-colors hover:text-paper aria-pressed:border-teal aria-pressed:bg-teal aria-pressed:text-ink"
          >
            {d}
          </button>
        </li>
      ))}
    </ul>
  );

  // Only the filter transition moves cards; page navigations leave them inside the page's own flow.
  const flow = { [FILTER]: "work-reflow", default: "none" };

  return (
    <div>
      {/* Sticky while the grid scrolls: under the site header while it shows, at the top when it hides. */}
      <div className="work-filter sticky z-20 -mx-(--gutter) border-b border-paper/10 bg-[color-mix(in_oklab,var(--ink)_78%,transparent)] px-(--gutter) py-3 backdrop-blur-xl">
        <div className="hidden md:block">{chips()}</div>
        <div className="flex items-center justify-between md:hidden">
          <p className="text-sm text-paper/60">
            Showing <span className="text-paper">{active}</span>
          </p>
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="rounded-full border border-paper/20 px-4 py-3 text-sm">
            Filter
          </button>
        </div>
      </div>
      <LiquidSurface open={sheet} onClose={() => setSheet(false)} origin="bottom" label="Filter work">
        <p className="label mb-5">Filter by discipline</p>
        {chips(() => setSheet(false))}
      </LiquidSurface>

      <p className="sr-only" aria-live="polite">
        {slots.length} case studies shown
      </p>

      <ul className={`mt-12 grid gap-x-8 gap-y-16 md:grid-cols-2 ${all ? "" : "lg:grid-cols-3"}`}>
        {slots.map(({ study, wide }, i) => (
          <ViewTransition key={study.slug} enter={flow} exit={flow} update={flow} default="none">
            <li className={wide ? "md:col-span-2" : ""}>
              <WorkCard study={study} large={wide} priority={i < 2} headingLevel="h2" showChapters />
            </li>
          </ViewTransition>
        ))}
      </ul>
    </div>
  );
}
