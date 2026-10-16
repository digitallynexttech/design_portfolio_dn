import type { CSSProperties, ReactNode } from "react";

/** Two-digit numbering, the document's only counting style. */
export const pad = (n: number) => String(n).padStart(2, "0");

/** "1600 × 1000" with real multiplication signs and tabular figures. */
export const dims = (w: number, h: number) => `${w} × ${h}`;

/**
 * A mounted plate: the media sits on its own sheet above the drafting grid, with crop marks at the
 * corners and dimension lines that state the source's real pixel size (width above, height at the
 * right). The callouts are ornament (aria-hidden); the caption says the same in words.
 */
export function Frame({
  w,
  h,
  ratio,
  children,
  className = "",
  measure = "both",
}: {
  w: number;
  h: number;
  /** Override the frame's aspect (e.g. a phone column); defaults to the source's own. */
  ratio?: string;
  children: ReactNode;
  className?: string;
  measure?: "both" | "width" | "none";
}) {
  return (
    <div className={`dg-frame ${className}`} style={{ "--ar": ratio ?? `${w} / ${h}` } as CSSProperties}>
      {measure !== "none" ? (
        <span className="dg-dim dg-dim--w" aria-hidden>
          <span className="dg-dim__v">{w}</span>
        </span>
      ) : null}
      {measure === "both" ? (
        <span className="dg-dim dg-dim--h" aria-hidden>
          <span className="dg-dim__v">{h}</span>
        </span>
      ) : null}
      <div className="dg-frame__media">{children}</div>
    </div>
  );
}

/** A numbered figure: a Frame and its caption ("Fig. 2.1a  Motion · 640 × 360"). */
export function Fig({
  no,
  note,
  w,
  h,
  ratio,
  measure,
  className = "",
  frameClass = "",
  children,
}: {
  no: string;
  note: ReactNode;
  w: number;
  h: number;
  ratio?: string;
  measure?: "both" | "width" | "none";
  className?: string;
  frameClass?: string;
  children: ReactNode;
}) {
  return (
    <figure className={`dg-fig ${className}`}>
      <Frame w={w} h={h} ratio={ratio} measure={measure} className={frameClass}>
        {children}
      </Frame>
      <figcaption className="dg-cap">
        <span className="dg-cap__no">Fig. {no}</span>
        <span className="dg-cap__note">{note}</span>
        <span className="dg-cap__dim">{dims(w, h)}</span>
      </figcaption>
    </figure>
  );
}

/** An engineering balloon: a circled reference number. */
export function Balloon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`dg-balloon ${className}`}>{children}</span>;
}

/**
 * A sheet's title block: the strong rule with registration marks at its ends, the balloon number,
 * the sheet's name, its heading, and a slot for the sheet's own metadata or link.
 */
export function SheetHead({
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
    <div className={`dg-head ${className}`}>
      <div className="dg-rule" aria-hidden />
      <div className="dg-head__row dg-g">
        <p className="dg-head__id">
          <Balloon>{no}</Balloon>
          <span className="dg-k dg-head__name">{name}</span>
        </p>
        <h2 id={titleId} className="dg-h2">
          {title}
        </h2>
        {aside ? <div className="dg-head__aside">{aside}</div> : null}
      </div>
    </div>
  );
}
