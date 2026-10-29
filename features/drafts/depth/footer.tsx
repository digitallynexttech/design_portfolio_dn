import Image from "next/image";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, FACTS, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { LocalTime } from "./local-time";
import { X_GLYPH } from "./x-glyph";

/** The footer's sign-off: DIGITALLY NEXT across the page, an outline that fills as you arrive (as the
 *  preloader's did), DIGITALLY in white and NEXT in red as in the logo, the X the mascot's letter. */
function FootMark({ slot }: { slot: boolean }) {
  const layer = (kind: "line" | "fill") => (
    <span className={`dp-foot__mark-layer dp-foot__mark-layer--${kind}`}>
      <span className="dp-foot__mark-a">DIGITALLY</span> <span className="dp-foot__mark-b">NE</span>
      {/* In the home's flight the 3D X jumps into this place (x-hop.ts) and becomes the letter. */}
      <svg className="dp-foot__mark-x" viewBox={`0 0 ${X_GLYPH.width} ${X_GLYPH.height}`} data-x-slot={slot && kind === "fill" ? "" : undefined}>
        <path d={X_GLYPH.d} />
      </svg>
      <span className="dp-foot__mark-b">T</span>
    </span>
  );
  return (
    <p className="dp-foot__mark" aria-hidden>
      {layer("line")}
      {layer("fill")}
    </p>
  );
}

/**
 * Contact, and the footer: the Depth home's, and every other page's (inside .dn-theme, site-chrome.tsx;
 * Karan, 26 Oct 2026: the home's theme everywhere). `astronaut` is the home's own: the astronaut at the
 * bottom of the well, the X's perch on "Join the studio" and its place in the sign-off's X. Elsewhere the
 * contact block is .footer-cta, which the case studies' chapters put away (work.css).
 */
export function DepthFooter({ astronaut = false }: { astronaut?: boolean }) {
  return (
    <footer className="dp-foot">
      <section className={astronaut ? "dp-contact" : "dp-contact footer-cta"} aria-labelledby="dp-contact-title">
        <div className="dp-gate">
          <span className="dp-gate__c dp-gate__c--tl" aria-hidden />
          <span className="dp-gate__c dp-gate__c--tr" aria-hidden />
          <span className="dp-gate__c dp-gate__c--bl" aria-hidden />
          <span className="dp-gate__c dp-gate__c--br" aria-hidden />
          {astronaut ? (
            // The bottom of the well: the astronaut settles here (a still picture until the scene is live).
            <div className="dp-astro-gate" data-astro-contact aria-hidden>
              <Image src="/models/astronaut/gate-settled-8.webp" alt="" width={610} height={920} sizes="12rem" className="dp-astro-gate__poster" />
            </div>
          ) : null}
          <p className="dp-k">Next</p>
          <h2 id="dp-contact-title" className="dp-contact__h">
            Have something that needs shaping<span className="dp-stop">?</span>
          </h2>
          <p className="dp-contact__line">Tell us what you’re making. We’ll take its shape.</p>
          <div className="dp-contact__actions">
            <a href={CONTACT_URL} className="dp-btn dp-btn--red dp-btn--lg">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className={astronaut ? "dp-btn dp-btn--lg dp-btn--perch" : "dp-btn dp-btn--lg"}>
              Join the studio <span aria-hidden>↗</span>
              {/* Where the X lands and stands, on the button's top edge (x-hop.ts). */}
              {astronaut ? <span className="dp-x-perch" data-x-perch aria-hidden /> : null}
            </a>
          </div>
        </div>
      </section>

      <div className="dp-foot__main">
        <div className="dp-foot__brand">
          <Image src="/brand/logo-white.png" alt="Digitally Next" width={1512} height={321} sizes="190px" className="dp-foot__logo" />
          <p className="dp-foot__about">
            The design and development studio inside Digitally Next. {FACTS.years} years, {FACTS.brands} brands, one team in {FACTS.city}.
          </p>
          <p className="dp-foot__now dp-k">
            <span className="dp-foot__dot" aria-hidden />
            {FACTS.city} <LocalTime /> IST
          </p>
        </div>
        <nav aria-label="Footer" className="dp-foot__cols">
          <div className="dp-foot__group">
            <p className="dp-k dp-foot__label" id="dp-foot-studio">
              Studio
            </p>
            <ul aria-labelledby="dp-foot-studio">
              {NAV.map((item) => (
                <li key={item.href}>
                  <FlowLink href={item.href} className="dp-foot__link">
                    {item.label}
                  </FlowLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="dp-foot__group">
            <p className="dp-k dp-foot__label" id="dp-foot-dn">
              Digitally Next
            </p>
            <ul aria-labelledby="dp-foot-dn">
              <li>
                <a href={CAREERS_URL} className="dp-foot__link">
                  Careers <span aria-hidden>↗</span>
                </a>
              </li>
              <li>
                <a href={JOURNAL_URL} className="dp-foot__link">
                  Journal <span aria-hidden>↗</span>
                </a>
              </li>
              <li>
                <a href={MAIN_SITE} className="dp-foot__link">
                  Main site <span aria-hidden>↗</span>
                </a>
              </li>
            </ul>
          </div>
          <div className="dp-foot__group">
            <p className="dp-k dp-foot__label" id="dp-foot-follow">
              Follow
            </p>
            <ul aria-labelledby="dp-foot-follow">
              {SOCIALS.map((social) => (
                <li key={social.href}>
                  <a href={social.href} className="dp-foot__link">
                    {social.label} <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <FootMark slot={astronaut} />
      <div className="dp-foot__base">
        <span>© {COPYRIGHT_YEAR} Digitally Next</span>
        <a href={PRIVACY_URL} className="dp-foot__small">
          Privacy <span aria-hidden>↗</span>
        </a>
        {/* The home's hero is #top (the flight rewinds the whole fall); elsewhere, the skip link's #main. */}
        <a href={astronaut ? "#top" : "#main"} className="dp-foot__small dp-foot__top">
          {astronaut ? "Back to the surface" : "Back to the top"} <span aria-hidden>↑</span>
        </a>
      </div>
    </footer>
  );
}
