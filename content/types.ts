// Content schema for the portfolio. Every case study is one typed object in content/work/<slug>.ts.
// Writing rules (PLAN §3.3, §9, §10.2):
// - Plain language for non-developers. Calm, clipped sentences. No hype, no invented facts.
// - Every number needs a `source` (file path, commit, DNMS task or URL). Sources are never rendered.
// - Never publish secrets, unfixed weaknesses, attack details, personal data, or internal staffing changes.
// - Former team members are not credited. Company tenure is "12+ years" only - never a founding year.

export type Img = {
  /** Path under /public, e.g. "/work/skelmet/home-desktop.webp". */
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** Fonts a client theme may use. Each maps to a next/font instance in lib/client-fonts.ts. */
export type FontKey =
  | "stackHeadline"
  | "stackText"
  | "anton"
  | "spaceGrotesk"
  | "figtree"
  | "cormorant"
  | "inter"
  | "bricolage"
  | "gabarito"
  | "hanken"
  | "montserrat"
  | "openSans"
  | "fraunces"
  | "instrumentSans"
  | "geist"
  | "manrope";

/** A client's identity, applied to all of that project's chapter pages (the theme takeover). */
export type Theme = {
  scheme: "dark" | "light";
  bg: string;
  surface: string;
  text: string;
  muted: string;
  /** The client's signature colour: links, progress line, highlights. Must pass 3:1 on bg. */
  accent: string;
  /** Text colour placed on top of `accent` (buttons). */
  onAccent: string;
  display: FontKey;
  body: FontKey;
};

export type Frame = "browser" | "phone" | "none";

export type Block =
  | { kind: "prose"; heading?: string; paragraphs: string[] }
  | {
      kind: "figure";
      image: Img;
      caption?: string;
      frame?: Frame;
      wide?: boolean;
    }
  | {
      kind: "pair";
      images: [Img, Img];
      frames?: [Frame, Frame];
      caption?: string;
    }
  | {
      kind: "palette";
      heading?: string;
      colors: { name: string; hex: string; note?: string }[];
    }
  | {
      kind: "typeface";
      families: { name: string; role: string; font: FontKey }[];
      sample: string;
    }
  | {
      kind: "facts";
      heading?: string;
      items: { label: string; value: string }[];
    }
  | { kind: "list"; heading?: string; items: string[] }
  | {
      kind: "timeline";
      heading?: string;
      items: { date: string; label: string }[];
    }
  | {
      kind: "architecture";
      heading?: string;
      caption?: string;
      /** Nodes are laid out left→right by `lane` (0-based), top→bottom in order of appearance. */
      nodes: { id: string; label: string; note?: string; lane: number }[];
      links: { from: string; to: string; label?: string }[];
    }
  | { kind: "stack"; heading?: string; items: string[] };

/** Interactive before/after attached to a hurdle. Only use when it genuinely explains the fix. */
export type HurdleDemo =
  | {
      kind: "compare";
      before: Img;
      after: Img;
      beforeLabel: string;
      afterLabel: string;
    }
  | {
      kind: "shift";
      label: string;
      before: number;
      after: number;
      unit?: string;
      /** Which direction is an improvement, so the meter reads correctly. */
      better: "higher" | "lower";
      decimals?: number;
    };

export type Hurdle = {
  id: string;
  /** Plain-language title, e.g. "Two skulls on screen". */
  title: string;
  /** "experience" = what visitors see; "engineering" = systems. Used to split long hurdle chapters. */
  group: "experience" | "engineering";
  /** Why it was hard: the constraint, 1–3 sentences. */
  hard: string;
  /** Honest false starts, if useful. */
  tried?: string;
  /** What we did, in plain language. */
  fix: string;
  /** A number or a visible difference. */
  result: string;
  demo?: HurdleDemo;
  /** Team member ids from content/team.ts. */
  solvedBy: string[];
  /** Internal trace: commit, file path or DNMS task. Never rendered. */
  source: string;
};

export type Metric = { value: string; label: string; source: string };

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  /** Drafts are shown in development only; production hides any quote whose approval is null. */
  approved: null | { by: string; date: string };
};

export type CreditTeam =
  | "Web"
  | "Design"
  | "Video & Motion"
  | "Accounts"
  | "Content";

export type Discipline =
  | "Brand site"
  | "Commerce"
  | "Platform"
  | "Product"
  | "Search & AI"
  | "3D & Motion";

export type ExhibitKey =
  | "skelmet"
  | "kyg"
  | "dnms"
  | "h2s"
  | "happy-ganga"
  | "leocym"
  | "kyg-network"
  | "talentifix"
  | "chetan"
  | "realty-canvas"
  | "making-of";

export type CaseStudy = {
  slug: string;
  client: string;
  /** One line that sells the story, e.g. "A helmet mount that flies off the page." */
  headline: string;
  /** Three plain sentences: who, what we built, why it matters. */
  summary: string;
  year: number;
  industry: string;
  disciplines: Discipline[];
  platform: string;
  liveUrl?: string;
  tier: "flagship" | "standard";
  /** Order on the Work page and home (lower first). */
  order: number;
  theme: Theme;
  poster: Img;
  /**
   * Where the poster is cropped when the exhibit is narrower than it (a CSS object-position, e.g.
   * "82% 50%"), so a phone still sees the subject. Centre when omitted.
   */
  posterFocus?: string;
  /** The same screen as `poster`, captured on a phone (art direction for cards under 768px). */
  posterPhone?: Img;
  /** Short muted loop shown on hover in grids (optional). */
  previewVideo?: string;
  exhibit: ExhibitKey;
  /** One sentence telling visitors how to play with the exhibit. */
  exhibitHint: string;
  metrics: Metric[];
  credits: { team: CreditTeam; people: string[] }[];
  testimonial?: Testimonial;
  brief: Block[];
  design: Block[];
  build: Block[];
  hurdles: Hurdle[];
  outcome: Block[];
  /** Slug of the case study that follows this one. */
  next: string;
};

export type ArchiveEntry = {
  client: string;
  sector: string;
  platform: string;
  year?: number;
  url: string;
  image: Img;
  note: string;
};

/** "systems" is the second hurdles page, used when a study has more than five hurdles. */
export type ChapterKey =
  | "overview"
  | "brief"
  | "design"
  | "build"
  | "approach"
  | "hurdles"
  | "systems"
  | "outcome";
