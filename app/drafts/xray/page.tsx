import type { Viewport } from "next";
import { XrayHome } from "@/features/drafts/xray/xray-home";

// Draft 9, "X-Ray": an alternative home page, for review only.
export const metadata = { title: "Draft 9: X-Ray", robots: { index: false, follow: false } };

// Drafting paper: the browser chrome and form controls follow the page, not the site's ink.
export const viewport: Viewport = {
  themeColor: "#f3f3f1",
  colorScheme: "light",
};

export default function XrayDraftPage() {
  return <XrayHome />;
}
