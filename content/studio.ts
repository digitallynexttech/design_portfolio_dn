import type { Img } from "./types";

export type Service = {
  id: string;
  title: string;
  line: string;
  body: string;
  deliverables: string[];
  tools: string[];
  /** Case-study slugs that prove it. Only published studies are linked. */
  proof: string[];
};

export const SERVICES: Service[] = [
  {
    id: "brand",
    title: "Brand & digital identity",
    line: "A look that belongs to you, built to work on every screen.",
    body: "We turn a brand brief into a working identity: colour, type and motion that hold together from a phone to a billboard, written down as design tokens so code and design never drift.",
    deliverables: [
      "Visual identity for digital",
      "Design tokens",
      "Motion language",
      "Brand guidelines in code",
    ],
    tools: ["Figma", "Illustrator", "After Effects"],
    proof: ["happy-ganga", "leocym", "kyg-network"],
  },
  {
    id: "design",
    title: "UI/UX & design systems",
    line: "Interfaces that explain themselves.",
    body: "Research, flows and screens, then a component system the developers build from directly. We design for the reader who is in a hurry and the one who is not sure yet.",
    deliverables: [
      "Information architecture",
      "Wireframes and prototypes",
      "Component libraries",
      "Accessibility to WCAG 2.2 AA",
    ],
    tools: ["Figma", "Storybook", "axe"],
    proof: ["know-your-genes", "leocym", "dnms"],
  },
  {
    id: "creative-development",
    title: "Websites & creative development",
    line: "Fast sites with something alive in them.",
    body: "Next.js sites with 3D, motion and interaction that serve the story - and still load in under two seconds on a mid-range phone. The text paints first; the spectacle earns its place.",
    deliverables: [
      "Marketing and brand sites",
      "3D and WebGL",
      "Scroll and motion design",
      "Performance budgets",
    ],
    tools: ["Next.js", "React", "three.js", "GSAP"],
    proof: ["skelmet", "know-your-genes", "chetan-mangalwedhe"],
  },
  {
    id: "commerce",
    title: "E-commerce",
    line: "Stores that sell, ship and invoice.",
    body: "Shopify when it fits, custom commerce when it doesn't. Payments, couriers, GST invoices, abandoned carts and the console your team runs it all from.",
    deliverables: [
      "Shopify themes",
      "Custom storefronts",
      "Payment and courier integrations",
      "Order and stock consoles",
    ],
    tools: ["Shopify", "Razorpay", "Shiprocket", "Postgres"],
    proof: ["hard2soft", "happy-ganga", "skelmet"],
  },
  {
    id: "platforms",
    title: "Platforms & products",
    line: "Software your business runs on.",
    body: "Portals, dashboards and internal tools with real data models, permissions and automation - including AI that works through the same rules as your people.",
    deliverables: [
      "Web applications",
      "Admin and client portals",
      "Integrations and automations",
      "AI features",
    ],
    tools: ["Next.js", "Prisma", "Postgres", "MCP"],
    proof: ["dnms", "know-your-genes", "realty-canvas"],
  },
  {
    id: "search",
    title: "Search & AI visibility",
    line: "Found by people, and by the machines they ask.",
    body: "Technical SEO, structured data and content built so search engines and AI assistants understand who you are - measured before and after, and checked on every deploy.",
    deliverables: [
      "Technical SEO audits",
      "Structured data",
      "llms.txt and AI-crawler access",
      "Programmatic landing pages",
    ],
    tools: ["Search Console", "Lighthouse", "IndexNow"],
    proof: ["talentifix", "hard2soft"],
  },
];

export type Step = {
  title: string;
  body: string;
  evidence: { label: string; href: string };
};

// Each step's proof is a different study, and each link lands on the hurdle that shows the step in practice.
// Anchors verified against the rendered pages (10 Oct 2026); hurdle ids live in content/work/<slug>.ts.
export const PROCESS: Step[] = [
  {
    title: "Discover",
    body: "We start with the business, in the client's words, check what is real, and write down what success has to look like before anything is built.",
    evidence: {
      label: "Happy Ganga: checking the mockups against the real store",
      href: "/work/happy-ganga/hurdles#verify-first",
    },
  },
  {
    title: "Design",
    body: "Identity and interface designed together, checked for contrast, then turned into tokens and components the code uses directly.",
    evidence: {
      label: "Leocym India: brand colours that pass contrast",
      href: "/work/leocym/hurdles#contrast",
    },
  },
  {
    title: "Build",
    body: "Server-rendered, typed, and fast by default. 3D and motion load last and only where the device can afford them.",
    evidence: {
      label: "SKELMET: the real print file in the browser",
      href: "/work/skelmet/build",
    },
  },
  {
    title: "Test",
    body: "Automated checks on every page and the money paths, accessibility audits, and real phones before anything ships.",
    evidence: {
      label: "Know Your Genes network: thirteen sites audited in one run",
      href: "/work/kyg-network/hurdles#launch-week",
    },
  },
  {
    title: "Launch",
    body: "Launches that never take a site down, with a tested way back.",
    evidence: {
      label: "Know Your Genes: moving servers without going offline",
      href: "/work/know-your-genes/systems#leave-vercel",
    },
  },
  {
    title: "Care",
    body: "After launch we keep measuring: speed, search, and every deploy checked for anything that broke.",
    evidence: {
      label: "TalentiFi-X: a search check after every deploy",
      href: "/work/talentifix/hurdles#found",
    },
  },
];

export const PRINCIPLES = [
  {
    title: "Adapt",
    body: "Water takes the shape of what holds it. We take the shape of your brand, not ours.",
  },
  {
    title: "Flow",
    body: "Nothing should stop a visitor. Every page leads somewhere; every interaction explains something.",
  },
  {
    title: "Carve",
    body: "Water wears through stone by not stopping. Hard problems get solved, then written down.",
  },
  {
    title: "Clear",
    body: "Plain language, honest numbers, and no effect without a reason.",
  },
];

/** A studio photo; `position` is the CSS object-position used when a layout crops it. */
export type StudioPhoto = Img & { position?: string };

export const STUDIO_PHOTOS: StudioPhoto[] = [
  {
    src: "/studio/team.webp",
    alt: "The studio team standing together in the red-walled library room",
    width: 1536,
    height: 893,
  },
  {
    src: "/studio/c1.webp",
    alt: "A working session around the long table in the studio",
    width: 1080,
    height: 810,
  },
  {
    src: "/studio/c5.webp",
    alt: "A team meeting in the studio's red meeting room",
    width: 1920,
    height: 2560,
    position: "50% 60%",
  },
  {
    src: "/studio/c7.webp",
    alt: "The team in front of the studio's superhero mural",
    width: 1080,
    height: 1350,
    position: "50% 80%",
  },
  {
    src: "/studio/c3.webp",
    alt: "The team celebrating together in the studio",
    width: 1080,
    height: 1439,
    position: "50% 45%",
  },
  {
    src: "/studio/workhere.webp",
    alt: "The team giving a thumbs up in the studio",
    width: 1280,
    height: 720,
  },
  {
    src: "/studio/c8.webp",
    alt: "Designers and developers at their desks",
    width: 1080,
    height: 1350,
    position: "50% 100%",
  },
];

/**
 * The same group as team.webp, shot in portrait in the same room: the About page shows it on phones (art direction).
 * Karan to confirm everyone pictured is current before launch.
 */
export const TEAM_PHOTO_PORTRAIT: StudioPhoto = {
  src: "/studio/c9.webp",
  alt: STUDIO_PHOTOS[0].alt,
  width: 3120,
  height: 4160,
  position: "50% 62%",
};
