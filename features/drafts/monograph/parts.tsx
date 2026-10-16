/** A page number at the foot of a spread: outer corner, right on odd (recto) pages, left on even (verso). */
export function Folio({ n }: { n: number }) {
  return (
    <p className="m-folio" data-side={n % 2 ? "recto" : "verso"} aria-hidden>
      <span className="m-folio__rule" />
      {n}
    </p>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** 1 → "I". The plates and the services are numbered the way a book numbers its plates. */
export const roman = (n: number) => ROMAN[n - 1] ?? String(n);
