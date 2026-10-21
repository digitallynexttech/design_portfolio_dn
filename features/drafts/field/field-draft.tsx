import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CLIENTS } from "@/content/clients";
import { REEL } from "@/content/reel";
import { RECOGNITION } from "@/content/recognition";
import { SERVICES } from "@/content/studio";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { MascotWindow } from "@/features/mascot/mascot-window";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { AwayFlag } from "./away-flag";
import { ReelStage } from "./reel-stage";
import { RowLoop } from "./row-loop";
import { ServiceIndex } from "./service-index";
import { fieldTiles, pad, PERIOD, START, toFieldStudy } from "./tiles";
import { WorkField } from "./work-field";
import "./field.css";

/** Logos drawn at one optical size: the same area whatever their shape, within the cell. */
function logoWidth(w: number, h: number) {
  const aspect = w / h;
  const height = Math.min(46, Math.max(15, Math.sqrt(2500 / aspect)));
  return Math.round(Math.min(116, height * aspect));
}

/**
 * Draft 6, "Field": the work is a space you explore. The hero is an endless, draggable field of
 * every frame of every study (and the reel), with a design tool's crosshair, rulers and selection;
 * below it the page is quiet and exact: the reel, the four flagships, the rest of the work, the
 * clients, the studio and its services, and the way to start.
 */
export function FieldDraft() {
  // The same selection and order as the home page.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");
  const studies = Object.fromEntries(clientStudies.map((s, i) => [s.slug, toFieldStudy(s, i + 1)]));
  const tiles = fieldTiles(clientStudies);

  const figures = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies" },
  ];

  return (
    <div className="d-field">
      <AwayFlag />

      <header className="df-top">
        <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="df-top__logo">
          <Image src="/brand/logo-white.png" alt="" width={1512} height={321} sizes="132px" preload className="df-top__mark" />
        </FlowLink>
        <nav aria-label="Main" className="df-top__nav">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className="df-top__link">
              {item.label}
            </FlowLink>
          ))}
          <a href={CONTACT_URL} className="df-top__link df-top__cta">
            Start a project <span aria-hidden>↗</span>
          </a>
        </nav>
      </header>

      <PageFlow>
        <main id="main" className="df-main">
          {/* ---------- Hero: the field ---------- */}
          <section className="df-hero" aria-labelledby="df-h1">
            <div className="df-copy">
              <p className="df-eyebrow">Design · Development · 3D</p>
              {/* The spaces keep the heading's accessible name as words; the lines are blocks. */}
              <h1 id="df-h1" className="df-h1">
                <span className="df-h1__line">Building your</span>{" "}
                <span className="df-h1__line">
                  tomorrow<span className="df-stop">.</span>
                </span>
              </h1>
              <p className="df-lead df-copy__lead">Websites, stores and platforms, designed and built by the studio inside Digitally Next.</p>
              <div className="df-copy__actions">
                <a href={CONTACT_URL} className="df-btn df-btn--red">
                  Start a project <span aria-hidden>↗</span>
                </a>
                <a href="#work" className="df-btn">
                  See the work <span aria-hidden>↓</span>
                </a>
              </div>
              <div className="df-copy__sail">
                <SailIntro data={worldData()} variant="link" />
              </div>
            </div>
            <WorkField
              tiles={tiles}
              studies={studies}
              period={PERIOD}
              start={START}
              reel={<ReelButton className="df-reelbtn" />}
              reelLength={REEL.length}
            />
            <div className="df-scrim" aria-hidden />
          </section>

          {/* ---------- 00 Showreel ---------- */}
          <ReelStage
            src={REEL.src}
            poster={REEL.poster}
            length={REEL.length}
            duration={REEL.duration}
            summary={REEL.summary}
            play={<ReelButton className="df-reelbtn df-reelbtn--lg" />}
          />

          {/* ---------- 01 Selected work: the four flagships ---------- */}
          <section id="work" className="df-sec df-feat" aria-labelledby="df-work-title">
            <div className="df-head df-wrap">
              <p className="df-label">
                <span className="df-num">01</span> Selected work
              </p>
              <h2 id="df-work-title" className="df-h2">
                Shapes we&apos;ve taken<span className="df-stop">.</span>
              </h2>
              <p className="df-k df-head__meta">
                <span className="df-num">{pad(flagships.length)}</span> flagships
              </p>
            </div>
            <div className="df-wrap">
              <div className="df-feat__cols" aria-hidden>
                <span>No.</span>
                <span>Frame</span>
                <span>Client</span>
                <span>The story</span>
                <span>Numbers</span>
                <span>Theme</span>
              </div>
            </div>
            <ol className="df-feat__list df-wrap">
              {flagships.map((study) => {
                const fs = studies[study.slug];
                return (
                  <li key={study.slug} className="df-feat__row" data-row style={{ "--ac": study.theme.accent } as CSSProperties}>
                    <span className="df-feat__no df-num" aria-hidden>
                      {fs.no}
                    </span>
                    <RowLoop src={fs.loop?.src} className="df-feat__media">
                      <Image
                        src={study.poster.src}
                        alt={study.poster.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, 92vw"
                        className="df-cover"
                        style={study.posterFocus ? { objectPosition: study.posterFocus } : undefined}
                      />
                    </RowLoop>
                    <div className="df-feat__id">
                      <h3 className="df-feat__client">
                        <FlowLink href={`/work/${study.slug}`} direction="deeper" className="df-feat__link">
                          {study.client}
                        </FlowLink>
                      </h3>
                      <p className="df-k">{study.industry}</p>
                    </div>
                    <p className="df-feat__headline">{study.headline}</p>
                    <dl className="df-feat__metrics">
                      {study.metrics.slice(0, 2).map((m) => (
                        <div key={m.label} className="df-feat__metric">
                          <dt className="df-feat__mlabel">{m.label}</dt>
                          <dd className="df-feat__mvalue df-num">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="df-feat__theme">
                      <p className="df-swatches">
                        <span className="df-swatch" style={{ background: study.theme.accent }} aria-hidden />
                        <span className="df-num">{study.theme.accent.toUpperCase()}</span>
                      </p>
                      <p className="df-swatches">
                        <span className="df-swatch" style={{ background: study.theme.bg }} aria-hidden />
                        <span className="df-num">{study.theme.bg.toUpperCase()}</span>
                      </p>
                      <span className="sr-only">Theme colours</span>
                    </div>
                    <span className="df-feat__go" aria-hidden>
                      View case study <span className="df-feat__arrow">→</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---------- 02 More work ---------- */}
          {standard.length ? (
            <section className="df-sec df-more" aria-labelledby="df-more-title">
              <div className="df-head df-wrap">
                <p className="df-label">
                  <span className="df-num">02</span> More work
                </p>
                <h2 id="df-more-title" className="df-h2">
                  Different containers<span className="df-stop">.</span>
                </h2>
                <FlowLink href="/work" className="df-btn df-head__btn">
                  All work <span aria-hidden>→</span>
                </FlowLink>
              </div>
              <ol className="df-more__grid df-wrap">
                {standard.map((study) => {
                  const card = toCard(study);
                  return (
                    <li key={card.slug} className="df-more__item" data-row>
                      <p className="df-more__frame df-k" aria-hidden>
                        <span className="df-num">{studies[card.slug].no}</span>
                        <span>{card.industry}</span>
                      </p>
                      <RowLoop src={card.previewVideo} className="df-more__media">
                        <Image
                          src={card.poster.src}
                          alt={card.poster.alt}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                          className="df-cover"
                          style={study.posterFocus ? { objectPosition: study.posterFocus } : undefined}
                        />
                      </RowLoop>
                      <h3 className="df-more__client">
                        <FlowLink href={`/work/${card.slug}`} direction="deeper" className="df-more__link">
                          {card.client}
                        </FlowLink>
                      </h3>
                      <p className="df-more__headline">{card.headline}</p>
                      {card.metric ? (
                        <p className="df-more__metric">
                          <span className="df-num">{card.metric.value}</span> <span className="df-more__mlabel">{card.metric.label}</span>
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              <div className="df-wrap df-more__end">
                <FlowLink href="/work" className="df-btn df-btn--block">
                  All work <span aria-hidden>→</span>
                </FlowLink>
              </div>
            </section>
          ) : null}

          {/* ---------- 03 Clients and awards ---------- */}
          <section className="df-sec df-clients" aria-labelledby="df-clients-title">
            <div className="df-head df-wrap">
              <p className="df-label">
                <span className="df-num">03</span> Clients and awards
              </p>
              <h2 id="df-clients-title" className="df-h2">
                Who we&apos;ve built for<span className="df-stop">.</span>
              </h2>
              <p className="df-k df-head__meta">
                <span className="df-num">{CLIENTS.length}</span> clients
              </p>
            </div>
            <ul className="df-logos df-wrap" aria-label="Clients">
              {CLIENTS.map((client, i) => {
                const w = logoWidth(client.logo.width, client.logo.height);
                return (
                  <li key={client.name} className="df-logo">
                    <span className="df-logo__no df-num" aria-hidden>
                      C.{pad(i + 1)}
                    </span>
                    <Image
                      src={client.logo.src}
                      alt={client.name}
                      width={client.logo.width}
                      height={client.logo.height}
                      sizes={`${w * 2}px`}
                      className="df-logo__img"
                      style={{ "--lw": `${w}px` } as CSSProperties}
                    />
                  </li>
                );
              })}
            </ul>
            <ul className="df-recog df-wrap" aria-label="Recognition">
              {RECOGNITION.map((item, i) => {
                const image = item.image;
                const badge = image ? image.width / image.height < 2 : false;
                return (
                  <li key={item.title} className="df-recog__item">
                    <span className="df-k df-num" aria-hidden>
                      R.{pad(i + 1)}
                    </span>
                    {image ? (
                      <span className={`df-recog__mark${item.plate ? " df-recog__mark--plate" : ""}${badge ? " df-recog__mark--badge" : ""}`}>
                        <Image src={image.src} alt="" width={image.width} height={image.height} sizes={badge ? "72px" : "240px"} className="df-recog__img" />
                      </span>
                    ) : null}
                    <p className="df-recog__text">
                      <span className="df-recog__title">{item.title}</span>
                      <span className="df-recog__detail">{item.detail}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---------- 04 Studio and services ---------- */}
          <section className="df-sec df-studio" aria-labelledby="df-studio-title">
            <div className="df-studio__top df-wrap">
              <div className="df-head df-head--flat">
                <p className="df-label">
                  <span className="df-num">04</span> Studio and services
                </p>
                <h2 id="df-studio-title" className="df-h2">
                  One studio, six kinds of work<span className="df-stop">.</span>
                </h2>
                <p className="df-lead df-studio__lead">The designers, developers and motion artists inside Digitally Next.</p>
              </div>
              <dl className="df-figs">
                {figures.map((f) => (
                  <div key={f.label} className="df-fig">
                    <dt className="df-fig__label">{f.label}</dt>
                    <dd className="df-fig__value df-num">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="df-wrap">
              <ServiceIndex
                services={SERVICES.map((s) => ({
                  id: s.id,
                  title: s.title,
                  line: s.line,
                  proof: s.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
                }))}
              />
              <div className="df-studio__links">
                <FlowLink href="/services" className="df-btn">
                  All services <span aria-hidden>→</span>
                </FlowLink>
                <FlowLink href="/about" className="df-btn">
                  Meet the studio <span aria-hidden>→</span>
                </FlowLink>
              </div>
            </div>
          </section>
        </main>
      </PageFlow>

      {/* ---------- Contact and footer ---------- */}
      <footer className="df-foot">
        <div className="df-foot__cta df-wrap df-rule-t">
          <p className="df-label">
            <span className="df-num">∞</span> Next
          </p>
          <div className="df-foot__row">
            <h2 className="df-foot__title">
              Have something that needs shaping<span className="df-stop">?</span>
            </h2>
            <MascotWindow className="df-mascot" bubble={null} />
          </div>
          <p className="df-lead df-foot__lead">Tell us what you&apos;re making. We&apos;ll take its shape.</p>
          <div className="df-foot__actions">
            <a href={CONTACT_URL} className="df-btn df-btn--red df-btn--lg" data-mascot-wave>
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="df-btn df-btn--lg">
              Join the studio <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        <div className="df-foot__grid df-wrap df-rule-t">
          <nav aria-label="Footer" className="df-foot__col">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="df-foot__link">
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="df-foot__col">
            <a href={CAREERS_URL} className="df-foot__link">
              Careers <span aria-hidden>↗</span>
            </a>
            <a href={JOURNAL_URL} className="df-foot__link">
              Journal <span aria-hidden>↗</span>
            </a>
            <a href={PRIVACY_URL} className="df-foot__link">
              Privacy <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="df-foot__col">
            {SOCIALS.map((social) => (
              <a key={social.href} href={social.href} className="df-foot__link">
                {social.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div className="df-foot__col df-foot__col--end">
            <a href={MAIN_SITE} className="df-foot__link">
              Part of Digitally Next <span aria-hidden>↗</span>
            </a>
            <span className="df-foot__copy">© {COPYRIGHT_YEAR} Digitally Next</span>
          </div>
        </div>
        <p className="df-foot__strip df-wrap df-rule-t" aria-hidden>
          <span>Digitally Next Design</span>
          <span>{FACTS.city}</span>
          <span className="df-num">
            Field {PERIOD.w} × {PERIOD.h} · {tiles.length} frames
          </span>
        </p>
      </footer>
    </div>
  );
}
