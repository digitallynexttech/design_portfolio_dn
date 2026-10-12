import type { CaseStudy } from "../types";

const kygNetwork: CaseStudy = {
  slug: "kyg-network",
  client: "Know Your Genes network",
  headline: "One science, thirteen ways in.",
  summary:
    "Alongside its store, Know Your Genes runs thirteen content sites, each explaining genetics to a different kind of reader. We built all thirteen on one shared foundation, each with its own format, colours and type. Then we checked every one of them live, in a real browser, page by page.",
  year: 2026,
  industry: "Genetics · Content network",
  disciplines: ["Brand site", "Platform"],
  platform: "Next.js · Sanity",
  tier: "standard",
  order: 7,
  theme: {
    scheme: "light",
    bg: "#F6F3EA",
    surface: "#FFFDF8",
    text: "#1B1813",
    muted: "#46413A",
    accent: "#0F766E",
    onAccent: "#FFFDF8",
    display: "fraunces",
    body: "geist",
  },
  poster: { src: "/work/kyg-network/mapmygenes-co-in-desktop.webp", alt: "mapmygenes.co.in, the network's streaming-style site: a dark billboard story above a row of trending tiles", width: 1200, height: 750 },
  posterPhone: { src: "/work/kyg-network/mapmygenes-co-in-phone.webp", alt: "mapmygenes.co.in on a phone: the dark billboard story above the first trending tiles", width: 390, height: 844 },
  exhibit: "kyg-network",
  exhibitHint: "Flip through the thirteen sites: one subject, poured into thirteen different shapes.",
  metrics: [
    { value: "13", label: "sites on one shared foundation", source: "knowyourgensSub Websites/memory.md" },
    { value: "111", label: "live pages checked in a real browser", source: "knowyourgensSub Websites/audit/LIVE-SMOKE-AUDIT-2026-08-20.md" },
    { value: "0", label: "JavaScript errors across those pages", source: "knowyourgensSub Websites/audit/LIVE-SMOKE-AUDIT-2026-08-20.md §1" },
  ],
  credits: [
    { team: "Web", people: ["diwakar-jha", "karan-joshi"] },
    { team: "Accounts", people: ["teesha-jain"] },
  ],
  testimonial: {
    quote:
      "Thirteen sites on one subject could easily have felt like one site thirteen times. Each has its own voice, and we know exactly how every page behaves.",
    name: "Know Your Genes founder",
    role: "Founder",
    company: "Know Your Genes",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Know Your Genes" },
        { label: "Sites", value: "13 domains" },
        { label: "Stack", value: "Next.js 16 and Sanity, per site" },
        { label: "Built", value: "27 May to 16 June 2026" },
      ],
    },
    {
      kind: "prose",
      heading: "Thirteen readers",
      paragraphs: [
        "Genetics means different things to different people. A beginner wants five minutes and no jargon. A couple wants to know why one of them is a morning person. A news reader wants this week's science; someone else only knows what their body is doing and wants the gene behind it.",
        "Know Your Genes gave each of those readers a site of their own.",
      ],
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "A different glass for each",
      paragraphs: [
        "Each site borrows an interface its reader already knows: an A-to-Z encyclopedia, a help centre, a streaming service's rows, a forum thread, a broadsheet front page, a tap-to-decode body map.",
        "Then each gets its own palette and type, from a near-black streaming shelf with hot coral to warm parchment with gold, set in faces from Newsreader and Fraunces to Geist and Figtree.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/kyg-network/knowourgenes-com-desktop.webp", alt: "knowourgenes.com: a parchment encyclopedia page with a gene search", width: 1200, height: 750 },
        { src: "/work/kyg-network/mapmygenes-co-in-desktop.webp", alt: "mapmygenes.co.in: a dark streaming-style shelf of stories", width: 1200, height: 750 },
      ],
      frames: ["browser", "browser"],
      caption: "The encyclopedia and the streaming shelf. Same subject, opposite moods.",
    },
  ],

  build: [
    {
      kind: "prose",
      heading: "One foundation, thirteen skins",
      paragraphs: [
        "All thirteen share one stack and one structure: Next.js 16, Sanity with its editor built into each site, the same pattern of routes, content models and seed scripts. Each keeps its own design tokens.",
        "That symmetry is what makes the network manageable. A fix written once applies to all thirteen the same way, and a colour change stays where it belongs.",
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "Sanity v5", "Tailwind CSS v4", "TypeScript", "Puppeteer"],
    },
  ],

  hurdles: [
    {
      id: "thirteen-formats",
      title: "Thirteen sites, one subject",
      group: "experience",
      hard: "Thirteen sites about the same subject risk reading as one site, thirteen times. A new colour on the same layout would not have been enough.",
      fix: "Format first, colour second. Each site took a shape people already use, from a streaming shelf to a help desk, and its own content model to match. Only then did it get a palette and typefaces of its own.",
      result: "Thirteen front pages that each read as their own publication, from a dark streaming shelf to a parchment reference library.",
      solvedBy: ["diwakar-jha"],
      source: "knowyourgensSub Websites/memory.md; each site's app/globals.css and sanity/schemas",
    },
    {
      id: "one-source",
      title: "One brief, thirteen content models",
      group: "engineering",
      hard: "The content arrived as one document, but every format needs its own shape: a gene page, a nugget, a streaming tile, a forum thread with answers.",
      fix: "Every site got its own content model in Sanity and a seed script that maps the shared document into it. On 16 June all thirteen were filled from it in a single pass, with the punctuation normalised on the way in.",
      result: "Thirteen sites filled from one source on the same day, each in its own format.",
      solvedBy: ["diwakar-jha"],
      source: "git log of all 13 repos, 16 Jun 2026: \"Seed content.docx entries, surface them on top, and replace em dashes with hyphens\"",
    },
    {
      id: "code-vs-live",
      title: "Reading the code wasn't enough",
      group: "engineering",
      hard: "Two code reviews in early August covered most of the network, but a code review can only guess at what a live site does.",
      tried: "Read from the code, one site's search box looked dead. It worked; it was simply wired up in a way the review didn't recognise.",
      fix: "We drove every live site in a real browser: 111 pages at desktop and phone sizes, every form typed into and every home-page button clicked. Earlier findings were re-tested against the live sites.",
      result: "Two earlier findings were withdrawn, and the baseline came back clean: no JavaScript errors, no broken images and no images without alt text across 111 pages.",
      solvedBy: ["karan-joshi"],
      source: "audit/PROJECT-AUDIT-2026-08-04.md, PROJECT-AUDIT-BATCH2-2026-08-05.md, LIVE-SMOKE-AUDIT-2026-08-20.md §0–1; DNMS task 'Audit of all 13 domains website'",
    },
    {
      id: "launch-week",
      title: "Thirteen audits in a launch week",
      group: "engineering",
      hard: "The network audit landed in the same week as launch QA for the main Know Your Genes store, 17 to 21 August. Clicking through thirteen sites by hand would have taken the week on its own.",
      fix: "One automated run applied the same checks to all thirteen and wrote a single report, ranked by severity, with 156 screenshots as evidence. The team's time went on reading results, not on clicking.",
      result: "A full health check of the network, delivered alongside the store's launch QA.",
      solvedBy: ["karan-joshi"],
      source: "DNMS KYG tasks 17–21 Aug 2026; audit/LIVE-SMOKE-AUDIT-2026-08-20.md (Puppeteer, 156 screenshots)",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Sites", value: "13, each its own format" },
        { label: "Pages checked live", value: "111" },
        { label: "Screenshots", value: "156, desktop and phone" },
        { label: "JavaScript errors", value: "0" },
      ],
    },
    {
      kind: "prose",
      heading: "Same water, thirteen glasses",
      paragraphs: [
        "The network gives Know Your Genes thirteen ways to meet a reader where they already are, whether that is a news habit, a relationship or a symptom.",
        "And because every site was checked live, page by page, the team knows exactly how each one behaves on a laptop and on a phone.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/kyg-network/matchgenes-in-phone.webp", alt: "matchgenes.in on a phone: \"MatchGenes Nuggets\" on deep teal", width: 390, height: 844 },
        { src: "/work/kyg-network/mygenesmap-com-phone.webp", alt: "mygenesmap.com on a phone: \"Your body has been dropping hints. Tap one.\"", width: 390, height: 844 },
      ],
      frames: ["phone", "phone"],
      caption: "Two of the thirteen on a phone: bite-sized nuggets, and a body map you tap.",
    },
  ],

  next: "talentifix",
};

export default kygNetwork;
