import type { Metadata } from "next";
import { ReelPlayer } from "@/components/media/reel-player";
import { PageFlow } from "@/components/ui/page-flow";
import { reelData } from "@/content/reel";
import { XReel } from "@/features/stage3d/x-reel/x-reel";

export const metadata: Metadata = {
  title: "Reel",
  description: "The work in motion: screen recordings of seven live sites built by Digitally Next's design and development studio.",
  alternates: { canonical: "/reel" },
};

/** The home's reel, as a page (Karan, 26 Oct 2026): its label and title, the player in a hairline frame, and
 *  the X sat on the frame's edge, watching (29 Oct 2026). */
export default function ReelPage() {
  const reel = reelData();
  return (
    <PageFlow>
      <main id="main" className="dn-theme dn-page reel-page">
        <div className="dn-reel">
          <ReelPlayer
            reel={reel}
            stage={<XReel />}
            head={
              <>
                <p className="dp-k">Reel · {reel.length} · No sound</p>
                <h1 className="dp-h2 dn-reel__title">
                  The work, running<span className="dp-stop">.</span>
                </h1>
              </>
            }
          />
        </div>
      </main>
    </PageFlow>
  );
}
