"use client";

import { useEffect } from "react";
import { FlowLink } from "@/components/ui/flow-link";

/** A page failed to render. Same calm voice as the 404: say so, offer another go, show the way home. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-svh content-center px-(--gutter) py-36">
      <p className="label">Error</p>
      <h1 className="mt-4 font-display text-d1 font-semibold">
        Something spilled<span className="stop">.</span>
      </h1>
      <p className="mt-6 max-w-[40ch] text-lg text-(--text-2)">This page didn&apos;t pour out right. Try it again, or head back to calmer water.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className="btn btn--solid">
          Try again
        </button>
        <FlowLink href="/" direction="back" className="btn">
          Home <span aria-hidden>←</span>
        </FlowLink>
      </div>
    </main>
  );
}
