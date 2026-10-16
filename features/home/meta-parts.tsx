import { Fragment } from "react";

/**
 * A meta line ("Genetics · Content network") that only ever breaks between its parts: each part
 * stays whole, and its dot stays with it.
 */
export function MetaParts({ parts }: { parts: string[] }) {
  return parts.map((part, k) => (
    <Fragment key={part}>
      <span className="whitespace-nowrap">
        {part}
        {k < parts.length - 1 ? " ·" : null}
      </span>
      {k < parts.length - 1 ? " " : null}
    </Fragment>
  ));
}
