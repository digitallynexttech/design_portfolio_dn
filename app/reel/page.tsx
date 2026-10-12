import type { Metadata } from "next";
import { ReelPlayer } from "@/components/media/reel-player";
import { PageFlow } from "@/components/ui/page-flow";
import { reelData } from "@/content/reel";

export const metadata: Metadata = {
  title: "Reel",
  description: "The work in motion: screen recordings of seven live sites built by Digitally Next's design and development studio.",
  alternates: { canonical: "/reel" },
};

export default function ReelPage() {
  const reel = reelData();
  return (
    <PageFlow>
      <main id="main" className="reel-page px-(--gutter) pt-28 pb-24">
        <ReelPlayer
          reel={reel}
          head={
            <>
              <p className="label">Reel · {reel.length} · No sound</p>
              <h1 className="mt-3 font-display text-d2 font-semibold">
                The work, running<span className="stop">.</span>
              </h1>
            </>
          }
        />
      </main>
    </PageFlow>
  );
}
