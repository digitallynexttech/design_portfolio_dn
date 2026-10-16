"use client";

import type { MouseEvent, ReactNode } from "react";

/**
 * Lets "Set sail" open the world over this draft.
 *
 * The shared openWorld() only acts on "/" (the world lives at /#sail), so off the home page its
 * click does nothing. This wrapper runs after SailIntro's own handler (which has already passed the
 * sound choice to the world store) and does the one step openWorld skipped: it pushes "/#sail".
 * Next keeps the rendered tree on a plain pushState (it only syncs usePathname), so the world opens
 * over this page, and closing it (history.back) lands here again.
 */
export function SailBridge({ children, className }: { children: ReactNode; className?: string }) {
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest(".sail-button")) return;
    if (window.location.pathname === "/") return;
    window.history.pushState({ dnWorld: true }, "", "/#sail");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  return (
    // The buttons inside handle the keyboard; this only listens for their clicks as they bubble.
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}
