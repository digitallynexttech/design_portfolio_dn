import { Inter_Tight, JetBrains_Mono } from "next/font/google";

// Draft 4 sets two faces: a neo-grotesk for the display and the text, and a monospace for every
// label, figure and readout. Both are on the first paint (the title and the sheet's meta strip),
// so both are preloaded; latin only, one variable file each.
export const gridSans = Inter_Tight({
  subsets: ["latin"],
  variable: "--dg-sans",
  display: "swap",
});

// One static weight: every label and figure in mono is set at 500, so this is half the bytes of
// the variable file.
export const gridMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "500",
  variable: "--dg-mono",
  display: "swap",
});
