"use client";

import type { ReactNode } from "react";

/**
 * The world opens only at "/#sail" (features/world/ui/world-root.tsx), so on this draft route
 * "Set sail" first moves the URL to /#sail without leaving the page: Next's router keeps this page
 * rendered, the world opens over it, and closing the world (history back) returns here. Runs in the
 * capture phase, before SailIntro's own handler, which then finds the URL already set.
 */
export function SailBridge({ children }: { children: ReactNode }) {
  return (
    <div
      className="dc-sail"
      onClickCapture={(event) => {
        const target = event.target as Element;
        if (!target.closest(".sail-button") || window.location.pathname === "/") return;
        window.history.pushState({ dnWorld: true }, "", "/#sail");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }}
    >
      {children}
    </div>
  );
}
