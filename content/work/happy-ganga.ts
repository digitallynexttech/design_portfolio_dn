import type { CaseStudy } from "../types";

// Sources: ..\HappyGangav1 (theme/, docs/, the Happy_Ganga_*.txt notes) and docs/dnms-findings.md.
// The live store still runs stock Refresh; the new theme is an unpublished draft on the same store,
// so screenshots come from the repo's static exports of that theme, not from happyganga.com.
const happyGanga: CaseStudy = {
  slug: "happy-ganga",
  client: "Happy Ganga",
  headline: "Probiotic cleaners, and a store that follows every drop to the river.",
  summary:
    "Happy Ganga makes probiotic home cleaners in Chennai, fermented for 90 days. We rebuilt its Shopify store from Figma as a custom theme: 92 sections, every value read out of the design file, and a river that draws itself from bottle to drain. It was built ahead of its content, delivered three days early, and staged on the live store without touching the shop customers see.",
  year: 2026,
  industry: "D2C · Home care",
  disciplines: ["Commerce", "Brand site"],
  platform: "Shopify · custom theme on Refresh",
  tier: "standard",
  order: 5,
  theme: {
    scheme: "light",
    bg: "#F5FCFD",
    surface: "#E8F5F6",
    text: "#06222A",
    muted: "#4C6268",
    accent: "#0896AC",
    onAccent: "#06222A",
    display: "gabarito",
    body: "hanken",
  },
  poster: {
    src: "/work/happy-ganga/home-desktop.webp",
    alt: "Happy Ganga home page: the headline 'Every drop that leaves your home is your decision' beside a teal water drop and four bottles",
    width: 1600,
    height: 1000,
  },
  posterPhone: { src: "/work/happy-ganga/home-phone.webp", alt: "Happy Ganga home page on a phone, headline first", width: 1170, height: 1992 },
  exhibit: "happy-ganga",
  exhibitHint: "Watch the river run from bottle to drain, then pick a bottle from the range.",
  metrics: [
    { value: "92", label: "custom sections, built from Figma", source: "HappyGangav1/theme/sections/hg-*.liquid (92 files)" },
    { value: "3 days", label: "early on the contracted store build", source: "DNMS Happy Ganga: SKU sets shipped 19 Aug 2026, due 22 Aug" },
    { value: "9", label: "product templates, one for each SKU", source: "HappyGangav1/theme/templates/product.*.json" },
  ],
  credits: [
    { team: "Web", people: ["karan-joshi", "mridul-singh-bisht", "diwakar-jha"] },
    { team: "Design", people: ["komal-gautam"] },
    { team: "Video & Motion", people: ["dev-lal"] },
    { team: "Accounts", people: ["teesha-jain"] },
  ],
  testimonial: {
    quote:
      "We handed over a design and half the content. They built the store around the gaps, asked the questions we hadn't thought of, and never put a claim on a page that we couldn't back.",
    name: "Happy Ganga founder",
    role: "Founder",
    company: "Happy Ganga",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Happy Ganga, Chennai" },
        { label: "Product", value: "Probiotic floor, dishwash, laundry and toilet cleaners" },
        { label: "Scope", value: "Custom Shopify theme, from Figma" },
        { label: "Status", value: "Staged on the live store, publishing on sign-off" },
      ],
    },
    {
      kind: "prose",
      heading: "Cleaners that keep working",
      paragraphs: [
        "Happy Ganga ferments its cleaners for 90 days. The idea is that what goes down the drain keeps cleaning: the pipe, the drain, and in the end the river. The home page says it in one line: every drop that leaves your home is your decision.",
        "The store was running a stock Shopify theme, with images borrowed from its marketplace listings. The brief was a full redesign in Figma, rebuilt as a theme the team could edit themselves, on the same store and the same Refresh base the shop already used.",
      ],
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "Read out of Figma, not eyeballed",
      paragraphs: [
        "Every colour, size and gap in the theme comes from one tokens file, and every value in it was read from the Figma file, with the frame it came from noted beside it. Ink for text, teal for emphasis, amber for the moments that matter. Gabarito sets the headlines; Hanken Grotesk sets everything else.",
        "Two values were changed on purpose. The teal is darkened a shade for small eyebrow text, so it passes accessibility contrast on both light grounds it sits on. And the gaps between sections, drawn at several different sizes in Figma, became one value, so the page breathes evenly from top to bottom.",
      ],
    },
    {
      kind: "palette",
      heading: "River and sun, as tokens",
      colors: [
        { name: "Ink", hex: "#06222A", note: "Text" },
        { name: "Teal", hex: "#0896AC", note: "Emphasis, links" },
        { name: "Deep teal", hex: "#077A8C", note: "Small eyebrow text" },
        { name: "Amber", hex: "#FFC400", note: "Calls to action, stats" },
        { name: "Orange", hex: "#FF7300", note: "Button gradient" },
        { name: "Cyan", hex: "#05C3DD", note: "Hero glow" },
        { name: "Mist", hex: "#F5FCFD", note: "Page" },
        { name: "Night", hex: "#001118", note: "Dark bands" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Gabarito", role: "Headlines", font: "gabarito" },
        { name: "Hanken Grotesk", role: "Everything else", font: "hanken" },
      ],
      sample: "Every drop that leaves your home is your decision.",
    },
    {
      kind: "figure",
      image: {
        src: "/work/happy-ganga/range.webp",
        alt: "The Range section: floor, dishwash, laundry and toilet cleaner bottles on amber, rose, mint and violet cards",
        width: 1600,
        height: 1169,
      },
      caption: "The range on real product photography. Each bottle has its own ground.",
      frame: "none",
      wide: true,
    },
  ],

  build: [
    {
      kind: "prose",
      heading: "A river that redraws itself",
      paragraphs: [
        "The How it works band is a river running through five stages: bottle, bucket, floor, drain, river. Figma exported it as a fixed curve. In the theme it is generated from the stages themselves, so if the team adds or removes one in Shopify's editor, the curve redraws and still passes through every badge. On a phone it turns into a vertical rail.",
        "All of the motion checks the visitor's reduced-motion setting first: words rising in the headline, counters, the river drawing in, the drop that tilts under a mouse. If the setting is on, the page arrives finished, never frozen halfway through an animation.",
      ],
    },
    {
      kind: "pair",
      images: [
        {
          src: "/work/happy-ganga/river-desktop.webp",
          alt: "How it works on desktop: a river line curving through five badges from Bottle to River",
          width: 1600,
          height: 873,
        },
        {
          src: "/work/happy-ganga/river-phone.webp",
          alt: "How it works on a phone: the same five stages stacked along a vertical rail",
          width: 1170,
          height: 2598,
        },
      ],
      frames: ["none", "none"],
      caption: "How it works, on desktop and on a phone.",
    },
    {
      kind: "stack",
      items: ["Shopify", "Refresh 11 (base theme)", "Liquid", "Vanilla JavaScript", "Section Rendering API", "Figma", "Shopify CLI"],
    },
  ],

  hurdles: [
    {
      id: "ahead-of-content",
      title: "Building ahead of the content",
      group: "engineering",
      hard: "The store build had a contracted date of 22 August, and the content for it wasn't finished. Two product sets went on hold on 17 and 18 August, waiting for copy.",
      fix: "We built the templates to stand on their own. Product pages read titles, prices, images and ratings from the store, and take their extra lines from fields the team can fill in later. When the content landed, it slotted straight in.",
      result: "Both product sets went out on 19 August, three days before the contracted date.",
      solvedBy: ["karan-joshi"],
      source: "DNMS Happy Ganga tasks 17–19 Aug 2026; theme/sections/hg-pdp.liquid (metafield-driven tagline and cost-per-use)",
    },
    {
      id: "verify-first",
      title: "The mockups promised more than the store could sell",
      group: "experience",
      hard: "The designs showed twin packs, 5-litre cans, a subscription option, a low-stock bar and a rating with hundreds of reactions. The store had none of the extra products, no subscription set up, and review data that didn't match the rating.",
      fix: "Each of those parts reads the store and hides itself when there is nothing real behind it. Size swatches link only to products that exist, the subscription block stays off until a plan exists, the stock bar reads live inventory, and ratings come from the product's own review data. Anything we couldn't verify went to the client as a plain question, and the next product pages waited for the answers.",
      result: "Nothing on a product page that a customer can't buy or check. The verified pages shipped on 3 September, two days after the content check.",
      solvedBy: ["karan-joshi"],
      source: "HappyGangav1/Happy_Ganga_Product_Page_Differences.txt; Happy_Ganga_Client_Questions.txt; DNMS 1–3 Sep 2026",
    },
    {
      id: "live-store",
      title: "Redesigning a store that was already selling",
      group: "engineering",
      hard: "Happy Ganga was taking orders on its old theme. The new one had to be built and reviewed on the real store, with real products and prices, without changing anything a customer could see.",
      fix: "The new theme sits on the store as an unpublished draft. Each product points to its own new template, which the live theme simply doesn't have, so live pages fall back to exactly what they showed before. Every proposed change was sorted into two lists: safe to make now, and touches the live shop. The second list waits for a yes.",
      result: "The client reviews the new store on its own products through preview links, while the live shop stays as it was, checked again after each change.",
      solvedBy: ["karan-joshi"],
      source: "HappyGangav1/Happy_Ganga_Draft_Preview_Links.txt; Happy_Ganga_Safe_To_Fix_Without_Live.txt",
    },
    {
      id: "figma-parity",
      title: "Keeping the build and the design in step",
      group: "experience",
      hard: "Feedback arrived in pieces, on 8–9 September and again on 5 October, and a second design round followed: a responsive pass on 14–15 September, then new Figma for Home, Product and About on 16–17 September. Every round risked the theme and the design drifting apart.",
      fix: "We checked the theme against Figma line by line, page by page, and wrote down every difference with its cause: store data, a setting, or a real mismatch. Real mismatches were fixed on whichever side was wrong. Sometimes that was the theme, sometimes Figma.",
      result: "At the 17 September check, the About page matched Figma word for word, and the Contact page's three wording differences were fixed the same day.",
      solvedBy: ["karan-joshi", "mridul-singh-bisht"],
      source: "HappyGangav1/Happy_Ganga_Theme_vs_Figma_Content.txt; DNMS 8–9 Sep, 14–17 Sep, 5 Oct 2026",
    },
    {
      id: "shared-clock",
      title: "A hurdle that became a feature",
      group: "engineering",
      hard: "On 19 August two Happy Ganga tasks ran side by side, and the studio's own project system counted the same working time twice, once for each task.",
      fix: "Rather than patch the timesheet, we built a shared clock for parallel tasks into DNMS, the studio's in-house platform, so time spent on tasks running at once is counted once. It shipped on 3 September and was refined on 21 September.",
      result: "A snag on one client project became part of the platform the whole studio runs on. The DNMS case study picks up the story.",
      solvedBy: ["karan-joshi"],
      source: "DNMS findings: Happy Ganga parallel tasks 19 Aug 2026; DNMS shared clock 3 Sep, fix 21 Sep 2026",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Delivered", value: "3 days before the contracted date" },
        { label: "Sections", value: "92 custom, all editable in Shopify" },
        { label: "Product templates", value: "9, one for each SKU" },
        { label: "Status", value: "Staged on the live store, publishing on sign-off" },
      ],
    },
    {
      kind: "prose",
      heading: "Ready when the answers are",
      paragraphs: [
        "The new store is built, reviewed on real products, and waiting on the last decisions only the client can make: product names, pack contents, and which claims can be printed, with what proof. Each one is written down as a plain question, with the reason it matters.",
        "That was the rule throughout. A number goes on the page only when someone can stand behind it.",
      ],
    },
    {
      kind: "pair",
      images: [
        {
          src: "/work/happy-ganga/home-desktop.webp",
          alt: "Happy Ganga home page on desktop, with the water-drop hero and four bottles",
          width: 1600,
          height: 1000,
        },
        {
          src: "/work/happy-ganga/home-phone.webp",
          alt: "Happy Ganga home page on a phone, headline first",
          width: 1170,
          height: 1992,
        },
      ],
      frames: ["browser", "phone"],
    },
  ],

  next: "leocym",
};

export default happyGanga;
