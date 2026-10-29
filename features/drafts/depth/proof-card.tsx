import Image from "next/image";
import type { CSSProperties } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import type { WorkCardData } from "@/components/work/work-card";
import { lift } from "./lift";

/**
 * A case study as a small card in the home's style (inside .dn-theme, in a .dn-cards list): its
 * poster in a hairline frame in the client's colour, the industry, the client and its line. The
 * whole card is the link.
 */
export function ProofCard({ study, headingLevel = "h3" }: { study: WorkCardData; headingLevel?: "h3" | "h4" }) {
  const Heading = headingLevel;
  return (
    <FlowLink href={`/work/${study.slug}`} direction="deeper" className="dn-card__link" style={{ "--accent": lift(study.accent) } as CSSProperties}>
      <div className="dp-box" style={{ "--ar": "16 / 10" } as CSSProperties}>
        <Image src={study.poster.src} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw" className="dp-plate dp-cover dp-cover--top" />
      </div>
      <p className="dp-k dn-card__meta">{study.industry}</p>
      <Heading className="dn-card__title">
        {study.client}
        <span aria-hidden className="dn-card__out">
          →
        </span>
      </Heading>
      <p className="dn-card__note">{study.headline}</p>
    </FlowLink>
  );
}
