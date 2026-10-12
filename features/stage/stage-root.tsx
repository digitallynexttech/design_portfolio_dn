"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { setWaterCovered } from "@/features/water/bus";
import { whenEngaged } from "./engage";
import { detectTier, type Tier } from "./tier";

const WaterCanvas = dynamic(() => import("@/features/water/water-canvas"), { ssr: false });

/**
 * The persistent water stage. Text paints first from the server; the WebGL water is chosen per
 * device and loaded only once the browser is idle, so it never competes with the headline (LCP).
 */
export function StageRoot() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  // Case studies cover the water with the client's own background, so don't load it there.
  const coveredRoute = /^\/work\/[^/]+/.test(pathname);

  useEffect(() => {
    if (tier !== null || coveredRoute) return;
    return whenEngaged(() => setTier(detectTier()));
  }, [tier, coveredRoute]);

  // The home hero's poster (a real frame of the world) hides the water while it fills the screen,
  // so the water rests until the visitor scrolls past it. The poster can commit a frame after the
  // route changes, so look for it for a few frames.
  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let raf = 0;
    let tries = 0;
    const attach = () => {
      const poster = document.querySelector(".hero-poster");
      if (!poster) {
        if (++tries < 10) raf = requestAnimationFrame(attach);
        return;
      }
      observer = new IntersectionObserver(([entry]) => setWaterCovered("hero", entry.intersectionRatio >= 0.95), {
        threshold: 0.95,
      });
      observer.observe(poster);
    };
    attach();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      setWaterCovered("hero", false);
    };
  }, [pathname]);

  return (
    <>
      <div
        className="water-fallback"
        aria-hidden
        style={{ opacity: ready ? 0 : 1, transition: "opacity 900ms var(--ease-flow)" }}
      />
      {tier ? <WaterCanvas tier={tier} onReady={() => setReady(true)} onFail={() => setTier(0)} /> : null}
    </>
  );
}
