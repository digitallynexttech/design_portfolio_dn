// Exhibit data for Leocym, taken verbatim from ..\LeocymDN\features\brand\components\difference.tsx
// (the zero-JavaScript "mask vs neutralise" comparison on the homepage).
//
// This copy sits inside the brand's approved claims and passed the site's own claims guard
// (scripts/check-claims.mjs). Do not reword it, add numbers to it, or name a competitor beside it.
// The site writes " - " (spaced hyphen) rather than a dash; it is kept as written.

export const LEOCYM_DIFFERENCE: {
  mask: { title: string; body: string };
  neutralise: { title: string; body: string };
} = {
  mask: {
    title: "The fragrance sits on top.",
    body: "A perfume is released into the air above the smell. Nothing has happened to the source - it is still there, still producing odour.",
  },
  neutralise: {
    title: "The action happens at the source.",
    body: "Leocym is applied to the source itself - poured into the drain, sprayed onto the soiled surface, placed where the odour is produced.",
  },
};
