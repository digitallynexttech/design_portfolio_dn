import type { CaseStudy } from "../types";

// Reference case study: other content files mirror this structure, tone and sourcing.
const skelmet: CaseStudy = {
  slug: "skelmet",
  client: "SKELMET",
  headline: "A helmet mount that leaves its photo and comes looking for you.",
  summary:
    "SKELMET makes one product: a 3D-printed flame-skull wall mount for motorcycle helmets. We built the brand's whole store and the back office behind it, from checkout and shipping to GST invoices. On the front, the skull you buy is the skull you play with: the real print file, live in the browser.",
  year: 2026,
  industry: "D2C · Motorcycle accessories",
  disciplines: ["Commerce", "3D & Motion", "Platform"],
  platform: "Next.js · custom commerce",
  liveUrl: "https://www.skelmet.in",
  tier: "flagship",
  order: 1,
  theme: {
    scheme: "dark",
    bg: "#07060A",
    surface: "#16151D",
    text: "#F7F4ED",
    muted: "#A3A0B0",
    accent: "#FF5A1F",
    onAccent: "#07060A",
    display: "anton",
    body: "spaceGrotesk",
  },
  poster: { src: "/work/skelmet/hero-skull.webp", alt: "The SKELMET flame skull glowing orange against a black garage wall", width: 1600, height: 893 },
  exhibit: "skelmet",
  exhibitHint: "Drag the skull to spin it. Flick it hard and watch it flare.",
  metrics: [
    { value: "~10 days", label: "from first task to a live store", source: "DNMS SKELMET tasks 21–30 Sep 2026" },
    { value: "8.9 → 1 MB", label: "the 3D hero, without losing detail", source: "DNMS task 23 Sep 2026" },
    { value: "100", label: "Lighthouse accessibility, best practices and SEO", source: "DNMS task 28 Sep 2026" },
  ],
  credits: [
    { team: "Web", people: ["diwakar-jha", "karan-joshi"] },
    { team: "Design", people: ["pratik-paul"] },
    { team: "Video & Motion", people: ["dev-lal"] },
    { team: "Accounts", people: ["teesha-jain"] },
    { team: "Content", people: ["harsh-kumar"] },
  ],
  testimonial: {
    quote:
      "We sell one product, so the site had to feel like the product. It does — and the back office means we ship every order without touching a spreadsheet.",
    name: "SKELMET founder",
    role: "Founder",
    company: "SKELMET",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "SKELMET, Noida" },
        { label: "Product", value: "One wall mount, three colourways" },
        { label: "Scope", value: "Brand site, store, back office, 3D" },
        { label: "Timeline", value: "About 10 days to launch" },
      ],
    },
    {
      kind: "prose",
      heading: "One product, two jobs",
      paragraphs: [
        "SKELMET sells a single thing: a flame skull, printed in Blaze Orange, Militia Olive or Ghost Grey, that holds a helmet on the wall and a pair of gloves under its jaw. Riders buy it on attitude. The tagline is three words: park the menace.",
        "The site had two jobs at once. To the rider, it had to feel like the garage the product lives in. To the business, it had to run everything after the click — payments, couriers, invoices, refunds and the people answering enquiries — without a patchwork of plugins.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/skelmet/gallery-garage-night.webp", alt: "A helmet resting on the skull mount in a dark garage", width: 1400, height: 1400 },
      caption: "The product in its natural habitat. The site borrows this light.",
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "After Dark Garage",
      paragraphs: [
        "The visual direction came straight from the product photography: a near-black room, one hot light, and a skull that glows. Every surface on the site is a shade of that room, and orange is used only where something burns.",
        "The type is loud on purpose. Anton sets headlines like stencilled garage signage; Space Grotesk keeps everything else easy to read; a mono face labels specs the way a workshop would.",
      ],
    },
    {
      kind: "palette",
      heading: "The garage, as tokens",
      colors: [
        { name: "Void", hex: "#07060A", note: "Page" },
        { name: "Carbon", hex: "#0E0D13" },
        { name: "Graphite", hex: "#16151D" },
        { name: "Blaze", hex: "#FF5A1F", note: "Calls to action" },
        { name: "Ember", hex: "#FF8A00" },
        { name: "Flare", hex: "#FFC24D" },
        { name: "Acid", hex: "#D4FF3D", note: "Rare highlight" },
        { name: "Bone", hex: "#F7F4ED", note: "Text" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Anton", role: "Headlines", font: "anton" },
        { name: "Space Grotesk", role: "Everything else", font: "spaceGrotesk" },
      ],
      sample: "Park the menace.",
    },
    {
      kind: "figure",
      image: { src: "/work/skelmet/colourway-lineup.webp", alt: "The skull mount in Blaze Orange, Militia Olive and Ghost Grey, side by side", width: 1600, height: 893 },
      caption: "Three colourways. Each product card on the site is tinted in its own colour.",
      wide: true,
    },
    {
      kind: "prose",
      heading: "The headline that burns",
      paragraphs: [
        "On the home page, four stacked copies of the headline sit under a mask that follows the skull. As the skull passes, the letters nearest to it burn down to outlines, so the product literally scorches the page it sits on.",
      ],
    },
  ],

  build: [
    {
      kind: "architecture",
      heading: "What runs behind the store",
      caption: "One codebase serves the shop, the staff console and every integration.",
      nodes: [
        { id: "store", label: "Storefront", note: "Next.js 16", lane: 0 },
        { id: "skull", label: "3D hero", note: "three.js in a Web Worker", lane: 0 },
        { id: "pay", label: "Payments", note: "Razorpay", lane: 1 },
        { id: "ship", label: "Shipping", note: "Shiprocket", lane: 1 },
        { id: "blog", label: "Blog", note: "Sanity CMS", lane: 1 },
        { id: "console", label: "Staff console", note: "19 screens", lane: 2 },
        { id: "invoice", label: "GST invoices", note: "PDF", lane: 2 },
        { id: "db", label: "Database", note: "Postgres · 29 models", lane: 3 },
      ],
      links: [
        { from: "store", to: "pay", label: "checkout" },
        { from: "store", to: "ship", label: "pincode check" },
        { from: "store", to: "blog" },
        { from: "pay", to: "console", label: "verified orders" },
        { from: "ship", to: "console", label: "tracking" },
        { from: "console", to: "invoice" },
        { from: "console", to: "db" },
        { from: "store", to: "db" },
      ],
    },
    {
      kind: "prose",
      heading: "The real print file, in the browser",
      paragraphs: [
        "The skull in the hero is not a render. It is the same file the mounts are printed from, cleaned up by a build script: turned the right way up, welded, smoothed of print lines, reduced and compressed.",
        "It runs in a Web Worker, off the main thread, so scrolling and typing never wait for it. Its gaze follows your cursor, it spins when you drag it, and as you scroll it flies down the page and lands exactly on the skull in each product photo.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "Pages", value: "35" },
        { label: "API routes", value: "76" },
        { label: "Automated tests", value: "~580" },
        { label: "Data models", value: "29" },
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "three.js", "Prisma + Postgres", "Auth.js", "Razorpay", "Shiprocket", "Sanity", "Tiptap", "pdfkit", "Vitest", "GitHub Actions"],
    },
  ],

  hurdles: [
    {
      id: "two-skulls",
      title: "Two skulls on screen",
      group: "experience",
      hard: "The 3D skull flies down the page and lands on the product photos. But every photo already has a skull in it, so the moment it landed, visitors saw two.",
      tried: "Fading the 3D model out on arrival looked like a glitch: the skull you were following simply vanished.",
      fix: "We made a twin of every photo with the skull digitally removed — a \"plate\". As the 3D skull arrives, the plate fades in underneath it, so the live model takes the photo's place.",
      result: "One skull, always. The hand-off is invisible unless you know to look for it.",
      demo: {
        kind: "compare",
        before: { src: "/work/skelmet/product-front.webp", alt: "Product photo with the printed skull on the wall", width: 1600, height: 1986 },
        after: { src: "/work/skelmet/product-front-plate.webp", alt: "The same photo with the skull removed, ready for the 3D model", width: 1600, height: 1986 },
        beforeLabel: "Photo",
        afterLabel: "Plate",
      },
      solvedBy: ["diwakar-jha"],
      source: "skelmet/scripts/build-skull-plates.mjs; skelmet/features/home skull-dock",
    },
    {
      id: "scroll-lag",
      title: "The skull lagged behind the scroll",
      group: "experience",
      hard: "Moving a 3D object with scroll events always runs a frame late. On a fast flick the skull visibly trailed the photo it was meant to land on.",
      fix: "We handed the skull's route to the browser itself as a scroll-driven animation, so it moves in the same frame as the page instead of chasing it.",
      result: "The skull and the page move as one, even on a fast flick.",
      solvedBy: ["diwakar-jha"],
      source: "skelmet/features/home skull-journey.ts, skull-docks.json",
    },
    {
      id: "first-visit",
      title: "A heavy first impression",
      group: "experience",
      hard: "A live 3D model is the heaviest thing on the page. Loading it first would make every visitor wait for the hero.",
      fix: "We captured a real frame of the 3D scene as a poster image. It bobs on the same clock as the live model, so when the model is ready the swap is invisible. Slow connections, data-saver and reduced-motion visitors simply keep the poster.",
      result: "The hero appears instantly for everyone; the 3D arrives only when the device can afford it.",
      solvedBy: ["diwakar-jha"],
      source: "skelmet/scripts/build-hero-poster.mjs",
    },
    {
      id: "print-to-web",
      title: "A print file is not a web file",
      group: "engineering",
      hard: "The model came from the printer: upside down, full of layer lines and far too many triangles for a phone.",
      tried: "A first pass at compression still shipped almost 9 MB.",
      fix: "A build script now orients, welds and smooths the mesh, removes the print layer lines, reduces the triangle count and compresses the result — the late-night push that got it there ran to 4 AM.",
      result: "The hero model went from 8.9 MB to 1 MB without losing the detail you can see.",
      demo: { kind: "shift", label: "3D hero size", before: 8.9, after: 1, unit: "MB", better: "lower", decimals: 1 },
      solvedBy: ["diwakar-jha"],
      source: "DNMS task 23 Sep 2026; skelmet/scripts/build-skull-model.mjs",
    },
    {
      id: "main-thread",
      title: "3D blocked scrolling and typing",
      group: "engineering",
      hard: "WebGL normally runs on the browser's main thread — the same thread that handles scrolling, clicks and typing. A busy frame made the whole page feel sticky.",
      fix: "The scene now renders in a Web Worker on an OffscreenCanvas, with a main-thread fallback for browsers that can't. We also dropped a 3D framework in favour of plain three.js.",
      result: "Scrolling stays smooth while the skull spins, and the page ships about 638 KB less JavaScript.",
      solvedBy: ["diwakar-jha"],
      source: "skelmet/features/home skull-worker.ts, skull-scene.ts",
    },
    {
      id: "shipping-in-a-day",
      title: "Courier integration, start to finish, in one day",
      group: "engineering",
      hard: "Shipping touches everything: courier rates at checkout, booking, pickup, labels, tracking and the emails customers expect. It had to work before launch, not after.",
      fix: "We integrated Shiprocket end to end in a single day — order sync, rates, waybills, pickup, labels, live tracking and shipped emails — and wrote the tests first.",
      result: "48 new automated tests, 87 passing at the end of the day.",
      solvedBy: ["karan-joshi"],
      source: "DNMS task 25 Sep 2026",
    },
    {
      id: "double-payments",
      title: "A double click must never charge twice",
      group: "engineering",
      hard: "Payments arrive twice: once from the browser and once from the payment provider. Either can be retried. A careless handler would double-charge, double-ship or oversell.",
      fix: "Prices are recalculated on the server, stock is reserved inside a transaction, every payment is signature-checked, and both paths are safe to run more than once.",
      result: "Each order is charged once, shipped once and counted once — however many times it is retried.",
      solvedBy: ["diwakar-jha"],
      source: "skelmet/features/checkout; skelmet/app/api/payments",
    },
    {
      id: "audit-in-a-day",
      title: "A full security review before launch",
      group: "engineering",
      hard: "A store takes money and addresses. Launching without an independent look at the code was not an option, and the launch date was days away.",
      fix: "We audited the whole codebase, fixed every finding and re-checked the fixes on the same day, then upgraded the dependencies.",
      result: "Launched with every audit finding closed.",
      solvedBy: ["karan-joshi", "diwakar-jha"],
      source: "DNMS tasks 25 Sep 2026",
    },
    {
      id: "zero-downtime",
      title: "Deploying without taking the store down",
      group: "engineering",
      hard: "The store runs on its own server. A normal deploy stops the old version before the new one is ready — a few seconds of errors for anyone mid-checkout.",
      fix: "Blue-green deploys: the new build starts beside the old one, a health check confirms it, and only then does traffic switch over. One command rolls back.",
      result: "Updates go out in the middle of the day without taking the store offline.",
      solvedBy: ["diwakar-jha"],
      source: "skelmet/docs deploy runbook",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Launch", value: "About 10 days after the first task" },
        { label: "Lighthouse", value: "100 · accessibility, best practices, SEO" },
        { label: "Google", value: "Average position 3.3 in the first weeks" },
        { label: "Delivery", value: "Every task on time" },
      ],
    },
    {
      kind: "prose",
      heading: "A store that runs itself",
      paragraphs: [
        "SKELMET launched with everything a one-product brand needs and nothing it doesn't: a storefront that feels like the product, a console that runs orders from payment to doorstep, and invoices that file themselves.",
        "The skull is still the star. Riders spin it, fling it and follow it down the page — and then they buy the real one.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/skelmet/mount-assembled.webp", alt: "The mount assembled with a helmet and gloves", width: 1600, height: 896 },
        { src: "/work/skelmet/rider-motorcycle-wall.webp", alt: "A rider's wall with the skull mount next to a motorcycle", width: 820, height: 820 },
      ],
      frames: ["none", "none"],
    },
  ],

  next: "know-your-genes",
};

export default skelmet;
