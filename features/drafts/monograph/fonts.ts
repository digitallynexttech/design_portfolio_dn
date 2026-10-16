import { Fraunces } from "next/font/google";

/**
 * Draft 1 "Monograph": one serif from footnote to title. Fraunces' optical-size axis (9–144) lets
 * the same family set a 300 px title and a 15 px caption, each drawn for its size: at display sizes
 * it becomes a sharp, high-contrast cut. Only the opsz axis is requested (softness and "wonk" stay
 * at 0), which keeps both files to about 145 KB together. Text stays in Stack Sans Text (the house
 * face, already preloaded by the root layout), and folios in Geist Mono (already loaded by the
 * layout), so the draft adds a single family.
 *
 * Both styles are preloaded: the first paint sets "We are" upright and "water." in italic.
 */
export const serif = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--m-serif",
});
