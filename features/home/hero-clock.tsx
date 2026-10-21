"use client";

import { useSyncExternalStore } from "react";

const TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
const HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false });

function partOfDay(hour: number): string {
  if (hour < 5) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
}

// The current minute, re-read every 15 s. The server (and the first client render) sees 0, so the
// static page never bakes in its build time.
const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 15_000);
  return () => window.clearInterval(id);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);
const noMinute = () => 0;

/** The studio's local time, like a window onto New Delhi: "13:15 Afternoon in New Delhi". */
export function HeroClock() {
  const minute = useSyncExternalStore(subscribe, minuteNow, noMinute);
  const now = minute ? new Date(minute * 60_000) : null;
  return (
    <p className="hero-clock">
      <span className="hero-clock__dot" aria-hidden />
      {now ? (
        <span>
          <time dateTime={now.toISOString()}>{TIME.format(now)}</time> {partOfDay(Number(HOUR.format(now)) % 24)} in New Delhi
        </span>
      ) : (
        <span>New Delhi</span>
      )}
    </p>
  );
}
