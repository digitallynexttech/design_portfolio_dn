import type { Img } from "../types";

// Exhibit data for the KYG network case study: thirteen sites, one subject.
// Palettes and fonts are read from each site's own code (app/globals.css, app/layout.tsx,
// and components/homepageStyles.ts for mapmygenetic.com) in `knowyourgensSub Websites/<domain>/`.
// `accent` is each site's signature colour as used on its home page; it is data, not a UI token,
// so it is not contrast-checked against `bg`. `font` names the site's display face first.
// Screenshots: knowyourgensSub Websites/audit/screenshots/<domain>__desktop.png (1440×900) and
// __mobile.png (390×844), captured live on 20 Aug 2026 for LIVE-SMOKE-AUDIT-2026-08-20.md.

export const KYG_SITES: {
  domain: string;
  concept: string;
  palette: { bg: string; text: string; accent: string };
  font: string;
  desktop: Img;
  phone?: Img;
}[] = [
  {
    domain: "knowgenes.com",
    concept: "Genetics from the beginning: a five-minute explainer for first-timers",
    palette: { bg: "#FBFCFC", text: "#11201F", accent: "#0D8B80" },
    font: "Lora + Inter",
    desktop: { src: "/work/kyg-network/knowgenes-com-desktop.webp", alt: "knowgenes.com home page: \"Genes, explained in five minutes.\" in a serif headline over a search box", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/knowgenes-com-phone.webp", alt: "knowgenes.com on a phone", width: 390, height: 844 },
  },
  {
    domain: "knowourgenes.com",
    concept: "An A-to-Z encyclopedia: look up any gene, understand it in one read",
    palette: { bg: "#F6F3EA", text: "#1B1813", accent: "#0F766E" },
    font: "Newsreader + Geist",
    desktop: { src: "/work/kyg-network/knowourgenes-com-desktop.webp", alt: "knowourgenes.com home page: a parchment reference page with a gene search and an A-to-Z button", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/knowourgenes-com-phone.webp", alt: "knowourgenes.com on a phone", width: 390, height: 844 },
  },
  {
    domain: "knowyourgenes.ai",
    concept: "A wellness magazine: bite-sized reads on how your DNA shapes daily life",
    palette: { bg: "#FAF6EF", text: "#1F1A14", accent: "#0E4D4B" },
    font: "Figtree",
    desktop: { src: "/work/kyg-network/knowyourgenes-ai-desktop.webp", alt: "knowyourgenes.ai home page: \"Genomic wellness, decoded for real life.\" on a warm cream gradient", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/knowyourgenes-ai-phone.webp", alt: "knowyourgenes.ai on a phone", width: 390, height: 844 },
  },
  {
    domain: "kyg.co.in",
    concept: "A help centre: genetic-testing questions answered one at a time",
    palette: { bg: "#F6F8F8", text: "#13201D", accent: "#0F766E" },
    font: "Geist",
    desktop: { src: "/work/kyg-network/kyg-co-in-desktop.webp", alt: "kyg.co.in home page: \"Genetic testing, your questions answered.\" with help-topic buttons and a question search", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/kyg-co-in-phone.webp", alt: "kyg.co.in on a phone", width: 390, height: 844 },
  },
  {
    domain: "mapmygenes.co.in",
    concept: "A streaming shelf: binge your biology, one row of stories at a time",
    palette: { bg: "#0B0B10", text: "#F6F6F8", accent: "#FF3B5C" },
    font: "Geist",
    desktop: { src: "/work/kyg-network/mapmygenes-co-in-desktop.webp", alt: "mapmygenes.co.in home page: a dark billboard story above a \"Trending this week\" row of tiles", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/mapmygenes-co-in-phone.webp", alt: "mapmygenes.co.in on a phone", width: 390, height: 844 },
  },
  {
    domain: "mapmygenes.life",
    concept: "A daily read: one short piece every weekday, themed by the day",
    palette: { bg: "#FAF5EC", text: "#2A2520", accent: "#E87A4C" },
    font: "Instrument Serif + Figtree",
    desktop: { src: "/work/kyg-network/mapmygenes-life-desktop.webp", alt: "mapmygenes.life home page: \"Your body has its own rules. Read one today.\" with a coral button", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/mapmygenes-life-phone.webp", alt: "mapmygenes.life on a phone", width: 390, height: 844 },
  },
  {
    domain: "mapmygenetic.com",
    concept: "A reference library: genetics questions, answered plainly and reviewed",
    palette: { bg: "#FAF6EF", text: "#1A1510", accent: "#C49A3C" },
    font: "Instrument Serif + Figtree",
    desktop: { src: "/work/kyg-network/mapmygenetic-com-desktop.webp", alt: "mapmygenetic.com home page: \"Genetics, answered plainly.\" with the last word in gold serif italic", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/mapmygenetic-com-phone.webp", alt: "mapmygenetic.com on a phone", width: 390, height: 844 },
  },
  {
    domain: "mapmygenomics.com",
    concept: "Discussion threads: the questions people wonder about, answered by people who know",
    palette: { bg: "#FAF6EF", text: "#1F1A14", accent: "#25B5AB" },
    font: "Figtree",
    desktop: { src: "/work/kyg-network/mapmygenomics-com-desktop.webp", alt: "mapmygenomics.com home page: \"The genetics questions you actually wonder about\" with browse and ask buttons", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/mapmygenomics-com-phone.webp", alt: "mapmygenomics.com on a phone", width: 390, height: 844 },
  },
  {
    domain: "matchgenes.in",
    concept: "Nuggets: byte-sized genetics you can read on a commute or save as a PDF",
    palette: { bg: "#0E2A2C", text: "#FAF6EF", accent: "#F3D5B2" },
    font: "Fraunces + Figtree",
    desktop: { src: "/work/kyg-network/matchgenes-in-desktop.webp", alt: "matchgenes.in home page: \"MatchGenes Nuggets\" in a large serif on deep teal, with topic filters", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/matchgenes-in-phone.webp", alt: "matchgenes.in on a phone", width: 390, height: 844 },
  },
  {
    domain: "matchgenes.life",
    concept: "Couples: the everyday biology of two people who love each other",
    palette: { bg: "#FFF6F1", text: "#2A1C22", accent: "#F4566B" },
    font: "Outfit + Geist",
    desktop: { src: "/work/kyg-network/matchgenes-life-desktop.webp", alt: "matchgenes.life home page: \"You're a morning person. They're not. Now you know why.\" on blush pink", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/matchgenes-life-phone.webp", alt: "matchgenes.life on a phone", width: 390, height: 844 },
  },
  {
    domain: "matchgenesnow.com",
    concept: "A weekly news desk: what's new in genetic science, in plain language",
    palette: { bg: "#FAFAF7", text: "#161513", accent: "#B4351C" },
    font: "Lora + Inter",
    desktop: { src: "/work/kyg-network/matchgenesnow-com-desktop.webp", alt: "matchgenesnow.com home page: \"What's new in genetic science this week.\" set like a broadsheet", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/matchgenesnow-com-phone.webp", alt: "matchgenesnow.com on a phone", width: 390, height: 844 },
  },
  {
    domain: "mygenesmap.com",
    concept: "A decode-yourself explorer: tap a body signal, find the gene behind it",
    palette: { bg: "#F5F2FC", text: "#1B1726", accent: "#6D28D9" },
    font: "Geist",
    desktop: { src: "/work/kyg-network/mygenesmap-com-desktop.webp", alt: "mygenesmap.com home page: \"Your body has been dropping hints. Tap one.\" on a lilac gradient", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/mygenesmap-com-phone.webp", alt: "mygenesmap.com on a phone", width: 390, height: 844 },
  },
  {
    domain: "mygenesmap.in",
    concept: "A community Q&A: ask a question, follow topic spaces, read expert answers",
    palette: { bg: "#F4F3F9", text: "#1B1726", accent: "#6D28D9" },
    font: "Geist",
    desktop: { src: "/work/kyg-network/mygenesmap-in-desktop.webp", alt: "mygenesmap.in home page: a three-column community feed with an ask box and trending questions", width: 1200, height: 750 },
    phone: { src: "/work/kyg-network/mygenesmap-in-phone.webp", alt: "mygenesmap.in on a phone", width: 390, height: 844 },
  },
];
