import { Sofia_Sans_Extra_Condensed } from "next/font/google";

// Draft 2 "Deep Water": a tall, extra-condensed display face for the title cards (one variable file,
// hairline to black, so the same family gives both the thin numerals and the heavy titles). Text and
// subtitles are set in the brand's own grotesk, Stack Sans Text, which the root layout already
// preloads: the draft adds one font file to the first screen, not two.
export const ddDisplay = Sofia_Sans_Extra_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--dd-font-display",
});
