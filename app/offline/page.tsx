import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <PageFlow>
      {/* data-offline: the footer's CTA (external links that can't load) steps aside (pages.css). */}
      <main id="main" data-offline className="grid min-h-svh content-start px-(--gutter) py-page-top">
        <p className="label">Offline</p>
        <h1 className="mt-4 font-display text-d1 font-semibold">
          The tide is out<span className="stop">.</span>
        </h1>
        <p className="mt-6 max-w-[40ch] text-lg text-paper/70">You&apos;re not connected right now. This page will load when the signal&apos;s back.</p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <RetryButton className="btn btn--solid" />
          <FlowLink
            href="/"
            direction="back"
            prefetch={false}
            className="btn"
          >
            <span aria-hidden>←</span> Home
          </FlowLink>
        </div>
      </main>
    </PageFlow>
  );
}
