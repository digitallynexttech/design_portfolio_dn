import { worldData } from "@/content/world";
import { MascotWindow } from "@/features/mascot/mascot-window";
import { SailIntro } from "@/features/world/ui/sail-intro";
import { CONTACT_URL } from "@/lib/site";
import { HeroClock } from "./hero-clock";

/**
 * The hero, over the live water: the tagline and the ways in on the left (start a project, see the
 * work, or sail the world), and on the right the X on its lit stage with the studio's local time.
 * Hovering "Start a project" makes the X wave.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow">Design · Development · 3D</p>
        {/* The spaces keep the heading's accessible name as words; the lines are blocks. */}
        <h1 id="hero-title" className="hero__title">
          <span>Building</span>{" "}
          <span className="hero__line--in">your</span>{" "}
          <span>
            tomorrow<span className="stop">.</span>
          </span>
        </h1>
        <p className="hero__lead">Websites, stores and platforms, designed and built by the studio inside Digitally Next.</p>
        <div className="hero__actions">
          <a href={CONTACT_URL} className="btn btn--primary btn--lg" data-mascot-wave>
            Start a project <span aria-hidden>↗</span>
          </a>
          <a href="#work" className="btn btn--lg">
            See the work <span aria-hidden>↓</span>
          </a>
        </div>
        <SailIntro data={worldData()} variant="link" />
      </div>

      <div className="hero__stage">
        <HeroClock />
        <MascotWindow greet="Wave" bubble="Let's build yours." className="mascot-window--stage" />
      </div>
    </section>
  );
}
