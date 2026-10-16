import Image from "next/image";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";
import { FACTS } from "@/lib/site";
import { LogoWall } from "./logo-wall";
import { Folio } from "./parts";

/** The studio: the statement as the chapter's first paragraph, the facts as figures, the clients as a colophon. */
export function Studio({ studies, folio }: { studies: number; folio: number }) {
  const stats = [
    { value: FACTS.years, label: "years in digital" },
    { value: FACTS.brands, label: "brands served" },
    { value: String(studies), label: "case studies, told in full" },
  ];
  const featured = RECOGNITION.filter((item) => item.featured && item.image);

  return (
    <section aria-labelledby="studio-title" className="m-studio m-block" data-chapter="The studio" data-folio={folio}>
      <p className="m-sidehead">The studio</p>
      <h2 id="studio-title" className="m-studio__statement">
        We are the designers, developers and motion artists inside <em>Digitally Next.</em>
      </h2>
      <p className="m-studio__sub">Every client is a different container. We take its shape.</p>

      <dl className="m-studio__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="m-stat">
            <dt className="m-stat__label">{stat.label}</dt>
            <dd className="m-stat__value">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="m-studio__clients">
        <p className="m-sidehead m-sidehead--inline">Trusted by</p>
        <LogoWall clients={CLIENTS.map((c) => ({ name: c.name, ...c.logo }))} />
      </div>

      <div className="m-studio__honours">
        <p className="m-sidehead m-sidehead--inline">Recognition</p>
        <ul aria-label="Recognition" className="m-honours">
          {featured.map((item) => {
            const image = item.image!;
            const badge = image.width / image.height < 2;
            return (
              <li key={item.title} className="m-honours__item" data-badge={badge ? "" : undefined}>
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes={badge ? "72px" : "(min-width: 768px) 360px, 280px"}
                  className="m-honours__img"
                />
                <p className="m-honours__text">
                  <span className="m-honours__title">{item.title}</span>
                  <span className="m-honours__detail">{item.detail}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <Folio n={folio} />
    </section>
  );
}
