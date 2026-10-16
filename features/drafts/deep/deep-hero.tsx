import { getImageProps } from "next/image";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { DeepSail } from "./deep-sail";

// A real frame of the world, letterboxed: the wide frame on landscape screens and tablets, the tall one on phones.
// The grade (cooled toward deep teal, desaturated, darkened) is baked into copies of the world's own
// posters (public/drafts/deep), so the first paint needs no filter or blend layer and the file is lighter.
function WorldFrame() {
  const common = { alt: "", sizes: "100vw" };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, width: 1920, height: 1080, src: "/drafts/deep/world-graded.webp" });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, width: 720, height: 1280, src: "/drafts/deep/world-graded-phone.webp" });
  return (
    <picture className="dd-hero__poster">
      {/* Tablets, even upright, take the wide frame (cropped): the tall one is sized for phones. */}
      <source media="(orientation: landscape), (min-width: 700px)" srcSet={wide} />
      <source srcSet={tall} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- decorative (alt=""); getImageProps supplies alt, src, srcSet and sizes */}
      <img {...rest} fetchPriority="high" loading="eager" decoding="async" />
    </picture>
  );
}

/**
 * The opening shot. The world, darkened and letterboxed, with the title card set inside the frame; the
 * two lines that follow arrive in the bar beneath it, the way subtitles do; and under them, the two
 * ways in: sail it (the one red, glowing action) or scroll for the work.
 */
export function DeepHero() {
  return (
    <section className="dd-hero" aria-labelledby="dd-hero-title">
      <div className="dd-hero__frame">
        <div className="dd-hero__shot">
          <WorldFrame />
        </div>
        <div className="dd-hero__grade" aria-hidden />
        <h1 id="dd-hero-title" className="dd-hero__title">
          <span className="dd-hero__line">We are</span> <span className="dd-hero__line dd-hero__line--b">water.</span>
        </h1>
      </div>

      <div className="dd-hero__deck">
        <div className="dd-hero__subs">
          <p className="dd-hero__sub">Pour us into anything.</p>
          <p className="dd-hero__sub dd-hero__sub--b">Soft enough to take any shape. Relentless enough to carve canyons.</p>
        </div>
        <p className="dd-hero__intro">
          Digitally Next - design, development and 3D, from New Delhi. Our work is a small sea of islands: sail it,
          or scroll for the work.
        </p>
        <div className="dd-hero__actions">
          <DeepSail>
            <SailIntro data={worldData()} />
          </DeepSail>
          <div className="dd-hero__aside">
            <ReelButton className="dd-reel" />
            <a href="#work" className="dd-hero__down">
              See the work <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
