import type { CaseStudy } from "../types";

// Sources: ..\h2s (Shopify theme), the live site h2s.co.in (8 Oct 2026), docs/dnms-findings.md,
// and ..\adauto\docs (the AI weekly report pilot, mentioned at a high level only).
// Positioning rule from the client: Hard2Soft CONDITIONS water. Never call it an RO or a purifier,
// and make no absolute claims.
const hard2soft: CaseStudy = {
  slug: "hard2soft",
  client: "Hard2Soft",
  headline: "43 cities, one engine, and a gauge that tells you it's the water.",
  summary:
    "Hard2Soft makes a cartridge that sits in the overhead tank and conditions borewell water, with no salt and no electricity. We run its Shopify store: 43 city and state pages from one data-driven template, a symptom check that turns a list of household annoyances into a reason, and a steady stream of festival looks and price changes. People searching for the problem now find the brand at an average Google position of 6.9.",
  year: 2026,
  industry: "D2C · Home water care",
  disciplines: ["Commerce", "Search & AI"],
  platform: "Shopify · Horizon",
  liveUrl: "https://h2s.co.in",
  tier: "flagship",
  order: 3,
  theme: {
    scheme: "light",
    bg: "#F6FAFF",
    surface: "#EEF3FB",
    text: "#10131A",
    muted: "#6C7280",
    accent: "#1257C7",
    onAccent: "#FFFFFF",
    display: "bricolage",
    body: "inter",
  },
  poster: {
    src: "/work/hard2soft/city-page-desktop.webp",
    alt: "A Hard2Soft city page for Jaipur: a 400-700 ppm hardness reading on a green-to-red scale beside the headline",
    width: 1600,
    height: 1000,
  },
  exhibit: "h2s",
  exhibitHint: "Tap the signs you recognise at home and watch the gauge rise. Then find your city among the 43.",
  metrics: [
    { value: "43", label: "city and state pages from one template", source: "h2s/templates/page.hard-water-*.liquid; h2s.co.in sitemap_pages_1.xml (8 Oct 2026)" },
    { value: "6.9", label: "average Google position across 7,745 impressions", source: "docs/dnms-findings.md, H2S results (Search Console)" },
    { value: "6", label: "festival looks in about seven weeks", source: "docs/dnms-findings.md, H2S hurdle 2" },
  ],
  credits: [
    { team: "Web", people: ["mridul-singh-bisht", "diwakar-jha"] },
    { team: "Design", people: ["komal-gautam"] },
    { team: "Video & Motion", people: ["dev-lal"] },
    { team: "Accounts", people: ["teesha-jain"] },
  ],
  testimonial: {
    quote:
      "Nobody searches for a water conditioner. They search for what hard water is doing to their home. The city pages and the symptom check meet them right there.",
    name: "Hard2Soft founder",
    role: "Founder",
    company: "Hard2Soft",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Hard2Soft, India" },
        { label: "Product", value: "One tank cartridge, in packs of 1 to 10" },
        { label: "Platform", value: "Shopify, Horizon theme" },
        { label: "Scope", value: "Store, landing pages, speed, search, payments" },
      ],
    },
    {
      kind: "prose",
      heading: "A problem people feel before they can name it",
      paragraphs: [
        "Hard2Soft sells one thing: a cartridge that goes into the overhead tank and conditions borewell water, without salt or electricity. It is not an RO and not a purifier, and the site never says it is. The brief fits on the box: Scale Free, Stress Free.",
        "The difficulty is that nobody searches for a water conditioner. They search for white crust on the taps, a geyser that keeps failing, hair in the shower drain. The site had to meet those people where they are, often in a particular city on a particular borewell, and show them that the common cause may be the water.",
        "The rules were strict from the start. Conditioning, not purification. Borewell and well water, not municipal supply, a line printed right under the order button on every city page. No absolute promises.",
      ],
    },
    {
      kind: "figure",
      image: {
        src: "/work/hard2soft/product-desktop.webp",
        alt: "The Hard2Soft product page: the cartridge beside a cut-away water tank, with pack-size pills from Pack of 1 to Pack of 10",
        width: 1600,
        height: 1000,
      },
      caption: "One product, six pack sizes. The pills join six separate products into one choice.",
      frame: "browser",
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "One blue, borrowed exactly",
      paragraphs: [
        "The store is black, white and one blue, #1257C7. Every custom page we added inherits the theme's own fonts and that single accent, so a visitor can't tell where Shopify's Horizon theme ends and our templates begin.",
        "Inter carries the headings and the text. Bricolage Grotesque is kept for numbers: prices, hardness readings, the score in the gauge.",
      ],
    },
    {
      kind: "palette",
      heading: "The store's blue, and the colours of damage",
      colors: [
        { name: "Hard2Soft blue", hex: "#1257C7", note: "The one accent" },
        { name: "Highlight", hex: "#0331A8", note: "Emphasis in headlines" },
        { name: "Deep blue", hex: "#0E3F96" },
        { name: "Blue wash", hex: "#E7EEFB", note: "Chips, soft bands" },
        { name: "Night", hex: "#0D1730", note: "Dark bands" },
        { name: "Ink", hex: "#10131A", note: "Text" },
        { name: "Amber", hex: "#D98A1F", note: "Gauge: strong match" },
        { name: "Rust", hex: "#B3431F", note: "Gauge: severe, warnings" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Bricolage Grotesque", role: "Numbers", font: "bricolage" },
        { name: "Inter", role: "Headings and text", font: "inter" },
      ],
      sample: "Scale Free, Stress Free.",
    },
    {
      kind: "figure",
      image: {
        src: "/work/hard2soft/symptom-check.webp",
        alt: "The symptom check: ten household signs as tiles, four ticked, and a ring gauge reading 4 of 10 signs, Strong match",
        width: 1600,
        height: 1080,
      },
      caption: "The symptom check. Four ticks turn the ring amber, and the Order button wakes at three.",
      frame: "none",
      wide: true,
    },
    {
      kind: "prose",
      heading: "Colour only where it means something",
      paragraphs: [
        "The hardness scale runs green to red with one hard line on it: the 180 ppm mark the site uses as its comfort limit. Amber and rust appear only where the page warns (the gauge, the severity pill, the area-by-area table), so warmth always reads as a warning, never as decoration.",
      ],
    },
    {
      kind: "pair",
      images: [
        {
          src: "/work/hard2soft/home-desktop.webp",
          alt: "The Hard2Soft home page with a Navratri banner: diyas, marigolds and the cartridge beside a tank",
          width: 1600,
          height: 1000,
        },
        {
          src: "/work/hard2soft/home-phone.webp",
          alt: "The Hard2Soft home page on a phone, with the boxed cartridge and its Scale Free, Stress Free packaging",
          width: 1170,
          height: 1992,
        },
      ],
      frames: ["browser", "phone"],
      caption: "The home page in its Navratri look, one of six festival looks in about seven weeks.",
    },
  ],

  build: [
    {
      kind: "architecture",
      heading: "What runs behind the store",
      caption: "Local facts go in on the left; one engine turns them into pages that sell.",
      nodes: [
        { id: "cities", label: "City & state pages", note: "43 short data files", lane: 0 },
        { id: "topics", label: "Topic pages", note: "hair, skin, laundry, bathroom, geyser", lane: 0 },
        { id: "engine", label: "Landing engine", note: "one Liquid snippet", lane: 1 },
        { id: "check", label: "Symptom check", note: "live ring gauge", lane: 2 },
        { id: "reels", label: "Shoppable reels", note: "video loads on view", lane: 2 },
        { id: "theme", label: "Horizon theme", note: "Shopify", lane: 2 },
        { id: "packs", label: "Pack selector", note: "6 sizes, 6 products", lane: 3 },
        { id: "checkout", label: "Checkout", note: "HDFC gateway · COD", lane: 3 },
      ],
      links: [
        { from: "cities", to: "engine", label: "local facts" },
        { from: "engine", to: "check" },
        { from: "engine", to: "reels" },
        { from: "topics", to: "theme" },
        { from: "engine", to: "theme" },
        { from: "reels", to: "checkout", label: "add to cart" },
        { from: "theme", to: "packs" },
        { from: "packs", to: "checkout" },
      ],
    },
    {
      kind: "prose",
      heading: "One engine, 43 pages",
      paragraphs: [
        "Each city and state page is a short file of local facts: the headline, the neighbourhoods, the tested hardness range, a paragraph on the local rock, an area-by-area table, ten symptoms, the yearly cost of doing nothing, and the questions people there ask. One Liquid snippet turns those facts into the full page.",
        "The sections every page shares, from installation and the replacement reminder to the size guide and the reels, are written once, inside the engine. Change the engine and all 43 pages change with it.",
      ],
    },
    {
      kind: "prose",
      heading: "Video that sells, without the weight",
      paragraphs: [
        "Reels on the city pages carry their own Add to Cart: one tap adds that pack and opens the cart drawer, without leaving the page. The videos load only as they near the screen, play while visible and pause when they leave. For visitors who ask their device for reduced motion, they don't play on their own.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "City and state pages", value: "43" },
        { label: "Landing engine", value: "~1,100 lines" },
        { label: "Topic pages", value: "5" },
        { label: "Pack sizes", value: "6" },
      ],
    },
    {
      kind: "timeline",
      heading: "Seven weeks of moving parts",
      items: [
        { date: "12 Aug", label: "HDFC payment gateway work begins" },
        { date: "13 Aug", label: "First of six site-wide price rounds" },
        { date: "24 Aug", label: "Speed and search audit" },
        { date: "9 Sep", label: "Search and Google profile work; last price round" },
        { date: "11 Sep", label: "Site speed pass" },
        { date: "21 Sep", label: "Gateway API work" },
        { date: "24 Sep", label: "Mobile speed pass" },
        { date: "25 Sep", label: "Cash on delivery in, part-payment out" },
        { date: "28 Sep", label: "Second search audit" },
        { date: "29 Sep", label: "Gateway integrated and tested" },
      ],
    },
    {
      kind: "stack",
      items: ["Shopify", "Horizon theme", "Liquid", "Vanilla JavaScript", "Shopify Ajax Cart API", "HDFC payment gateway", "Google Search Console", "Google Tag Manager"],
    },
  ],

  hurdles: [
    {
      id: "symptom-check",
      title: "Visitors didn't know they had hard water",
      group: "experience",
      hard: "Hard water is invisible. People notice dry skin, hair fall or a dead geyser, and blame the shampoo or the appliance. Telling them outright that it's the water would be a claim the brand can't make.",
      fix: "We let them get there themselves. The symptom check lists ten everyday signs; each tap fills a ring gauge and moves it through three bands: early signs, strong match, severe. The Order button stays dimmed until three signs are ticked. Every tile works as a real checkbox for keyboards and screen readers, and the verdict is read out as it changes.",
      result: "The case for the product is made by the visitor's own home. The check runs on all 43 city and state pages.",
      solvedBy: ["mridul-singh-bisht"],
      source: "h2s/snippets/city-landing.liquid (symptom self-diagnostic, #h2cSymMeter)",
    },
    {
      id: "festivals",
      title: "A new festival look every week",
      group: "experience",
      hard: "Indian shopping runs on festivals, and the brand wanted the store dressed for each one: six looks in about seven weeks, from Independence Day through Ganpati, Navratri and Dussehra to Diwali.",
      fix: "Festival artwork lives in the home page slideshow as editable slides, so each change is new artwork and copy, not new code. Design produced the banners and the matching ads; web swapped them in and kept the offers in step.",
      result: "Six festival looks in about seven weeks, without rebuilding a layout.",
      solvedBy: ["komal-gautam", "mridul-singh-bisht"],
      source: "docs/dnms-findings.md H2S hurdle 2; h2s/sections/custom-slideshow.liquid; live home page 8 Oct 2026 (Navratri slide)",
    },
    {
      id: "pack-family",
      title: "Six pack sizes, six separate products",
      group: "experience",
      hard: "Each pack (1, 2, 3, 4, 5 and 10 cartridges) is its own product in Shopify. The theme's size picker only works inside one product, so a product page offered no choice of pack at all.",
      fix: "A pack selector joins the family. It appears on every pack's page, highlights the current one, and each pill opens that pack's own page, where the price and the sticky buy bar update by themselves. Prices are left off the pills on purpose: each pack's own page shows its price.",
      result: "Shoppers move between packs as if they were sizes of one product, and each pack keeps its own page and price.",
      solvedBy: ["mridul-singh-bisht"],
      source: "h2s/snippets/h2s-pack-selector.liquid",
    },
    {
      id: "in-app-browser",
      title: "Ad clicks froze inside Instagram",
      group: "experience",
      hard: "Paid social sends visitors in through Instagram's and Facebook's built-in browsers. The theme animates between pages using the browser's view transitions, and in those in-app browsers, or on a very slow connection, a page change could hang on a white or frozen screen, most often from the home page to the product.",
      fix: "A small script at the end of every page spots in-app browsers, 2G connections and data-saver mode, and turns the page-to-page transition off for them alone. Everyone else keeps the smooth transition.",
      result: "From an ad, the product page now opens as a plain, reliable page load.",
      solvedBy: ["mridul-singh-bisht"],
      source: "h2s/layout/theme.liquid (in-app browser view-transition override, end of body)",
    },
    {
      id: "city-engine",
      title: "43 city pages without 43 designs",
      group: "engineering",
      hard: "Every city has its own borewell story: different rock, different hardness, different neighbourhoods. Building 43 pages by hand would mean 43 copies of the same design to keep in step every time anything changed.",
      fix: "We built one landing engine, a single Liquid snippet, and made each city or state page a short file of local facts that feeds it. The shared sections are written once, inside the engine.",
      result: "43 city and state pages are live from one template. A design change, a new section or a fix reaches all of them at once.",
      solvedBy: ["mridul-singh-bisht"],
      source: "h2s/snippets/city-landing.liquid; h2s/templates/page.hard-water-*.liquid; h2s.co.in sitemap_pages_1.xml",
    },
    {
      id: "price-rounds",
      title: "Six price changes in four weeks",
      group: "engineering",
      hard: "Between 13 August and 9 September the price changed six times, site-wide, and the last change put it back where an earlier round had it. Each round touched every page that showed a price, and every ad.",
      fix: "We kept the price in as few places as possible. The 43 city pages share one price block inside the engine; the city-page reels and the cart read the live price from Shopify itself. Design re-cut the ads in step.",
      result: "A price round became one edit for all 43 city pages, not 43 edits.",
      solvedBy: ["mridul-singh-bisht", "komal-gautam"],
      source: "docs/dnms-findings.md H2S hurdle 1 (13 Aug–9 Sep 2026); h2s/snippets/city-landing.liquid (hero price block, reel prices from variant data)",
    },
    {
      id: "speed",
      title: "Video and tags weighed the pages down",
      group: "engineering",
      hard: "The pages lean on video: shoppable reels, installation clips, brand films. Add analytics tags, and a phone on a slow network was fetching far more than the first screen needed.",
      fix: "Reels and installation clips now load only as they near the screen, play while visible and pause when they leave. YouTube embeds can show a still image until tapped. Google Tag Manager waits until two seconds after the page has loaded. The work ran in passes: an audit on 24 August, site speed on 11 September, mobile speed on 24 September.",
      result: "Videos and trackers no longer compete with the first screen.",
      solvedBy: ["mridul-singh-bisht"],
      source: "h2s/snippets/city-landing.liquid (lazy video observer); h2s/assets/youtube-facade.js; h2s/layout/theme.liquid (deferred GTM); DNMS 24 Aug, 11 Sep, 24 Sep 2026",
    },
    {
      id: "gateway",
      title: "Payments through the bank's own gateway",
      group: "engineering",
      hard: "The brand wanted payments to run through HDFC's gateway, and the payment options changed partway through: on 25 September cash on delivery came in and part-payment went out.",
      fix: "We took it in stages: set-up from 12 August, the gateway's API on 21 September, then integration and end-to-end testing on 29 September, reworking the checkout options in between.",
      result: "By 29 September the gateway was integrated and tested. Checkout offers prepaid and cash on delivery, with a small extra discount for paying upfront.",
      solvedBy: ["mridul-singh-bisht"],
      source: "docs/dnms-findings.md H2S hurdle 3 (12 Aug, 21 Sep, 25 Sep, 29 Sep 2026); h2s.co.in announcement bar, 8 Oct 2026",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Google", value: "Average position 6.9 across 7,745 impressions" },
        { label: "Landing pages", value: "43 cities and states, all live" },
        { label: "Festival looks", value: "6 in about 7 weeks" },
        { label: "Checkout", value: "HDFC gateway, plus cash on delivery" },
      ],
    },
    {
      kind: "prose",
      heading: "Found by the people with the problem",
      paragraphs: [
        "Hard2Soft is now found where its customers start: searching for the trouble in their own city. The store averages position 6.9 in Google across 7,745 impressions, after a speed and search programme that ran from August to the end of September.",
        "And the store keeps moving. New prices, new festivals, new packs: each one handled as an edit, not a rebuild.",
        "Hard2Soft is also the pilot client for an AI weekly report the studio is building: one button that gathers the brand's marketing channels in one place and writes up the week in plain English.",
      ],
    },
    {
      kind: "pair",
      images: [
        {
          src: "/work/hard2soft/symptom-check-phone.webp",
          alt: "The symptom check on a phone: six of ten signs ticked, the ring in rust red, labelled Severe - act now",
          width: 1170,
          height: 1992,
        },
        {
          src: "/work/hard2soft/product-phone.webp",
          alt: "The Hard2Soft product page on a phone, with the sticky Add to Cart bar along the bottom",
          width: 1170,
          height: 1992,
        },
      ],
      frames: ["phone", "phone"],
      caption: "On a phone: the gauge at six signs, and the product page with its sticky buy bar.",
    },
  ],

  next: "dnms",
};

export default hard2soft;
