import type { Metadata, Viewport } from "next";
import { Monograph } from "@/features/drafts/monograph/monograph";

export const metadata: Metadata = { title: "Draft 1: Monograph", robots: { index: false, follow: false } };

// Paper, not ink: the browser's own chrome and controls follow the page.
export const viewport: Viewport = { themeColor: "#F3F0E8", colorScheme: "light" };

export default function MonographDraft() {
  return <Monograph />;
}
