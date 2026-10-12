import type { CaseStudy } from "../types";

// Chetan Mangalwedhe: personal thought-leadership site of the TalentiFi-X founder.
// Sources: ..\chet-portfolio (git log 5 Jun – 1 Oct 2026, components/homepage.tsx, lib/schema.ts, lib/media.ts,
// lib/site.ts, stylesheets/homepage.css, app/llms.txt, app/feed.xml), the SEO/GEO/AEO audit of 23 Sep 2026
// (chet-portfolio/audit), the SEO work log entry of 5 Oct 2026, DNMS project TALENTIFI-X (Chet tasks 25 Aug – 1 Oct),
// docs/dnms-findings.md.
// Deliberately left out: mobile speed (no fix documented), canonical-host details (live canonical tag and
// redirect disagree, see report), and anything implying Wikipedia notability.
const chetanMangalwedhe: CaseStudy = {
  slug: "chetan-mangalwedhe",
  client: "Chetan Mangalwedhe",
  headline: "A founder's notebook, built for readers and for the machines that read it.",
  summary:
    "Chetan Mangalwedhe founded TalentiFi-X and writes about hiring, AI and history. We built his personal site: an emerald-night home where a particle network answers the pointer, a reel wall that never talks over itself, and a press wall of 27 pieces from 16 outlets. Underneath, one connected identity tells search engines and AI assistants exactly who he is.",
  year: 2026,
  industry: "Thought leadership · Personal brand",
  disciplines: ["Brand site", "Search & AI"],
  platform: "Next.js · Sanity",
  liveUrl: "https://chetanmangalwedhe.com",
  tier: "standard",
  order: 9,
  theme: {
    scheme: "dark",
    bg: "#0A0F0D",
    surface: "#111714",
    text: "#ECEFEC",
    muted: "#B7BFB9",
    accent: "#4ECCA3",
    onAccent: "#0A0F0D",
    display: "bricolage",
    body: "instrumentSans",
  },
  poster: { src: "/work/chetan-mangalwedhe/home-desktop.webp", alt: "Chetan Mangalwedhe's homepage: a long headline in white and emerald italic beside his portrait, over a faint particle network", width: 1440, height: 900 },
  posterPhone: { src: "/work/chetan-mangalwedhe/home-phone.webp", alt: "The homepage on a phone, with the particle network behind the headline", width: 1170, height: 1992 },
  exhibit: "chetan",
  exhibitHint: "Move through the network. It parts around your cursor and reaches out to it.",
  metrics: [
    { value: "27", label: "press pieces from 16 outlets, on one wall", source: "chet-portfolio/lib/media.ts (27 entries, 16 distinct outlets)" },
    { value: "12 of 12", label: "AI and search crawlers served the full essay", source: "chet-portfolio/audit/SEO-GEO-AEO-AUDIT-2026-09-23 §1 Key strengths" },
    { value: "93–96", label: "desktop Lighthouse performance", source: "chet-portfolio/audit/SEO-GEO-AEO-AUDIT-2026-09-23 §1 Key strengths" },
  ],
  credits: [
    { team: "Web", people: ["mridul-singh-bisht", "diwakar-jha", "karan-joshi"] },
  ],
  testimonial: {
    quote:
      "I wanted a place where the thinking comes first and the CV comes second. It reads like me, and it tells search engines and AI tools, in one voice, exactly who I am.",
    name: "Chetan Mangalwedhe",
    role: "Founder, TalentiFi-X",
    company: "TalentiFi-X",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Chetan Mangalwedhe, founder of TalentiFi-X" },
        { label: "Site", value: "Essays, reels, themes and press" },
        { label: "Scope", value: "Design, build, CMS, search and AI readiness" },
        { label: "Timeline", value: "Built in June 2026, extended through October" },
      ],
    },
    {
      kind: "prose",
      heading: "Thinking out loud",
      paragraphs: [
        "Chetan writes about hiring, AI, how history repeats itself, and, in the site's own words, the big questions most people are too busy to ask. His press coverage was growing faster than any profile could keep up with.",
        "A founder's personal site has two readers. People should meet a mind at work, not a CV. Search engines and AI assistants need a single, certain answer to one question: who is this?",
      ],
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "Emerald night",
      paragraphs: [
        "Near-black ink and emerald light: the palette of a study late at night. Bricolage Grotesque sets the headlines, Fraunces italic carries the turns of phrase, and Instrument Sans does the reading. A mono face labels each section like a field notebook.",
        "Light follows the cursor across the hero and the theme tiles, and orbital rings turn slowly around the one big idea on the page. A warm paper theme is one tap away, and the site remembers the choice.",
      ],
    },
    {
      kind: "palette",
      heading: "Ink and emerald",
      colors: [
        { name: "Ink", hex: "#0A0F0D", note: "Page" },
        { name: "Ink 2", hex: "#111714", note: "Surfaces" },
        { name: "Emerald", hex: "#4ECCA3", note: "Signal" },
        { name: "Emerald Light", hex: "#187E5F", note: "Network links" },
        { name: "Emerald Deep", hex: "#0B5844", note: "Depth" },
        { name: "Paper", hex: "#F3EFE6", note: "Light theme" },
        { name: "Bone", hex: "#ECEFEC", note: "Text" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Bricolage Grotesque", role: "Headlines", font: "bricolage" },
        { name: "Fraunces", role: "Italic accents", font: "fraunces" },
        { name: "Instrument Sans", role: "Reading", font: "instrumentSans" },
      ],
      sample: "Thinking out loud about the world we're actually building.",
    },
    {
      kind: "figure",
      image: { src: "/work/chetan-mangalwedhe/orbit-desktop.webp", alt: "A dark section with an italic quotation on the left and slowly turning orbital rings on the right", width: 1440, height: 900 },
      caption: "One big idea at a time, with orbital rings turning around it.",
      frame: "browser",
      wide: true,
    },
    {
      kind: "pair",
      images: [
        { src: "/work/chetan-mangalwedhe/home-phone.webp", alt: "The homepage on a phone, with the particle network behind the headline", width: 1170, height: 1992 },
        { src: "/work/chetan-mangalwedhe/watch-phone.webp", alt: "The Watch section on a phone: a swipeable reel with arrow buttons and a mute control", width: 1170, height: 1992 },
      ],
      frames: ["phone", "phone"],
    },
  ],

  build: [
    {
      kind: "architecture",
      heading: "One person, everywhere",
      caption: "Every page, essay and press item points back to the same Person.",
      nodes: [
        { id: "sanity", label: "Sanity CMS", note: "the essays", lane: 0 },
        { id: "press", label: "Press list", note: "one typed file", lane: 0 },
        { id: "site", label: "Next.js site", note: "server-rendered", lane: 1 },
        { id: "graph", label: "Person graph", note: "JSON-LD, one id", lane: 2 },
        { id: "llms", label: "llms.txt", note: "a brief for AI", lane: 2 },
        { id: "feed", label: "RSS + sitemap", note: "for every essay", lane: 2 },
        { id: "search", label: "Search engines", lane: 3 },
        { id: "ai", label: "AI assistants", lane: 3 },
      ],
      links: [
        { from: "sanity", to: "site" },
        { from: "press", to: "site" },
        { from: "site", to: "graph" },
        { from: "site", to: "llms" },
        { from: "site", to: "feed" },
        { from: "graph", to: "search" },
        { from: "feed", to: "search" },
        { from: "llms", to: "ai" },
        { from: "graph", to: "ai" },
      ],
    },
    {
      kind: "prose",
      heading: "Written in a CMS, shaped by the design",
      paragraphs: [
        "Essays are written in Sanity and published under #ChetTalks, each with its own page, share image and place in the feed. The site is rendered on the server, so every crawler gets the whole essay, not a loading spinner.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "Press pieces", value: "27" },
        { label: "Outlets", value: "16" },
        { label: "Reels", value: "4, one voice at a time" },
        { label: "Network", value: "60 points" },
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "Sanity", "Tailwind CSS v4", "TypeScript", "Canvas 2D", "YouTube IFrame API", "JSON-LD", "RSS", "llms.txt", "Vercel", "Google Analytics 4"],
    },
  ],

  hurdles: [
    {
      id: "who-is-he",
      title: "Machines had to know who he is",
      group: "engineering",
      hard: "A personal site competes with every other page that mentions the person: old profiles, press quotes, social bios. Search engines and AI assistants need one authoritative answer to \"who is this?\", or they assemble their own from whatever they find.",
      fix: "Every page now describes him the same way in structured data: one Person with a stable identifier, which the website, the blog, every essay and every press item all point back to. A plain-text llms.txt brief lists every essay and press piece for AI assistants, and an RSS feed is declared on every page.",
      result: "One connected graph with no parsing errors. All 12 AI and search crawlers tested receive the full essay, rendered on the server.",
      solvedBy: ["mridul-singh-bisht", "karan-joshi"],
      source: "chet-portfolio commit 2968d06 (23 Sep 2026); lib/schema.ts; app/llms.txt; app/feed.xml; audit 23 Sep 2026 §1, §6; DNMS 23 Sep 2026 ('chet website full seo reports and seo optmise', 'complete SEO audit for both talentifix and chet website')",
    },
    {
      id: "quiet-motion",
      title: "Motion that doesn't compete with the words",
      group: "experience",
      hard: "The hero carries a long headline and a portrait. A busy animation behind them would take the attention the words need.",
      fix: "A sparse network of 60 points drifts behind the headline and only reacts near the pointer: points within reach move aside and draw faint lines to the cursor, while a soft light follows it. The network is drawn at the screen's real pixel density so it stays sharp. A canvas can't read the page's colour theme, so it checks the theme every frame and turns deep emerald on paper. Visitors who ask for reduced motion don't get it at all.",
      result: "The hero comes alive when you move and stays still while you read.",
      solvedBy: ["mridul-singh-bisht"],
      source: "chet-portfolio/components/homepage.tsx (hero particle canvas: PARTICLE_COUNT 60, LINK_DIST 130, pointer radius 140, prefers-reduced-motion guard)",
    },
    {
      id: "one-voice",
      title: "Four reels, all talking at once",
      group: "experience",
      hard: "The Watch section embeds four short videos. Video that plays on its own has to start muted, and once each reel has its own sound button, two can end up talking over each other.",
      fix: "Reels start muted. Tapping one reel's sound button unmutes it and mutes every other, through the YouTube player's own messaging interface. On a computer the four sit in a row; on a phone they become a swipeable carousel with arrows.",
      result: "Only ever one voice at a time.",
      solvedBy: ["mridul-singh-bisht"],
      source: "chet-portfolio/components/homepage.tsx (toggleReelSound, Watch section)",
    },
    {
      id: "press-wall",
      title: "A press wall that keeps growing",
      group: "engineering",
      hard: "New coverage arrives every few weeks: features, columns, interviews and the LinkedIn posts that share them. The press appears in four places, and four copies drift apart. Some outlets also block their images from appearing on other sites.",
      fix: "One typed list feeds the press page, the homepage preview, the structured data and the AI brief; the homepage shows the newest four and links to the rest. Publisher artwork is used where it loads. Where an outlet blocks it or publishes none, the card gets its own topical cover, and an article never shares an image with its LinkedIn post.",
      result: "27 pieces from 16 outlets, each added once and shown everywhere.",
      solvedBy: ["mridul-singh-bisht"],
      source: "chet-portfolio/lib/media.ts (header comment); commit a496f11 (1 Oct 2026); DNMS 1 Oct 2026 ('chet - new media added and also new images created for the media')",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Press", value: "27 pieces, 16 outlets" },
        { label: "Crawlers", value: "12 of 12 receive the full essay" },
        { label: "Desktop", value: "Lighthouse performance 93–96" },
        { label: "Research", value: "Wikipedia-readiness study done" },
      ],
    },
    {
      kind: "prose",
      heading: "A home base for the ideas",
      paragraphs: [
        "The site gives Chetan's writing, talks and press one address that he controls, and one description of him that search engines and AI assistants can trust.",
        "The work continued past launch, in audit rounds from August to October. It included Wikipedia-readiness research, which checked every press piece against the sourcing that reference works expect and gave the PR work a clear target.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/chetan-mangalwedhe/media-desktop.webp", alt: "The press page: 'In the media', with cards from Lokmat Times, Business Today and Business Standard", width: 1440, height: 900 },
        { src: "/work/chetan-mangalwedhe/talks-desktop.webp", alt: "The essays page: 'Latest from #ChetTalks', with three essay cards", width: 1440, height: 900 },
      ],
      frames: ["browser", "browser"],
    },
  ],

  next: "realty-canvas",
};

export default chetanMangalwedhe;
