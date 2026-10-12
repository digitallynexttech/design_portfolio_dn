import type { Img } from "../types";

// Exhibit data for Happy Ganga, taken from the theme in ..\HappyGangav1\theme.

/**
 * The "How it works" river the theme draws (sections/hg-journey.liquid).
 * The theme builds this path in Liquid from the number of stages; this is its output for the
 * home page's five stages (Bottle, Bucket, Floor, Drain, River). Stage centres sit at
 * x = 130 / 390 / 650 / 910 / 1170, alternating y = 170.567 (low) and 53.0142 (high).
 * The theme draws it with preserveAspectRatio="none", a non-scaling 3.4 stroke with round caps,
 * and a userSpaceOnUse gradient across x 0 → 1300: #FFC400 0% · #FF7300 45% · #0896AC 100%.
 */
export const HG_RIVER: { viewBox: string; d: string } = {
  viewBox: "0 0 1300 348.05",
  d: "M23 170.567H130C260 170.567 260 53.0142 390 53.0142C520 53.0142 520 170.567 650 170.567C780 170.567 780 53.0142 910 53.0142C1040 53.0142 1040 170.567 1170 170.567H1277",
};

/**
 * Real product photography on transparent backgrounds (theme/assets/hg-shot-*.png), kept with alpha.
 * `color` is each product's card ground from hg-tokens.css (the flat midpoint of its card gradient).
 */
export const HG_PRODUCTS: { name: string; color: string; image: Img }[] = [
  {
    name: "Floor Cleaner",
    color: "#FBE3C8",
    image: { src: "/work/happy-ganga/shot-floor.webp", alt: "Happy Ganga Floor Cleaner, 500 ml bottle", width: 628, height: 1789 },
  },
  {
    name: "Dishwash Liquid",
    color: "#FADEE2",
    image: { src: "/work/happy-ganga/shot-dishwash.webp", alt: "Happy Ganga Dishwash Liquid, 500 ml bottle", width: 627, height: 1797 },
  },
  {
    name: "Laundry Detergent",
    color: "#CDE9DC",
    image: { src: "/work/happy-ganga/shot-laundry.webp", alt: "Happy Ganga Laundry Detergent, 500 ml bottle", width: 628, height: 1793 },
  },
  {
    name: "Toilet Cleaner",
    color: "#DEDCF5",
    image: { src: "/work/happy-ganga/shot-toilet.webp", alt: "Happy Ganga Toilet Cleaner bottle with a red nozzle", width: 666, height: 1574 },
  },
  {
    // The theme's real four-bottle lockup (hg-shot-pack.png), shown on the "value pack" sun ground.
    // Not labelled as the SAFE HOME Pack: that pack's contents were still awaiting client confirmation.
    name: "The full range",
    color: "#F5E0BE",
    image: { src: "/work/happy-ganga/shot-range.webp", alt: "The four Happy Ganga cleaners side by side: laundry, dishwash, floor and toilet", width: 800, height: 793 },
  },
];
