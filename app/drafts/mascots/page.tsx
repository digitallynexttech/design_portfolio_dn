import type { Metadata } from "next";
import { PageFlow } from "@/components/ui/page-flow";
import { MascotReview } from "@/features/drafts/mascots/mascot-review";

export const metadata: Metadata = { title: "DN X mascot review", robots: { index: false, follow: false } };

// Ten takes on the DN X for the team to choose from. Not linked anywhere but /drafts.
export default function MascotsPage() {
  return (
    <PageFlow>
      <main id="main">
        <MascotReview />
      </main>
    </PageFlow>
  );
}
