import { Bricolage_Grotesque } from "next/font/google";

// Draft 3's display face: Bricolage Grotesque with its width axis, so one family gives both the
// condensed poster cut (wdth 75, tracked tight in current.css) and the wider statement cut.
// The optical-size axis is left out on purpose: it would add 52 KB to the file the hero's h1 waits
// for (128 KB against 76 KB), which cost the page its mobile performance budget.
// Preloaded: the h1 is set in it. Text stays in Stack Sans Text, which the root layout already
// preloads on every page, so the draft adds one font file.
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--dc-display",
});
