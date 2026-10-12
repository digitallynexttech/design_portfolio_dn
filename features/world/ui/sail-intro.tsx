"use client";

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

/** The front door: "Set sail" opens the world over the page. */
export function SailIntro({ data }: { data: WorldData }) {
  const supported = useSyncExternalStore(noop, canRun, () => true);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    world.setData(data);
  }, [data]);

  if (!supported) {
    return <p className="max-w-[34ch] text-sm text-paper/70">This browser can&apos;t draw our 3D world; every project in it is below.</p>;
  }

  return (
    <div className="flex items-center gap-2" onPointerEnter={prefetchWorld} onPointerDown={prefetchWorld} onTouchStart={prefetchWorld} onFocus={prefetchWorld}>
      <button type="button" onClick={() => openWorld(sound)} className="sail-button">
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
