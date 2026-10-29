import type { Metadata } from "next";
import { PageFlow } from "@/components/ui/page-flow";
import { ArchiveGrid } from "@/components/work/archive-grid";
import { RouteFocus } from "@/components/work/route-focus";
import { WORK_CARDS } from "@/content/work/cards";
import { WorkHeadAstronaut } from "@/features/stage3d/astro/astro-figure";
import { Shaft, WA_MODE_SCRIPT } from "@/features/work/shaft";

// The index must stay complete static output; the build fails if it ever needs per-request work.
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies from Digitally Next's design and development studio: brand sites, commerce, platforms and 3D - each with the hurdles we hit and how we fixed them.",
  alternates: { canonical: "/work" },
};

/**
 * Work, "The Shaft" (Karan chose it from five falling drafts, 26 Oct 2026): you look straight down a
 * shaft; the studies hang on its walls and turn to face you as you fall past (features/work/shaft.tsx).
 */
export default function WorkPage() {
  return (
    <PageFlow>
      <main id="main" className="dn-theme dn-page wa s3-host">
        {/* Picks the shaft, the phone drop or the still rows before the first paint (shaft.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: WA_MODE_SCRIPT }} />
        <RouteFocus />
        <header className="dn-page__head">
          <p className="dp-k">(02) Work</p>
          <h1 tabIndex={-1} className="dp-title__h">
            Shapes we&apos;ve taken<span className="dp-stop">.</span>
          </h1>
          <p className="dn-page__lead">
            Every project here is a different container. Each case study opens with the real thing running, then walks
            through the brief, the design, the build - and the hurdles we hit on the way, with exactly how we fixed them.
          </p>
        </header>
        {/* Out of the shaft (phones, reduced motion), the astronaut floats beside the title. */}
        <WorkHeadAstronaut />

        <Shaft studies={WORK_CARDS} />

        <section aria-labelledby="archive-title" className="dp-sec">
          <div className="dp-sec__head">
            <p className="dp-k">Archive</p>
            <h2 id="archive-title" className="dp-h2">
              Earlier shapes<span className="dp-stop">.</span>
            </h2>
            <p className="dn-sec__lead">Sites from before this portfolio. No case studies here - just the live work, still running.</p>
          </div>
          <ArchiveGrid />
        </section>
      </main>
    </PageFlow>
  );
}
