import type { Metadata } from "next";
import { DeepHome } from "@/features/drafts/deep/deep-home";

export const metadata: Metadata = {
  title: "Draft 2: Deep Water",
  robots: { index: false, follow: false },
};

export default function DeepWaterDraft() {
  return <DeepHome />;
}
