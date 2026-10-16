// Colour fields for Draft 3. Every field is a background and the text colour computed for it, so
// body copy keeps WCAG AA (4.5:1) on every colour the page flows through.

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const INK = "#0B0A0C";
const WHITE = "#FFFFFF";

/**
 * The text colour for a field: the brand's own pairing when it holds 4.5:1, otherwise whichever of
 * ink or white reads better.
 */
export function inkFor(bg: string, preferred?: string): string {
  if (preferred && contrast(bg, preferred) >= 4.5) return preferred;
  return contrast(bg, INK) >= contrast(bg, WHITE) ? INK : WHITE;
}

/** The studio's own fields, in the order the page flows through them (contrast noted per pair). */
export const FIELDS = {
  /** Brand red; white is 4.7:1. */
  red: { bg: "#E21F26", fg: "#FFFFFF", soft: "#FFFFFF" },
  /** Warm paper for the studio; ink 16:1, soft 7.2:1, red text 5.2:1. */
  cream: { bg: "#F7EDE1", fg: "#17110F", soft: "#5C4B42" },
  /** More work; ink 15.9:1, soft 6.5:1. */
  paper: { bg: "#F2EEE7", fg: "#141414", soft: "#5A544D" },
  /** Services: deep water; paper 15.4:1, soft 9.1:1. */
  navy: { bg: "#0F1B2D", fg: "#F5F1EA", soft: "#B4BDCB" },
  /** Client voices; ink 13.3:1, soft 6.2:1. */
  mist: { bg: "#D9E8E3", fg: "#10201C", soft: "#40564F" },
  /** The people: the blush of the studio's red walls; ink 13.7:1, soft 6.8:1. */
  blush: { bg: "#F3D9CE", fg: "#1C1210", soft: "#5E4239" },
} as const;

export type Field = { bg: string; fg: string; soft: string };

/** CSS custom properties for a field (inline style). */
export function fieldStyle(field: Field): Record<string, string> {
  return { "--bg": field.bg, "--fg": field.fg, "--soft": field.soft };
}
