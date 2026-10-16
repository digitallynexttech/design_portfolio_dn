"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Mounts its children one frame after hydration, so what they load never competes with the first
 * paint. Used for the title sheet's figure, which is a picture, not the message. The server copy
 * renders a <noscript> fallback beside it for readers without script.
 */
export function AfterPaint({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on ? children : null;
}
