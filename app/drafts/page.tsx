import type { Metadata } from "next";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";

export const metadata: Metadata = { title: "Home drafts", robots: { index: false, follow: false } };

// Four directions for the home page, same content and sections, for review. Not linked anywhere.
const DRAFTS = [
  {
    href: "/drafts/monograph",
    name: "Monograph",
    line: "Light and editorial: a printed studio book. Paper, ink and one red; a serif with an italic water voice; the work as big plates with notes in the margin.",
  },
  {
    href: "/drafts/deep",
    name: "Deep Water",
    line: "Cinematic and dark: the page sinks as you scroll. Deep navy, condensed title cards, each study as a full-screen scene from its own footage.",
  },
  {
    href: "/drafts/current",
    name: "Colour Current",
    line: "Bold colour: the water takes each client's colour. One field flows from brand red through every flagship's palette, with wave edges between.",
  },
  {
    href: "/drafts/grid",
    name: "Spec Sheet",
    line: "Technical and precise: a studio that builds things. Bone paper, a live water line through the title, the work as stacked spec sheets and an index.",
  },
];

export default function Drafts() {
  return (
    <PageFlow>
      <main id="main" className="px-(--gutter) pt-page-top pb-section">
        <p className="label">Review</p>
        <h1 className="mt-4 font-display text-d1 font-semibold">Home drafts</h1>
        <p className="mt-6 max-w-[52ch] text-lg text-(--text-2)">
          The same content and sections in four directions.{" "}
          <FlowLink href="/" direction="back" className="underline decoration-paper/40 underline-offset-4 hover:text-teal">
            Compare with the current home
          </FlowLink>
        </p>
        <ol className="mt-stack border-t border-paper/15">
          {DRAFTS.map((draft, i) => (
            <li key={draft.href} className="border-b border-paper/15">
              <FlowLink
                href={draft.href}
                direction="deeper"
                className="group grid gap-3 py-8 md:grid-cols-[4rem_minmax(0,18rem)_minmax(0,1fr)_auto] md:items-baseline md:gap-8"
              >
                <span className="font-mono text-sm text-(--text-3)">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-d3 font-semibold transition-colors group-hover:text-teal">{draft.name}</span>
                <span className="max-w-[60ch] text-(--text-2)">{draft.line}</span>
                <span aria-hidden className="text-2xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </FlowLink>
            </li>
          ))}
        </ol>
      </main>
    </PageFlow>
  );
}
