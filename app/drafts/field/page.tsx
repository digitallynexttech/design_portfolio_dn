import type { Viewport } from "next";
import { FieldDraft } from "@/features/drafts/field/field-draft";

// Draft 6, "Field": an alternative home page, for review only.
export const metadata = { title: "Draft 6: Field", robots: { index: false, follow: false } };

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function FieldDraftPage() {
  return <FieldDraft />;
}
