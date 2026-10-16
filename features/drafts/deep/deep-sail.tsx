"use client";

import type { MouseEvent, ReactNode } from "react";

/**
 * Wraps the real <SailIntro>. The world only opens at /#sail (WorldRoot and openWorld both look for
 * the home path), so on this draft route a press on Set sail first swaps the URL to /#sail in place,
 * through the history API that Next keeps in sync. The draft stays on screen under the world, and
 * closing the world goes back one entry, to the draft. On the home page itself this does nothing.
 */
export function DeepSail({ children }: { children: ReactNode }) {
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as Element).closest("button");
    if (!button?.classList.contains("sail-button") || window.location.pathname === "/") return;
    window.history.pushState({ dnWorld: true }, "", "/#sail");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  return (
    <div className="dd-sail" onClickCapture={onClickCapture}>
      {children}
    </div>
  );
}
