import Image from "next/image";
import { worldData } from "@/content/world";
import { ReelButton } from "@/features/home/reel-button";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { FIELDS, fieldStyle } from "./colour";
import { HeroMotion } from "./hero-motion";
import { SailBridge } from "./sail-bridge";

/**
 * The opening field: brand red, the line set as a poster, and the world held in a single drop of
 * water beside it. The drop is the door: Set sail sits right under it.
 */
export function Hero() {
  return (
    <section aria-labelledby="dc-hero-title" className="dc-field dc-hero" data-field style={fieldStyle(FIELDS.red)}>
      {/* The drop's outline, in its own box's units, so it scales with the frame. */}
      <svg width="0" height="0" aria-hidden focusable="false" className="dc-defs">
        <clipPath id="dc-drop-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.5,0 C0.5,0 0.05,0.43 0.05,0.675 C0.05,0.885 0.255,1 0.5,1 C0.745,1 0.95,0.885 0.95,0.675 C0.95,0.43 0.5,0 0.5,0 Z" />
        </clipPath>
      </svg>

      <div className="dc-hero__grid">
        <h1 id="dc-hero-title" className="dc-hero__title">
          <span className="dc-hero__line">We are</span> <span className="dc-hero__line">water.</span>
        </h1>

        <div className="dc-hero__drop">
          <div className="dc-drop">
            <div className="dc-drop__clip">
              <Image
                src="/world/poster-phone.webp"
                alt=""
                fill
                loading="eager"
                sizes="(min-width: 1024px) 31vw, (min-width: 640px) 40vw, 46vw"
                className="dc-drop__img"
              />
              <span className="dc-drop__shine" aria-hidden />
            </div>
          </div>
        </div>

        <p className="dc-hero__pour">Pour us into anything.</p>
        <p className="dc-hero__soft">Soft enough to take any shape. Relentless enough to carve canyons.</p>
        <p className="dc-hero__intro">
          Digitally Next - design, development and 3D, from New Delhi. Our work is a small sea of islands: sail it, or
          scroll for the work.
        </p>

        <div className="dc-hero__sail">
          <SailBridge>
            <SailIntro data={worldData()} />
          </SailBridge>
        </div>
        <div className="dc-hero__aside">
          <ReelButton className="dc-reel" />
          <a href="#work" className="dc-hero__down">
            See the work <span aria-hidden>↓</span>
          </a>
        </div>
      </div>

      <div className="dc-hero__foot" style={{ color: FIELDS.cream.bg }}>
        <HeroMotion />
      </div>
    </section>
  );
}
