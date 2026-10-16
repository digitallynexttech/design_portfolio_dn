import Image from "next/image";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { SailBridge } from "./sail-bridge";

/**
 * The title page. The title alone, then the verse, and the world shown as what it is: a plate you
 * can step into. Two ways on: Set sail (the one red thing on the page) or the reel.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="m-hero" data-chapter="Digitally Next Design">
      <h1 id="hero-title" className="m-hero__title">
        <span className="m-hero__we">We are</span> <em>water.</em>
      </h1>

      <div className="m-hero__text">
        <div className="m-hero__verse">
          <p className="m-hero__pour">
            Pour us into <em>anything.</em>
          </p>
          <p className="m-hero__lines">
            <span>Soft enough to take any shape.</span> <span>Relentless enough to carve canyons.</span>
          </p>
        </div>
        <p className="m-hero__intro">
          Digitally Next – design, development and 3D, from New Delhi. Our work is a small sea of islands: sail it, or scroll for the work.
        </p>
      </div>

      <figure className="m-hero__plate">
        <div className="m-hero__frame" data-ripple>
          <Image
            src="/world/poster.webp"
            alt="A frame of the archipelago: the boat on open water, the studio's island ahead and the clients' islands around it"
            fill
            loading="eager"
            sizes="(min-width: 1100px) 58vw, 100vw"
            className="m-hero__img"
          />
        </div>
        <figcaption className="m-caption">
          <span className="m-caption__no">Fig. 1</span> The archipelago <span aria-hidden>—</span> sail it
        </figcaption>
      </figure>

      <div className="m-hero__actions">
        <SailBridge className="m-hero__sail">
          <SailIntro data={worldData()} />
        </SailBridge>
        <div className="m-hero__aside">
          <span className="m-reel">
            <ReelButton />
          </span>
          <a href="#work" className="m-link m-link--down">
            See the work <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
