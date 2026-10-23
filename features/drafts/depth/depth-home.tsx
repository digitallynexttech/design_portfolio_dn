import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";
import { REEL } from "@/content/reel";
import { SERVICES } from "@/content/studio";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import type { CaseStudy } from "@/content/types";
import { AwayFlag } from "./away-flag";
import { DepthHeader } from "./header";
import { Journey } from "./journey";
import { LocalTime } from "./local-time";
import { LOADER_SCRIPT, MODE_SCRIPT } from "./mode";
import { Preloader } from "./preloader";
import { ServicesStrip } from "./services-strip";
import type { DepthPlane, DepthStop } from "./types";
import { X_GLYPH } from "./x-glyph";
import "./depth.css";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A client colour as a hairline on the void: dark accents (Know Your Genes' deep teal) are lifted
 * toward paper until a 1 px line reads; bright ones are left exactly as they are.
 */
function lift(hex: string): string {
  const v = parseInt(hex.slice(1), 16);
  const rgb = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const lin = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  if (luminance >= 0.08) return hex;
  const mixed = rgb.map((c, i) => Math.round(c + ([242, 241, 238][i] - c) * 0.38));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** The phone gauge's names: a strip of narrow stops (Karan's phone frame, 22 Oct 2026). */
const SHORT: Record<string, string> = {
  skelmet: "SKELMET",
  "know-your-genes": "Genes",
  hard2soft: "Hard2Soft",
  "happy-ganga": "Ganga",
  talentifix: "TalentiFi",
  "chetan-mangalwedhe": "Chetan",
  "realty-canvas": "Realty",
  dnms: "DNMS",
  leocym: "Leocym",
  "kyg-network": "KYG Net",
};

/** The home's work, one list in the sitemap's order (docs/sitemap.md, Karan, 21 Oct 2026). */
const HOME_ORDER = [
  "skelmet",
  "know-your-genes",
  "hard2soft",
  "happy-ganga",
  "talentifix",
  "chetan-mangalwedhe",
  "realty-canvas",
  "dnms",
  "leocym",
  "kyg-network",
];

/** The footer's sign-off: DIGITALLY NEXT across the page, an outline that fills as you arrive (as the
 *  preloader's did), DIGITALLY in white and NEXT in red as in the logo, the X the mascot's letter. */
function FootMark() {
  const layer = (kind: "line" | "fill") => (
    <span className={`dp-foot__mark-layer dp-foot__mark-layer--${kind}`}>
      <span className="dp-foot__mark-a">DIGITALLY</span> <span className="dp-foot__mark-b">NE</span>
      {/* In the flight the 3D X jumps into this place (x-hop.ts) and becomes the letter. */}
      <svg className="dp-foot__mark-x" viewBox={`0 0 ${X_GLYPH.width} ${X_GLYPH.height}`} data-x-slot={kind === "fill" ? "" : undefined}>
        <path d={X_GLYPH.d} />
      </svg>
      <span className="dp-foot__mark-b">T</span>
    </span>
  );
  return (
    <p className="dp-foot__mark" aria-hidden>
      {layer("line")}
      {layer("fill")}
    </p>
  );
}

/** The hero stills (Cycles, from Blender/DigitallyNext/astronaut/hero). Wide screens: the whole frame. */
const WIDE = "(min-width: 900px) and (min-aspect-ratio: 5 / 4)";
/** A transparent pixel: wide screens skip the phone's cut-out. */
const NOTHING = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function HeroStill() {
  const common = { alt: "", sizes: "100vw", priority: true, quality: 75 } as const;
  const wide = getImageProps({ ...common, src: "/models/astronaut/hero-wide-5.webp", width: 2400, height: 1350 }).props;
  const sky = getImageProps({ ...common, src: "/models/astronaut/hero-sky-3.webp", width: 1260, height: 1800 }).props;
  return (
    <picture className="dp-hero__still">
      <source media={WIDE} srcSet={wide.srcSet} />
      <img {...sky} alt="" className="dp-hero__img" />
    </picture>
  );
}

/** Phones: the bust, cut out, laid on the helmet's place until the scene takes over (depth.css). */
function HeroFigure() {
  const fig = getImageProps({
    src: "/models/astronaut/hero-bust-5.webp",
    alt: "",
    width: 1170,
    height: 2228,
    sizes: "(min-width: 600px) 86vw, 100vw",
    priority: true,
    quality: 80,
  }).props;
  return (
    <picture>
      <source media={WIDE} srcSet={NOTHING} />
      <img {...fig} alt="" className="dp-hero__fig" />
    </picture>
  );
}

/**
 * Draft 7, "Depth". Scroll is a fall through space, and an astronaut falls with you, the X riding on
 * its shoulder. The hero is a close-up over Earth's limb, its gold visor holding a desert at sunset
 * (Karan's reference frame, 21 Oct 2026). Then the reel, then all ten projects hung left and right
 * down a dark corridor, each with its hairline frame in the client's colour and its facts beside it
 * as real HTML. The astronaut floats beside each one, never over the words: where it floats is CSS
 * (the invisible [data-astro] slots; the hero's anchors the helmet). After the last plane it falls on
 * ahead, small and far behind the plain sections, and comes forward again at the contact gate.
 * Reduced motion, Data Saver and no-WebGL2 get a stacked page with the astronaut as still pictures.
 */
export function DepthHome() {
  const works = HOME_ORDER.map((slug) => getCaseStudy(slug)).filter((s): s is CaseStudy => Boolean(s));
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");

  // Station coordinates: 0 the hero, 1 the reel, 1.5 the section title, 2… the work, then out.
  const FIRST = 2;
  const exit = FIRST + works.length;

  const planes: DepthPlane[] = [
    { key: "reel", at: 1, kind: "reel", src: REEL.poster, w: REEL.width, h: REEL.height, accent: "#f2f1ee", side: 0, video: REEL.src },
    ...works.map(
      (s, i): DepthPlane => ({
        key: s.slug,
        at: FIRST + i,
        kind: "work",
        src: s.poster.src,
        w: s.poster.width,
        h: s.poster.height,
        accent: lift(s.theme.accent),
        side: i % 2 === 0 ? 1 : -1,
      }),
    ),
  ];

  const stops: DepthStop[] = [
    { at: 0, id: "top", label: "Intro", short: "Intro" },
    { at: 1, id: "reel", label: "Reel", short: "Reel" },
    ...works.map((s, i) => ({ at: FIRST + i, id: `case-${s.slug}`, label: s.client, short: SHORT[s.slug] ?? s.client })),
  ];

  const facts = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies" },
  ];

  return (
    <div className="d-depth">
      {/* Picks the layout, and whether this visit opens with the preloader, before the first paint
          (see mode.ts). */}
      <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT + ";" + LOADER_SCRIPT }} />
      {/* The one canvas, fixed behind the whole page (journey.tsx puts it here); outside PageFlow so
          no transformed ancestor can unpin it. */}
      <div className="dp-sky" data-sky aria-hidden />
      {/* Before the page in the tree, so its effect has set html[data-loader] when the journey's runs. */}
      <Preloader />
      <AwayFlag />
      <DepthHeader />

      <PageFlow>
        <main id="main" className="dp-main">
          <Journey planes={planes} stops={stops} exit={exit}>
            {/* ---------- 0 · The hero: the astronaut over Earth, the X on its shoulder ---------- */}
            <section id="top" className="dp-st dp-hero" data-at="0" data-kind="hero" tabIndex={-1} aria-labelledby="dp-h1">
              <HeroStill />
              <div className="dp-hero__copy" data-text>
                <p className="dp-k dp-hero__label">Design · Development · 3D</p>
                <h1 id="dp-h1" className="dp-h1">
                  <span className="dp-h1__line">Building your</span>{" "}
                  <span className="dp-h1__line">
                    tomorrow<span className="dp-stop">.</span>
                  </span>
                </h1>
                <p className="dp-hero__lead">Websites, stores and platforms, designed and built by the studio inside Digitally Next.</p>
                <div className="dp-hero__actions">
                  <SailIntro data={worldData()} variant="cta" className="dp-btn dp-btn--red dp-btn--lg" />
                  <a href="#work" className="dp-btn dp-btn--lg dp-btn--solid" data-go={FIRST}>
                    See the work <span aria-hidden>↓</span>
                  </a>
                </div>
              </div>
              {/* The astronaut's place: the helmet, and the scene hangs the body from it (scene.ts,
                  data-anchor). Wide: right of the copy. Phones: the room above the copy, which
                  .dp-hero__space is, with the bust's still standing on it until the scene is live. */}
              <div className="dp-hero__space">
                <span className="dp-astro dp-astro--hero" data-astro="0" data-anchor="helmet" aria-hidden>
                  <HeroFigure />
                </span>
              </div>
              <p className="dp-hero__cue dp-k" aria-hidden>
                <span className="dp-hero__cue-line" />
                Scroll to descend
              </p>
            </section>

            {/* ---------- 1 · The reel ---------- */}
            <section id="reel" className="dp-st dp-reel" data-at="1" data-kind="reel" tabIndex={-1} aria-labelledby="dp-reel-title">
              <div className="dp-reel__head" data-text>
                <h2 id="dp-reel-title" className="dp-reel__title">
                  Watch our showreel
                </h2>
                <p className="dp-k">
                  {REEL.length} · No sound · {REEL.summary}
                </p>
              </div>
              <div className="dp-box dp-reel__box" data-box="reel" style={{ "--ar": `${REEL.width} / ${REEL.height}`, "--arn": REEL.width / REEL.height, "--accent": "#f2f1ee" } as CSSProperties}>
                <Image src={REEL.poster} alt="" fill sizes="(min-width: 900px) 64vw, 92vw" className="dp-plate dp-cover" />
                <span className="dp-astro dp-astro--reel" data-astro="1" aria-hidden />
              </div>
              <div className="dp-reel__play">
                <ReelButton className="dp-reelbtn" />
              </div>
            </section>

            {/* ---------- (01) The work: the corridor, all ten ---------- */}
            <section id="work" className="dp-works" aria-labelledby="dp-work-title">
              <div className="dp-st dp-title" data-at={FIRST - 0.5} data-kind="title">
                <p className="dp-k">(01) The work</p>
                <h2 id="dp-work-title" className="dp-title__h">
                  Shapes we’ve taken<span className="dp-stop">.</span>
                </h2>
                <span className="dp-astro dp-astro--title" data-astro={FIRST - 0.5} aria-hidden />
              </div>

              {works.map((study, i) => {
                const side = i % 2 === 0 ? "right" : "left";
                return (
                  <article
                    key={study.slug}
                    id={`case-${study.slug}`}
                    className="dp-st dp-case"
                    data-at={FIRST + i}
                    data-kind="work"
                    data-side={side}
                    tabIndex={-1}
                    aria-labelledby={`dp-case-${study.slug}`}
                    style={{ "--accent": lift(study.theme.accent) } as CSSProperties}
                  >
                    <div
                      className="dp-box dp-case__box"
                      data-box={study.slug}
                      style={{ "--ar": `${study.poster.width} / ${study.poster.height}`, "--arn": study.poster.width / study.poster.height } as CSSProperties}
                    >
                      <Image src={study.poster.src} alt={study.poster.alt} fill sizes="(min-width: 900px) 52vw, 92vw" className="dp-plate dp-cover" />
                      <span className="dp-astro dp-astro--case" data-astro={FIRST + i} aria-hidden />
                    </div>
                    <div className="dp-case__text" data-text>
                      <p className="dp-k dp-case__meta">
                        <span className="dp-case__no">{pad(i + 1)}</span>
                        <span>{study.industry}</span>
                      </p>
                      <h3 id={`dp-case-${study.slug}`} className="dp-case__client">
                        {study.client}
                      </h3>
                      <p className="dp-case__line">{study.headline}</p>
                      <dl className="dp-metrics">
                        {study.metrics.slice(0, 2).map((m) => (
                          <div key={m.label} className="dp-metric">
                            <dt className="dp-metric__label">{m.label}</dt>
                            <dd className="dp-metric__value">{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                      <dl className="dp-spec">
                        <div className="dp-spec__row">
                          <dt className="dp-k">Stack</dt>
                          <dd>{study.platform}</dd>
                        </div>
                        <div className="dp-spec__row">
                          <dt className="dp-k">Palette</dt>
                          <dd className="dp-swatches">
                            {[study.theme.bg, study.theme.text, study.theme.accent].map((hex, k) => (
                              <span key={k} className="dp-swatch">
                                <span className="dp-swatch__chip" style={{ background: hex }} aria-hidden />
                                {hex.toUpperCase()}
                              </span>
                            ))}
                          </dd>
                        </div>
                      </dl>
                      <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dp-link" data-case-link={study.slug}>
                        View case study <span aria-hidden>→</span>
                      </FlowLink>
                    </div>
                  </article>
                );
              })}
            </section>
          </Journey>

          {/* ---------- (02) Clients and awards ---------- */}
          <section id="clients" className="dp-sec dp-clients" aria-labelledby="dp-clients-title">
            <div className="dp-sec__head">
              <p className="dp-k dp-rise">(02) Clients and awards</p>
              <h2 id="dp-clients-title" className="dp-h2 dp-rise">
                Who we’ve built for<span className="dp-stop">.</span>
              </h2>
            </div>
            <ul className="dp-logos" aria-label="Clients">
              {CLIENTS.map((client, i) => {
                const aspect = client.logo.width / client.logo.height;
                // Optical sizing: wide marks get less height, square ones more, so all weigh the same.
                const h = Math.round(Math.min(44, Math.max(16, 27 * Math.sqrt(2.4 / aspect))));
                return (
                  <li key={client.name} className="dp-logo dp-rise" style={{ "--i": i % 9 } as CSSProperties}>
                    <Image
                      src={client.logo.src}
                      alt={client.name}
                      width={client.logo.width}
                      height={client.logo.height}
                      sizes={`${Math.ceil(h * aspect * 2)}px`}
                      className="dp-logo__img"
                      style={{ height: h, width: "auto" }}
                    />
                    <span className="dp-logo__name" aria-hidden>
                      {client.name}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="dp-recog">
              <h3 className="dp-k dp-recog__k">Recognition</h3>
              <ul className="dp-recog__list">
                {RECOGNITION.map((item) => (
                  <li key={item.title} className="dp-recog__row dp-rise">
                    <span className={`dp-recog__mark${item.plate ? " dp-recog__mark--plate" : ""}`}>
                      {item.image ? (
                        <Image src={item.image.src} alt="" width={item.image.width} height={item.image.height} sizes="160px" className="dp-recog__img" />
                      ) : null}
                    </span>
                    <span className="dp-recog__title">{item.title}</span>
                    <span className="dp-recog__detail">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------- (03) Studio and services ---------- */}
          <section id="studio" className="dp-sec dp-studio" aria-labelledby="dp-studio-title">
            <div className="dp-studio__top">
              <div>
                <p className="dp-k dp-rise">(03) Studio and services</p>
                <h2 id="dp-studio-title" className="dp-h2 dp-rise">
                  One studio, six kinds of work<span className="dp-stop">.</span>
                </h2>
                <p className="dp-studio__lead dp-rise">The designers, developers and motion artists inside Digitally Next.</p>
              </div>
              <dl className="dp-facts">
                {facts.map((fact) => (
                  <div key={fact.label} className="dp-fact dp-rise">
                    <dt className="dp-fact__label">{fact.label}</dt>
                    <dd className="dp-fact__value">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ServicesStrip
              services={SERVICES.map((service) => ({
                id: service.id,
                title: service.title,
                line: service.line,
                proof: service.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
                image: `/services/${service.id}.webp`,
              }))}
            />
            <div className="dp-studio__links">
              <FlowLink href="/services" className="dp-btn">
                All services <span aria-hidden>→</span>
              </FlowLink>
              <FlowLink href="/about" className="dp-btn">
                Meet the studio <span aria-hidden>→</span>
              </FlowLink>
            </div>
          </section>
        </main>
      </PageFlow>

      {/* ---------- Contact, and the footer ---------- */}
      <footer className="dp-foot">
        <section className="dp-contact" aria-labelledby="dp-contact-title">
          <div className="dp-gate">
            <span className="dp-gate__c dp-gate__c--tl" aria-hidden />
            <span className="dp-gate__c dp-gate__c--tr" aria-hidden />
            <span className="dp-gate__c dp-gate__c--bl" aria-hidden />
            <span className="dp-gate__c dp-gate__c--br" aria-hidden />
            {/* The bottom of the well: the astronaut settles here (a still picture until the scene is live). */}
            <div className="dp-astro-gate" data-astro-contact aria-hidden>
              <Image src="/models/astronaut/gate-settled-5.webp" alt="" width={602} height={920} sizes="12rem" className="dp-astro-gate__poster" />
            </div>
            <p className="dp-k">Next</p>
            <h2 id="dp-contact-title" className="dp-contact__h">
              Have something that needs shaping<span className="dp-stop">?</span>
            </h2>
            <p className="dp-contact__line">Tell us what you’re making. We’ll take its shape.</p>
            <div className="dp-contact__actions">
              <a href={CONTACT_URL} className="dp-btn dp-btn--red dp-btn--lg">
                Start a project <span aria-hidden>↗</span>
              </a>
              <a href={CAREERS_URL} className="dp-btn dp-btn--lg dp-btn--perch">
                Join the studio <span aria-hidden>↗</span>
                {/* Where the X lands and stands, on the button's top edge (x-hop.ts). */}
                <span className="dp-x-perch" data-x-perch aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <div className="dp-foot__main">
          <div className="dp-foot__brand">
            <Image src="/brand/logo-white.png" alt="Digitally Next" width={1512} height={321} sizes="190px" className="dp-foot__logo" />
            <p className="dp-foot__about">
              The design and development studio inside Digitally Next. {FACTS.years} years, {FACTS.brands} brands, one team in {FACTS.city}.
            </p>
            <p className="dp-foot__now dp-k">
              <span className="dp-foot__dot" aria-hidden />
              {FACTS.city} <LocalTime /> IST
            </p>
          </div>
          <nav aria-label="Footer" className="dp-foot__cols">
            <div className="dp-foot__group">
              <p className="dp-k dp-foot__label" id="dp-foot-studio">
                Studio
              </p>
              <ul aria-labelledby="dp-foot-studio">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <FlowLink href={item.href} className="dp-foot__link">
                      {item.label}
                    </FlowLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="dp-foot__group">
              <p className="dp-k dp-foot__label" id="dp-foot-dn">
                Digitally Next
              </p>
              <ul aria-labelledby="dp-foot-dn">
                <li>
                  <a href={CAREERS_URL} className="dp-foot__link">
                    Careers <span aria-hidden>↗</span>
                  </a>
                </li>
                <li>
                  <a href={JOURNAL_URL} className="dp-foot__link">
                    Journal <span aria-hidden>↗</span>
                  </a>
                </li>
                <li>
                  <a href={MAIN_SITE} className="dp-foot__link">
                    Main site <span aria-hidden>↗</span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="dp-foot__group">
              <p className="dp-k dp-foot__label" id="dp-foot-follow">
                Follow
              </p>
              <ul aria-labelledby="dp-foot-follow">
                {SOCIALS.map((social) => (
                  <li key={social.href}>
                    <a href={social.href} className="dp-foot__link">
                      {social.label} <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        <FootMark />
        <div className="dp-foot__base">
          <span>© {COPYRIGHT_YEAR} Digitally Next</span>
          <a href={PRIVACY_URL} className="dp-foot__small">
            Privacy <span aria-hidden>↗</span>
          </a>
          <a href="#top" className="dp-foot__small dp-foot__top">
            Back to the surface <span aria-hidden>↑</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
