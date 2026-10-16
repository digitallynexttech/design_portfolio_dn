import Image from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import type { CaseStudy } from "@/content/types";
import { visibleTestimonial } from "@/content/work";
import { MetaParts } from "@/features/home/meta-parts";
import { LoopVideo } from "./loop-video";
import { Folio, roman } from "./parts";

// A second, smaller figure beside each plate: the live site moving, or (DNMS, which has no loop)
// the same product on a phone.
type Inset = { kind: "video"; src: string; poster: string } | { kind: "image"; src: string; width: number; height: number };

const INSETS: Record<string, Inset> = {
  skelmet: { kind: "video", src: "/work/skelmet/preview.mp4", poster: "/work/skelmet/preview-poster.webp" },
  "know-your-genes": { kind: "video", src: "/work/know-your-genes/preview.mp4", poster: "/work/know-your-genes/preview-poster.webp" },
  hard2soft: { kind: "video", src: "/work/hard2soft/preview.mp4", poster: "/work/hard2soft/preview-poster.webp" },
  dnms: { kind: "image", src: "/work/dnms/phone-dashboard.webp", width: 780, height: 1688 },
};

function InsetFigure({ inset, n }: { inset: Inset; n: number }) {
  return (
    <figure className="m-plate__inset" data-kind={inset.kind} aria-hidden>
      <div className="m-plate__inset-frame">
        {inset.kind === "video" ? (
          <LoopVideo src={inset.src} poster={inset.poster} className="m-plate__video" />
        ) : (
          <Image src={inset.src} alt="" width={inset.width} height={inset.height} sizes="(min-width: 1100px) 11vw, 40vw" className="m-plate__phone" />
        )}
      </div>
      <figcaption className="m-caption">
        <span className="m-caption__no">Pl. {roman(n)}b</span> {inset.kind === "video" ? "Preview" : "On a phone"}
      </figcaption>
    </figure>
  );
}

/**
 * Selected work: a chapter of four plates. Each study is printed large (the real screen, edge to
 * edge on its side of the spread) with its facts set in the margin beside it, alternating sides
 * the way a book alternates recto and verso.
 */
export function SelectedWork({ flagships, firstFolio }: { flagships: CaseStudy[]; firstFolio: number }) {
  return (
    <section id="work" aria-labelledby="selected-title" className="m-work" data-chapter="Selected work" data-folio={firstFolio}>
      <header className="m-opener m-block">
        <h2 id="selected-title" className="m-opener__title">
          Shapes we&apos;ve <em>taken.</em>
        </h2>
        <nav aria-label="Plates" className="m-contents">
          <ol>
            {flagships.map((study, i) => (
              <li key={study.slug}>
                <a href={`#plate-${study.slug}`} className="m-contents__link">
                  <span className="m-contents__no">{roman(i + 1)}</span>
                  <span className="m-contents__name">{study.client}</span>
                  <span className="m-contents__leader" aria-hidden />
                  <span className="m-contents__folio">
                    <span className="sr-only">page </span>
                    {firstFolio + 1 + i}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <ol className="m-plates">
        {flagships.map((study, i) => {
          const t = visibleTestimonial(study.testimonial);
          const n = i + 1;
          const folio = firstFolio + n;
          const inset = INSETS[study.slug];
          return (
            <li
              key={study.slug}
              id={`plate-${study.slug}`}
              className="m-plate"
              data-side={i % 2 ? "right" : "left"}
              data-chapter={`Selected work · Plate ${roman(n)}`}
              data-folio={folio}
            >
              <p className="m-plate__no">
                <span className="m-plate__rule" aria-hidden />
                Plate {roman(n)}
              </p>
              <div className="m-plate__text">
                <h3 className="m-plate__client">{study.client}</h3>
                <p className="m-plate__industry">
                  <MetaParts parts={study.industry.split(" · ")} />
                </p>
                <p className="m-plate__line">{study.headline}</p>
                <dl className="m-plate__metrics">
                  {study.metrics.slice(0, 2).map((m) => (
                    <div key={m.label} className="m-plate__metric">
                      <dt className="m-plate__metric-label">{m.label}</dt>
                      <dd className="m-plate__metric-value">{m.value}</dd>
                    </div>
                  ))}
                </dl>
                {t ? (
                  <blockquote className="m-plate__quote">
                    <p>“{t.quote}”</p>
                  </blockquote>
                ) : null}
                <FlowLink href={`/work/${study.slug}`} direction="deeper" className="m-link m-link--case">
                  View case study <span aria-hidden>→</span>
                  <span className="sr-only">: {study.client}</span>
                </FlowLink>
              </div>

              <figure className="m-plate__fig">
                <div
                  className="m-plate__frame m-rise"
                  data-ripple
                  data-tone={study.theme.scheme}
                  style={{ aspectRatio: `${study.poster.width} / ${study.poster.height}` }}
                >
                  <Image
                    src={study.poster.src}
                    alt={study.poster.alt}
                    fill
                    sizes="(min-width: 1100px) 64vw, 100vw"
                    className="m-plate__img"
                  />
                </div>
                <figcaption className="m-caption m-plate__caption">
                  <span className="m-caption__no">Pl. {roman(n)}a</span> {study.poster.alt}
                </figcaption>
              </figure>
              {inset ? <InsetFigure inset={inset} n={n} /> : null}
              <Folio n={folio} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
