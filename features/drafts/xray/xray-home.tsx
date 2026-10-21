import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";
import { REEL, reelChapters } from "@/content/reel";
import { SERVICES } from "@/content/studio";
import type { Block, CaseStudy, Img, Theme } from "@/content/types";
import { CASE_STUDIES, getCaseStudy } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { AwayFlag } from "./away-flag";
import { Chrome } from "./chrome";
import { IstClock } from "./clock";
import { specimenFamily, specimenFontVars } from "./fonts";
import { HeroMeasure } from "./hero-measure";
import { Inspector } from "./inspector";
import { Lens } from "./lens";
import { Measure } from "./measure";
import { Counters } from "./motion";
import { Count, PadDim, SecHead, Stop, dims, fileOf, pad } from "./parts";
import { ReelScrub } from "./reel-scrub";
import { SailDoor } from "./sail-door";
import { ServiceLibrary } from "./services";
import { XSpecimen } from "./specimen";
import "./xray.css";

const LENS_SIZES = "(min-width: 1024px) 62vw, 100vw";

const THEME_TOKENS: [keyof Theme, string][] = [
  ["bg", "bg"],
  ["surface", "surface"],
  ["text", "text"],
  ["muted", "muted"],
  ["accent", "accent"],
  ["onAccent", "on accent"],
];

const allBlocks = (s: CaseStudy): Block[] => [...s.brief, ...s.design, ...s.build, ...s.outcome];

function findBlock<K extends Block["kind"]>(s: CaseStudy, kind: K): Extract<Block, { kind: K }> | undefined {
  return allBlocks(s).find((b): b is Extract<Block, { kind: K }> => b.kind === kind);
}

/** An image already described in a study's chapters, so its alt text comes from the content. */
function chapterImage(s: CaseStudy, src: string): Img | undefined {
  for (const block of allBlocks(s)) {
    const images = block.kind === "figure" ? [block.image] : block.kind === "pair" ? block.images : [];
    const hit = images.find((image) => image.src === src);
    if (hit) return hit;
  }
  return undefined;
}

/** The screen under each lens: the study's own desktop capture where its poster is a picture, not a page. */
function screenOf(s: CaseStudy): Img {
  if (s.slug === "know-your-genes") return chapterImage(s, "/work/know-your-genes/home-desktop.webp") ?? s.poster;
  return s.poster;
}

/** Logos are drawn to one optical size: a wide wordmark gets less height than a square badge. */
function logoScale(width: number, height: number) {
  const aspect = width / height;
  return Math.min(1.25, Math.max(0.5, Math.sqrt(1.8 / aspect))).toFixed(3);
}

/**
 * Draft 9, "X-Ray": the studio's work shown as it is built. A light technical drawing (paper,
 * ink, hairlines, one red) where every element carries its real measurements, an X-ray lens over
 * each flagship shows its build layer (grid, colour tokens, type, stack), and a Design / Build
 * switch flips the whole page into its blueprint. Same content and order as the live home.
 */
export function XrayHome() {
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Section numbers come from what renders, so they never skip (as on the live home).
  let n = 1;
  const moreN = standard.length ? ++n : 0;
  const clientsN = ++n;
  const studioN = ++n;

  const chapters = reelChapters().map((c) => ({ start: c.start, end: c.end, client: c.client, accent: c.accent }));

  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies" },
  ];

  const services = SERVICES.map((s) => ({
    id: s.id,
    title: s.title,
    line: s.line,
    proof: s.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
    image: `/services/${s.id}.webp`,
  }));

  return (
    <div className={`d-xray ${specimenFontVars}`}>
      <AwayFlag />
      <Chrome cols={12} />
      <Inspector />
      <Counters />

      <PageFlow>
        <main id="main" className="dx-main">
          {/* ---------- Hero ---------- */}
          <section id="top" className="dx-hero" aria-labelledby="dx-h1">
            <div className="dx-ruler12" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="dx-ruler12__c">
                  <span>{pad(i + 1)}</span>
                </span>
              ))}
            </div>
            <div className="dx-hero__meta">
              <p className="dx-hero__eyebrow" data-x="p">
                Design · Development · 3D
              </p>
              <p className="dx-hero__grid dx-k" aria-hidden>
                <span>
                  <b data-o="cols">12</b> col × <b data-o="colw">—</b> px
                </span>
                <span>
                  <b data-o="gut">—</b> gutter
                </span>
                <span>
                  <b data-o="mar">—</b> margin
                </span>
              </p>
              <p className="dx-hero__time dx-k">
                {FACTS.city} <IstClock /> IST
              </p>
            </div>

            <div className="dx-hero__type">
              <span className="dx-hd" aria-hidden>
                <span className="dx-hd__v">
                  <b data-o="w1">—</b> px · cols 01–<b data-o="span">—</b>
                </span>
              </span>
              <h1 id="dx-h1" className="dx-h1" data-x="h1">
                <span className="dx-h1__w dx-h1__w--a" data-tm="display">
                  Building
                </span>{" "}
                <span className="dx-h1__w dx-h1__w--b" data-tm="display" data-tm-quiet="">
                  your
                </span>{" "}
                <span className="dx-h1__w dx-h1__w--c" data-tm="display" data-tm-quiet="">
                  tomorrow
                  <Stop />
                </span>
                <XSpecimen />
              </h1>
              <span className="dx-hm" aria-hidden>
                <span className="dx-hm__l dx-hm__l--cap">
                  <span>
                    cap <b data-o="cap">—</b>
                  </span>
                </span>
                <span className="dx-hm__l dx-hm__l--x">
                  <span>
                    x-height <b data-o="xh">—</b>
                  </span>
                </span>
                <span className="dx-hm__l dx-hm__l--base">
                  <span>baseline</span>
                </span>
              </span>
            </div>

            <div className="dx-hero__foot">
              <p className="dx-hero__lead" data-x="p" data-tm="text">
                Websites, stores and platforms, designed and built by the studio inside Digitally Next.
              </p>
              <div className="dx-hero__act">
                <div className="dx-hero__btns">
                  <a href={CONTACT_URL} className="dx-btn dx-btn--red dx-btn--lg" data-x="a" data-mascot-wave>
                    Start a project <span aria-hidden>↗</span>
                  </a>
                  <a href="#work" className="dx-btn dx-btn--lg" data-x="a">
                    See the work <span aria-hidden>↓</span>
                  </a>
                </div>
                <SailDoor>
                  <SailIntro data={worldData()} variant="link" />
                </SailDoor>
              </div>
              <div className="dx-hero__side" aria-hidden>
              <dl className="dx-spec">
                <div>
                  <dt>Face</dt>
                  <dd>Stack Sans Headline</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>
                    <b data-o="wt">—</b>
                  </dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>
                    <b data-o="size">—</b> px
                  </dd>
                </div>
                <div>
                  <dt>Leading</dt>
                  <dd>
                    <b data-o="lead">—</b> · <b data-o="lh">—</b> px
                  </dd>
                </div>
                <div>
                  <dt>Tracking</dt>
                  <dd>
                    <b data-o="ls">—</b> px
                  </dd>
                </div>
                <div>
                  <dt>Viewport</dt>
                  <dd>
                    <b data-o="vw">—</b>
                  </dd>
                </div>
              </dl>
              <p className="dx-hero__hint dx-k">
                <span className="dx-hover">
                  Point at anything to measure it · <kbd>B</kbd> shows the build
                </span>
                <span className="dx-touch">Switch to Build to see how the page is made</span>
              </p>
              </div>
            </div>
            <HeroMeasure />
          </section>

          {/* ---------- Showreel ---------- */}
          <section id="reel" className="dx-sec dx-reelsec" aria-labelledby="dx-reel-title">
            <PadDim />
            <header className="dx-sh dx-sh--slim">
              <div className="dx-sh__rule" aria-hidden />
              <h2 id="dx-reel-title" className="dx-sh__label dx-k">
                <span className="dx-sh__no">(00)</span> Showreel
              </h2>
            </header>
            <ReelScrub
              src={REEL.src}
              poster={REEL.poster}
              width={REEL.width}
              height={REEL.height}
              duration={REEL.duration}
              length={REEL.length}
              summary={REEL.summary}
              chapters={chapters}
              play={<ReelButton className="dx-play" />}
            />
          </section>

          {/* ---------- (01) Selected work ---------- */}
          <section id="work" className="dx-sec dx-work" aria-labelledby="dx-work-title">
            <PadDim />
            <SecHead
              no="01"
              name="Selected work"
              titleId="dx-work-title"
              title={
                <>
                  Shapes we&apos;ve taken
                  <Stop />
                </>
              }
              aside={
                <p className="dx-k">
                  {pad(flagships.length)} studies · each screen has a build layer under it
                </p>
              }
            />
            <ol className="dx-flags">
              {flagships.map((s, i) => {
                const img = screenOf(s);
                const palette = findBlock(s, "palette");
                const type = findBlock(s, "typeface");
                const stack = findBlock(s, "stack");
                const descId = `dx-bl-${s.slug}`;
                return (
                  <li key={s.slug} className="dx-flag">
                    <article className="dx-flag__art" aria-labelledby={`dx-f-${s.slug}`}>
                      <p className="dx-flag__strip dx-k" aria-hidden>
                        <span className="dx-flag__n">{pad(i + 1)}</span>
                        <span>{s.industry}</span>
                        <span>{s.year}</span>
                        <span className="dx-flag__fig">
                          Fig. 1.{i + 1} · {dims(img.width, img.height)} · {fileOf(img.src)}
                        </span>
                      </p>
                      <div className="dx-flag__body">
                        <div className="dx-flag__media">
                          <Lens
                            w={img.width}
                            h={img.height}
                            label={`${s.client}: the live screen. Point at it, or focus it, to X-ray its build layer.`}
                            descId={descId}
                            intro={i === 0}
                            design={<Image src={img.src} alt={img.alt} fill sizes={LENS_SIZES} className="dx-cover" />}
                          >
                            <div className="dx-bl" style={{ "--acc": s.theme.accent } as CSSProperties}>
                              <div className="dx-bl__ghost">
                                <Image src={img.src} alt="" fill sizes={LENS_SIZES} className="dx-cover" />
                              </div>
                              <div className="dx-bl__cols">
                                {Array.from({ length: 12 }, (_, c) => (
                                  <span key={c}>
                                    <i>{c + 1}</i>
                                  </span>
                                ))}
                              </div>
                              <p className="dx-bl__head">
                                <span>Build layer</span>
                                <span>{s.client}</span>
                                <span>
                                  {s.theme.scheme} · {s.platform}
                                </span>
                              </p>
                              {type ? (
                                <div className="dx-bl__type">
                                  <span className="dx-bl__aa dx-ff" style={{ "--ff": specimenFamily(s.theme.display) } as CSSProperties}>
                                    Aa
                                  </span>
                                  <ul className="dx-bl__fams">
                                    {type.families.map((f) => (
                                      <li key={f.name}>
                                        <b
                                          className={`dx-ff${/italic/i.test(f.role) ? " dx-ff--i" : ""}`}
                                          style={{ "--ff": specimenFamily(f.font) } as CSSProperties}
                                        >
                                          {f.name}
                                        </b>
                                        <span>{f.role}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <p className="dx-bl__sample dx-ff" style={{ "--ff": specimenFamily(s.theme.display) } as CSSProperties}>
                                    {type.sample}
                                  </p>
                                </div>
                              ) : null}
                              {palette ? (
                                <div className="dx-bl__pal">
                                  <p className="dx-bl__k">
                                    {palette.heading ?? "Palette"} · {palette.colors.length}
                                  </p>
                                  <ul>
                                    {palette.colors.map((c) => (
                                      <li key={c.hex + c.name}>
                                        <i style={{ background: c.hex }} />
                                        <b>{c.name}</b>
                                        <span>{c.hex.toUpperCase()}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {stack ? (
                                <div className="dx-bl__stack">
                                  <p className="dx-bl__k">Stack · {stack.items.length}</p>
                                  <p>{stack.items.join(" · ")}</p>
                                </div>
                              ) : null}
                            </div>
                          </Lens>
                          <p className="dx-flag__hint dx-k" aria-hidden>
                            <span className="dx-hover">Point at the screen to X-ray it · hold to open it all</span>
                            <span className="dx-touch">Drag the lens · tap to move it</span>
                          </p>
                        </div>

                        <div className="dx-flag__spec">
                          <h3 id={`dx-f-${s.slug}`} className="dx-h3" data-tm="display" data-x="h3">
                            {s.client}
                          </h3>
                          <p className="dx-flag__line" data-tm="text" data-tm-quiet="" data-x="p">
                            {s.headline}
                          </p>
                          <dl className="dx-metrics">
                            {s.metrics.slice(0, 2).map((m, k) => (
                              <div key={m.label} className="dx-metric" data-x="dd">
                                <dt className="dx-metric__label">
                                  <span className="dx-k" aria-hidden>
                                    M.{k + 1}
                                  </span>{" "}
                                  {m.label}
                                </dt>
                                <dd className="dx-metric__value">
                                  <Count value={m.value} />
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <div className="dx-theme">
                            <p className="dx-k">
                              Theme · {s.theme.scheme} · <span className="dx-theme__plat">{s.platform}</span>
                            </p>
                            <ul className="dx-theme__list" aria-label={`${s.client} theme colours`}>
                              {THEME_TOKENS.map(([key, name]) => (
                                <li key={key} className="dx-theme__t">
                                  <i style={{ background: s.theme[key] }} aria-hidden />
                                  <span className="dx-theme__k">{name}</span>
                                  <b>{String(s.theme[key]).toUpperCase()}</b>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <FlowLink href={`/work/${s.slug}`} direction="deeper" className="dx-btn dx-btn--ink dx-btn--lg dx-flag__cta" data-x="a">
                            View case study <span aria-hidden>→</span>
                          </FlowLink>
                        </div>
                      </div>
                      <p id={descId} className="sr-only">
                        {`Build layer. `}
                        {palette ? `Colours: ${palette.colors.map((c) => `${c.name} ${c.hex}`).join(", ")}. ` : ""}
                        {type ? `Type: ${type.families.map((f) => `${f.name}, ${f.role}`).join("; ")}. ` : ""}
                        {stack ? `Stack: ${stack.items.join(", ")}.` : ""}
                      </p>
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---------- (02) More work ---------- */}
          {moreN ? (
            <section id="more" className="dx-sec dx-more" aria-labelledby="dx-more-title">
              <PadDim />
              <SecHead
                no={pad(moreN)}
                name="More work"
                titleId="dx-more-title"
                title={
                  <>
                    Different containers
                    <Stop />
                  </>
                }
                aside={
                  <FlowLink href="/work" className="dx-btn dx-more__top" data-x="a">
                    All work <span aria-hidden>→</span>
                  </FlowLink>
                }
              />
              <div className="dx-idx">
                <div className="dx-idx__head dx-k" aria-hidden>
                  <span>No.</span>
                  <span>Client</span>
                  <span>Industry</span>
                  <span>Platform</span>
                  <span>Year</span>
                  <span>Lead figure</span>
                </div>
                <ol className="dx-idx__rows">
                  {standard.map((study, i) => {
                    const card = toCard(study);
                    return (
                      <li key={card.slug} className="dx-idx__row">
                        <FlowLink href={`/work/${card.slug}`} direction="deeper" className="dx-idx__a" data-x="a">
                          <span className="dx-idx__no dx-k">{pad(flagships.length + i + 1)}</span>
                          <span className="dx-idx__client">
                            <b>{card.client}</b>
                            <span className="dx-idx__line">{card.headline}</span>
                          </span>
                          <span className="dx-idx__ind">{card.industry}</span>
                          <span className="dx-idx__plat">{card.platform}</span>
                          <span className="dx-idx__yr">{card.year}</span>
                          <span className="dx-idx__fig">
                            {card.metric ? (
                              <>
                                <b>
                                  <Count value={card.metric.value} />
                                </b>
                                <span>{card.metric.label}</span>
                              </>
                            ) : null}
                          </span>
                          <span className="dx-idx__go" aria-hidden>
                            →
                          </span>
                          <span className="dx-idx__pv" aria-hidden>
                            <span className="dx-idx__sw" style={{ background: card.accent }} />
                            <Image src={card.poster.src} alt="" fill sizes="(min-width: 1024px) 300px, 112px" className="dx-cover" />
                          </span>
                        </FlowLink>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <FlowLink href="/work" className="dx-btn dx-btn--lg dx-more__end" data-x="a">
                All work <span aria-hidden>→</span>
              </FlowLink>
            </section>
          ) : null}

          {/* ---------- (03) Clients and awards ---------- */}
          <section id="clients" className="dx-sec dx-clients" aria-labelledby="dx-clients-title">
            <PadDim />
            <SecHead
              no={pad(clientsN)}
              name="Clients and awards"
              titleId="dx-clients-title"
              title={
                <>
                  Who we&apos;ve built for
                  <Stop />
                </>
              }
              aside={
                <p className="dx-k dx-logos__spec" aria-hidden>
                  <span>{CLIENTS.length} marks</span>
                  <span>
                    <Measure sel=".dx-logos__grid" what="cols" /> col grid
                  </span>
                  <span>
                    cell <Measure sel=".dx-logo" what="size" /> px
                  </span>
                </p>
              }
            />
            <ul className="dx-logos__grid" aria-label="Clients">
              {CLIENTS.map((client, i) => (
                <li key={client.name} className="dx-logo" data-x="img" style={{ "--k": logoScale(client.logo.width, client.logo.height) } as CSSProperties}>
                  <span className="dx-logo__ref" aria-hidden>
                    C{pad(i + 1)}
                  </span>
                  <Image
                    src={client.logo.src}
                    alt={client.name}
                    width={client.logo.width}
                    height={client.logo.height}
                    sizes="(min-width: 1024px) 140px, 30vw"
                    className="dx-logo__img"
                  />
                  <span className="dx-logo__name" aria-hidden>
                    {client.name}
                  </span>
                </li>
              ))}
            </ul>

            <div className="dx-recog">
              <p className="dx-recog__head dx-k">
                <span>Awards and alliances</span>
                <span>R.01–R.{pad(RECOGNITION.length)}</span>
              </p>
              <ul className="dx-plates" aria-label="Awards and alliances">
                {RECOGNITION.map((item, i) => (
                  <li key={item.title} className={`dx-rp${item.featured ? " dx-rp--lead" : ""}`} data-x="li">
                    <span className="dx-rp__screw dx-rp__screw--tl" aria-hidden />
                    <span className="dx-rp__screw dx-rp__screw--tr" aria-hidden />
                    <span className="dx-rp__screw dx-rp__screw--bl" aria-hidden />
                    <span className="dx-rp__screw dx-rp__screw--br" aria-hidden />
                    <p className="dx-rp__strip dx-k" aria-hidden>
                      <span>R.{pad(i + 1)}</span>
                      {item.image ? <span>{dims(item.image.width, item.image.height)}</span> : null}
                    </p>
                    {item.image ? (
                      <div className="dx-rp__mark">
                        <Image
                          src={item.image.src}
                          alt=""
                          width={item.image.width}
                          height={item.image.height}
                          sizes={item.featured ? "(min-width: 1024px) 420px, 80vw" : "(min-width: 1024px) 240px, 60vw"}
                          className="dx-rp__img"
                        />
                      </div>
                    ) : null}
                    <p className="dx-rp__title">{item.title}</p>
                    <p className="dx-rp__detail">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------- (04) Studio and services ---------- */}
          <section id="studio" className="dx-sec dx-studio" aria-labelledby="dx-studio-title">
            <PadDim />
            <SecHead
              no={pad(studioN)}
              name="Studio and services"
              titleId="dx-studio-title"
              title={
                <>
                  One studio, six kinds of work
                  <Stop />
                </>
              }
            />
            <div className="dx-studio__top">
              <p className="dx-studio__lead" data-tm="text" data-x="p">
                The designers, developers and motion artists inside Digitally Next.
              </p>
              <dl className="dx-stats">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="dx-stat" data-x="dd">
                    <dt className="dx-stat__label">
                      <span className="dx-k" aria-hidden>
                        Q.{pad(i + 1)}
                      </span>{" "}
                      {stat.label}
                    </dt>
                    <dd className="dx-stat__value">
                      <Count value={stat.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <ServiceLibrary items={services} />
            <div className="dx-studio__links">
              <FlowLink href="/services" className="dx-btn dx-btn--lg" data-x="a">
                All services <span aria-hidden>→</span>
              </FlowLink>
              <FlowLink href="/about" className="dx-btn dx-btn--lg" data-x="a">
                Meet the studio <span aria-hidden>→</span>
              </FlowLink>
            </div>
          </section>
        </main>
      </PageFlow>

      {/* ---------- Contact and footer ---------- */}
      <footer className="dx-foot">
        <section className="dx-sec dx-cta" aria-labelledby="dx-cta-title">
          <PadDim />
          <header className="dx-sh dx-sh--slim">
            <div className="dx-sh__rule" aria-hidden />
            <p className="dx-sh__label dx-k">
              <span className="dx-sh__no">(∞)</span> Next
            </p>
          </header>
          <h2 id="dx-cta-title" className="dx-cta__title" data-tm="display" data-x="h2">
            Have something that needs shaping
            <Stop>?</Stop>
          </h2>
          <div className="dx-cta__row">
            <p className="dx-cta__lead" data-tm="text" data-x="p">
              Tell us what you&apos;re making. We&apos;ll take its shape.
            </p>
            <div className="dx-cta__btns">
              <a href={CONTACT_URL} className="dx-btn dx-btn--red dx-btn--lg" data-x="a" data-mascot-wave>
                Start a project <span aria-hidden>↗</span>
              </a>
              <a href={CAREERS_URL} className="dx-btn dx-btn--lg" data-x="a">
                Join the studio <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </section>

        <div className="dx-tb">
          <nav aria-label="Footer" className="dx-tb__cell">
            <span className="dx-tb__ref" aria-hidden>
              A1 · Pages
            </span>
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="dx-tb__link">
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dx-tb__cell">
            <span className="dx-tb__ref" aria-hidden>
              A2 · Company
            </span>
            <a href={CAREERS_URL} className="dx-tb__link">
              Careers <span aria-hidden>↗</span>
            </a>
            <a href={JOURNAL_URL} className="dx-tb__link">
              Journal <span aria-hidden>↗</span>
            </a>
            <a href={PRIVACY_URL} className="dx-tb__link">
              Privacy <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="dx-tb__cell">
            <span className="dx-tb__ref" aria-hidden>
              A3 · Social
            </span>
            {SOCIALS.map((social) => (
              <a key={social.href} href={social.href} className="dx-tb__link">
                {social.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div className="dx-tb__cell dx-tb__cell--wide">
            <span className="dx-tb__ref" aria-hidden>
              A4 · Parent
            </span>
            <a href={MAIN_SITE} className="dx-tb__link">
              Part of Digitally Next <span aria-hidden>↗</span>
            </a>
            <span className="dx-tb__copy">
              © {COPYRIGHT_YEAR} Digitally Next
            </span>
          </div>
        </div>
        <p className="dx-foot__strip dx-k" aria-hidden>
          <span>Digitally Next Design</span>
          <span>
            {FACTS.city} · <IstClock /> IST
          </span>
          <span className="dx-foot__key">
            Press <kbd>B</kbd> for the build
          </span>
        </p>
      </footer>
    </div>
  );
}
