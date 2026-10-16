import type { Viewport } from "next";
import { GridDraft } from "@/features/drafts/grid/grid-draft";

// Draft 4, "Spec Sheet": an alternative home page, for review only.
export const metadata = { title: "Draft 4: Spec Sheet", robots: { index: false, follow: false } };

// Bone paper: the browser chrome and form controls follow the page, not the site's ink.
export const viewport: Viewport = {
  themeColor: "#ece9e1",
  colorScheme: "light",
};

export default function GridDraftPage() {
  return <GridDraft />;
}
