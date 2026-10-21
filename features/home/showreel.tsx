import { REEL } from "@/content/reel";
import { ReelButton } from "./reel-button";
import { ShowreelZoom } from "./showreel-zoom";

/**
 * The showreel's section, right after the hero. A server component, so "Play reel" joins its chapter
 * data here and the case-study content never ships to the browser.
 */
export function Showreel() {
  return <ShowreelZoom src={REEL.src} poster={REEL.poster} play={<ReelButton />} />;
}
