"use client";

import { useEffect } from "react";

/** Puts the picture of the service crossing the middle of the screen (or holding focus) on the screen. */
export function ServicesDirector() {
  useEffect(() => {
    const body = document.querySelector<HTMLElement>(".d-deep .dd-services__body");
    if (!body) return;
    const items = Array.from(body.querySelectorAll<HTMLElement>(".dd-service"));
    const now = body.querySelector<HTMLElement>(".dd-services__now");
    const set = (i: number) => {
      items.forEach((item, k) => item.toggleAttribute("data-on", k === i));
      if (body.dataset.active === String(i)) return;
      body.dataset.active = String(i);
      // The text node is rewritten in place (no node inserted, so no document-wide :has() re-check).
      if (now?.firstChild) now.firstChild.nodeValue = String(i + 1).padStart(2, "0");
    };
    set(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) set(Number((entry.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-46% 0px -46% 0px" },
    );
    for (const item of items) io.observe(item);
    const onFocus = (event: FocusEvent) => {
      const item = (event.target as Element).closest<HTMLElement>(".dd-service");
      if (item) set(Number(item.dataset.i));
    };
    body.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      body.removeEventListener("focusin", onFocus);
    };
  }, []);
  return null;
}
