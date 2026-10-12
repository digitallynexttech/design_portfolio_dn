import { ReelPopup } from "@/components/media/reel-player";
import { reelData } from "@/content/reel";

/**
 * "Play reel" flows a full-screen liquid viewer up from the bottom; the reel also has its own page. A server
 * component, so the chapter data is joined here and the case-study content never ships to the browser.
 */
export function ReelButton({ className }: { className?: string }) {
  return <ReelPopup reel={reelData()} className={className} />;
}
