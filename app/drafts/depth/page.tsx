import type { Viewport } from "next";
import { DepthHome } from "@/features/drafts/depth/depth-home";

// Draft 7, "Depth": an alternative home page, for review only.
export const metadata = { title: "Draft 7: Depth", robots: { index: false, follow: false } };

// The void: the browser chrome follows the page.
export const viewport: Viewport = {
  themeColor: "#070708",
  colorScheme: "dark",
};

export default function DepthDraftPage() {
  return <DepthHome />;
}
