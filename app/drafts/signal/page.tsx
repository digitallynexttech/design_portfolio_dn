import type { Viewport } from "next";
import { SignalDraft } from "@/features/drafts/signal/signal-draft";

// Draft 5, "Signal": an alternative home page, for review only.
export const metadata = {
  title: "Draft 5: Signal",
  robots: { index: false, follow: false },
};

// The instrument's warm grey body: the browser chrome and form controls follow the page, not the site's ink.
export const viewport: Viewport = {
  themeColor: "#e6e4df",
  colorScheme: "light",
};

export default function SignalDraftPage() {
  return <SignalDraft />;
}
