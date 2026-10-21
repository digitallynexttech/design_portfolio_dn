import { Anton, Bricolage_Grotesque, Cormorant_Garamond, Figtree, Inter, Space_Grotesk } from "next/font/google";
import type { FontKey } from "@/content/types";

// The flagships' own typefaces, for the type specimens inside the X-ray lens. Never preloaded, and
// the specimens only take these families once a study nears the screen (data-live), so nothing
// downloads until someone scrolls to the work.
const anton = Anton({ subsets: ["latin"], weight: "400", display: "swap", preload: false, variable: "--xf-anton" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--xf-space-grotesk" });
const figtree = Figtree({ subsets: ["latin"], display: "swap", preload: false, variable: "--xf-figtree" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  variable: "--xf-cormorant",
});
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--xf-bricolage" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--xf-inter" });

export const specimenFontVars = [anton, spaceGrotesk, figtree, cormorant, bricolage, inter].map((f) => f.variable).join(" ");

/** A client font as a CSS family. Keys this draft doesn't load fall back to the studio's text face. */
export function specimenFamily(key: FontKey): string {
  switch (key) {
    case "anton":
      return "var(--xf-anton)";
    case "spaceGrotesk":
      return "var(--xf-space-grotesk)";
    case "figtree":
      return "var(--xf-figtree)";
    case "cormorant":
      return "var(--xf-cormorant)";
    case "bricolage":
      return "var(--xf-bricolage)";
    case "inter":
      return "var(--xf-inter)";
    case "stackHeadline":
      return "var(--font-headline)";
    default:
      return "var(--font-text)";
  }
}
