import type { CaseStudy } from "../types";

// TalentiFi-X: AI and tech staffing site (Next.js + Sanity), rebuilt to be found by search engines and AI tools.
// Sources: ..\Talentifix (git log Feb – Oct 2026, src/app/layout.tsx, src/styles/global.css, scripts/, .github/workflows),
// ..\SEO\documentation\document.md (work log 29 Sep – 8 Oct 2026), ..\SEO\talentifix (audit, Lighthouse reports,
// screenshots, checklist), DNMS project TALENTIFI-X (33 tasks), docs/dnms-findings.md.
// Positive, verified results only. Not published here, by instruction: AI-answer visibility counts,
// off-site authority scores, and raw indexing counts.
const talentifix: CaseStudy = {
  slug: "talentifix",
  client: "TalentiFi-X",
  headline: "Staffing. Rebuilt. Then rebuilt again, to be found.",
  summary:
    "TalentiFi-X is an AI and tech staffing firm with offices in Bengaluru and Houston. We built its Next.js and Sanity site, then reworked it to be found: clean addresses, structured data, a sitemap that refreshes itself and a direct line to search engines. In one week the jobs page went from 79 to 94 on mobile Lighthouse, and all 40 pages passed their title, description and heading checks.",
  year: 2026,
  industry: "Staffing · AI & tech hiring",
  disciplines: ["Search & AI", "Brand site"],
  platform: "Next.js · Sanity",
  liveUrl: "https://www.talentifix.com",
  tier: "standard",
  order: 8,
  theme: {
    scheme: "light",
    bg: "#F2F4F8",
    surface: "#FFFFFF",
    text: "#1E1E24",
    muted: "#5A5D6B",
    accent: "#0000FF",
    onAccent: "#FFFFFF",
    // The site's headline face is Stack Sans Notch, which is not a FontKey; Stack Sans Headline stands in.
    display: "stackHeadline",
    body: "inter",
  },
  poster: { src: "/work/talentifix/home-desktop.webp", alt: "The TalentiFi-X homepage: 'Staffing. Rebuilt.' beside a glass 3D logo in electric blue and cyan", width: 1440, height: 900 },
  posterPhone: { src: "/work/talentifix/home-phone.webp", alt: "The TalentiFi-X homepage on a phone, with the 3D logo above 'Staffing. Rebuilt.'", width: 1170, height: 1992 },
  exhibit: "talentifix",
  exhibitHint: "Switch between before and after, and watch each gauge settle at its new level.",
  metrics: [
    { value: "79 → 94", label: "mobile Lighthouse on the jobs page, in one week", source: "SEO/talentifix/lighthouse/jobs-mobile.json (29 Sep 2026) and lighthouse/2026-10-06/jobs-mobile.json" },
    { value: "81 → 123", label: "of 199 SEO checklist items done", source: "SEO work log 29 Sep and 6 Oct 2026; SEO/talentifix/Talentifix-SEO-Checklist.xlsx" },
    { value: "40 of 40", label: "pages passing title, description and heading checks", source: "SEO work log 1 Oct 2026 (PR #28, checked live) and 6 Oct 2026 (rechecked)" },
  ],
  credits: [
    { team: "Web", people: ["karan-joshi", "diwakar-jha", "mridul-singh-bisht"] },
    { team: "Design", people: ["komal-gautam"] },
  ],
  testimonial: {
    quote:
      "We wanted search engines and AI tools to read our site as clearly as a good candidate reads a job post. Every change came with a plain-English note on what it did and why it mattered.",
    name: "TalentiFi-X founder",
    role: "Founder",
    company: "TalentiFi-X",
    approved: null,
  },

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "TalentiFi-X, Bengaluru and Houston" },
        { label: "Business", value: "AI and tech staffing" },
        { label: "Scope", value: "Website, CMS, search and AI readiness" },
        { label: "Launch", value: "Live in 4 weeks" },
      ],
    },
    {
      kind: "prose",
      heading: "Built to be found",
      paragraphs: [
        "TalentiFi-X hires AI, machine-learning and cybersecurity talent, from offices in Bengaluru and Houston. Its buyers search before they call, and more and more of them ask an AI assistant instead. A staffing firm they can't find doesn't make the shortlist.",
        "The site went live in four weeks. The harder brief came after: make every page legible to Google, Bing and the AI tools that read them. When the content for a planned optimisation round was late, the team didn't wait. It audited the whole site and turned the findings into a 199-point checklist, which became the work plan.",
      ],
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "One loud blue",
      paragraphs: [
        "The brand speaks in pure electric blue, #0000FF, with a cyan full stop at the end of its headlines: Staffing. Rebuilt. Headlines are set in Stack Sans Notch, whose notched letterforms give plain words an engineered edge; Inter does the reading.",
      ],
    },
    {
      kind: "palette",
      heading: "Electric, with a cyan full stop",
      colors: [
        { name: "Electric Blue", hex: "#0000FF", note: "Every call to action" },
        { name: "Deep Blue", hex: "#000099", note: "Gradient end" },
        { name: "Cyan", hex: "#00DDE2", note: "The full stop" },
        { name: "Light Cyan", hex: "#D3F6FA" },
        { name: "Ink", hex: "#1E1E24", note: "Text" },
        { name: "Mist", hex: "#F2F4F8", note: "Page" },
        { name: "White", hex: "#FFFFFF", note: "Cards" },
      ],
    },
    {
      kind: "typeface",
      families: [
        { name: "Stack Sans Headline", role: "Headlines (the site uses Stack Sans Notch)", font: "stackHeadline" },
        { name: "Inter", role: "Everything else", font: "inter" },
      ],
      sample: "Staffing. Rebuilt.",
    },
    {
      kind: "figure",
      image: { src: "/work/talentifix/solutions-desktop.webp", alt: "The TalentiFi-X Solutions page: 'Not Just Roles. Responsibility.' with a blue Hire Smarter button and an isometric illustration", width: 1440, height: 900 },
      caption: "The Solutions page: big type, short lines and one blue button.",
      frame: "browser",
      wide: true,
    },
    {
      kind: "pair",
      images: [
        { src: "/work/talentifix/home-phone.webp", alt: "The TalentiFi-X homepage on a phone, with the 3D logo above 'Staffing. Rebuilt.'", width: 1170, height: 1992 },
        { src: "/work/talentifix/jobs-phone.webp", alt: "The TalentiFi-X open roles page on a phone", width: 1170, height: 1992 },
      ],
      frames: ["phone", "phone"],
      caption: "Most visits arrive on a phone, so that is the version we tuned first.",
    },
  ],

  build: [
    {
      kind: "architecture",
      heading: "From the editor to the index",
      caption: "Editors publish in Sanity; search engines and AI tools hear about it without anyone redeploying.",
      nodes: [
        { id: "sanity", label: "Sanity CMS", note: "articles, jobs, SEO fields", lane: 0 },
        { id: "actions", label: "GitHub Actions", note: "publishes on schedule", lane: 0 },
        { id: "site", label: "Next.js site", note: "40 pages, server-rendered", lane: 1 },
        { id: "schema", label: "Structured data", note: "company, articles, jobs", lane: 2 },
        { id: "sitemap", label: "Sitemap", note: "refreshes hourly", lane: 2 },
        { id: "llms", label: "llms.txt", note: "a brief for AI tools", lane: 2 },
        { id: "google", label: "Google", note: "Search Console", lane: 3 },
        { id: "bing", label: "Bing", note: "IndexNow", lane: 3 },
      ],
      links: [
        { from: "actions", to: "sanity", label: "flips to published" },
        { from: "sanity", to: "site" },
        { from: "site", to: "schema" },
        { from: "site", to: "sitemap" },
        { from: "site", to: "llms" },
        { from: "sitemap", to: "google" },
        { from: "site", to: "bing", label: "new pages, sent directly" },
      ],
    },
    {
      kind: "prose",
      heading: "Publishing on a timetable",
      paragraphs: [
        "Articles are written ahead and released at agreed times, even at 5 AM. A GitHub Actions workflow checks every fifteen minutes and publishes whatever is due, because GitHub's scheduled runs routinely start minutes late and a job pinned to the exact minute would miss its window. Running it twice changes nothing.",
        "Editors also got a Published switch: a post can leave the site, the blog and both sitemaps without being deleted from the CMS.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "Pages", value: "40" },
        { label: "Checklist", value: "199 checks" },
        { label: "Sitemap refresh", value: "Hourly" },
        { label: "Tap targets", value: "At least 44 px" },
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "Sanity", "Tailwind CSS v4", "TypeScript", "JSON-LD", "IndexNow", "GitHub Actions", "Vercel", "Search Console", "Bing Webmaster Tools", "Microsoft Clarity"],
    },
  ],

  hurdles: [
    {
      id: "empty-shell",
      title: "Search engines were sent an empty page",
      group: "engineering",
      hard: "The site had been started on an admin-panel framework. Its wrapper sat around every page and quietly switched the whole site to rendering in the browser, so crawlers received an empty shell: no headings, no links, no content.",
      tried: "Removing the framework's packages outright broke the deploy, because the lockfile still expected them.",
      fix: "The wrapper was doing nothing (its data source pointed at a demo API), so we took it out of the layout and left the packages for a separate, tested clean-up.",
      result: "Every page is rendered on the server again. Headings, links and images are in the HTML that crawlers receive.",
      solvedBy: ["karan-joshi"],
      source: "Talentifix commits 0c9e393 and 0c1e1e8 (18 Jun 2026)",
    },
    {
      id: "found",
      title: "Most of the site wasn't in Google yet",
      group: "engineering",
      hard: "When the SEO work began, most of the site's 40 pages weren't in Google's index. Pages without one clear address, and without a clear description of what they are, get passed over.",
      fix: "Every page got one canonical address. The company, every article and every job are described to search engines in structured data. IndexNow now tells Bing and its partner engines about a page directly instead of waiting for a crawl, and all 40 pages were sent through it.",
      result: "All 40 pages were accepted by IndexNow. A check after every deploy now confirms the sitemap, canonical addresses and structured data.",
      solvedBy: ["diwakar-jha", "karan-joshi"],
      source: "Talentifix commits df6f3a9 (canonical), 7dfe626 (23 Sep 2026, structured data), e1e17f5 (IndexNow); SEO work log 29 Sep and 1 Oct 2026; SEO/tools/post_deploy_check.py",
    },
    {
      id: "sitemap",
      title: "The sitemap that never refreshed",
      group: "engineering",
      hard: "Articles go live the moment an editor publishes them. The sitemap, the list search engines read to find new pages, was built once at deploy, so a new post stayed unannounced until someone redeployed.",
      tried: "An hourly refresh worked in a local build, but the host published the sitemap as a fixed file and dropped the refresh setting.",
      fix: "We now serve the sitemap from a route, the same way the llms.txt brief for AI tools was already served, so it rebuilds itself at most once an hour.",
      result: "Confirmed on the live site the next morning: the sitemap had rebuilt itself with no deploy, and a post switched off in the CMS had left it.",
      solvedBy: ["karan-joshi"],
      source: "Talentifix commits e8cf056 (1 Oct 2026) and 8c3193b (6 Oct 2026); SEO work log 1 Oct entry, updates of 6–7 Oct",
    },
    {
      id: "cookie-banner",
      title: "The cookie banner sat on the headline",
      group: "experience",
      hard: "Google ranks on the phone version of a site, and most visitors arrive on one. On the home page, the cookie banner the law requires covered the headline and pushed the main button off the first screen.",
      fix: "On phones the banner became one compact row beside its two buttons: 78 px tall instead of 228. The 3D logo graphic shrinks on phones too, so the headline and the Hire Smarter button sit above the banner. Tablets and computers look exactly as before.",
      result: "On standard phones, every page's main heading and main button now clear the banner, and all 40 pages fit the screen without sideways scrolling.",
      demo: {
        kind: "compare",
        before: { src: "/work/talentifix/phone-banner-before.webp", alt: "The TalentiFi-X home page on a phone on 29 September: a tall cookie banner covers the headline", width: 1170, height: 2532 },
        after: { src: "/work/talentifix/phone-banner-after.webp", alt: "The same screen after the fix: the headline and both buttons sit above a one-row cookie banner", width: 1170, height: 2532 },
        beforeLabel: "29 Sep",
        afterLabel: "After",
      },
      solvedBy: ["karan-joshi"],
      source: "Talentifix commits 0b38074 and fba73a0 (6 Oct 2026); SEO work log 1 and 6 Oct 2026; before: SEO/talentifix/screenshots/home-mobile-cookiebanner.png; after: live capture, same 390×844 viewport",
    },
    {
      id: "jobs-speed",
      title: "A slow first screen on phones",
      group: "experience",
      hard: "In the 29 September speed test, the jobs page took 4.2 seconds on a phone to show its main content. The test also flagged what slowed pages down: main images not marked as a priority, and a headline font in a heavy older format.",
      fix: "The main image on every page is now marked to load first. The headline font ships as WOFF2, 61% smaller, in only the four weights the site uses, and it never competes with the hero image for bandwidth. Connections to analytics open early.",
      result: "Mobile Lighthouse on the jobs page rose from 79 to 94, with its main content on screen in 2.5 seconds.",
      demo: { kind: "shift", label: "Mobile Lighthouse, jobs page", before: 79, after: 94, better: "higher" },
      solvedBy: ["karan-joshi"],
      source: "SEO/talentifix/lighthouse/jobs-mobile.json (29 Sep 2026, 79, LCP 4.2 s) and lighthouse/2026-10-06/jobs-mobile.json (94, LCP 2.5 s); Talentifix/src/app/layout.tsx font note; SEO work log 1 Oct 2026",
    },
  ],

  outcome: [
    {
      kind: "facts",
      items: [
        { label: "Launch", value: "Live in 4 weeks" },
        { label: "Jobs page, mobile", value: "Lighthouse 79 → 94" },
        { label: "SEO checklist", value: "81 → 123 of 199" },
        { label: "Pages", value: "All 40 pass titles, descriptions, headings" },
      ],
    },
    {
      kind: "prose",
      heading: "Work you can read",
      paragraphs: [
        "Every change was logged in plain English: what was done, why it matters and where to check it. The checklist works as the progress bar, and each tick carries a dated note of what was seen on the live site.",
        "Articles now carry breadcrumbs and end with links to the services and related articles. New posts appear in the sitemap within the hour, and the AI tools that read llms.txt get a plain summary of the company and every article.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/talentifix/post-desktop.webp", alt: "A TalentiFi-X article page with breadcrumbs, a contents list and a byline crediting the editorial team with the founder's insights", width: 1440, height: 900 },
      caption: "Breadcrumbs and a contents list on every article; newer pieces credit the founder's insights by name.",
      frame: "browser",
      wide: true,
    },
  ],

  next: "chetan-mangalwedhe",
};

export default talentifix;
