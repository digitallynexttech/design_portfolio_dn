"use client";

import { useEffect } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { XSpill } from "@/features/stage3d/x-spill/x-spill";

/** A page failed to render. Same calm voice as the 404: say so, offer another go, show the way home. The X
 *  lies knocked over beside it, and stands back up for "Try again" (29 Oct 2026; decorative, and safe to fail). */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="dn-theme dn-page dn-short xs-host">
      <div className="dn-page__head">
        <p className="dp-k">Error</p>
        <h1 className="dp-title__h">
          Something spilled<span className="dp-stop">.</span>
        </h1>
        <p className="dn-page__lead">This page didn&apos;t pour out right. Try it again, or head back to calmer water.</p>
        <div className="dn-actions">
          <button type="button" onClick={() => retry()} className="dp-btn dp-btn--red">
            Try again
          </button>
          <FlowLink href="/" direction="back" className="dp-btn">
            <span aria-hidden>←</span> Home
          </FlowLink>
        </div>
        <XSpill />
      </div>
    </main>
  );
}
