// Exhibit data for TalentiFi-X: before → after readings from the SEO work of 29 Sep – 7 Oct 2026.
// Every value is traceable to the SEO work log (..\SEO\documentation\document.md) or the saved
// Lighthouse reports (..\SEO\talentifix\lighthouse). Positive, verified results only.
// `max` is the full scale of each gauge, so a "water level" can be drawn as after / max.

export const TFX_SHIFTS: {
  label: string;
  before: number;
  after: number;
  unit?: string;
  better: "higher" | "lower";
  max: number;
  source: string;
}[] = [
  {
    label: "Mobile Lighthouse, jobs page",
    before: 79,
    after: 94,
    better: "higher",
    max: 100,
    source: "SEO/talentifix/lighthouse/jobs-mobile.json (29 Sep 2026) → lighthouse/2026-10-06/jobs-mobile.json; SEO work log 6 Oct 2026",
  },
  {
    label: "Jobs page main content on a phone",
    before: 4.2,
    after: 2.5,
    unit: "s",
    better: "lower",
    max: 5,
    source: "Largest Contentful Paint in the same two Lighthouse reports (4.2 s → 2.5 s)",
  },
  {
    label: "SEO checklist items done",
    before: 81,
    after: 123,
    better: "higher",
    max: 199,
    source: "SEO work log 29 Sep 2026 (81 of 199) and 6 Oct 2026 (123 of 199); SEO/talentifix/Talentifix-SEO-Checklist.xlsx",
  },
  {
    label: "Next.js checklist items done",
    before: 25,
    after: 48,
    better: "higher",
    max: 56,
    source: "SEO work log 29 Sep 2026 (25 of 56) and 6 Oct 2026 (48 of 56)",
  },
  {
    label: "Pages with a correct heading order",
    before: 10,
    after: 40,
    better: "higher",
    max: 40,
    source: "SEO work log 1 Oct 2026: 30 of 40 pages broke the order; all 40 pass after PR #28, rechecked 6 Oct",
  },
  {
    label: "Cookie banner height on phones",
    before: 228,
    after: 78,
    unit: "px",
    better: "lower",
    max: 240,
    source: "SEO work log 1 Oct 2026 (228 → 152 px) and 6 Oct 2026 (152 → 78 px); commit 0b38074",
  },
];
