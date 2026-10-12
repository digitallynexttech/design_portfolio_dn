import type { CaseStudy } from "../types";

// Leocym India: information-only brand site for a French odour-neutralisation brand.
// Sources: ..\LeocymDN (README, app/globals.css, features/, scripts/check-claims.mjs, git log 11–31 Aug 2026),
// DNMS project RUDIONE / LEOCYM (tasks 10 Aug – 31 Aug 2026), docs/dnms-findings.md.
// The site is not public yet (leocym.com shows a holding page; the build is noindex until sign-off).
// The client has granted permission to feature it. Screenshots come from the production build, served locally.
// Copy rule: product claims are quoted only from the site's own approved copy (lib/claims.ts, brand.ts,
// difference.tsx). No new performance claim, number, price or competitor name appears here.
const leocym: CaseStudy = {
  slug: "leocym",
  client: "Leocym India",
  headline: "A brand site that cannot overstate the product. The build won't let it.",
  summary:
    "Leocym is a French odour-neutralisation brand, distributed in India by Rudione. We built its information-only site: seven pages that explain how the chemistry works, show all 26 products and send every buyer to the distributor, never to a cart. Every line of copy is checked by the build itself, which refuses any claim, price or competitor's name the brand hasn't approved.",
  year: 2026,
  industry: "Odour control · Eco-hygiene",
  disciplines: ["Brand site"],
  platform: "Next.js · static",
  tier: "standard",
  order: 6,
  theme: {
    scheme: "light",
    bg: "#FFFFFF",
    surface: "#EAF2F5",
    text: "#1C1C46",
    muted: "#5E608E",
    // Leocym Orange (#F07814) measures 2.84:1 on white, under the 3:1 floor, so Leocym Indigo carries the accent.
    accent: "#282864",
    onAccent: "#FFFFFF",
    display: "montserrat",
    body: "openSans",
  },
  poster: { src: "/work/leocym/home-desktop.webp", alt: "The Leocym homepage: 'Real freshness, not perfume.' in indigo capitals beside a photograph of a water treatment plant", width: 1440, height: 900 },
  posterPhone: { src: "/work/leocym/home-phone.webp", alt: "The Leocym homepage on a phone", width: 1170, height: 1992 },
  exhibit: "leocym",
  exhibitHint: "Compare masking with neutralising, and follow the odour up to the air you breathe.",
  metrics: [
    { value: "0", label: "accessibility violations, every page, desktop and phone", source: "LeocymDN/README.md §Verified: axe-core WCAG 2.2 AA at 1440 and 390, all seven pages plus the 404" },
    { value: "26", label: "products, each from the printed catalogue", source: "LeocymDN/features/products/products.ts; public/products (26 plates)" },
    { value: "Zero", label: "JavaScript in the site's most important section", source: "LeocymDN/features/brand/components/difference.tsx (a server component; 'ships zero client JavaScript')" },
  ],
  credits: [
    { team: "Web", people: ["diwakar-jha", "karan-joshi"] },
    { team: "Design", people: ["komal-gautam"] },
    { team: "Accounts", people: ["teesha-jain"] },
  ],
  testimonial: {
    quote:
      "We can only say what we can prove, and the site holds that line for us. It shows the difference between covering a smell and removing one more clearly than any brochure we've printed.",
    name: "Leocym India founder",
    role: "Founder",
    company: "Leocym India",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Leocym India" },
        { label: "Technology", value: "French odour neutralisation" },
        { label: "Scope", value: "Information-only brand site, 7 pages" },
        { label: "Timeline", value: "About three weeks, August 2026" },
      ],
    },
    {
      kind: "prose",
      heading: "A site that never sells",
      paragraphs: [
        "Leocym's whole argument fits on one line of its homepage: Real Freshness, Not Perfume. In the brand's own approved words, its odour products \"remove smells at the source, rather than masking them with fragrance.\"",
        "The brief was unusual. The site explains: the chemistry, the range, where it is used. Then it hands every buyer to the distributor's own site. No price, no cart, no checkout, and no claim the brand cannot prove. Its structure came straight from the client's marketing strategy: one page for each item in the agreed sitemap.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/leocym/installation-hero.webp", alt: "Steam rising from an outdoor water treatment basin at dawn, with a technician working on the walkway", width: 1122, height: 1402 },
      caption: "Real installation photography, supplied by the client, leads the homepage.",
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "French technical apothecary",
      paragraphs: [
        "Editorial type on an industrial spec-sheet grid. Hairline rules, plate numbers and spec lists do the work that cards and shadows do on most sites.",
        "The first pass borrowed a warm paper ground from the printed catalogue. The brand book said otherwise: lead with navy and white. So the ground went white, Leocym Indigo took over the heavy lifting, and orange was held to about a tenth of any view. Red and green appear only with a meaning: red is the odour, green is neutralised.",
      ],
    },
    {
      kind: "palette",
      heading: "Straight from the brand book",
      colors: [
        { name: "White", hex: "#FFFFFF", note: "Ground" },
        { name: "Light Grey", hex: "#EAF2F5", note: "Bands" },
        { name: "Leocym Indigo", hex: "#282864", note: "Dominant" },
        { name: "Indigo Dark", hex: "#1C1C46", note: "Text" },
        { name: "Indigo Soft", hex: "#5E608E", note: "Secondary text" },
        { name: "Leocym Orange", hex: "#F07814", note: "About 10%, never text" },
        { name: "Orange Dark", hex: "#A8540E", note: "Orange that can carry text" },
        { name: "Leocym Red", hex: "#DC3C14", note: "The problem" },
        { name: "Leocym Green", hex: "#50A03C", note: "Neutralised" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Montserrat", role: "Titles, labels, buttons", font: "montserrat" },
        { name: "Open Sans", role: "Long reading", font: "openSans" },
      ],
      sample: "Real Freshness, Not Perfume.",
    },
    {
      kind: "figure",
      image: { src: "/work/leocym/products-desktop.webp", alt: "The Leocym catalogue page: odour neutralisers filtered by problem, with four product plates for drains, urine, garbage and carpets", width: 1440, height: 900 },
      caption: "Named after the problem, not the perfume. Every plate is the real catalogue photography.",
      frame: "browser",
      wide: true,
    },
    {
      kind: "pair",
      images: [
        { src: "/work/leocym/home-phone.webp", alt: "The Leocym homepage on a phone", width: 1170, height: 1992 },
        { src: "/work/leocym/difference-phone.webp", alt: "The masking diagram on a phone: odour lines rise straight through the fragrance layer", width: 1170, height: 1992 },
      ],
      frames: ["phone", "phone"],
      caption: "On a phone the comparison stacks, but each diagram keeps the same baseline.",
    },
  ],

  build: [
    {
      kind: "architecture",
      heading: "Rules first, then pages",
      caption: "Nothing reaches a page without passing the claims guard.",
      nodes: [
        { id: "content", label: "Typed content", note: "26 products, 5 segments", lane: 0 },
        { id: "claims", label: "Approved claims", note: "one file", lane: 0 },
        { id: "guard", label: "Claims guard", note: "runs before every build", lane: 1 },
        { id: "pages", label: "Seven static pages", note: "Next.js 16", lane: 2 },
        { id: "feeds", label: "Sitemap + llms.txt", note: "from the same menu", lane: 2 },
        { id: "enquiry", label: "Enquiry form", note: "one email, no database", lane: 3 },
        { id: "buy", label: "Distributor's site", note: "the only buy link", lane: 3 },
      ],
      links: [
        { from: "content", to: "guard" },
        { from: "claims", to: "guard" },
        { from: "guard", to: "pages", label: "pass or fail" },
        { from: "pages", to: "feeds" },
        { from: "pages", to: "enquiry" },
        { from: "pages", to: "buy", label: "where to buy" },
      ],
    },
    {
      kind: "prose",
      heading: "Quiet engineering",
      paragraphs: [
        "Every page is prebuilt as static HTML; the enquiry form is the only part that runs on request, because it sends mail. That mail goes out from the site's own address with the enquirer in Reply-To, so leads land in the inbox rather than in spam.",
        "Pages change with the browser's own View Transitions: a short crossfade while the header stays still. Sections reveal once as you reach them, with no animation library, and all of it switches off for visitors who ask for reduced motion.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "Pages", value: "7" },
        { label: "Products", value: "26" },
        { label: "Approved claims", value: "4" },
        { label: "Accessibility violations", value: "0" },
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "Tailwind CSS v4", "TypeScript", "View Transitions API", "Zod", "React Hook Form", "Nodemailer", "Vitest", "Playwright", "axe-core", "Vercel"],
    },
  ],

  hurdles: [
    {
      id: "claims-guard",
      title: "Every sentence is a legal claim",
      group: "engineering",
      hard: "Odour control is a category of big promises. The brand had no laboratory data, so it could say only the four claims it had approved in writing. A site written by several hands over several rounds drifts.",
      fix: "We moved the rule out of people's memory and into the build. The approved claims live in one file. Before every build, a guard script reads every string that can reach a page and fails on a price, a cart, a competitor's name, an unapproved percentage or forbidden sales language. We inject violations on purpose to prove it still fails.",
      result: "A breach can't ship. It stops the deploy instead.",
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "LeocymDN/scripts/check-claims.mjs; lib/claims.ts; README §Contract",
    },
    {
      id: "side-by-side",
      title: "A toggle hid the comparison",
      group: "experience",
      hard: "The brand rests on one contrast: covering a smell versus removing it. The first version showed it as a toggle, and a toggle makes a comparison sequential. Readers had to hold one state in memory while looking at the other, and most clicked once or not at all.",
      fix: "Both approaches now sit side by side on a shared baseline: the same air at the top, the same source at the bottom, so the only thing that differs is what happens in between. Red marks the odour and green the neutralised state. The brand's own orange stays off the method the brand argues against.",
      result: "The comparison reads at a glance, and the site's most important section ships no JavaScript at all.",
      solvedBy: ["diwakar-jha", "karan-joshi"],
      source: "LeocymDN/features/brand/components/difference.tsx (header comment)",
    },
    {
      id: "contrast",
      title: "The brand's own colours failed contrast",
      group: "experience",
      hard: "The brand book's orange measures 2.84:1 on white, and its light indigo 3.37:1. Both fall short of what readers with low vision need for text. The palette is fixed, and mixing new shades would break the guidelines.",
      fix: "Orange never carries text; where text needs orange, it uses the brand book's own Dark orange. Secondary text uses the nearest indigo that clears 4.5:1 on every ground. Each deviation is written down beside its token with the measured ratio. Then we tested what a screenshot can't show: keyboard focus, dialogs, and the scrolling ticker under reduced motion.",
      result: "Zero automated accessibility violations (WCAG 2.2 AA) on every page, at desktop and phone widths.",
      demo: { kind: "shift", label: "Secondary text contrast on white", before: 3.37, after: 5.93, unit: ":1", better: "higher", decimals: 2 },
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "LeocymDN/app/globals.css (DEVIATION 1 of 2, --color-flame-deep); commit f7e5c88; README §Verified",
    },
    {
      id: "one-page",
      title: "Twelve sections on one page",
      group: "experience",
      hard: "The first version put everything on the homepage: the catalogue, five industrial segments, the method, ten questions. Every part was good. Together they were unreadable.",
      fix: "We rebuilt the structure around the client's sitemap and marketing strategy: seven pages, one for each agreed item. Nothing was deleted. The homepage keeps a short preview of each page, drawn from the same typed content as the page itself, and the sitemap is generated from the navigation.",
      result: "A preview can't fall out of date with its page, and no page can be added to the menu but left out of the sitemap.",
      solvedBy: ["diwakar-jha"],
      source: "LeocymDN/README.md 'Why it stopped being one page'; DNMS 10 Aug 2026 (sitemap changes per marketing strategy) and 11 Aug 2026 (Leocym pages per sitemap)",
    },
    {
      id: "sign-off",
      title: "Finished, but not yet approved",
      group: "engineering",
      hard: "A brand that hasn't launched can't have unapproved copy turn up in Google. But approval needs a real site at a real address, and nobody signs off a whole site by clicking through it page by page.",
      fix: "The site stays invisible to search engines until one setting is switched on, and a fresh deployment starts in that safe state; even a setting left blank counts as off. A hidden review page sets out every claim and every line of product copy on one sheet, so the client can approve it in a single sitting.",
      result: "The team could build, test and share the site freely. Going live is one switch, after sign-off.",
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "LeocymDN/README.md 'The site is deliberately not indexable yet'; app/(marketing)/review; commit 279e4d4",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Pages", value: "7, one per sitemap item" },
        { label: "Accessibility", value: "0 violations · WCAG 2.2 AA" },
        { label: "Claims", value: "Only the 4 approved, enforced at build" },
        { label: "Launch", value: "One switch, after the client signs off" },
      ],
    },
    {
      kind: "prose",
      heading: "Explain, then step aside",
      paragraphs: [
        "Leocym's site does one job and refuses the others. It explains how the chemistry works, what it treats and where it is used, then sends buyers to the distributor's own site rather than to a marketplace.",
        "Its rules don't depend on anyone remembering them. The claims, the colours and the structure are all enforced by the code, so the site stays honest as it grows.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/leocym/brand-story-desktop.webp", alt: "The Leocym brand story page: 'A French brand built around one refusal.'", width: 1440, height: 900 },
        { src: "/work/leocym/business-desktop.webp", alt: "The Leocym for-business page: 'Odour is a licence condition before it is a nuisance.'", width: 1440, height: 900 },
      ],
      frames: ["browser", "browser"],
    },
  ],

  next: "kyg-network",
};

export default leocym;
