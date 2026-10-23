"use client";

import { useEffect, useRef } from "react";

const FORMAT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

/**
 * The studio's time in New Delhi, for the footer. The server can't know the visitor's moment, so it
 * renders a placeholder and the clock fills in after hydration, then ticks each minute (its one
 * text node rewritten in place).
 */
export function LocalTime() {
  const el = useRef<HTMLTimeElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const tick = () => {
      const now = new Date();
      if (node.firstChild instanceof Text) node.firstChild.data = FORMAT.format(now);
      else node.textContent = FORMAT.format(now);
      node.dateTime = now.toISOString();
      return 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    };
    let timer = window.setTimeout(function next() {
      timer = window.setTimeout(next, tick());
    }, tick());
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <time ref={el} className="dp-foot__clock">
      --:--
    </time>
  );
}
