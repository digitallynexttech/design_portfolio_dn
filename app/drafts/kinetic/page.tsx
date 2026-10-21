import type { Viewport } from "next";
import { KineticHome } from "@/features/drafts/kinetic/kinetic-home";

// Draft 8, "Kinetic": an alternative home page, for review only.
export const metadata = { title: "Draft 8: Kinetic", robots: { index: false, follow: false } };

// Near-black: the browser chrome follows the page.
export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function KineticDraftPage() {
  return <KineticHome />;
}
