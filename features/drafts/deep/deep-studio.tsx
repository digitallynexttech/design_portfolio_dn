import { ClientWall } from "@/components/proof/client-wall";
import { Recognition } from "@/components/proof/recognition";
import { FACTS } from "@/lib/site";

/** The studio, just under the surface: a statement in light grotesk, the facts as tall thin numerals. */
export function DeepStudio({ studies }: { studies: number }) {
  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(studies), label: "case studies, told in full" },
  ];
  return (
    <section id="dd-studio" className="dd-section dd-studio" aria-labelledby="dd-studio-title">
      <p className="dd-label">The studio</p>
      <h2 id="dd-studio-title" className="dd-studio__statement dd-rise">
        We are the <span className="dd-em">designers, developers and motion artists</span> inside Digitally Next.
      </h2>
      <p className="dd-studio__sub dd-rise">Every client is a different container. We take its shape.</p>

      <dl className="dd-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="dd-stats__item dd-rise">
            <dt className="dd-stats__label">{stat.label}</dt>
            <dd className="dd-stats__value">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="dd-proof">
        <div className="dd-proof__clients">
          <ClientWall label="Trusted by" />
        </div>
        <div className="dd-proof__awards">
          <Recognition variant="compact" />
        </div>
      </div>
    </section>
  );
}
