"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { whenEngaged } from "@/features/stage/engage";
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

/**
 * The front door: "Set sail" opens the world over the page. The world's code starts downloading
 * once the visitor moves, so the button is quick, but never before (it doesn't touch page speed).
 */
export function SailIntro({ data }: { data: WorldData }) {
  const supported = useSyncExternalStore(noop, canRun, () => true);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    world.setData(data);
  }, [data]);

  useEffect(() => {
    // Data-saver visitors download the world only if they actually set sail.
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!supported || saveData) return;
    return whenEngaged(() => {
      void import("../engine");
      void import("./world-app");
    }, 2500);
  }, [supported]);

  if (!supported) {
    return <p className="max-w-[34ch] text-sm text-paper/70">This browser can&apos;t draw our 3D world; every project in it is below.</p>;
  }

  return (
    <div className="flex items-center gap-2">
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
