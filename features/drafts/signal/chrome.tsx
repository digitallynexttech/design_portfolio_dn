"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setWaterCovered } from "@/features/water/bus";

/**
 * The draft hides the site's chrome with html:has(.d-signal), so it is gone from the first paint.
 * Next keeps a page you leave in the DOM as a hidden copy, so that selector would follow the reader
 * to other routes; when the draft unmounts (or is hidden), html gets .ds-away and the rules stand
 * down. The site's WebGL water is hidden here too, and told to stop drawing.
 */
export function AwayFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("ds-away");
    setWaterCovered("draft-signal", true);
    return () => {
      root.classList.add("ds-away");
      setWaterCovered("draft-signal", false);
    };
  }, []);
  return null;
}

/**
 * Modules "power on" as they reach the screen: each [data-power] element gets data-power="on" the
 * first time a fifth of it is visible, which lights its lamp and (for screens) runs a one-off
 * switch-on line. Purely ornament: everything is readable before and without it.
 */
export function PowerOn() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".d-signal [data-power]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.power = "on";
          io.unobserve(e.target);
        }
      },
      { threshold: 0.2 },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);
  return null;
}

const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** New Delhi's time, to the second, written straight to the DOM (nothing re-renders). */
export function StudioClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tick = () => {
      el.textContent = TIME.format(new Date());
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span ref={ref} className="ds-num">
      --:--:--
    </span>
  );
}

/**
 * Lets "Or sail through our work in 3D" open the world over this draft. The shared openWorld() only
 * acts on "/" (the world lives at /#sail); after its click, this pushes "/#sail" with a native
 * pushState, which Next treats as a shallow change: the world opens over the draft, and closing it
 * (history.back) lands here again.
 */
export function SailDoor({ children, className }: { children: ReactNode; className?: string }) {
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
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
