"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { WorldData } from "../data";
import { world } from "../store";
import { openWorld } from "./world-root";

function canRun(): boolean {
  try {
    return "gpu" in navigator || !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

const noop = () => () => undefined;

let prefetched = false;

/**
 * Start fetching the world's code (about 350 KB) the moment a visitor shows they mean to sail:
 * a pointer over the controls, keyboard focus on them, or a finger coming down. Visitors who never
 * sail never download it. Data-saver visitors download it only when they actually set sail.
 * (The controls sit in the hero, in view from the first paint, so scrolling into view would be no
 * signal at all.) A /#sail deep link loads the world directly and doesn't need this.
 */
function prefetchWorld() {
  if (prefetched) return;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  prefetched = true;
  void import("../engine");
  void import("./world-app");
}

/**
 * The front door: "Set sail" opens the world over the page. The "link" variant is a quiet text link
 * under the home hero's buttons (sound off; the world has its own sound switch). The "cta" variant
 * is a single "Set sail" button styled by the caller (className). Away from the home page, where the
 * world can't open, both go to /#sail. Where the browser can't draw the world they render nothing.
 */
export function SailIntro({
  data,
  variant = "button",
  className = "",
}: {
  data: WorldData;
  variant?: "button" | "link" | "cta";
  className?: string;
}) {
  const supported = useSyncExternalStore(noop, canRun, () => true);
  const [sound, setSound] = useState(false);
  const router = useRouter();

  useEffect(() => {
    world.setData(data);
  }, [data]);

  const sail = (withSound: boolean) => {
    if (window.location.pathname === "/") openWorld(withSound);
    else {
      world.set({ sound: withSound });
      router.push("/#sail");
    }
  };

  if (variant === "cta") {
    if (!supported) return null;
    return (
      <button
        type="button"
        onClick={() => sail(false)}
        onPointerEnter={prefetchWorld}
        onPointerDown={prefetchWorld}
        onTouchStart={prefetchWorld}
        onFocus={prefetchWorld}
        className={className}
      >
        Set sail <span aria-hidden>→</span>
      </button>
    );
  }

  if (variant === "link") {
    if (!supported) return null;
    return (
      <button
        type="button"
        onClick={() => sail(false)}
        onPointerEnter={prefetchWorld}
        onPointerDown={prefetchWorld}
        onTouchStart={prefetchWorld}
        onFocus={prefetchWorld}
        className="sail-link"
      >
        Or sail through our work in 3D <span aria-hidden>→</span>
      </button>
    );
  }

  if (!supported) {
    return <p className="max-w-[34ch] text-sm text-(--text-3)">This browser can&apos;t draw our 3D world; every project in it is below.</p>;
  }

  return (
    <div className="flex items-center gap-2" onPointerEnter={prefetchWorld} onPointerDown={prefetchWorld} onTouchStart={prefetchWorld} onFocus={prefetchWorld}>
      <button type="button" onClick={() => sail(sound)} className="btn btn--primary btn--lg sail-button">
        <span className="sail-button__wake" aria-hidden />
        Set sail <span aria-hidden>→</span>
      </button>
      {/* One door, with the sound as a switch beside it rather than a second door. */}
      <button type="button" aria-pressed={sound} aria-label="Sound" title={sound ? "Sound on" : "Sound off"} onClick={() => setSound((on) => !on)} className="sail-sound">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
          {sound ? (
            <>
              <path d="M15.5 9a4 4 0 0 1 0 6" />
              <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
            </>
          ) : (
            <path d="M16 9.5l5 5m0-5-5 5" />
          )}
        </svg>
      </button>
    </div>
  );
}
