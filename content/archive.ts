import type { ArchiveEntry } from "./types";

// Older work, shown below the Work grid. Cards link out to the live sites.
// Screenshots: 1440×900 above the fold, captured with Playwright on 8 Oct 2026 (scratch/assets/shoot-archive.mjs).
// Sources (never rendered):
// - Sectors, platforms and results: digitallynext.com/design-portfolio (digitallynext/src/app/design-portfolio/DesignPortfolioClient.tsx, PORTFOLIO_CARDS).
// - Years: previous portfolio (previous_portfolio/src/components/project/project-four.tsx, `meta`). Left out where unknown.
// - Platforms for iMET, Gajna, Sanjivani, Opinova, NeoTech: live response headers (Vercel) and /_next/static assets, 8 Oct 2026.
// - NEET Playbook: design comp neetplaybook/pages/neetPlayBook/NeetPlayBook.png (no public URL).
// - Deepak Goel: skipped. deepakgoel.in still serves the old WordPress site, not ours.
export const ARCHIVE: ArchiveEntry[] = [
  {
    client: "Advent Global",
    sector: "IT services",
    platform: "WordPress",
    year: 2024,
    url: "https://adventglobal.com",
    image: {
      src: "/archive/advent-global.webp",
      alt: "Advent Global home page: a serif headline reading “Welcome To TECH… Emerge” in navy and amber.",
      width: 1400,
      height: 875,
    },
    note: "A brand revamp and new site for a long-standing IT firm. Soon after launch, it helped them win a landmark enterprise client.",
  },
  {
    client: "iMET Global",
    sector: "Business school",
    platform: "Next.js",
    year: 2024,
    url: "https://imetglobal.com",
    image: {
      src: "/archive/imet-global.webp",
      alt: "iMET Global home page: “New age skills-driven B-School” headline with four course buttons.",
      width: 1400,
      height: 875,
    },
    note: "A site for a business school that teaches digital, social media and AI, in the same group as Digitally Next.",
  },
  {
    client: "Khaleej",
    sector: "Fashion",
    platform: "Shopify",
    year: 2025,
    url: "https://khaleej.in",
    image: {
      src: "/archive/khaleej.webp",
      alt: "Khaleej home page: the wordmark over a photo of models in wool capes, with a Shop Now button.",
      width: 1400,
      height: 875,
    },
    note: "A Shopify store for a luxury capes and ponchos label. 5X ROAS within the first month.",
  },
  {
    client: "House of Nandini",
    sector: "Fashion",
    platform: "Shopify",
    year: 2025,
    url: "https://houseofnandini.com",
    image: {
      src: "/archive/house-of-nandini.webp",
      alt: "House of Nandini home page: a festive banner of women in chikankari sarees.",
      width: 1400,
      height: 875,
    },
    note: "A Shopify store for Lucknow chikankari, launched at a live inauguration event.",
  },
  {
    client: "Mauli",
    sector: "Fashion",
    platform: "Shopify",
    url: "https://mauli.co",
    image: {
      src: "/archive/mauli.webp",
      alt: "Mauli home page: a model in an embroidered cashmere scarf above a Best Sellers row.",
      width: 1400,
      height: 875,
    },
    note: "A quiet, minimal Shopify store for a cashmere label. 4X ROAS within 2 months.",
  },
  {
    client: "Gajna Overseas",
    sector: "Coffee export",
    platform: "Next.js",
    year: 2025,
    url: "https://gajnaoverseas.com",
    image: {
      src: "/archive/gajna-overseas.webp",
      alt: "Gajna Overseas home page: a farmer picking red coffee cherries under the forest canopy.",
      width: 1400,
      height: 875,
    },
    note: "An export-ready site for a green coffee exporter, written for buyers in the USA, Europe and the Middle East.",
  },
  {
    client: "Sanjivani Edge",
    sector: "IT and ERP services",
    platform: "Next.js",
    url: "https://sanjivaniedge.com",
    image: {
      src: "/archive/sanjivani-edge.webp",
      alt: "Sanjivani Edge home page: “Rooted in Values… Engineered for the Future…” on a light dotted background.",
      width: 1400,
      height: 875,
    },
    note: "A clean, precise site for an IT and ERP firm, built to start the right enterprise conversations.",
  },
  {
    client: "Opinova Foundation",
    sector: "Non-profit",
    platform: "Next.js",
    url: "https://opinovafoundation.com",
    image: {
      src: "/archive/opinova-foundation.webp",
      alt: "Opinova Foundation home page: “Empowering Communities. Inspiring Change.” above a photo of a boy writing on a blackboard.",
      width: 1400,
      height: 875,
    },
    note: "A dignified home for a community non-profit, written for donors, grant bodies and the people it serves.",
  },
  {
    client: "NeoTech World Lab",
    sector: "Genomic diagnostics",
    platform: "Next.js",
    url: "https://neotechworldlab.com",
    image: {
      src: "/archive/neotech-world-lab.webp",
      alt: "NeoTech World Lab home page: “From Unknowns to Outcomes.” beside a glowing glass sphere holding a DNA helix.",
      width: 1400,
      height: 875,
    },
    note: "Makes genetic testing read clearly for patients and institutions alike.",
  },
  {
    client: "NEET Playbook",
    sector: "Education",
    platform: "HTML and WordPress",
    url: "",
    image: {
      src: "/archive/neet-playbook.webp",
      alt: "NEET Playbook design: “Before You Take NEET… Read This Once.” beside the book cover.",
      width: 1400,
      height: 875,
    },
    note: "A sales funnel for a NEET admissions guide, designed as static pages and ported to a WordPress theme.",
  },
];
