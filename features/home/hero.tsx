import { getImageProps } from "next/image";
import { worldData } from "@/content/world";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { HeroBeats } from "./hero-beats";
import { ReelButton } from "./reel-button";

// A real frame of the world sits behind the hero: landscape on wide screens, portrait on phones.
function WorldPoster() {
  const common = { alt: "", sizes: "100vw" };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, width: 1920, height: 1080, src: "/world/poster.webp" });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, width: 900, height: 1600, src: "/world/poster-phone.webp", preload: true });
  return (
    <picture className="hero-poster">
      <source media="(min-aspect-ratio: 4/5)" srcSet={wide} />
      <source srcSet={tall} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- decorative (alt=""); getImageProps supplies alt, src, srcSet and sizes */}
      <img {...rest} fetchPriority="high" loading="eager" decoding="async" />
    </picture>
  );
}

/** The hero: three beats over a real frame of the world, and the two ways in (sail it, or scroll). */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <HeroBeats>
        <div className="hero-sticky relative">
          <WorldPoster />
          <div className="hero-beats relative">
            <h1 id="hero-title" data-beat className="hero-beat">
              We are water<span className="stop">.</span>
            </h1>
            <p data-beat className="hero-beat">
              Pour us into anything<span className="stop">.</span>
            </p>
            <p data-beat className="hero-beat hero-beat--long">
              Soft enough to take any shape. Relentless enough to carve canyons<span className="stop">.</span>
            </p>
          </div>

          <div className="hero-foot relative">
            <div className="grid gap-5">
              <p className="max-w-[38ch] text-paper/85">
                Digitally Next — design, development and 3D, from New Delhi. Our work is a small sea of islands: sail it, or scroll for the work.
              </p>
              <SailIntro data={worldData()} />
            </div>
            <div className="hero-foot__aside">
              <ReelButton />
              <a href="#work" className="hero-scroll">
                See the work <span aria-hidden>↓</span>
              </a>
            </div>
          </div>
        </div>
      </HeroBeats>
    </section>
  );
}
