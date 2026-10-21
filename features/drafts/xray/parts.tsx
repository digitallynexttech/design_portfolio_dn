import type { CSSProperties, ReactNode } from "react";

/** Two-digit numbering, the drawing's only counting style. */
export const pad = (n: number) => String(n).padStart(2, "0");

/** "1600 × 893", with a real multiplication sign. */
export const dims = (w: number, h: number) => `${w} × ${h}`;

/** The file name at the end of a public path: "/work/skelmet/hero-skull.webp" → "hero-skull.webp". */
export const fileOf = (src: string) => src.split("/").pop() ?? src;

/**
 * A mounted image. In Design mode it shows the picture; in Build mode the picture wipes away behind
 * the scan line and leaves its blueprint: the box, its diagonals, and the source's real size and
 * file. The blueprint is ornament (aria-hidden); the image keeps its own alt text.
 */
export function Plate({
  w,
  h,
  file,
  kind = "img",
  ratio,
  className = "",
  children,
}: {
  w: number;
  h: number;
  file: string;
  kind?: "img" | "video" | "canvas";
  /** Override the frame's aspect; defaults to the source's own. */
  ratio?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`dx-plate ${className}`} style={{ "--ar": ratio ?? `${w} / ${h}` } as CSSProperties} data-x={kind}>
      <div className="dx-plate__bp" aria-hidden>
        <svg className="dx-plate__x" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="dx-plate__tag">
          <b>{kind}</b> {dims(w, h)} · {file}
        </span>
      </div>
      <div className="dx-plate__media">{children}</div>
    </div>
  );
}

/**
 * A number that counts up as it is revealed (motion.tsx). The server renders the final value, so it
 * is right with no script and under reduced motion; screen readers get the value once, never mid-count.
 */
export function Count({ value, className = "" }: { value: string; className?: string }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span className={`dx-count ${className}`} aria-hidden data-count={value}>
        {value}
      </span>
    </>
  );
}

/**
 * A section's title block: a hairline with a registration tick, the section number and name in mono,
 * then the heading (whose type metrics show in Build mode), and a slot for the section's own data.
 */
export function SecHead({
  no,
  name,
  titleId,
  title,
  aside,
  className = "",
}: {
  no: string;
  name: string;
  titleId: string;
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`dx-sh ${className}`}>
      <div className="dx-sh__rule" aria-hidden />
      <p className="dx-sh__label dx-k">
        <span className="dx-sh__no">({no})</span> {name}
      </p>
      <h2 id={titleId} className="dx-h2" data-tm="display" data-x="h2">
        {title}
      </h2>
      {aside ? <div className="dx-sh__aside">{aside}</div> : null}
    </header>
  );
}

/** The red full stop the site sets at the end of its headings. */
export function Stop({ children = "." }: { children?: ReactNode }) {
  return <span className="dx-stop">{children}</span>;
}

/** A section's top padding, drawn as a vertical dimension in Build mode (its value is measured). */
export function PadDim() {
  return (
    <span className="dx-pad" aria-hidden>
      <span className="dx-pad__v">
        <b data-pad>—</b> px
      </span>
    </span>
  );
}
