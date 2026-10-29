import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CASE_STUDIES } from "@/content/work";
import { LostAstronaut } from "@/features/stage3d/astro/astro-figure";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  const picks = CASE_STUDIES.filter((s) => s.tier === "flagship").slice(0, 3);
  return (
    <PageFlow>
      {/* Anchored at the top like every page, so the title lands where the last page's did. */}
      <main id="main" className="dn-theme dn-page dn-short s3-host">
        <div className="dn-page__head">
          <p className="dp-k">404</p>
          <h1 className="dp-title__h">
            This page ran dry<span className="dp-stop">.</span>
          </h1>
          <p className="dn-page__lead">It doesn&apos;t exist. These do - and each one tells you exactly how it was built.</p>
          <ul className="dn-actions">
            {picks.map((study) => (
              <li key={study.slug}>
                <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dp-btn">
                  {study.client} <span aria-hidden>→</span>
                </FlowLink>
              </li>
            ))}
            <li>
              <FlowLink href="/work" className="dp-btn dp-btn--red">
                All work <span aria-hidden>→</span>
              </FlowLink>
            </li>
          </ul>
          <FlowLink href="/" direction="back" className="dp-link dn-home-link">
            <span aria-hidden>←</span> Home
          </FlowLink>
        </div>
        {/* Lost in space: the astronaut adrift beside the way back; it can be flung round. */}
        <LostAstronaut fling />
      </main>
    </PageFlow>
  );
}
