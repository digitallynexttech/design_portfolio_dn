import Image from "next/image";
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
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { AwayFlag } from "./away-flag";
import { Effects, KineticHeader } from "./chrome";
import { Cursor } from "./cursor";
import { StudioTime, WeightDial } from "./hero-parts";
import { KineticType } from "./kinetic-type";
import { ClientMarquee } from "./marquee";
import { BtnLabel, Label, Words, pad } from "./parts";
import { KineticReel } from "./reel";
import { ServiceList } from "./services";
import { WorkIndex, type WorkRow } from "./work-index";
import "./kinetic.css";

/** The weight the headline rests at; the pointer's field pulls letters toward 700. */
const HERO_REST = 300;

/**
 * The flagships' floating frame shows a real picture from the study while the cursor's disc plays
 * the loop, so the two never show the same thing: the product shot for SKELMET, a page of the live
 * site for Know Your Genes and Hard2Soft. DNMS has no loop, so its disc gets the assistant screen and
 * its frame the poster.
 */
const FRAME: Record<string, string> = {
  skelmet: "/work/skelmet/colourway-lineup.webp",
  "know-your-genes": "/work/know-your-genes/life-curve-desktop.webp",
  hard2soft: "/work/hard2soft/home-desktop.webp",
};
const STILL: Record<string, string> = {
  dnms: "/work/dnms/ask-dnms.webp",
};

/** "12+" with its plus in red. */
function Figure({ value }: { value: string }) {
  return value.endsWith("+") ? (
    <>
      {value.slice(0, -1)}
      <span className="dk-stop">+</span>
    </>
  ) : (
    <>{value}</>
  );
}

/**
 * Draft 8, "Kinetic": type is the interface. Near-black and off-white with one red, the studio's
 * variable faces set huge, and their weight axis as the instrument: the headline's letters thicken
 * toward the pointer, the reel's word gains weight as it's pushed aside, a hovered project takes the
 * weight while the rest step back. Same content and order as the live home: hero, showreel, the 4
 * flagships, the rest of the work, clients and awards, studio and services, contact and footer.
 */
export function KineticHome() {
  // The making-of is told on its own page and in the world; home keeps to client work.
  const clientStudies = CASE_STUDIES.filter((s) => s.slug !== "making-of");
  const flagships = clientStudies.filter((s) => s.tier === "flagship");
  const standard = clientStudies.filter((s) => s.tier === "standard");

  // Section numbers come from what renders, so the labels never skip (as on home).
  let n = 1;
  const moreN = standard.length ? ++n : 0;
  const clientsN = ++n;
  const studioN = ++n;

  const flagRows: WorkRow[] = flagships.map((study, i) => {
    const card = toCard(study);
    return {
      slug: study.slug,
      no: pad(i + 1),
      client: study.client,
      industry: study.industry,
      year: study.year,
      platform: study.platform,
      headline: study.headline,
      metrics: study.metrics.slice(0, 2).map(({ value, label }) => ({ value, label })),
      theme: { bg: study.theme.bg, accent: study.theme.accent },
      poster: study.poster,
      posterFocus: study.posterFocus,
      video: card.previewVideo,
      frame: FRAME[study.slug],
      still: STILL[study.slug],
    };
  });

  const moreRows: WorkRow[] = standard.map((study, i) => {
    const card = toCard(study);
    return {
      slug: card.slug,
      no: pad(flagships.length + i + 1),
      client: card.client,
      industry: card.industry,
      year: card.year,
      platform: card.platform,
      headline: card.headline,
      metrics: card.metric ? [card.metric] : [],
      poster: card.poster,
      posterFocus: study.posterFocus,
      video: card.previewVideo,
    };
  });

  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(clientStudies.length), label: "case studies" },
  ];

  return (
    <div className="d-kinetic">
      <AwayFlag />
      <Effects />
      <KineticHeader />

      <PageFlow>
        <main id="main" className="dk-main">
          {/* ---------- Hero: the headline is the interface ---------- */}
          <section className="dk-hero" data-kt-area aria-labelledby="dk-h1">
            <div className="dk-hero__meta dk-mono">
              <p>Design · Development · 3D</p>
              <p className="dk-hero__where">
                {FACTS.city} <StudioTime />
              </p>
            </div>

            <div className="dk-hero__type">
              <KineticType
                as="h1"
                id="dk-h1"
                label="Building your tomorrow."
                lines={[{ text: "Building" }, { text: "your", end: true }, { text: "tomorrow." }]}
                rest={HERO_REST}
                intro
                className="dk-h1"
              />
              <p className="dk-hero__lead">Websites, stores and platforms, designed and built by the studio inside Digitally Next.</p>
            </div>

            <div className="dk-hero__foot">
              <div className="dk-hero__actions">
                <a href={CONTACT_URL} className="dk-btn dk-btn--red" data-magnetic>
                  <BtnLabel>
                    Start a project <span aria-hidden>↗</span>
                  </BtnLabel>
                </a>
                <a href="#work" className="dk-btn" data-magnetic>
                  <BtnLabel>
                    See the work <span aria-hidden>↓</span>
                  </BtnLabel>
                </a>
              </div>
              <div className="dk-hero__sail">
                <SailIntro data={worldData()} variant="link" />
              </div>
              <WeightDial target="dk-h1" rest={HERO_REST} />
            </div>
          </section>

          {/* ---------- Showreel: SHOW [frame] REEL, scroll to open ---------- */}
          <KineticReel
            src={REEL.src}
            poster={REEL.poster}
            length={REEL.length}
            summary={REEL.summary}
            play={<ReelButton className="dk-reelbtn" />}
          />

          {/* ---------- (01) Selected work: the flagships as an index ---------- */}
          <section id="work" className="dk-sec dk-work" aria-labelledby="dk-work-title">
            <div className="dk-head">
              <Label no="01">Selected work</Label>
              <h2 id="dk-work-title" className="dk-h2" data-reveal>
                <Words text="Shapes we’ve taken." />
              </h2>
              <p className="dk-mono dk-head__aside" aria-hidden>
                No. 01–{pad(flagships.length)}
              </p>
            </div>
            <WorkIndex rows={flagRows} variant="flag" />
          </section>

          {/* ---------- (02) More work ---------- */}
          {moreN ? (
            <section className="dk-sec dk-more" aria-labelledby="dk-more-title">
              <div className="dk-head">
                <Label no={pad(moreN)}>More work</Label>
                <h2 id="dk-more-title" className="dk-h2" data-reveal>
                  <Words text="Different containers." />
                </h2>
                <FlowLink href="/work" className="dk-btn dk-head__btn" data-magnetic>
                  <BtnLabel>
                    All work <span aria-hidden>→</span>
                  </BtnLabel>
                </FlowLink>
              </div>
              <WorkIndex rows={moreRows} variant="compact" />
              <FlowLink href="/work" className="dk-btn dk-btn--block dk-more__all">
                <BtnLabel>
                  All work <span aria-hidden>→</span>
                </BtnLabel>
              </FlowLink>
            </section>
          ) : null}

          {/* ---------- (03) Clients and awards ---------- */}
          <section className="dk-sec dk-clients" aria-labelledby="dk-clients-title">
            <div className="dk-head">
              <Label no={pad(clientsN)}>Clients and awards</Label>
              <h2 id="dk-clients-title" className="dk-h2" data-reveal>
                <Words text="Who we’ve built for." />
              </h2>
            </div>
            <ClientMarquee
              names={CLIENTS.map((c) => c.name)}
              logos={CLIENTS.map((c) => ({ name: c.name, ...c.logo }))}
            />
            <div className="dk-awards">
              <p className="dk-mono dk-awards__k">Recognition</p>
              <ol className="dk-awards__list">
                {RECOGNITION.map((item, i) => (
                  <li key={item.title} className="dk-award">
                    <span className="dk-mono dk-award__no" aria-hidden>
                      R.{pad(i + 1)}
                    </span>
                    <p className="dk-award__title">{item.title}</p>
                    <p className="dk-award__detail">{item.detail}</p>
                    {item.image ? (
                      <span className={`dk-award__mark${item.plate ? " dk-award__mark--plate" : ""}`}>
                        <Image
                          src={item.image.src}
                          alt=""
                          width={item.image.width}
                          height={item.image.height}
                          sizes="128px"
                        />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ---------- (04) Studio and services, on paper ---------- */}
          <section className="dk-sec dk-studio" aria-labelledby="dk-studio-title">
            <div className="dk-studio__top">
              <div>
                <Label no={pad(studioN)}>Studio and services</Label>
                <h2 id="dk-studio-title" className="dk-h2 dk-studio__title" data-reveal>
                  <Words text="One studio, six kinds of work." />
                </h2>
                <p className="dk-studio__sub" data-reveal>
                  <Words text="The designers, developers and motion artists inside Digitally Next." />
                </p>
              </div>
              <dl className="dk-figs">
                {stats.map((stat) => (
                  <div key={stat.label} className="dk-fig">
                    <dt className="dk-mono dk-fig__k">{stat.label}</dt>
                    <dd className="dk-fig__v dk-num">
                      <Figure value={stat.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <ServiceList
              services={SERVICES.map((s) => ({
                id: s.id,
                title: s.title,
                line: s.line,
                proof: s.proof.flatMap((slug) => getCaseStudy(slug)?.client ?? []),
              }))}
            />
            <div className="dk-studio__links">
              <FlowLink href="/services" className="dk-btn dk-btn--ink" data-magnetic>
                <BtnLabel>
                  All services <span aria-hidden>→</span>
                </BtnLabel>
              </FlowLink>
              <FlowLink href="/about" className="dk-btn" data-magnetic>
                <BtnLabel>
                  Meet the studio <span aria-hidden>→</span>
                </BtnLabel>
              </FlowLink>
            </div>
          </section>
        </main>
      </PageFlow>

      {/* ---------- Contact and footer: the question answers the pointer too ---------- */}
      <footer className="dk-foot" data-kt-area aria-labelledby="dk-foot-title">
        <Label no="∞">Next</Label>
        <KineticType
          id="dk-foot-title"
          label="Have something that needs shaping?"
          lines={[{ text: "Have something" }, { text: "that needs shaping?", end: true }]}
          rest={260}
          className="dk-foot__title"
        />
        <div className="dk-foot__row">
          <p className="dk-foot__sub">Tell us what you’re making. We’ll take its shape.</p>
          <div className="dk-foot__btns">
            <a href={CONTACT_URL} className="dk-orb" data-magnetic="strong">
              <span className="dk-orb__t">
                Start a project <span aria-hidden>↗</span>
              </span>
            </a>
            <a href={CAREERS_URL} className="dk-btn" data-magnetic>
              <BtnLabel>
                Join the studio <span aria-hidden>↗</span>
              </BtnLabel>
            </a>
          </div>
        </div>

        <div className="dk-foot__grid">
          <nav aria-label="Footer" className="dk-foot__col">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="dk-foot__link">
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dk-foot__col">
            <a href={CAREERS_URL} className="dk-foot__link">
              Careers <span aria-hidden>↗</span>
            </a>
            <a href={JOURNAL_URL} className="dk-foot__link">
              Journal <span aria-hidden>↗</span>
            </a>
            <a href={PRIVACY_URL} className="dk-foot__link">
              Privacy <span aria-hidden>↗</span>
            </a>
          </div>
          <div className="dk-foot__col">
            {SOCIALS.map((social) => (
              <a key={social.href} href={social.href} className="dk-foot__link">
                {social.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
          <div className="dk-foot__col dk-foot__col--end">
            <a href={MAIN_SITE} className="dk-foot__link">
              Part of Digitally Next <span aria-hidden>↗</span>
            </a>
            <span className="dk-foot__copy">
              © {COPYRIGHT_YEAR} Digitally Next
            </span>
          </div>
        </div>
      </footer>

      <Cursor />
    </div>
  );
}
