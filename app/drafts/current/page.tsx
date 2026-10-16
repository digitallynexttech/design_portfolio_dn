import type { Viewport } from "next";
import { DraftCurrent } from "@/features/drafts/current/draft-current";

export const metadata = { title: "Draft 3: Colour Current", robots: { index: false, follow: false } };

// The browser chrome takes the opening field's red.
export const viewport: Viewport = { themeColor: "#E21F26" };

export default function DraftCurrentPage() {
  return <DraftCurrent />;
}
