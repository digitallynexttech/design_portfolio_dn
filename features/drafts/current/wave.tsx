import type { CSSProperties } from "react";

// Two periods of a slow swell, so the strip can slide by exactly one period and loop seamlessly.
const PATHS = [
  "M0,70 C240,22 480,22 720,62 C960,102 1200,118 1440,70 C1680,22 1920,22 2160,62 C2400,102 2640,118 2880,70 V120 H0 Z",
  "M0,58 C300,98 520,104 760,74 C1000,44 1140,18 1440,58 C1740,98 1960,104 2200,74 C2440,44 2580,18 2880,58 V120 H0 Z",
  "M0,80 C200,46 420,20 700,40 C980,60 1240,114 1440,80 C1640,46 1860,20 2140,40 C2420,60 2680,114 2880,80 V120 H0 Z",
];

/**
 * The meniscus where one colour field meets the next: the next field's colour rising along the
 * bottom of this one. It sits inside its own section (so a section can skip rendering while off
 * screen without clipping it), and as it travels up the screen the swell slides sideways and settles
 * flat (a scroll-driven transform, so it runs on the compositor). Decorative.
 */
export function Wave({ color, variant = 0, reverse = false }: { color: string; variant?: number; reverse?: boolean }) {
  const style = { color, ...(reverse ? { "--wave-from": "-50%", "--wave-to": "0%" } : {}) } as CSSProperties;
  return (
    <div className="dc-wave" aria-hidden style={style}>
      <div className="dc-wave__flow">
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none" focusable="false">
          <path d={PATHS[variant % PATHS.length]} fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
