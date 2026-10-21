import Image from "next/image";
import type { ReactNode } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";
import { REEL, reelChapters } from "@/content/reel";
import { SERVICES } from "@/content/studio";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { AwayFlag, PowerOn, SailDoor, StudioClock } from "./chrome";
import { pad } from "./dot-engine";
import { DotDisplay } from "./dot-display";
import { FileBrowser, type FileRow } from "./file-browser";
import { ReelMonitor } from "./reel-monitor";
import { Selector, type Channel } from "./selector";
import { ServiceKeys } from "./service-keys";
import { Ticker } from "./ticker";
import { XModule } from "./x-module";
import "./signal.css";

/** A module's head: its lamp and number, its name, a hairline, and the part label at the right. */
function ModHead({ no, name, part, meta }: { no?: string; name: string; part: string; meta?: ReactNode }) {
  return (
    <div className="ds-head">
      <p className="ds-tag">
        <span className="ds-led" aria-hidden />
        {no ? <span className="ds-num">{no}</span> : null}
        <span>{name}</span>
      </p>
      <span className="ds-head__rule" aria-hidden />
      {meta ? <p className="ds-k ds-head__meta">{meta}</p> : null}
      <p className="ds-k ds-head__part" aria-hidden>
        {part}
      </p>
    </div>
  );
}

/**
 * Draft 5, "Signal": the studio as a precision instrument. A warm grey body, black ink and one red;
 * hairline seams, mono part labels and small exact keys. Its two signatures are a dot-matrix display
 * that answers the pointer, and a detented dial that turns through the flagship work.
 * Same content and order as the live home: hero, showreel, selected work, more work, clients and
 * awards, studio and services, then contact and footer.
 */
export function SignalDraft() {
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  const channels: Channel[] = flagships.map((s) => ({
    slug: s.slug,
    client: s.client,
    industry: s.industry,
    year: s.year,
    platform: s.platform,
    headline: s.headline,
    metrics: s.metrics.slice(0, 2).map(({ value, label }) => ({ value, label })),
    palette: [
      { name: "Ground", hex: s.theme.bg },
      { name: "Surface", hex: s.theme.surface },
      { name: "Text", hex: s.theme.text },
      { name: "Accent", hex: s.theme.accent },
    ],
    still: {
      src: s.poster.src,
      alt: s.poster.alt,
      width: s.poster.width,
      height: s.poster.height,
    },
    video: toCard(s).previewVideo,
  }));

  const files: FileRow[] = standard.map((s, i) => {
    const card = toCard(s);
    return {
      no: pad(flagships.length + i + 1),
      slug: card.slug,
      client: card.client,
      industry: card.industry,
      platform: card.platform,
      year: card.year,
      headline: card.headline,
      metric: card.metric,
      still: {
        src: card.poster.src,
        alt: card.poster.alt,
        width: card.poster.width,
        height: card.poster.height,
      },
      video: card.previewVideo,
    };
  });

  const chapters = reelChapters().map((c) => ({
    start: c.start,
    end: c.end,
    client: c.client,
  }));

  const services = SERVICES.map((s) => ({
    id: s.id,
    title: s.title,
    line: s.line,
    proof: s.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
    image: `/services/${s.id}.webp`,
  }));

  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies" },
  ];

  // Section numbers come from what renders, as on home: (01) is Selected work.
  let n = 1;
  const moreN = standard.length ? ++n : 0;
  const clientsN = ++n;
  const studioN = ++n;

  return (
    <div className="d-signal">
      <AwayFlag />
      <PowerOn />

      <header className="ds-top">
        <div className="ds-top__bar">
          <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="ds-top__logo">
            <Image src="/brand/logo-color.png" alt="" width={1056} height={224} sizes="120px" loading="eager" />
          </FlowLink>
          <span className="ds-top__model ds-k" aria-hidden>
            DN-01 · Design
          </span>
          <nav aria-label="Main" className="ds-top__nav">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="ds-top__link">
                {item.label}
              </FlowLink>
            ))}
            <a href={CONTACT_URL} className="ds-key ds-key--red ds-key--sm ds-top__cta">
              Start a project <span aria-hidden>↗</span>
            </a>
          </nav>
        </div>
      </header>

      <PageFlow>
        <main id="main" className="ds-main">
          {/* ---------- A · Display ---------- */}
          <section id="top" className="ds-mod ds-hero" aria-labelledby="ds-h1" data-power>
            <div className="ds-hero__bar">
              <p className="ds-tag">
                <span className="ds-led" aria-hidden />
                <span>Design · Development · 3D</span>
              </p>
              <p className="ds-k ds-hero__clock">
                {FACTS.city} <StudioClock /> IST
              </p>
            </div>

            <div className="ds-hero__face">
              <DotDisplay words={["Building", "your", "tomorrow."]} accentTail="." meta="A1 · Display" className="ds-hero__display">
                <h1 id="ds-h1" className="ds-h1">
                  Building your tomorrow<span className="ds-red">.</span>
                </h1>
              </DotDisplay>

              <div className="ds-hero__x">
                <p className="ds-k ds-hero__xlabel" aria-hidden>
                  <span>A2 · DN-X</span>
                  <span>3D</span>
                </p>
                <div className="ds-hero__xwell">
                  <XModule />
                </div>
                <p className="ds-k ds-hero__xhint" aria-hidden>
                  Hover to wave · Press to spin
                </p>
              </div>
            </div>

            <div className="ds-hero__foot">
              <p className="ds-lead ds-hero__lead">
                Websites, stores and platforms, designed and built by the studio inside Digitally Next.
              </p>
              <div className="ds-hero__actions">
                <div className="ds-hero__keys">
                  <a href={CONTACT_URL} className="ds-key ds-key--red ds-key--lg" data-mascot-wave>
                    Start a project <span aria-hidden>↗</span>
                  </a>
                  <a href="#work" className="ds-key ds-key--lg">
                    See the work <span aria-hidden>↓</span>
                  </a>
                </div>
                <SailDoor className="ds-sail">
                  <SailIntro data={worldData()} variant="link" />
                </SailDoor>
              </div>
            </div>
          </section>

          {/* ---------- B · Monitor: the showreel ---------- */}
          <section className="ds-mod ds-reelmod" aria-labelledby="ds-reel-title" data-power>
            <ModHead name="Showreel" part="B · Monitor" meta={`${REEL.length} · No sound`} />
            <div className="ds-reelmod__grid">
              <h2 id="ds-reel-title" className="ds-h2 ds-reelmod__title">
                {REEL.summary}
                <span className="ds-red">.</span>
              </h2>
              <ReelMonitor
                size={`${REEL.width} × ${REEL.height}`}
                src={REEL.src}
                poster={REEL.poster}
                length={REEL.length}
                duration={REEL.duration}
                chapters={chapters}
                play={<ReelButton />}
              />
            </div>
          </section>

          {/* ---------- C · Selector: (01) Selected work ---------- */}
          <section id="work" className="ds-mod ds-work" aria-labelledby="ds-work-title" data-power>
            <ModHead no="01" name="Selected work" part="C · Selector" meta={`${pad(flagships.length)} channels`} />
            <h2 id="ds-work-title" className="ds-h2">
              Shapes we’ve taken<span className="ds-red">.</span>
            </h2>
            <Selector channels={channels} />
            <noscript>
              <ul className="ds-noscript">
                {flagships.map((s) => (
                  <li key={s.slug}>
                    <a href={`/work/${s.slug}`}>
                      {s.client}: {s.headline}
                    </a>
                  </li>
                ))}
              </ul>
            </noscript>
          </section>

          {/* ---------- D · Files: (02) More work ---------- */}
          {moreN ? (
            <section id="more" className="ds-mod ds-more" aria-labelledby="ds-more-title" data-power>
              <ModHead no={pad(moreN)} name="More work" part="D · Files" />
              <div className="ds-headrow">
                <h2 id="ds-more-title" className="ds-h2">
                  Different containers<span className="ds-red">.</span>
                </h2>
                <FlowLink href="/work" className="ds-key ds-key--lg ds-headrow__key">
                  All work <span aria-hidden>→</span>
                </FlowLink>
              </div>
              <FileBrowser rows={files} />
              <FlowLink href="/work" className="ds-key ds-key--lg ds-key--block ds-more__all">
                All work <span aria-hidden>→</span>
              </FlowLink>
            </section>
          ) : null}

          {/* ---------- E · Ticker and plates: (03) Clients and awards ---------- */}
          <section id="clients" className="ds-mod ds-clients" aria-labelledby="ds-clients-title" data-power>
            <ModHead no={pad(clientsN)} name="Clients and awards" part="E · Ticker" />
            <h2 id="ds-clients-title" className="ds-h2">
              Who we’ve built for<span className="ds-red">.</span>
            </h2>
            <Ticker clients={CLIENTS.map((c) => ({ name: c.name, ...c.logo }))} />

            <div className="ds-plates">
              <p className="ds-k ds-plates__head">Recognition</p>
              <ul className="ds-plates__list" aria-label="Recognition">
                {RECOGNITION.map((item, i) => {
                  const image = item.image;
                  // A near-square award badge stands tall; wordmarks sit on one line.
                  const badge = image ? image.width / image.height < 1.2 : false;
                  return (
                    <li key={item.title} className={`ds-plate${item.featured ? " ds-plate--lead" : ""}`}>
                      <span className="ds-plate__screw ds-plate__screw--a" aria-hidden />
                      <span className="ds-plate__screw ds-plate__screw--b" aria-hidden />
                      <p className="ds-k ds-num ds-plate__no" aria-hidden>
                        R.{pad(i + 1)}
                      </p>
                      {image ? (
                        <span className={`ds-plate__mark${badge ? " ds-plate__mark--badge" : ""}`}>
                          <Image
                            src={image.src}
                            alt=""
                            width={image.width}
                            height={image.height}
                            sizes={badge ? "80px" : "(min-width: 1024px) 320px, 70vw"}
                          />
                        </span>
                      ) : null}
                      <p className="ds-plate__title">{item.title}</p>
                      <p className="ds-plate__detail">{item.detail}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* ---------- F · Keys: (04) Studio and services ---------- */}
          <section id="studio" className="ds-mod ds-studio" aria-labelledby="ds-studio-title" data-power>
            <ModHead no={pad(studioN)} name="Studio and services" part="F · Keys" />
            <div className="ds-studio__top">
              <div className="ds-studio__intro">
                <h2 id="ds-studio-title" className="ds-h2">
                  One studio, six kinds of work<span className="ds-red">.</span>
                </h2>
                <p className="ds-lead">The designers, developers and motion artists inside Digitally Next.</p>
              </div>
              <dl className="ds-stats">
                {stats.map((s, i) => (
                  <div key={s.label} className="ds-stat">
                    <dt className="ds-stat__label">
                      <span className="ds-k ds-num" aria-hidden>
                        Q.{pad(i + 1)}
                      </span>
                      {s.label}
                    </dt>
                    <dd className="ds-stat__value">
                      <DotDisplay
                        words={[s.value]}
                        accentTail={s.value.endsWith("+") ? "+" : undefined}
                        justify="center"
                        className="ds-stat__display"
                      >
                        <span className="ds-stat__text ds-num">{s.value}</span>
                      </DotDisplay>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <ServiceKeys services={services} />

            <div className="ds-studio__links">
              <FlowLink href="/services" className="ds-key ds-key--lg">
                All services <span aria-hidden>→</span>
              </FlowLink>
              <FlowLink href="/about" className="ds-key ds-key--lg">
                Meet the studio <span aria-hidden>→</span>
              </FlowLink>
            </div>
          </section>
        </main>
      </PageFlow>

      {/* ---------- G · Output: contact and footer ---------- */}
      <footer className="ds-foot">
        <section className="ds-mod ds-contact" aria-labelledby="ds-contact-title" data-power>
          <ModHead name="Contact" part="G · Output" />
          <h2 id="ds-contact-title" className="ds-contact__title">
            Have something that needs shaping<span className="ds-red">?</span>
          </h2>
          <div className="ds-contact__row">
            <p className="ds-lead">Tell us what you’re making. We’ll take its shape.</p>
            <div className="ds-contact__keys">
              <a href={CONTACT_URL} className="ds-key ds-key--red ds-key--xl" data-mascot-wave>
                Start a project <span aria-hidden>↗</span>
              </a>
              <a href={CAREERS_URL} className="ds-key ds-key--xl">
                Join the studio <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </section>

        <div className="ds-plate-foot">
          <nav aria-label="Footer" className="ds-plate-foot__cell">
            <p className="ds-k" aria-hidden>
              H1 · Site
            </p>
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="ds-plate-foot__link">
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="ds-plate-foot__cell">
            <p className="ds-k" aria-hidden>
              H2 · Company
            </p>
            <a href={CAREERS_URL} className="ds-plate-foot__link">
              Careers <span aria-hidden>↗</span>
            </a>
            <a href={JOURNAL_URL} className="ds-plate-foot__link">
              Journal <span aria-hidden>↗</span>
            </a>
            <a href={PRIVACY_URL} className="ds-plate-foot__link">
              Privacy <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="ds-plate-foot__cell">
            <p className="ds-k" aria-hidden>
              H3 · Social
            </p>
            {SOCIALS.map((s) => (
              <a key={s.href} href={s.href} className="ds-plate-foot__link">
                {s.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div className="ds-plate-foot__cell ds-plate-foot__cell--end">
            <p className="ds-k" aria-hidden>
              H4 · Parent
            </p>
            <a href={MAIN_SITE} className="ds-plate-foot__link">
              Part of Digitally Next <span aria-hidden>↗</span>
            </a>
            <p className="ds-plate-foot__copy">© {COPYRIGHT_YEAR} Digitally Next</p>
          </div>
        </div>
        <p className="ds-foot__strip ds-k" aria-hidden>
          <span>DN-01</span>
          <span>Digitally Next Design</span>
          <span>{FACTS.city}</span>
          <span className="ds-num">{COPYRIGHT_YEAR}</span>
        </p>
      </footer>
    </div>
  );
}
