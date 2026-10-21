"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { BASE_EVENT } from "./kinetic-type";

/**
 * A type tester for the headline: a range input on the font's weight axis. Dragging it (or the
 * arrow keys) sets the weight every letter rests at; the pointer's field still plays on top.
 */
export function WeightDial({ target, rest }: { target: string; rest: number }) {
  const [value, setValue] = useState(rest);
  const pct = ((value - 200) / 500) * 100;
  return (
    <div className="dk-dial" style={{ "--p": `${pct}%` } as CSSProperties}>
      <label htmlFor={`${target}-dial`} className="dk-mono dk-dial__k">
        wght
      </label>
      <input
        id={`${target}-dial`}
        type="range"
        min={200}
        max={700}
        step={10}
        value={value}
        aria-label="Headline weight"
        className="dk-dial__input"
        onChange={(e) => {
          const v = Number(e.target.value);
          setValue(v);
          document.getElementById(target)?.dispatchEvent(new CustomEvent(BASE_EVENT, { detail: v }));
        }}
      />
      <output htmlFor={`${target}-dial`} className="dk-mono dk-dial__v" aria-hidden>
        {value}
      </output>
    </div>
  );
}

const TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

// The current minute, re-read every 15 s. The server (and the first client render) sees 0, so the
// static page never bakes in its build time.
const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 15_000);
  return () => window.clearInterval(id);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);
const noMinute = () => 0;

/** The studio's local time. */
export function StudioTime() {
  const minute = useSyncExternalStore(subscribe, minuteNow, noMinute);
  const now = minute ? new Date(minute * 60_000) : null;
  return now ? (
    <time dateTime={now.toISOString()} className="dk-num">
      {TIME.format(now)} IST
    </time>
  ) : (
    <span className="dk-num">--:-- IST</span>
  );
}
