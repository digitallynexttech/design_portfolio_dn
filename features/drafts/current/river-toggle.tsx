"use client";

import { useEffect, useRef, useState } from "react";

/** Pauses the logo current it sits in (sets data-paused on the enclosing .dc-river). */
export function RiverToggle() {
  const ref = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    ref.current?.closest(".dc-river")?.toggleAttribute("data-paused", paused);
  }, [paused]);
  return (
    <button ref={ref} type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="dc-river__toggle">
      <svg aria-hidden viewBox="0 0 10 10" width="10" height="10">
        <path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" />
      </svg>
      Pause
    </button>
  );
}
