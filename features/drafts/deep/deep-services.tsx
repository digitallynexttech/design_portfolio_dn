import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { ServicesDirector } from "./services-director";

export type DeepService = { id: string; title: string; line: string; proof: string[]; image: string };

/**
 * How we adapt. On wide screens one projection screen holds still on the left and changes picture
 * as each service passes the middle of the screen; on phones and tablets the six are a row of
 * frames to swipe, each carrying its own picture.
 */
export function DeepServices({ services }: { services: DeepService[] }) {
  return (
    <section id="dd-services" className="dd-section dd-services" aria-labelledby="services-title">
      <p className="dd-label">How we adapt</p>
      <h2 id="services-title" className="dd-services__title dd-rise">
        Six kinds of work, one studio.
      </h2>

      <div className="dd-services__body" data-active="0">
        <div className="dd-services__stage" aria-hidden>
          <div className="dd-services__screen">
            {services.map((s, i) => (
              <div key={s.id} className="dd-services__shot" data-i={i}>
                <Image src={s.image} alt="" fill sizes="(min-width: 1536px) 46rem, 46vw" className="dd-cover" />
              </div>
            ))}
            <p className="dd-services__count">
              <span className="dd-services__now">01</span> / {String(services.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <ol className="dd-services__list">
          {services.map((s, i) => (
            <li key={s.id} className="dd-service" data-i={i} data-on={i === 0 ? "" : undefined} style={{ "--i": i } as CSSProperties}>
              <div className="dd-service__pic" aria-hidden>
                <Image src={s.image} alt="" fill sizes="(min-width: 768px) 60vw, 84vw" className="dd-cover" />
              </div>
              <span className="dd-service__index" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="dd-service__title">
                <FlowLink href={`/services#${s.id}`} className="dd-service__link">
                  {s.title}
                </FlowLink>
              </h3>
              <p className="dd-service__line">{s.line}</p>
              {s.proof.length ? (
                <p className="dd-service__proof">
                  <span className="sr-only">Proof: </span>
                  {s.proof.join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
      <ServicesDirector />
    </section>
  );
}
