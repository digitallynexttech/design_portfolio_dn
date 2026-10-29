/** Two digits, as the home's case numbers and the gauge read. */
export const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A client colour as a hairline on the void: dark accents (Know Your Genes' deep teal) are lifted
 * toward paper until a 1 px line reads; bright ones are left exactly as they are.
 */
export function lift(hex: string): string {
  const v = parseInt(hex.slice(1), 16);
  const rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const lin = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  if (luminance >= 0.08) return hex;
  const mixed = rgb.map((c, i) => Math.round(c + ([242, 241, 238][i] - c) * 0.38));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
