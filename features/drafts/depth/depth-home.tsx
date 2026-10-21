import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";
import { REEL } from "@/content/reel";
import { SERVICES } from "@/content/studio";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { AwayFlag } from "./away-flag";
import { DepthHeader } from "./header";
import { Journey } from "./journey";
import { MODE_SCRIPT } from "./mode";
import { MoreWork, type MoreCard } from "./more-work";
import { ServicesStrip } from "./services-strip";
import type { DepthPlane, DepthStop } from "./types";
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

/**
 * Draft 7, "Depth". Scroll is a camera moving forward through the work: the tagline in a quiet void
 * with the X standing in it, the reel, then the four flagships hung left and right down a dark
 * corridor, each with its hairline frame in the client's colour and its facts beside it as real HTML.
 * After the last one the void closes and the rest of the home page follows as precise, plain sections.
 * Same content and order as the live home; reduced motion, Data Saver and no-WebGL2 get a stacked page.
 */
export function DepthHome() {
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Station coordinates: 0 the void, 1 the reel, 1.5 the section title, 2… the flagships, then out.
  const FIRST = 2;
  const exit = FIRST + flagships.length;

  const planes: DepthPlane[] = [
    { key: "reel", at: 1, kind: "reel", src: REEL.poster, w: REEL.width, h: REEL.height, accent: "#f2f1ee", side: 0, video: REEL.src },
    ...flagships.map(
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
    { at: 0, id: "top", label: "Intro" },
    { at: 1, id: "reel", label: "Reel" },
    ...flagships.map((s, i) => ({ at: FIRST + i, id: `case-${s.slug}`, label: s.client })),
  ];

  // Section numbers as on home: (01) is Selected work.
  let n = 1;
  const moreN = standard.length ? ++n : 0;
  const clientsN = ++n;
  const studioN = ++n;

  const more: MoreCard[] = standard.map((study, i) => {
    const card = toCard(study);
    return {
      slug: card.slug,
      no: pad(flagships.length + i + 1),
      client: card.client,
      industry: card.industry,
      accent: card.accent,
      metric: card.metric,
      poster: card.poster,
      phone: card.posterPhone ?? card.poster,
      video: card.previewVideo,
    };
  });

  const facts = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies" },
  ];

  return (
    <div className="d-depth">
      {/* Picks the layout before the first paint (see mode.ts). */}
      <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      <AwayFlag />
      <DepthHeader />

      <PageFlow>
        <main id="main" className="dp-main">
          <Journey planes={planes} stops={stops} exit={exit}>
            {/* ---------- 0 · The void: the tagline, and the X standing in it ---------- */}
            <section id="top" className="dp-st dp-hero" data-at="0" data-kind="hero" tabIndex={-1} aria-labelledby="dp-h1">
              <div className="dp-hero__copy" data-text>
                <p className="dp-k dp-hero__label">Design · Development · 3D</p>
                <h1 id="dp-h1" className="dp-h1">
                  <span className="dp-h1__line">Building your</span>{" "}
                  <span className="dp-h1__line">
                    tomorrow<span className="dp-stop">.</span>
                  </span>
                </h1>
                <div className="dp-hero__foot">
                  <p className="dp-hero__lead">Websites, stores and platforms, designed and built by the studio inside Digitally Next.</p>
                  <div className="dp-hero__actions">
                    <a href={CONTACT_URL} className="dp-btn dp-btn--red">
                      Start a project <span aria-hidden>↗</span>
                    </a>
                    <a href="#work" className="dp-btn" data-go={FIRST}>
                      See the work <span aria-hidden>↓</span>
                    </a>
                  </div>
                  <div className="dp-hero__sail">
                    <SailIntro data={worldData()} variant="link" />
                  </div>
                </div>
              </div>
              <div className="dp-xbox" data-xbox aria-hidden>
                <Image src="/models/dn-x/poster.webp" alt="" width={800} height={800} sizes="(min-width: 900px) 30vw, 40vw" className="dp-xbox__poster" />
              </div>
              <p className="dp-hero__cue dp-k" aria-hidden>
                <span className="dp-hero__cue-line" />
                Scroll to move forward
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
              </div>
              <div className="dp-reel__play">
                <ReelButton className="dp-reelbtn" />
              </div>
            </section>

            {/* ---------- (01) Selected work: the corridor ---------- */}
            <section id="work" className="dp-works" aria-labelledby="dp-work-title">
              <div className="dp-st dp-title" data-at={FIRST - 0.5} data-kind="title">
                <p className="dp-k">(01) Selected work</p>
                <h2 id="dp-work-title" className="dp-title__h">
                  Shapes we’ve taken<span className="dp-stop">.</span>
                </h2>
              </div>

              {flagships.map((study, i) => {
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

          {/* ---------- (02) More work ---------- */}
          {moreN ? (
            <section id="more" className="dp-sec dp-more" aria-labelledby="dp-more-title">
              <div className="dp-sec__head">
                <p className="dp-k dp-rise">({pad(moreN)}) More work</p>
                <h2 id="dp-more-title" className="dp-h2 dp-rise">
                  Different containers<span className="dp-stop">.</span>
                </h2>
                <FlowLink href="/work" className="dp-btn dp-sec__aside">
                  All work <span aria-hidden>→</span>
                </FlowLink>
              </div>
              <MoreWork cards={more} />
              <FlowLink href="/work" className="dp-btn dp-btn--block dp-more__all">
                All work <span aria-hidden>→</span>
              </FlowLink>
            </section>
          ) : null}

          {/* ---------- (03) Clients and awards ---------- */}
          <section id="clients" className="dp-sec dp-clients" aria-labelledby="dp-clients-title">
            <div className="dp-sec__head">
              <p className="dp-k dp-rise">({pad(clientsN)}) Clients and awards</p>
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

          {/* ---------- (04) Studio and services ---------- */}
          <section id="studio" className="dp-sec dp-studio" aria-labelledby="dp-studio-title">
            <div className="dp-studio__top">
              <div>
                <p className="dp-k dp-rise">({pad(studioN)}) Studio and services</p>
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
            <p className="dp-k">Next</p>
            <h2 id="dp-contact-title" className="dp-contact__h">
              Have something that needs shaping<span className="dp-stop">?</span>
            </h2>
            <p className="dp-contact__line">Tell us what you’re making. We’ll take its shape.</p>
            <div className="dp-contact__actions">
              <a href={CONTACT_URL} className="dp-btn dp-btn--red dp-btn--lg">
                Start a project <span aria-hidden>↗</span>
              </a>
              <a href={CAREERS_URL} className="dp-btn dp-btn--lg">
                Join the studio <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </section>

        <div className="dp-foot__grid">
          <nav aria-label="Footer" className="dp-foot__col">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="dp-foot__link">
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dp-foot__col">
            <a href={CAREERS_URL} className="dp-foot__link">
              Careers <span aria-hidden>↗</span>
            </a>
            <a href={JOURNAL_URL} className="dp-foot__link">
              Journal <span aria-hidden>↗</span>
            </a>
            <a href={PRIVACY_URL} className="dp-foot__link">
              Privacy <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="dp-foot__col">
            {SOCIALS.map((social) => (
              <a key={social.href} href={social.href} className="dp-foot__link">
                {social.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div className="dp-foot__col dp-foot__col--end">
            <a href={MAIN_SITE} className="dp-foot__link">
              Part of Digitally Next <span aria-hidden>↗</span>
            </a>
            <span className="dp-foot__copy">© {COPYRIGHT_YEAR} Digitally Next</span>
          </div>
        </div>
        <div className="dp-foot__base" aria-hidden>
          <span>Digitally Next Design</span>
          <span>{FACTS.city}</span>
        </div>
      </footer>
    </div>
  );
}
