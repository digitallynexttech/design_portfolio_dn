import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { LostAstronaut } from "@/features/stage3d/astro/astro-figure";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <PageFlow>
      {/* data-offline: the footer's CTA (external links that can't load) steps aside (pages.css). */}
      <main id="main" data-offline className="dn-theme dn-page dn-short s3-host">
        <div className="dn-page__head">
          <p className="dp-k">Offline</p>
          <h1 className="dp-title__h">
            The tide is out<span className="dp-stop">.</span>
          </h1>
          <p className="dn-page__lead">You&apos;re not connected right now. This page will load when the signal&apos;s back.</p>
          <div className="dn-actions">
            <RetryButton className="dp-btn dp-btn--red" />
            <FlowLink href="/" direction="back" prefetch={false} className="dp-btn">
              <span aria-hidden>←</span> Home
            </FlowLink>
          </div>
        </div>
        {/* Adrift until the signal's back: live if the 3D is already in the browser's cache, else its still. */}
        <LostAstronaut />
      </main>
    </PageFlow>
  );
}
