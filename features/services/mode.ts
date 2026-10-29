/**
 * /services, "Spacewalk": how the page reads, chosen before the first paint (html[data-sh]):
 * - walk: wide screens (900 px and up) with motion. The tether runs down the middle, the stations
 *   clipped on to it left and right; the astronaut rides its tip with a readout of the line paid out.
 * - slim: smaller screens with motion. The tether runs down the left edge, a smaller astronaut on it.
 * - static: reduced motion. The tether drawn whole, the astronaut parked at the hatch, nothing moves.
 * No attribute (no script): a plain hairline where the tether goes, everything shown.
 */
export const SH_MODE_SCRIPT = `(function(){try{var d=document.documentElement,r=matchMedia('(prefers-reduced-motion: reduce)').matches,w=matchMedia('(min-width: 900px)').matches;d.setAttribute('data-sh',r?'static':w?'walk':'slim')}catch(e){}})()`;

export type Mode = "walk" | "slim" | "static";

export const WIDE = "(min-width: 900px)";

export function decideMode(): Mode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  return window.matchMedia(WIDE).matches ? "walk" : "slim";
}

/** Tether paid out, for the astronaut's readout: a pixel of line is a decimetre. */
export const metresOf = (px: number) => `${String(Math.max(0, Math.round(px / 10))).padStart(4, "0")} m`;

/** The live astronaut's line runs on past its fist this far (metres) before it goes slack, so the
 *  glove is round it (climber.ts holds it at the middle of the palm). */
export const PAST_FIST = 0.18;
