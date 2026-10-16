import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { CaseStudy } from "@/content/types";
import { visibleTestimonial } from "@/content/work";
import { MetaParts } from "@/features/home/meta-parts";
import { ScenesDirector } from "./scenes-director";

type Pic = { src: string; width: number; height: number };
type Companion = Pic & { kind: "still" | "crew" | "phone" };
type SceneMedia = { video?: string; frames: Pic[]; companion?: Companion };

// What each flagship shows: its own recorded loop (or, for DNMS, its real screens), and one piece of
// the client's world beside it. All from the studies' own folders.
const MEDIA: Record<string, SceneMedia> = {
  skelmet: {
    video: "/work/skelmet/preview.mp4",
    frames: [{ src: "/work/skelmet/preview-poster.webp", width: 640, height: 360 }],
    companion: { kind: "still", src: "/work/skelmet/gallery-garage-night.webp", width: 1400, height: 1400 },
  },
  "know-your-genes": {
    video: "/work/know-your-genes/preview.mp4",
    frames: [{ src: "/work/know-your-genes/preview-poster.webp", width: 640, height: 360 }],
    companion: { kind: "crew", src: "/work/know-your-genes/crew-hero.webp", width: 1600, height: 600 },
  },
  hard2soft: {
    video: "/work/hard2soft/preview.mp4",
    frames: [{ src: "/work/hard2soft/preview-poster.webp", width: 640, height: 360 }],
    companion: { kind: "phone", src: "/work/hard2soft/home-phone.webp", width: 1170, height: 1992 },
  },
  dnms: {
    frames: [
      { src: "/work/dnms/poster.webp", width: 1600, height: 1000 },
      { src: "/work/dnms/ask-dnms.webp", width: 1400, height: 875 },
      { src: "/work/dnms/ai-connections.webp", width: 1400, height: 875 },
    ],
    companion: { kind: "phone", src: "/work/dnms/phone-dashboard.webp", width: 780, height: 1688 },
  },
};

/**
 * The pan across the scenes: every panel holds still for a beat at its centre, and the camera eases
 * from one to the next. Written per panel count, so a fifth flagship needs no CSS change.
 */
function panKeyframes(panels: number) {
  const moves = Math.max(1, panels - 1);
  const hold = 0.17 / moves;
  const pct = (v: number) => `${(Math.min(1, Math.max(0, v)) * 100).toFixed(2)}%`;
  const steps = Array.from({ length: panels }, (_, k) => {
    const c = k / moves;
    const at = Array.from(new Set([pct(c - hold), pct(c + hold)])).join(", ");
    return `${at} { transform: translate3d(calc(${-k} * 100cqw), 0, 0); animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1); }`;
  });
  return `@keyframes dd-pan { ${steps.join(" ")} }`;
}

/** Selected work as cinema: a title card, then one full-frame scene per flagship. */
export function DeepScenes({ flagships }: { flagships: CaseStudy[] }) {
  const panels = flagships.length + 1;
  const moves = Math.max(1, panels - 1);
  return (
    <section id="work" className="dd-work" aria-labelledby="selected-title" style={{ "--panels": panels } as CSSProperties}>
      <style>{panKeyframes(panels)}</style>
      <div className="dd-work__pin" data-panels={panels}>
        <div className="dd-work__stage">
          <div className="dd-work__track">
            <div className="dd-intertitle">
              <p className="dd-label">Selected work</p>
              <h2 id="selected-title" className="dd-intertitle__title">
                Shapes we&apos;ve taken.
              </h2>
              <span className="dd-intertitle__cue" aria-hidden>
                <span>→</span>
              </span>
            </div>

            <ol className="dd-work__scenes">
              {flagships.map((study, i) => {
                const media = MEDIA[study.slug] ?? { frames: [study.poster] };
                const t = visibleTestimonial(study.testimonial);
                const centre = (i + 1) / moves;
                const first = media.frames[0];
                const style = {
                  "--ratio": (first.height / first.width).toFixed(4),
                  "--accent": study.theme.accent,
                  "--on-accent": study.theme.onAccent,
                  "--drift-range": `contain ${((centre - 1 / moves) * 100).toFixed(2)}% contain ${((centre + 1 / moves) * 100).toFixed(2)}%`,
                } as CSSProperties;
                return (
                  <li key={study.slug} className="dd-scene" data-dd-scene data-kind={media.companion?.kind ?? "none"} style={style}>
                    <div className="dd-scene__light" aria-hidden />
                    <p className="dd-scene__meta">
                      <span className="dd-scene__count">
                        {String(i + 1).padStart(2, "0")}
                        <span aria-hidden> / </span>
                        <span className="sr-only"> of </span>
                        {String(flagships.length).padStart(2, "0")}
                      </span>
                      <span className="dd-scene__industry">
                        <MetaParts parts={study.industry.split(" · ")} />
                      </span>
                    </p>
                    <h3 className="dd-scene__title">{study.client}</h3>
                    <p className="dd-scene__line">{study.headline}</p>
                    <dl className="dd-scene__metrics">
                      {study.metrics.slice(0, 2).map((m) => (
                        <div key={m.label} className="dd-scene__metric">
                          <dt className="sr-only">{m.label}</dt>
                          <dd>
                            <span className="dd-scene__value">{m.value}</span>
                            <span className="dd-scene__unit">{m.label}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {t ? <p className="dd-scene__quote">“{t.quote}”</p> : null}
                    <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dd-btn dd-btn--accent dd-btn--lg dd-scene__cta">
                      View case study <span aria-hidden>→</span>
                    </FlowLink>

                    <div className="dd-scene__media" aria-hidden>
                      <div className={`dd-scene__screen${media.frames.length > 1 ? " dd-scene__screen--stills" : ""}`}>
                        {media.frames.map((frame, k) => (
                          <Image
                            key={frame.src}
                            src={frame.src}
                            alt=""
                            width={frame.width}
                            height={frame.height}
                            sizes="(min-width: 1024px) 56vw, 100vw"
                            className="dd-scene__frame"
                            style={{ "--k": k } as CSSProperties}
                          />
                        ))}
                        {media.video ? <video className="dd-scene__video" data-src={media.video} muted playsInline loop preload="none" tabIndex={-1} /> : null}
                      </div>
                      {media.companion ? (
                        <div className="dd-scene__companion">
                          <Image
                            src={media.companion.src}
                            alt=""
                            width={media.companion.width}
                            height={media.companion.height}
                            sizes={media.companion.kind === "crew" ? "(min-width: 1024px) 36vw, 90vw" : "(min-width: 1024px) 16vw, 36vw"}
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
      <ScenesDirector />
    </section>
  );
}
