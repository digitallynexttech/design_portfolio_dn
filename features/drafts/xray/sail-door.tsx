"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the site's own sail link (SailIntro). openWorld() only opens the world over "/" (WorldRoot
 * shows it for "/#sail"), so after its click the URL is pointed at "/#sail" with a native
 * pushState: Next keeps this page mounted, the world opens over the draft, and closing it
 * (history.back) lands back here where it was left.
 */
export function SailDoor({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element | null)?.closest(".sail-link, .sail-button")) return;
      if (window.location.pathname === "/" || window.location.hash === "#sail") return;
      window.history.pushState({ dnWorld: true }, "", "/#sail");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    };
    // Bubbling: runs after the link's own handler has called openWorld().
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);
  return (
    <div ref={ref} className="dx-sail">
      {children}
    </div>
  );
}
