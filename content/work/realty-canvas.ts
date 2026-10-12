import type { CaseStudy } from "../types";

// Realty Canvas. Sources: ..\realtycanvas (code, git log incl. origin/main), docs/dnms-findings.md,
// live captures of https://www.realtycanvas.in on 8 Oct 2026. Front end and SEO model only.
const realtyCanvas: CaseStudy = {
  slug: "realty-canvas",
  client: "Realty Canvas",
  headline: "Sixty Gurugram launches, each framed for its screen and found on its own.",
  summary:
    "Realty Canvas is a real-estate advisory in Gurugram that helps buyers choose between new launches. We built its property platform: listings, lead capture, a blog, and the console the team runs every project from. Each of its 60 project pages carries its own search identity, and every hero banner is composed separately for phones, tablets and wide screens.",
  year: 2026,
  industry: "Real estate · Advisory",
  disciplines: ["Platform", "Search & AI", "Brand site"],
  platform: "Next.js · Postgres · Sanity",
  liveUrl: "https://www.realtycanvas.in",
  tier: "standard",
  order: 10,
  theme: {
    scheme: "dark",
    bg: "#0D1B25",
    surface: "#112D48",
    text: "#F5F3EE",
    muted: "#A9B4BF",
    accent: "#FEB711",
    onAccent: "#0D1B25",
    display: "inter",
    body: "inter",
  },
  poster: {
    src: "/work/realty-canvas/project-desktop.webp",
    alt: "The Tarc Ishva project page on Realty Canvas: an aerial view of the towers beside the price, size and key highlights",
    width: 1440,
    height: 900,
  },
  posterPhone: { src: "/work/realty-canvas/project-phone.webp", alt: "The Tarc Ishva project page on a phone, with Enquire, Call Now and WhatsApp buttons fixed at the bottom", width: 1170, height: 1992 },
  exhibit: "realty-canvas",
  exhibitHint: "Swipe the top banner away to deal the next. Each project comes twice: once cut for a phone, once for a tablet.",
  metrics: [
    {
      value: "60",
      label: "project pages, each with its own SEO record",
      source: "https://www.realtycanvas.in/sitemap.xml, 60 /projects/ URLs on 8 Oct 2026; realtycanvas/prisma/schema.prisma ProjectSeo",
    },
    {
      value: "3",
      label: "compositions of every hero banner, phone to TV",
      source: "realtycanvas/public/banner/{mobile,tablet,extended,tv}; components/home/hero-section.tsx; data/banners.ts",
    },
    {
      value: "4 days",
      label: "from the client's reference to a finished Vedic City Goa page",
      source: "DNMS Realty Canvas tasks 10–13 Aug 2026; realtycanvas commits e7c3ec4 (10 Aug), 87964b0 (13 Aug)",
    },
  ],
  credits: [
    { team: "Web", people: ["diwakar-jha", "karan-joshi"] },
    { team: "Design", people: ["anukriti-singh", "komal-gautam"] },
    { team: "Accounts", people: ["teesha-jain"] },
  ],
  testimonial: {
    quote:
      "Every launch we advise on gets its own page that search engines actually understand, and our banners look right on a phone or a showroom screen. When we needed the Goa page exactly as designed, it was done that week.",
    name: "Realty Canvas founder",
    role: "Founder",
    company: "Realty Canvas",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Realty Canvas, Gurugram" },
        { label: "Business", value: "Advisory on new property launches" },
        { label: "Scope", value: "Listings, leads, blog, SEO, landing pages" },
        { label: "Started", value: "March 2026" },
      ],
    },
    {
      kind: "prose",
      heading: "Advice, not inventory",
      paragraphs: [
        "Realty Canvas doesn't build towers; it helps people choose between them. Buyers arrive comparing launches by sector, developer and budget, and leave by calling, messaging or filling in a form.",
        "So the site had two jobs: make each project easy to compare and act on, and make each one findable on its own, for a search like \"3 BHK on Golf Course Extension Road\" rather than for the brand alone.",
      ],
    },
    {
      kind: "figure",
      image: {
        src: "/work/realty-canvas/home-desktop.webp",
        alt: "The Realty Canvas home page: a Downtown 66 banner across the top and a search panel for category, status, price and name",
        width: 1440,
        height: 600,
      },
      caption: "Search overlaps the banner: by category, status, price, or a project, place or developer's name.",
      frame: "browser",
    },
  ],

  design: [
    {
      kind: "palette",
      heading: "Navy and gold",
      colors: [
        { name: "Navy", hex: "#0D1B25", note: "Brand" },
        { name: "Harbour", hex: "#112D48" },
        { name: "Ink", hex: "#0B1A3D", note: "Headings" },
        { name: "Gold", hex: "#FEB711", note: "Brand, calls to action" },
        { name: "Amber", hex: "#FDB022", note: "Highlights" },
        { name: "Paper", hex: "#FFFFFF", note: "Page" },
      ],
    },
    {
      kind: "typeface",
      families: [{ name: "Inter", role: "Headlines and text", font: "inter" }],
      sample: "Find your address in Gurugram.",
    },
    {
      kind: "pair",
      images: [
        {
          src: "/work/realty-canvas/home-phone.webp",
          alt: "The home page on a phone: the Ishva banner composed for a narrow screen, with the search panel below",
          width: 1170,
          height: 1992,
        },
        {
          src: "/work/realty-canvas/project-phone.webp",
          alt: "A project page on a phone, with Enquire, Call Now and WhatsApp buttons fixed at the bottom",
          width: 1170,
          height: 1992,
        },
      ],
      frames: ["phone", "phone"],
      caption: "On a phone, enquiring is always one thumb away.",
    },
    {
      kind: "figure",
      image: {
        src: "/work/realty-canvas/banner-ishva-tv.webp",
        alt: "The Ishva banner on its ultra-wide canvas: the towers and text in the centre, night sky and hills running far out to both sides",
        width: 1600,
        height: 181,
      },
      caption: "The same Ishva banner, drawn on a canvas 9,375 pixels wide for desktops and TVs. Wide screens crop into the middle and never reach an edge.",
      frame: "none",
      wide: true,
    },
    {
      kind: "prose",
      heading: "A skyline while you wait",
      paragraphs: [
        "Each visit opens on a small Lottie city that builds itself under the sun. It leaves one second after the page has loaded, or at three seconds, whichever comes first, so it welcomes people without ever holding them up.",
      ],
    },
    {
      kind: "figure",
      image: {
        src: "/work/realty-canvas/preloader.webp",
        alt: "The preloader: a sun, a few clouds and a low skyline being drawn above the words Realty Canvas",
        width: 1170,
        height: 1200,
      },
      frame: "none",
    },
  ],

  build: [
    {
      kind: "prose",
      heading: "Built around the project page",
      paragraphs: [
        "Every project lives in one database record: gallery, floor plans, prices by unit size, highlights, location, FAQs and its own search settings. The team edits all of it from a console, and the public page, the sitemap and the structured data all read from the same place.",
        "The blog runs on Sanity, and a plain-text guide at /llms.txt describes the site and its projects for AI search tools.",
      ],
    },
    {
      kind: "figure",
      image: {
        src: "/work/realty-canvas/project-local-content.webp",
        alt: "A project page's overview and location sections, written for that project's sector",
        width: 1440,
        height: 900,
      },
      caption: "Each project carries its own local copy, written for its sector, not a template's.",
      frame: "browser",
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "Prisma + Postgres", "Sanity", "Framer Motion", "Lottie", "Tailwind CSS 4", "JSON-LD"],
    },
  ],

  hurdles: [
    {
      id: "goa-exact",
      title: "Exactly the same page",
      group: "experience",
      hard: "For Vedic City Goa, the client already had a finished landing page and wanted it on realtycanvas.in with exactly the same UI, down to its own tracking and lead hand-off.",
      tried: "We first rebuilt it as React components inside the site. It looked right, but every detail of its tracking would have had to be rebuilt and re-tested too.",
      fix: "The original build is now served as-is at /vedic-city-goa through a rewrite inside the main site, so it keeps its own header, footer and tracking. The sitemap and the AI guide still list it, and the React version is archived, ready to restore.",
      result: "The page matches the reference to the pixel, the client's tracking is untouched, and it was done in four days.",
      solvedBy: ["diwakar-jha"],
      source: "realtycanvas origin/main archive/vedic-city-goa-react/README.md; commits e7c3ec4 (10 Aug 2026), 87964b0 (13 Aug 2026); DNMS task 10–13 Aug (\"exact same UI\")",
    },
    {
      id: "banner-cuts",
      title: "One banner, three compositions",
      group: "experience",
      hard: "A launch banner is a tower and a price. Squeezed onto a phone, the price falls off; stretched across a wide screen, the towers crop at the knees.",
      tried: "One phone banner refused to load because its file name differed from the reference by a single capital letter: harmless on a laptop, fatal on a case-sensitive server.",
      fix: "Every banner is drawn three times: a near-square cut for phones, a landscape cut for tablets, and a canvas over 9,000 pixels wide whose scenery runs past the edges, so desktops and TVs crop into the middle and never find an edge. The browser picks the one composed for its screen.",
      result: "The towers and the price stay in frame, from a phone in the hand to a screen on a showroom wall.",
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "realtycanvas components/home/hero-section.tsx (<picture> at 768/1280/1920 px); public/banner (768×680, 2048×1200, 9375×1063); commits 658630e, 971d3bc, f92272f (27 Mar 2026)",
    },
    {
      id: "seo-per-project",
      title: "One template, sixty identities",
      group: "engineering",
      hard: "Sixty projects share one page template, but each has to rank for its own sector and developer, with its own title, its own structured data and the right words behind its own photos.",
      fix: "Every project carries its own SEO record: title and description, social card, canonical address, H1 and H2s, custom JSON-LD with an automatic real-estate-listing fallback, alt text for each image, local and long-form copy, an index switch and a sitemap priority. Breadcrumb and FAQ structured data are generated beside it.",
      result: "Each of the 60 project pages describes itself to search and AI engines in its own words, edited by the team without a developer.",
      solvedBy: ["diwakar-jha", "karan-joshi"],
      source: "realtycanvas prisma/schema.prisma model ProjectSeo; app/(routes)/projects/[slug]/page.tsx; components/projects/project-detail-client.tsx (imageAltMap); live sitemap 8 Oct 2026",
    },
    {
      id: "hidden-answers",
      title: "Answers the answer engines couldn't read",
      group: "engineering",
      hard: "The home page FAQ only put an answer on the page when a visitor opened it. Search engines and AI answer engines read the page as it is served, so they saw questions with no answers.",
      fix: "Every answer is now in the page from the start, folded away with CSS. The same list feeds the FAQ structured data, so what visitors read and what search engines read can't drift apart. The business was also described as a real-estate agent with the area it serves.",
      result: "Every answer is readable without a click, by people and by machines.",
      solvedBy: ["karan-joshi"],
      source: "realtycanvas commit 6b3e519 (16 Jun 2026); lib/home-faqs.ts; components/home/FAQ-section.tsx",
    },
    {
      id: "shorts-deck",
      title: "Eight videos, three players",
      group: "experience",
      hard: "The home page deals a deck of eight YouTube Shorts. Eight live video players would weigh the page down and fight over the connection.",
      fix: "Only the top three cards ever exist. Drag the front card past a threshold and it goes to the back of the deck; left alone, the deck deals itself every five seconds, but only while it is on screen.",
      result: "A deck that feels endless, with never more than three players loaded.",
      solvedBy: ["karan-joshi"],
      source: "realtycanvas components/home/podcast-section.tsx (cards.slice(0, 3), IntersectionObserver, 5 s); commit b64670d (10 Mar 2026)",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Projects", value: "60 pages, each with its own SEO" },
        { label: "Banners", value: "Three cuts each, phone to TV" },
        { label: "Vedic City Goa", value: "Matched to the reference in four days" },
        { label: "AI search", value: "A site guide at /llms.txt" },
      ],
    },
    {
      kind: "prose",
      heading: "A shop window for every launch",
      paragraphs: [
        "Realty Canvas now adds a launch by filling in one record. The page, its search identity, its place in the sitemap and its structured data follow on their own, and the banner looks composed on whatever screen it lands on.",
        "For Goa, the client got the page exactly as designed, and the design team made a \"Goa Decoded\" carousel to go with it.",
      ],
    },
    {
      kind: "pair",
      images: [
        {
          src: "/work/realty-canvas/goa-desktop.webp",
          alt: "The Vedic City Goa landing page: a hero with key facts on the left and an enquiry form on the right",
          width: 1425,
          height: 900,
        },
        {
          src: "/work/realty-canvas/goa-phone.webp",
          alt: "The Vedic City Goa page on a phone, with Enquire, Call and WhatsApp fixed at the bottom",
          width: 1170,
          height: 1992,
        },
      ],
      frames: ["browser", "phone"],
      caption: "Vedic City Goa, served exactly as the client designed it.",
    },
  ],

  next: "making-of",
};

export default realtyCanvas;
