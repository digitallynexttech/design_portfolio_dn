import type { CaseStudy } from "../types";

const knowYourGenes: CaseStudy = {
  slug: "know-your-genes",
  client: "Know Your Genes",
  headline: "A DNA-testing store with a guide who makes genetics feel friendly.",
  summary:
    "Know Your Genes sells DNA tests direct to people in India: a kit by post, a saliva sample at home, a report from an accredited lab. We built the store and every system behind it, from checkout and couriers to the lab and counsellor screens. Up front, the brand's mascot GENEe does the explaining, now in 3D and with a crew of five.",
  year: 2026,
  industry: "D2C · Genetic testing",
  disciplines: ["Commerce", "Platform", "3D & Motion"],
  platform: "Next.js · custom commerce",
  liveUrl: "https://www.knowyourgenes.in",
  tier: "flagship",
  order: 2,
  theme: {
    scheme: "light",
    bg: "#FAF6EF",
    surface: "#F5EDDF",
    text: "#141B1A",
    muted: "#5B564E",
    accent: "#0E4D4B",
    onAccent: "#FAF6EF",
    display: "cormorant",
    body: "figtree",
  },
  poster: { src: "/work/know-your-genes/hero-poster.webp", alt: "GENEe, the Know Your Genes mascot, standing beside an at-home genetic testing kit on a sunlit desk", width: 1384, height: 779 },
  // GENEe stands at the right of the frame; a centre crop on a phone shows only the kit box.
  posterFocus: "100% 50%",
  exhibit: "kyg",
  exhibitHint: "Meet GENEe, then tap Vita, Cardi, Dozy, Guard or Glow to see their signature moves.",
  metrics: [
    { value: "65", label: "pages, from storefront to lab dashboard", source: "knowyourgenes/app/**/page.tsx, counted 8 Oct 2026" },
    { value: "9.9 → 0.6 MB", label: "GENEe in 3D, from generator to page", source: "knowyourgenes/assets-src/meshy7-raw.glb (10,386,296 B) → public/home/brand/mascot.glb (590,488 B); commit aa6b0f4" },
    { value: "760 → 298 ms", label: "the worst frame while scrolling", source: "knowyourgenes commit 551c864 (14 Aug 2026)" },
  ],
  credits: [
    { team: "Web", people: ["diwakar-jha", "karan-joshi"] },
    { team: "Design", people: ["pratik-paul", "komal-gautam"] },
    { team: "Video & Motion", people: ["dev-lal"] },
    { team: "Accounts", people: ["teesha-jain"] },
  ],
  testimonial: {
    quote:
      "Most people are a little afraid of a DNA test. The site answers their questions before they ask them, and GENEe makes it feel like a conversation rather than a lab report.",
    name: "Know Your Genes founder",
    role: "Founder",
    company: "Know Your Genes",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Know Your Genes, India" },
        { label: "Product", value: "At-home DNA tests, sold online" },
        { label: "Scope", value: "Store, back office, mascots, 3D" },
        { label: "Timeline", value: "April to October 2026" },
      ],
    },
    {
      kind: "prose",
      heading: "A test people are nervous to buy",
      paragraphs: [
        "Most people have never bought a DNA test. They don't know what a gene does, what the report will say, or who will see it. Know Your Genes needed a store that answers those questions before anyone asks them, calmly and in plain words.",
        "Behind the store, every order is a small relay. A kit goes out by courier, a sample comes back, a partner lab runs it, a reviewer checks the report, and the result lands in the customer's account. The site had to run all of it.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/know-your-genes/home-desktop.webp", alt: "The Know Your Genes home page: GENEe beside the testing kit on a warm, sunlit desk", width: 1440, height: 900 },
      caption: "The home page opens on the kit and the guide, not on a laboratory.",
      frame: "browser",
    },
    {
      kind: "pair",
      images: [
        { src: "/work/know-your-genes/photo-sample-at-home.webp", alt: "Hands holding a saliva collection tube over an open kit box on a living-room table", width: 1536, height: 639 },
        { src: "/work/know-your-genes/photo-reading-report.webp", alt: "A man reading his printed report at home, plants on the windowsill behind him", width: 1536, height: 639 },
      ],
      frames: ["none", "none"],
      caption: "The journey the site has to carry: a sample taken at home, a report read at home.",
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "A well-lit home, not a clinic",
      paragraphs: [
        "The look is warm and editorial: white linen, sand and deep teal, with photography in daylight. Teal carries the trust, on buttons, links and the helix in the logo.",
        "Every bold headline is answered by a line of serif italic, as if someone kinder were explaining it. Figtree does the talking; Cormorant Garamond does the reassuring.",
      ],
    },
    {
      kind: "palette",
      heading: "Linen, sand and teal",
      colors: [
        { name: "Eden", hex: "#0E4D4B", note: "Buttons, links, logo" },
        { name: "Java", hex: "#25B5AB", note: "The helix" },
        { name: "Java glow", hex: "#2AC3A2", note: "Light on dark sections" },
        { name: "White Linen", hex: "#FAF6EF", note: "Page" },
        { name: "Sand", hex: "#F5EDDF", note: "Panels" },
        { name: "Ink", hex: "#141B1A", note: "Dark sections" },
        { name: "Crimson", hex: "#C73C70", note: "Women's Health" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Figtree", role: "Headlines and everything else", font: "figtree" },
        { name: "Cormorant Garamond", role: "The italic answer lines", font: "cormorant" },
      ],
      sample: "Genetics sounds complicated. Good thing GENEe doesn't.",
    },
    {
      kind: "pair",
      images: [
        { src: "/work/know-your-genes/meet-genee-desktop.webp", alt: "The Meet GENEe section: the mascot in a lab coat beside the headline \"Genetics sounds complicated. Good thing GENEe doesn't.\"", width: 1440, height: 900 },
        { src: "/work/know-your-genes/meet-genee-phone.webp", alt: "The Meet GENEe section on a phone, with the mascot above a question card", width: 800, height: 1362 },
      ],
      frames: ["browser", "phone"],
      caption: "Meet GENEe: a curious guide in a lab coat, with a double helix for a hood.",
    },
    {
      kind: "prose",
      heading: "A guide, then a crew",
      paragraphs: [
        "On the home page GENEe stands in 3D, turning slowly and breathing while you read. The illustration it was built from sits underneath as the fallback, so if the 3D never loads, nobody can tell.",
        "Five more guides followed, one for each family of tests: Vita for wellness, Cardi for the heart, Dozy for sleep, Guard for immunity and Glow for skin. Each has a prop, a colour and a move of its own.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/know-your-genes/crew-hero.webp", alt: "The five crew mascots side by side: Vita with an apple, Cardi waving, Dozy with a moon pillow, Guard with a shield and Glow with a star", width: 1600, height: 600 },
      caption: "The crew. Same family, five jobs.",
      wide: true,
    },
    {
      kind: "prose",
      heading: "A life story, told by scroll",
      paragraphs: [
        "One section follows a life on a rising curve: a newborn, a boy at cricket, a couple, a family, a grandfather in his garden. As you scroll, the curve fills and each moment lifts as you reach it. Nothing takes over your scroll; the section simply holds still while you read it.",
        "Elsewhere a DNA helix draws itself behind the text as you scroll, and a map of India glows wherever your pointer goes.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/know-your-genes/life-curve-desktop.webp", alt: "The One Life. One DNA. section on a wide screen: five photographs on a glowing teal curve", width: 1440, height: 900 },
        { src: "/work/know-your-genes/life-curve-phone.webp", alt: "The same section on a phone, as a vertical timeline of photographs", width: 800, height: 1362 },
      ],
      frames: ["browser", "phone"],
      caption: "The same five moments: a band on wide screens, a timeline on phones.",
    },
    {
      kind: "figure",
      image: { src: "/work/know-your-genes/india-map-desktop.webp", alt: "The Born in India section: a teal map of India with glowing points beside four statements about who the tests are for", width: 1440, height: 900 },
      caption: "Born in India. The map lights up under the pointer, clipped to the coastline.",
      frame: "browser",
    },
  ],

  build: [
    {
      kind: "architecture",
      heading: "What runs behind the store",
      caption: "One codebase serves the shop, the staff console and the lab.",
      nodes: [
        { id: "store", label: "Storefront", note: "Next.js 16", lane: 0 },
        { id: "genee", label: "GENEe in 3D", note: "three.js", lane: 0 },
        { id: "pay", label: "Payments", note: "Razorpay", lane: 1 },
        { id: "ship", label: "Couriers", note: "Shiprocket · Delhivery", lane: 1 },
        { id: "geo", label: "Address lookup", note: "Mappls", lane: 1 },
        { id: "blog", label: "Journal", note: "Sanity CMS", lane: 1 },
        { id: "console", label: "Staff console", note: "orders, labs, exports", lane: 2 },
        { id: "lab", label: "Lab and review", note: "report sign-off", lane: 2 },
        { id: "reports", label: "Report PDFs", note: "private storage", lane: 2 },
        { id: "db", label: "Database", note: "Postgres · 32 models", lane: 3 },
      ],
      links: [
        { from: "store", to: "pay", label: "checkout" },
        { from: "store", to: "ship", label: "kit by post" },
        { from: "store", to: "geo", label: "address" },
        { from: "store", to: "blog" },
        { from: "pay", to: "console", label: "paid orders" },
        { from: "ship", to: "console", label: "tracking" },
        { from: "console", to: "lab", label: "routed samples" },
        { from: "lab", to: "reports", label: "approved report" },
        { from: "console", to: "db" },
        { from: "store", to: "db" },
      ],
    },
    {
      kind: "prose",
      heading: "An order is a journey",
      paragraphs: [
        "Every order moves through named stages: booked, kit sent, kit delivered, sample collected, at the lab, report ready. The customer sees each one in their account.",
        "Staff route each sample to a partner lab by hand. The lab uploads the report, and a Know Your Genes reviewer reads it before it reaches anyone. The PDF then arrives in the customer's account and inbox.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/know-your-genes/crew-concept-vs-3d.webp", alt: "A grid of the five mascots: the concept drawings on the top row, the Blender builds front-on and in three-quarter view below", width: 1600, height: 1440 },
      caption: "Top row: the five concept drawings. Below: the same five, built in Blender by Python scripts.",
      wide: true,
    },
    {
      kind: "prose",
      heading: "Mascots made from measurements",
      paragraphs: [
        "The crew were not sculpted by hand. Each was measured off its concept drawing, in pixels, and built by Python scripts inside Blender: body, face, hands and props. A second script calibrated their colours against the drawings.",
        "Each mascot is rigged with four animations, idle, wave, jump and a signature move, and every clip can blend into any other. Compressed for the web, each one weighs 270 to 315 KB.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "Pages", value: "65" },
        { label: "API routes", value: "68" },
        { label: "Data models", value: "32" },
        { label: "Automated tests", value: "~270" },
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "three.js", "React Three Fiber", "Prisma + Postgres", "Auth.js", "Razorpay", "Shiprocket", "Delhivery", "Mappls", "Sanity", "Blender + Python", "glTF-Transform", "Vitest", "Cloudflare"],
    },
  ],

  hurdles: [
    {
      id: "figma-not-ready",
      title: "The design wasn't ready",
      group: "experience",
      hard: "Pages were due before their designs were. On 13 August the home page went on hold with a one-line reason: \"Figma is not ready.\"",
      fix: "We set hard deadlines for each design frame and built the rest of the site around the gaps. When the home page design landed, we rebuilt the page against the designer's own build and made it the live home page.",
      result: "No week lost to waiting. The new home page went live within a day of its design arriving.",
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "DNMS KYG task on hold 13 Aug 2026 (\"Figma is not ready\"); knowyourgenes commits 958c0cd, ac40e16 (14 Aug)",
    },
    {
      id: "rebrand",
      title: "A new logo, halfway through",
      group: "experience",
      hard: "At the end of August the logo was redesigned and the main site got a new five-page design. Home, About and Contact had already been built once.",
      fix: "We rebuilt all three from the new frames in the first week of September. The old hand-traced logo was replaced with the brand's exact geometry, and the wordmark is pinned to the mark's width, so the lockup keeps its shape whatever font the browser has.",
      result: "Three pages rebuilt in a week, and one identity across the site, final within two weeks of the redesign.",
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "DNMS KYG tasks 31 Aug–11 Sep 2026; knowyourgenes commits 2ed5b54, 4b53dbd, 19c5b68, 5139f3a",
    },
    {
      id: "life-curve",
      title: "The commonest laptop got the phone layout",
      group: "experience",
      hard: "The life-curve section holds still while you read it, which needs a tall enough window. Its layout switch asked for width and height together, so a 1536-pixel-wide laptop with a short window was handed the phone layout: one photograph per screen.",
      tried: "Responsive passes on 1, 8 and 10 September fixed phones and landscape phones across 16 screen sizes. This shape slipped between them: a 1920×1080 screen at 125% scaling leaves about 698 pixels of window, two short of the old threshold.",
      fix: "We split one question into two. Whether the section holds still depends on height; which layout it shows depends on width alone. Short, wide windows now get the full band, and the curve still fills as you scroll.",
      result: "Every wide screen gets the five-moment band, at any window height.",
      solvedBy: ["diwakar-jha", "karan-joshi"],
      source: "DNMS task 'Responsive layout fix for the One Lifetime Curve section' (21 Sep 2026); knowyourgenes commit 14f1fc7 (app/globals.css kyg-pin); earlier passes c147a82, 2dd48ac",
    },
    {
      id: "scroll-jank",
      title: "Scrolling stalled for three-quarters of a second",
      group: "experience",
      hard: "Scrolling felt sticky on every page. Two hidden menu panels kept a blur effect running behind them, about 1.65 million pixels of it, and the browser redrew that blur every time the page moved.",
      fix: "We removed the blur from the hidden panels. Their own background was already 98% opaque, so nothing visible changed, and we compared before and after screenshots to prove it.",
      result: "The worst frame while scrolling fell from 760 ms to 298 ms, and the typical slow frame halved, from 16.8 ms to 8.5 ms.",
      demo: { kind: "shift", label: "Worst frame while scrolling", before: 760, after: 298, unit: "ms", better: "lower" },
      solvedBy: ["karan-joshi"],
      source: "knowyourgenes commit 551c864 (14 Aug 2026), components/shared/SiteHeader.tsx",
    },
    {
      id: "genee-3d",
      title: "GENEe, from drawing to 3D",
      group: "experience",
      hard: "GENEe existed only as an illustration. AI generators turned it into 3D files of 8 to 54 MB, and the brand's deep teal came back as mint.",
      fix: "A build script cleans, reduces and compresses each model, then re-grades its colours against the illustration by measurement. In the browser, a neutral tone curve keeps teal teal. The illustration shows first and stays until the model has drawn a real frame, and nothing loads until GENEe is nearly on screen.",
      result: "The live model weighs 0.6 MB, matches the drawing's colours and never flashes a blank frame. Without WebGL, visitors simply keep the illustration.",
      demo: { kind: "shift", label: "GENEe 3D model", before: 9.9, after: 0.6, unit: "MB", better: "lower", decimals: 1 },
      solvedBy: ["karan-joshi"],
      source: "knowyourgenes commit aa6b0f4 (15 Sep 2026); assets-src/meshy7-raw.glb, tripo-raw.glb; features/home/components/sections/GeneeModel.tsx",
    },
    {
      id: "gen-e",
      title: "The mascot that needed polishing",
      group: "engineering",
      hard: "GEN-E is a character whose body is the double helix itself: two ribbons that twist into arms and legs. The first 3D build went on hold on 5 October: \"still need polishing\".",
      fix: "We rebuilt GEN-E by measurement. Every part was measured off the concept art in pixels and fitted by Python inside Blender, then rendered from the same camera and laid over the drawing to check the outline. Face, hands and each strand were redone one at a time, with a saved checkpoint before every pass.",
      result: "Two days and twelve checkpoints later, the 3D build sits on its drawing almost line for line.",
      demo: {
        kind: "compare",
        before: { src: "/work/know-your-genes/gen-e-concept.webp", alt: "The GEN-E concept drawing: a teal helix-bodied character waving", width: 800, height: 1308 },
        after: { src: "/work/know-your-genes/gen-e-blender.webp", alt: "The GEN-E 3D build in Blender, in the same pose and framing", width: 800, height: 1308 },
        beforeLabel: "Concept",
        afterLabel: "Blender",
      },
      solvedBy: ["karan-joshi"],
      source: "DNMS KYG mascot tasks 5–7 Oct 2026; Blender/Knowyourgenes/scripts/gen_e_build.py, compare.py; renders/backup_pre_* (12 checkpoints)",
    },
    {
      id: "payments",
      title: "Payments with every edge case covered",
      group: "engineering",
      hard: "Each order sets off real costs: a kit by courier and a lab booking. Payment news arrives twice, refunds arrive in several steps, and any of it can be retried.",
      tried: "The gateway went in on 10 August. Testing ran in rounds, including an overnight session on 24–25 August, and still surfaced two days of payment-flow fixes.",
      fix: "Every payment is signature-checked. No kit ships and no lab is told until an order is actually paid. A refund counts only once money moves, and checkout refuses to start rather than run half-configured.",
      result: "Each order is charged once and fulfilled once, and only after it is paid.",
      solvedBy: ["diwakar-jha", "karan-joshi"],
      source: "DNMS KYG payment tasks 10–28 Aug 2026; knowyourgenes commits ad4f8f4, ada7a01, 055f35a",
    },
    {
      id: "leave-vercel",
      title: "Moving house without going offline",
      group: "engineering",
      hard: "The live site sat on Vercel, which deployed it on every push. Moving it to the company's own server meant a cutover in production, with two quiet risks: a database that might not hold the same customers, and missing settings that fail silently. Email would simply stop.",
      fix: "We wrote the move as a runbook. The new server is built, running and checked against the real domain before DNS moves, and Vercel stays in place as the way back until the new setup has carried real traffic.",
      result: "knowyourgenes.in now runs on the company's own server, behind Cloudflare.",
      solvedBy: ["diwakar-jha"],
      source: "DNMS task 15 Sep 2026 (runbook to move knowyourgenes.in from Vercel to our VPS); knowyourgenes commit 85697bf (docs/DEPLOY_VPS.md); live response headers 8 Oct 2026",
    },
    {
      id: "debt-then-hardening",
      title: "Paying down the debt, then locking up",
      group: "engineering",
      hard: "Months of fast building had left drift: more than 30 different corner radii, 12 page widths and three colour systems, plus files nobody used any more.",
      fix: "We set three rules, one 6 px corner, one 1,600 px page width and one 44 px button, and cleaned house: 108 unused files (61.7 MB) and about 1,060 lines of dead code went, and two 10 MB hero images were cut by 98%. Then came a full security audit with its fixes, alongside the animation-lag fixes.",
      result: "A smaller, consistent codebase, audited and hardened before the next round of features.",
      solvedBy: ["diwakar-jha", "karan-joshi"],
      source: "knowyourgenes/CLAUDE.md (UI rules); commits e060a21 (14 Sep), 5b87d46 (7 Sep); DNMS task 'security audit and animation lag fixes' (28 Sep 2026)",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Live", value: "knowyourgenes.in" },
        { label: "Tests", value: "10 test pages on sale" },
        { label: "Journal", value: "31 articles" },
        { label: "Hosting", value: "Company server, behind Cloudflare" },
      ],
    },
    {
      kind: "timeline",
      heading: "Six months, in short",
      items: [
        { date: "20 Apr", label: "First commit" },
        { date: "10 Aug", label: "Payment gateway in" },
        { date: "13 Aug", label: "Home page waits for its design, then ships" },
        { date: "17–21 Aug", label: "Launch QA, plus an audit of 13 sister sites" },
        { date: "31 Aug", label: "New logo and a new five-page design" },
        { date: "15 Sep", label: "GENEe goes 3D" },
        { date: "28 Sep", label: "Security audit and animation fixes" },
        { date: "5–7 Oct", label: "GEN-E rebuilt; the crew of five arrives" },
      ],
    },
    {
      kind: "prose",
      heading: "A shop that explains itself",
      paragraphs: [
        "Know Your Genes launched with a store that answers the nervous questions first, a checkout that only ever charges once, and a back office that walks every sample from doorstep to lab to report.",
        "And it has a face. GENEe greets visitors on the home page, and the crew are ready to take a test page each.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/know-your-genes/test-womens-desktop.webp", alt: "The DNA Women's Health Test page: a portrait beside the price, three key facts and Add to cart and Buy now buttons", width: 1440, height: 900 },
        { src: "/work/know-your-genes/test-womens-phone.webp", alt: "The same test page on a phone, with the photo gallery above the title and price", width: 800, height: 1362 },
      ],
      frames: ["browser", "phone"],
      caption: "A test page: one saliva sample, five traits, answers in plain language.",
    },
  ],

  next: "hard2soft",
};

export default knowYourGenes;
