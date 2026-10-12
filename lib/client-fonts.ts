import {
  Anton,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Figtree,
  Fraunces,
  Gabarito,
  Geist,
  Hanken_Grotesk,
  Instrument_Sans,
  Inter,
  Manrope,
  Montserrat,
  Open_Sans,
  Space_Grotesk,
} from "next/font/google";
import type { FontKey } from "@/content/types";

// Client typefaces for case-study theme takeovers. Imported only by case-study routes and never
// preloaded: @font-face rules are cheap, and a file downloads only when a themed page uses it.
const anton = Anton({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--ff-anton" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-space-grotesk" });
const figtree = Figtree({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-figtree" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--ff-cormorant",
});
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-bricolage" });
const gabarito = Gabarito({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-gabarito" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-hanken" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-open-sans" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-fraunces" });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-instrument-sans" });
const geist = Geist({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-geist" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--ff-manrope" });

/** Every client font variable, for the case-study root element. */
export const clientFontVariables = [
  anton,
  spaceGrotesk,
  figtree,
  cormorant,
  inter,
  bricolage,
  gabarito,
  hanken,
  montserrat,
  openSans,
  fraunces,
  instrumentSans,
  geist,
  manrope,
]
  .map((font) => font.variable)
  .join(" ");

/** CSS value for a FontKey. The two studio fonts are always loaded by the root layout. */
export const fontFamily: Record<FontKey, string> = {
  stackHeadline: "var(--font-headline)",
  stackText: "var(--font-text)",
  anton: "var(--ff-anton)",
  spaceGrotesk: "var(--ff-space-grotesk)",
  figtree: "var(--ff-figtree)",
  cormorant: "var(--ff-cormorant)",
  inter: "var(--ff-inter)",
  bricolage: "var(--ff-bricolage)",
  gabarito: "var(--ff-gabarito)",
  hanken: "var(--ff-hanken)",
  montserrat: "var(--ff-montserrat)",
  openSans: "var(--ff-open-sans)",
  fraunces: "var(--ff-fraunces)",
  instrumentSans: "var(--ff-instrument-sans)",
  geist: "var(--ff-geist)",
  manrope: "var(--ff-manrope)",
};
