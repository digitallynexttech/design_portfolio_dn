import { Fragment, type ReactNode } from "react";

/**
 * A heading's words, each in its own mask so the line can rise into place word by word (with
 * data-reveal on the heading). The spaces stay real text, so the accessible name is unchanged; a
 * closing full stop or question mark is set in red.
 */
export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => {
        const stop = /[.?]$/.test(word) ? word.slice(-1) : "";
        const body = stop ? word.slice(0, -1) : word;
        return (
          <Fragment key={i}>
            {i ? " " : null}
            <span className="dk-w">
              <span className="dk-w__in" style={{ transitionDelay: `${i * 55}ms` }}>
                {body}
                {stop ? <span className="dk-stop">{stop}</span> : null}
              </span>
            </span>
          </Fragment>
        );
      })}
    </>
  );
}

/** A section's running label, "(01) Selected work", in mono. */
export function Label({ no, children, className = "" }: { no?: string; children: ReactNode; className?: string }) {
  return (
    <p className={`dk-label dk-mono ${className}`}>
      {no ? <span className="dk-label__no">({no})</span> : null}
      {children}
    </p>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A button's label, drawn twice: on hover the fill rises from the bottom while the label rolls up
 * and its copy (in the fill's colour) rolls in under it. Transforms only. The copy is hidden from
 * assistive tech, so the name is read once.
 */
export function BtnLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="dk-btn__fill" aria-hidden />
      <span className="dk-btn__roll">
        <span className="dk-btn__a">{children}</span>
        <span className="dk-btn__b" aria-hidden>
          {children}
        </span>
      </span>
    </>
  );
}
