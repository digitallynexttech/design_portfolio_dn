import Image from "next/image";
import type { CSSProperties } from "react";
import { CLIENTS } from "@/content/clients";
import { RECOGNITION } from "@/content/recognition";

/** The clients' marks in the home's hairline grid (the home's (02) section, and About). */
export function ClientLogos() {
  return (
    <ul className="dp-logos" aria-label="Clients">
      {CLIENTS.map((client, i) => {
        const aspect = client.logo.width / client.logo.height;
        // Optical sizing: wide marks get less height, square ones more, so all weigh the same.
        const h = Math.round(Math.min(44, Math.max(16, 27 * Math.sqrt(2.4 / aspect))));
        return (
          <li key={client.name} className="dp-logo dp-rise" style={{ "--i": i % 9 } as CSSProperties}>
            <Image
              src={client.logo.src}
              alt={client.name}
              width={client.logo.width}
              height={client.logo.height}
              sizes={`${Math.ceil(h * aspect * 2)}px`}
              className="dp-logo__img"
              style={{ height: h, width: "auto" }}
            />
            <span className="dp-logo__name" aria-hidden>
              {client.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The awards and partnerships, one hairline row each (the home's (02) section, and About). */
export function RecognitionList({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <div className="dp-recog">
      <Heading className="dp-k dp-recog__k">Recognition</Heading>
      <ul className="dp-recog__list">
        {RECOGNITION.map((item) => (
          <li key={item.title} className="dp-recog__row dp-rise">
            <span className={`dp-recog__mark${item.plate ? " dp-recog__mark--plate" : ""}`}>
              {item.image ? <Image src={item.image.src} alt="" width={item.image.width} height={item.image.height} sizes="160px" className="dp-recog__img" /> : null}
            </span>
            <span className="dp-recog__title">{item.title}</span>
            <span className="dp-recog__detail">{item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
