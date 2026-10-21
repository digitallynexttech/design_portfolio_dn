/** A study as the field's sheet shows it (serializable; sources stay on the server). */
export type FieldStudy = {
  slug: string;
  /** Site order, "01"–"10". */
  no: string;
  client: string;
  headline: string;
  industry: string;
  platform: string;
  year: number;
  disciplines: string[];
  tier: "flagship" | "standard";
  chapters: number;
  metrics: { value: string; label: string }[];
  accent: string;
  bg: string;
  loop?: { src: string; poster: string };
};

/** One frame on the field. Positions are in field units (fu). */
export type FieldTile = {
  id: string;
  kind: "study" | "reel";
  slug: string | null;
  src: string;
  alt: string;
  /** The source image's own pixels, shown as the selection's size readout. */
  iw: number;
  ih: number;
  /** Centre in the period. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Top-left offset from the starting crosshair (wrapped), for the server-painted first frame. */
  dx: number;
  dy: number;
  /** "01.2": study 01, frame 2. */
  code: string;
  /** This frame plays the study's preview loop when it is held under the crosshair or hovered. */
  loop?: boolean;
  /** On the first screen: loads at once. */
  near: boolean;
};
