"use client";

import { useEffect, useRef } from "react";

/** New Delhi's time, to the second: the studio's local time, as on the live home. */
export function IstClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    let id = 0;
    const tick = () => {
      el.textContent = format.format(new Date());
    };
    const sync = () => {
      window.clearInterval(id);
      if (document.visibilityState !== "visible") return;
      tick();
      id = window.setInterval(tick, 1000);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <span ref={ref} className="dx-num">
      --:--:--
    </span>
  );
}
