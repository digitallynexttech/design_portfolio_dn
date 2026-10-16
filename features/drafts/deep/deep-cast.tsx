import Image from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import type { StudioPhoto } from "@/content/studio";

export type Maker = { id: string; name: string; title: string; shipped: string[] };

/** The people, as a film closes: the whole crew in one wide shot, then the credits, role beside name. */
export function DeepCast({ photo, makers }: { photo: StudioPhoto; makers: Maker[] }) {
  return (
    <section id="dd-people" className="dd-section dd-cast" aria-labelledby="people-title">
      <div className="dd-cast__head">
        <p className="dd-label">The people</p>
        <h2 id="people-title" className="dd-cast__title dd-rise">
          Who poured it.
        </h2>
      </div>
      <div className="dd-cast__shot">
        <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="dd-cover" />
      </div>
      <ul className="dd-cast__roll">
        {makers.map((p) => (
          <li key={p.id} className="dd-cast__credit dd-rise">
            <p className="dd-cast__role">{p.title}</p>
            <div className="dd-cast__who">
              <p className="dd-cast__name">{p.name}</p>
              {p.shipped.length ? (
                <p className="dd-cast__shipped">
                  <span className="sr-only">Shipped: </span>
                  {p.shipped.join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <div className="dd-cast__foot">
        <FlowLink href="/about" className="dd-btn dd-btn--line dd-btn--lg">
          Meet the studio <span aria-hidden>→</span>
        </FlowLink>
      </div>
    </section>
  );
}
