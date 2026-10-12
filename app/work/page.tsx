import type { Metadata } from "next";
import { PageFlow } from "@/components/ui/page-flow";
import { ArchiveGrid } from "@/components/work/archive-grid";
import { RouteFocus } from "@/components/work/route-focus";
import { WorkGrid } from "@/components/work/work-grid";
import { WORK_CARDS } from "@/content/work/cards";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies from Digitally Next's design and development studio: brand sites, commerce, platforms and 3D — each with the hurdles we hit and how we fixed them.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <PageFlow>
      <main id="main" className="px-(--gutter) pt-36 pb-24">
        <RouteFocus />
        <header className="max-w-5xl">
          <p className="label">(02) Work</p>
          <h1 tabIndex={-1} className="mt-4 font-display text-[clamp(3.25rem,10vw,9rem)] leading-[0.9] font-semibold tracking-[-0.035em]">
            Shapes we&apos;ve taken<span className="stop">.</span>
          </h1>
          <p className="mt-8 max-w-[52ch] text-lg text-paper/70">
            Every project here is a different container. Each case study opens with the real thing running, then walks through the
            brief, the design, the build — and the hurdles we hit on the way, with exactly how we fixed them.
          </p>
        </header>

        <div className="mt-16">
          <WorkGrid studies={WORK_CARDS} />
        </div>

        <section aria-labelledby="archive-title" className="mt-40">
          <p className="label">Archive</p>
          <h2 id="archive-title" className="mt-4 font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-none font-semibold tracking-tight">
            Earlier shapes<span className="stop">.</span>
          </h2>
          <p className="mt-6 max-w-[52ch] text-paper/65">Sites from before this portfolio. No case studies here — just the live work, still running.</p>
          <div className="mt-14">
            <ArchiveGrid />
          </div>
        </section>
      </main>
    </PageFlow>
  );
}
