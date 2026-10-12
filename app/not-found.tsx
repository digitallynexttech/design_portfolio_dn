import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CASE_STUDIES } from "@/content/work";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  const picks = CASE_STUDIES.filter((s) => s.tier === "flagship").slice(0, 3);
  return (
    <PageFlow>
      <main
        id="main"
        className="grid min-h-svh content-center px-(--gutter) py-36"
      >
        <p className="label">404</p>
        <h1 className="mt-4 font-display text-d1 font-semibold">
          This page ran dry<span className="stop">.</span>
        </h1>
        <p className="mt-6 max-w-[40ch] text-lg text-paper/70">
          It doesn&apos;t exist. These do - and each one tells you exactly how
          it was built.
        </p>
        <ul className="mt-10 flex flex-wrap gap-3">
          {picks.map((study) => (
            <li key={study.slug}>
              <FlowLink
                href={`/work/${study.slug}`}
                direction="deeper"
                className="btn"
              >
                {study.client} <span aria-hidden>→</span>
              </FlowLink>
            </li>
          ))}
          <li>
            <FlowLink href="/work" className="btn btn--solid">
              All work
            </FlowLink>
          </li>
        </ul>
        <FlowLink
          href="/"
          direction="back"
          className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 text-paper/70 transition-colors hover:text-teal"
        >
          <span aria-hidden>←</span> Home
        </FlowLink>
      </main>
    </PageFlow>
  );
}
