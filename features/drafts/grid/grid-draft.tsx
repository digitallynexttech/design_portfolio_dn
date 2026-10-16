import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { PageFlow } from "@/components/ui/page-flow";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";
import { SERVICES, STUDIO_PHOTOS } from "@/content/studio";
import { TEAM, creditsFor } from "@/content/team";
import type { CaseStudy, Img, Testimonial } from "@/content/types";
import { CASE_STUDIES, getCaseStudy, visibleTestimonial } from "@/content/work";
import { toCard } from "@/content/work/cards";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { LocalTime, MeasureTitle, SheetChrome, type SheetRef } from "./chrome";
import { gridMono, gridSans } from "./fonts";
import { HeroWave } from "./hero-wave";
import { IndexTable, type IndexRow } from "./index-table";
import { AfterPaint } from "./after-paint";
import { AwayFlag } from "./away-flag";
import { LogoParts } from "./logo-parts";
import { LoopVideo } from "./loop-video";
import { Balloon, Fig, SheetHead, pad } from "./parts";
import { Ripples } from "./ripples";
import { SailDoor } from "./sail-door";
import "./grid.css";

// New Delhi, the studio's city, as the drawing's datum.
const DATUM = "28.6139° N  77.2090° E";

/** "Founder, Happy Ganga" when the name only restates the company; otherwise "Name, Role" (as on home). */
function attribution(t: Testimonial) {
  return t.name.includes(t.company) ? `${t.role}, ${t.company}` : `${t.name}, ${t.role}`;
}

/** An image already described in a study's chapters, so its alt text comes from the content. */
function chapterImage(study: CaseStudy, src: string): Img | undefined {
  for (const block of [...study.brief, ...study.design, ...study.build, ...study.outcome]) {
    const images = block.kind === "figure" ? [block.image] : block.kind === "pair" ? block.images : [];
    const hit = images.find((image) => image.src === src);
    if (hit) return hit;
  }
  return undefined;
}

type Media =
  | { kind: "video"; src: string; poster: string; w: number; h: number }
  | { kind: "image"; img: Img };

/**
 * What each flagship sheet shows: its real motion (the 5-second loop recorded from the live site)
 * or its real screen, and a second plate - the phone screen, or for SKELMET the 3D hero itself.
 */
function sheetMedia(study: CaseStudy): { main: Media; detail?: { img: Img; note: string; contain?: boolean } } {
  const loop = (slug: string): Media => ({
    kind: "video",
    src: `/work/${slug}/preview.mp4`,
    poster: `/work/${slug}/preview-poster.webp`,
    w: 640,
    h: 360,
  });
  const phone = (src: string) => chapterImage(study, src);
  switch (study.slug) {
    case "skelmet":
      return {
        main: loop("skelmet"),
        detail: {
          img: { src: "/work/skelmet/hero-poster.webp", alt: "The SKELMET flame skull, as rendered for the site's 3D hero", width: 1008, height: 1260 },
          note: "3D hero",
          contain: true,
        },
      };
    case "know-your-genes": {
      const img = phone("/work/know-your-genes/meet-genee-phone.webp");
      return { main: loop("know-your-genes"), detail: img ? { img, note: "Phone" } : undefined };
    }
    case "hard2soft": {
      const img = phone("/work/hard2soft/symptom-check-phone.webp");
      return { main: loop("hard2soft"), detail: img ? { img, note: "Phone" } : undefined };
    }
    case "dnms": {
      const img = phone("/work/dnms/phone-dashboard.webp");
      return { main: { kind: "image", img: study.poster }, detail: img ? { img, note: "Phone" } : undefined };
    }
    default:
      return { main: { kind: "image", img: study.poster } };
  }
}

export function GridDraft() {
  // The same selection and order as the home page.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Client voices: the home page's rule exactly (never repeat a voice, skip our own).
  const heard = new Set(flagships.flatMap((s) => visibleTestimonial(s.testimonial)?.company ?? []));
  heard.add("Digitally Next");
  const voices = standard.flatMap((study) => {
    const t = visibleTestimonial(study.testimonial);
    if (!t || heard.has(t.company)) return [];
    heard.add(t.company);
    return [{ study, t }];
  });

  const makers = TEAM.filter((p) => p.group !== "Studio").map((p) => ({
    ...p,
    shipped: creditsFor(p.id)
      .filter((s) => s.slug !== "making-of")
      .map((s) => s.client),
  }));

  // Sheet numbers come from what renders, so they never skip (as on home).
  let n = 2;
  const moreN = standard.length ? ++n : 0;
  const servicesN = ++n;
  const voicesN = voices.length ? ++n : 0;
  const peopleN = ++n;

  const sheets: SheetRef[] = [
    { id: "top", no: "00", name: "Title" },
    { id: "studio", no: "01", name: "The studio" },
    { id: "work", no: "02", name: "Selected work" },
    ...(moreN ? [{ id: "more", no: pad(moreN), name: "More work" }] : []),
    { id: "services", no: pad(servicesN), name: "How we adapt" },
    ...(voicesN ? [{ id: "voices", no: pad(voicesN), name: "Clients" }] : []),
    { id: "people", no: pad(peopleN), name: "The people" },
  ];

  // Studies are numbered once, 01 onwards, and keep that number wherever they are cited.
  const studyNo = new Map(clientStudies.map((s, i) => [s.slug, pad(i + 1)]));

  const indexRows: IndexRow[] = standard.map((study) => {
    const card = toCard(study);
    return {
      no: studyNo.get(study.slug) ?? "",
      slug: card.slug,
      client: card.client,
      industry: card.industry,
      platform: card.platform,
      headline: card.headline,
      metric: card.metric,
      poster: card.poster,
      video: card.previewVideo ? { src: card.previewVideo, poster: `/work/${card.slug}/preview-poster.webp`, width: 640, height: 360 } : undefined,
    };
  });

  // The matrix's columns: every study that proves a service, in site order.
  const proofSlugs = new Set(SERVICES.flatMap((s) => s.proof));
  const proofCols = clientStudies.filter((s) => proofSlugs.has(s.slug));

  const recognition = RECOGNITION.filter((item) => item.featured && item.image);
  const team = STUDIO_PHOTOS[0];
  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies, told in full" },
  ];

  return (
    <div className={`d-grid ${gridSans.variable} ${gridMono.variable}`}>
      <AwayFlag />
      <SheetChrome sheets={sheets} />
      <Ripples />

      <PageFlow>
        <main id="main" className="dg-main">
          {/* ---------- 00 Title ---------- */}
          <section id="top" data-sheet className="dg-sec dg-hero" aria-labelledby="dg-h1">
            <div className="dg-meta" aria-hidden>
              <span className="dg-meta__cell">Digitally Next Design</span>
              <span className="dg-meta__cell">Sheet 00 · Title</span>
              <span className="dg-meta__cell dg-meta__cell--datum">
                {FACTS.city} · <span className="dg-num">{DATUM}</span>
              </span>
              <span className="dg-meta__cell dg-meta__cell--time">
                IST <LocalTime />
              </span>
              <span className="dg-meta__cell dg-meta__cell--spec dg-gridspec" />
            </div>
            <div className="dg-ruler dg-g" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i}>{pad(i + 1)}</span>
              ))}
            </div>

            <div className="dg-hero__title">
              <div className="dg-hero__fit">
                <p className="dg-measure" aria-hidden>
                  <span className="dg-measure__v">
                    W <MeasureTitle /> px
                  </span>
                </p>
                <div className="dg-hero__type">
                  <h1 id="dg-h1" className="dg-h1">
                    <span className="dg-h1__text">We are water.</span>
                  </h1>
                  <HeroWave />
                  <span className="dg-h1 dg-h1__outline" aria-hidden>
                    <span>We are water.</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="dg-hero__body dg-g">
              <ol className="dg-specs">
                <li className="dg-spec">
                  <span className="dg-spec__no dg-num" aria-hidden>
                    1.1
                  </span>
                  <p className="dg-spec__lead">Pour us into anything.</p>
                </li>
                <li className="dg-spec">
                  <span className="dg-spec__no dg-num" aria-hidden>
                    1.2
                  </span>
                  <p className="dg-spec__text">Soft enough to take any shape. Relentless enough to carve canyons.</p>
                </li>
              </ol>

              <div className="dg-abstract">
                <p className="dg-k">Abstract</p>
                <p className="dg-abstract__text">
                  Digitally Next - design, development and 3D, from New Delhi. Our work is a small sea of islands: sail it, or
                  scroll for the work.
                </p>
                <div className="dg-cmds">
                  <SailDoor>
                    <SailIntro data={worldData()} />
                  </SailDoor>
                  <div className="dg-cmds__row">
                    <div className="dg-reel">
                      <ReelButton />
                    </div>
                    <a href="#work" className="dg-down">
                      See the work <span aria-hidden>↓</span>
                    </a>
                  </div>
                </div>
              </div>

              <Fig no="1" note="The world, one frame" w={1920} h={1080} className="dg-hero__fig">
                <AfterPaint>
                  <Image src="/world/poster.webp" alt="" fill sizes="(min-width: 1024px) 30vw, 92vw" className="dg-cover dg-develop" />
                </AfterPaint>
                <noscript>
                  <Image src="/world/poster.webp" alt="" fill sizes="(min-width: 1024px) 30vw, 92vw" className="dg-cover" />
                </noscript>
              </Fig>
            </div>
          </section>

          {/* ---------- 01 The studio ---------- */}
          <section id="studio" data-sheet className="dg-sec dg-cv dg-studio" aria-labelledby="dg-studio-title">
            <SheetHead
              no="01"
              name="The studio"
              titleId="dg-studio-title"
              className="dg-head--statement"
              title="We are the designers, developers and motion artists inside Digitally Next."
              aside={<p className="dg-sub">Every client is a different container. We take its shape.</p>}
            />

            <dl className="dg-stats">
              {stats.map((stat, i) => (
                <div key={stat.label} className="dg-stat">
                  <dt className="dg-stat__label">{stat.label}</dt>
                  <dd className="dg-stat__value">
                    <span className="dg-k dg-num" aria-hidden>
                      Q.{pad(i + 1)}
                    </span>
                    <span className="dg-stat__fig dg-num">{stat.value}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="dg-parts">
              <div className="dg-parts__head">
                <p className="dg-k dg-k--ink">Trusted by</p>
                <p className="dg-k dg-num" aria-hidden>
                  C01–C{pad(CLIENTS.length)}
                </p>
              </div>
              <LogoParts
                parts={CLIENTS.map((client) => {
                  const aspect = client.logo.width / client.logo.height;
                  const k = Math.sqrt(2.6 / aspect);
                  // Drawn at most 2.25rem tall: as wide as that height times the aspect ratio.
                  const w = Math.ceil(aspect * Math.min(2.25, Math.max(1.05, k * 1.55)) * 16);
                  return { name: client.name, ...client.logo, sizes: `${w}px`, k: k.toFixed(3) };
                })}
              />
            </div>

            <div className="dg-recog">
              <p className="dg-k dg-k--ink">Recognition</p>
              <ul className="dg-recog__list" aria-label="Recognition">
                {recognition.map((item, i) => {
                  const image = item.image!;
                  const badge = image.width / image.height < 2;
                  return (
                    <li key={item.title} className={`dg-recog__item${badge ? " dg-recog__item--badge" : ""}`}>
                      <span className="dg-k dg-num" aria-hidden>
                        R.{pad(i + 1)}
                      </span>
                      <Image
                        src={image.src}
                        alt=""
                        width={image.width}
                        height={image.height}
                        sizes={badge ? "64px" : "(min-width: 768px) 336px, 240px"}
                        className="dg-recog__mark"
                      />
                      <p className="dg-recog__text">
                        <span className="dg-recog__title">{item.title}</span>
                        <span className="dg-recog__detail">{item.detail}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* ---------- 02 Selected work ---------- */}
          <section id="work" data-sheet className="dg-sec dg-cv dg-work" aria-labelledby="dg-work-title">
            <SheetHead
              no="02"
              name="Selected work"
              titleId="dg-work-title"
              title="Shapes we’ve taken."
              aside={
                <p className="dg-k dg-num">
                  {flagships.length} sheets · No. 01–{pad(flagships.length)}
                </p>
              }
            />
            <ol className="dg-sheets">
              {flagships.map((study, i) => {
                const no = studyNo.get(study.slug) ?? pad(i + 1);
                const t = visibleTestimonial(study.testimonial);
                const media = sheetMedia(study);
                const fig = `2.${i + 1}`;
                return (
                  <li key={study.slug} className="dg-sheet" style={{ "--z": i + 1 } as CSSProperties}>
                    <article className="dg-sheet__paper" aria-labelledby={`dg-sheet-${study.slug}`}>
                      <dl className="dg-bar">
                        <div className="dg-bar__cell dg-bar__cell--no">
                          <dt className="dg-k">No.</dt>
                          <dd className="dg-num">{no}</dd>
                        </div>
                        <div className="dg-bar__cell dg-bar__cell--ind">
                          <dt className="dg-k">Industry</dt>
                          <dd>{study.industry}</dd>
                        </div>
                        <div className="dg-bar__cell">
                          <dt className="dg-k">Year</dt>
                          <dd className="dg-num">{study.year}</dd>
                        </div>
                        <div className="dg-bar__cell dg-bar__cell--stack">
                          <dt className="dg-k">Stack</dt>
                          <dd>{study.platform}</dd>
                        </div>
                        <div className="dg-bar__cell dg-bar__cell--disc">
                          <dt className="dg-k">Disciplines</dt>
                          <dd>{study.disciplines.join(" · ")}</dd>
                        </div>
                        <div className="dg-bar__cell dg-bar__cell--accent">
                          <dt className="dg-k">Accent</dt>
                          <dd className="dg-num">
                            <span className="dg-swatch" style={{ background: study.theme.accent }} aria-hidden />
                            {study.theme.accent.toUpperCase()}
                          </dd>
                        </div>
                      </dl>

                      <div className="dg-sheet__body">
                        {media.main.kind === "video" ? (
                          <Fig no={`${fig}a`} note="Preview loop" w={media.main.w} h={media.main.h} className="dg-sheet__main">
                            <LoopVideo src={media.main.src} poster={media.main.poster} className="dg-cover" />
                          </Fig>
                        ) : (
                          <Fig no={`${fig}a`} note="Screen" w={media.main.img.width} h={media.main.img.height} className="dg-sheet__main">
                            <Image src={media.main.img.src} alt={media.main.img.alt} fill sizes="(min-width: 1024px) 44vw, 92vw" className="dg-cover dg-cover--top" />
                          </Fig>
                        )}
                        {media.detail ? (
                          <Fig
                            no={`${fig}b`}
                            note={media.detail.note}
                            w={media.detail.img.width}
                            h={media.detail.img.height}
                            ratio="10 / 17"
                            measure="width"
                            className="dg-sheet__detail"
                            frameClass={media.detail.contain ? "dg-frame--plate" : ""}
                          >
                            <Image
                              src={media.detail.img.src}
                              alt={media.detail.img.alt}
                              fill
                              sizes="(min-width: 1280px) 13vw, 36vw"
                              className={media.detail.contain ? "dg-contain" : "dg-cover dg-cover--top"}
                            />
                          </Fig>
                        ) : null}

                        <div className="dg-sheet__spec">
                          <h3 id={`dg-sheet-${study.slug}`} className="dg-h3">
                            {study.client}
                          </h3>
                          <p className="dg-sheet__line">{study.headline}</p>
                          <dl className="dg-metrics">
                            {study.metrics.map((m, k) => (
                              <div key={m.label} className="dg-metric">
                                <dt className="dg-metric__label">
                                  <span className="dg-k dg-num" aria-hidden>
                                    M.{k + 1}
                                  </span>
                                  {m.label}
                                </dt>
                                <dd className="dg-metric__value dg-num">{m.value}</dd>
                              </div>
                            ))}
                          </dl>
                          {t ? (
                            <figure className="dg-quote">
                              <blockquote>“{t.quote}”</blockquote>
                              <figcaption className="dg-k">{attribution(t)}</figcaption>
                            </figure>
                          ) : null}
                          <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dg-btn dg-btn--ink dg-btn--lg dg-sheet__cta">
                            View case study <span aria-hidden>→</span>
                          </FlowLink>
                        </div>
                      </div>
                      {/* The drawing's title strip, at the foot of each pinned sheet. */}
                      <p className="dg-sheet__foot" aria-hidden>
                        <span className="dg-num">
                          Sheet 2.{i + 1} of 2.{flagships.length}
                        </span>
                        <span>{study.client}</span>
                        <span className="dg-sheet__leader" />
                        <span>{flagships[i + 1] ? `Next · ${flagships[i + 1].client} ↓` : "End of set"}</span>
                      </p>
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---------- 03 More work ---------- */}
          {moreN ? (
            <section id="more" data-sheet className="dg-sec dg-cv dg-more" aria-labelledby="dg-more-title">
              <SheetHead
                no={pad(moreN)}
                name="More work"
                titleId="dg-more-title"
                title="Different containers."
                aside={
                  <FlowLink href="/work" className="dg-btn dg-more__all-top">
                    All work <span aria-hidden>→</span>
                  </FlowLink>
                }
              />
              <IndexTable rows={indexRows} />
              <FlowLink href="/work" className="dg-btn dg-btn--lg dg-btn--block dg-more__all-end">
                All work <span aria-hidden>→</span>
              </FlowLink>
            </section>
          ) : null}

          {/* ---------- 04 How we adapt ---------- */}
          <section id="services" data-sheet className="dg-sec dg-services" aria-labelledby="dg-services-title">
            <SheetHead
              no={pad(servicesN)}
              name="How we adapt"
              titleId="dg-services-title"
              title="Six kinds of work, one studio."
              aside={
                <p className="dg-k dg-num">
                  {SERVICES.length} × {proofCols.length} matrix
                </p>
              }
            />

            {/* Wide screens: service × proof, as a matrix. */}
            <div className="dg-matrix-wrap">
              <table className="dg-matrix">
                <caption className="sr-only">Services, and the case studies that prove each one</caption>
                <thead>
                  <tr>
                    <th scope="col" className="dg-matrix__corner">
                      <span className="dg-k">Service</span>
                      <span className="dg-k" aria-hidden>
                        Proof →
                      </span>
                    </th>
                    {proofCols.map((study, c) => (
                      <th key={study.slug} scope="col" className="dg-matrix__col" data-c={c}>
                        <span className="dg-matrix__colno dg-num" aria-hidden>
                          {studyNo.get(study.slug)}
                        </span>
                        <span className="dg-matrix__colname">{study.client}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((service, i) => (
                    <tr key={service.id}>
                      <th scope="row" className="dg-matrix__svc">
                        <span className="dg-matrix__plate">
                          <Image src={`/services/${service.id}.webp`} alt="" fill sizes="(min-width: 1024px) 120px, 1px" className="dg-cover" />
                        </span>
                        <span className="dg-matrix__sno dg-num" aria-hidden>
                          S.{i + 1}
                        </span>
                        <span className="dg-matrix__text">
                          <FlowLink href={`/services#${service.id}`} className="dg-matrix__title">
                            {service.title}
                          </FlowLink>
                          <span className="dg-matrix__line">{service.line}</span>
                        </span>
                      </th>
                      {proofCols.map((study, c) => {
                        const proves = service.proof.includes(study.slug);
                        return (
                          <td key={study.slug} data-c={c} className="dg-matrix__cell">
                            {proves ? (
                              <>
                                <span className="dg-dot" aria-hidden />
                                <span className="sr-only">Proof</span>
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Narrow screens: one record per service. */}
            <ol className="dg-svcs">
              {SERVICES.map((service, i) => {
                const proof = service.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []);
                return (
                  <li key={service.id} className="dg-svc">
                    <span className="dg-svc__plate">
                      <Image src={`/services/${service.id}.webp`} alt="" fill sizes="(max-width: 1023px) 30vw, 1px" className="dg-cover" />
                    </span>
                    <div className="dg-svc__text">
                      <p className="dg-k dg-num" aria-hidden>
                        S.{i + 1}
                      </p>
                      <h3 className="dg-svc__title">
                        <FlowLink href={`/services#${service.id}`} className="dg-svc__link">
                          {service.title}
                        </FlowLink>
                      </h3>
                      <p className="dg-svc__line">{service.line}</p>
                      {proof.length ? (
                        <p className="dg-svc__proof">
                          <span className="sr-only">Proof: </span>
                          {proof.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---------- 05 Client voices (only when a quote may be shown) ---------- */}
          {voicesN ? (
            <section id="voices" data-sheet className="dg-sec dg-voices" aria-labelledby="dg-voices-title">
              <SheetHead no={pad(voicesN)} name="Clients" titleId="dg-voices-title" title="In their words." />
              <ol className="dg-voices__list">
                {voices.map(({ study, t }, i) => (
                  <li key={study.slug} className="dg-voice">
                    <span className="dg-k dg-num" aria-hidden>
                      V.{pad(i + 1)}
                    </span>
                    {t.approved ? null : <p className="dg-voice__draft dg-k">Draft · awaiting approval</p>}
                    <figure className="dg-voice__fig">
                      <blockquote className="dg-voice__quote">“{t.quote}”</blockquote>
                      <figcaption className="dg-voice__by">{attribution(t)}</figcaption>
                    </figure>
                    <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dg-textlink">
                      Read the {study.client} story <span aria-hidden>→</span>
                    </FlowLink>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* ---------- 06 The people ---------- */}
          <section id="people" data-sheet className="dg-sec dg-cv dg-people" aria-labelledby="dg-people-title">
            <SheetHead no={pad(peopleN)} name="The people" titleId="dg-people-title" title="Who poured it." />
            <div className="dg-people__top dg-g">
              <Fig no={String(peopleN)} note="The studio" w={team.width} h={team.height} className="dg-people__fig">
                <Image src={team.src} alt={team.alt} fill sizes="(min-width: 1024px) 60vw, 92vw" className="dg-cover" />
              </Fig>
              <div className="dg-people__side">
                <p className="dg-k dg-k--ink">Credits</p>
                <p className="dg-people__count dg-num" aria-hidden>
                  {pad(makers.length)}
                </p>
                <p className="dg-k" aria-hidden>
                  Makers
                </p>
                <FlowLink href="/about" className="dg-btn dg-btn--ink dg-btn--lg">
                  Meet the studio <span aria-hidden>→</span>
                </FlowLink>
              </div>
            </div>
            <div className="dg-credits">
              <div className="dg-credits__head" aria-hidden>
                <span>No.</span>
                <span>Name</span>
                <span>Discipline</span>
                <span>Shipped</span>
              </div>
              <ol className="dg-credits__rows">
                {makers.map((p, i) => (
                  <li key={p.id} className="dg-credit">
                    <span className="dg-credit__no dg-num" aria-hidden>
                      {pad(i + 1)}
                    </span>
                    <p className="dg-credit__name">{p.name}</p>
                    <p className="dg-credit__title">{p.title}</p>
                    {p.shipped.length ? (
                      <p className="dg-credit__shipped">
                        <span className="sr-only">Shipped: </span>
                        {p.shipped.join(" · ")}
                      </p>
                    ) : (
                      <p className="dg-credit__shipped" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </main>
      </PageFlow>

      {/* ---------- Footer: the title block ---------- */}
      <footer className="dg-foot">
        <div className="dg-rule" aria-hidden />
        <div className="dg-foot__cta dg-g">
          <p className="dg-head__id">
            <Balloon>∞</Balloon>
            <span className="dg-k dg-head__name">Next</span>
          </p>
          <h2 className="dg-foot__title">Have something that needs shaping?</h2>
          <div className="dg-foot__btns">
            <a href={CONTACT_URL} className="dg-btn dg-btn--ink dg-btn--lg">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="dg-btn dg-btn--lg">
              Join the studio <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        <div className="dg-tb">
          <nav aria-label="Footer" className="dg-tb__cell">
            <span className="dg-k dg-tb__ref" aria-hidden>
              A1
            </span>
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="dg-tb__link">
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dg-tb__cell">
            <span className="dg-k dg-tb__ref" aria-hidden>
              A2
            </span>
            <a href={CAREERS_URL} className="dg-tb__link">
              Careers <span aria-hidden>↗</span>
            </a>
            <a href={JOURNAL_URL} className="dg-tb__link">
              Journal <span aria-hidden>↗</span>
            </a>
            <a href={PRIVACY_URL} className="dg-tb__link">
              Privacy <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="dg-tb__cell">
            <span className="dg-k dg-tb__ref" aria-hidden>
              A3
            </span>
            {SOCIALS.map((social) => (
              <a key={social.href} href={social.href} className="dg-tb__link">
                {social.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div className="dg-tb__cell">
            <span className="dg-k dg-tb__ref" aria-hidden>
              A4
            </span>
            <a href={MAIN_SITE} className="dg-tb__link">
              Part of Digitally Next <span aria-hidden>↗</span>
            </a>
            <span className="dg-tb__copy">© {COPYRIGHT_YEAR} Digitally Next</span>
          </div>
        </div>
        <div className="dg-foot__strip" aria-hidden>
          <span>Digitally Next Design</span>
          <span className="dg-num">{DATUM}</span>
          <span className="dg-num">
            Sheets {sheets[0].no}–{sheets[sheets.length - 1].no}
          </span>
        </div>
      </footer>
    </div>
  );
}
