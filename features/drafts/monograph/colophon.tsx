import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";

/** The footer as the book's last page: the invitation, then the colophon. Same content as the site footer. */
export function Colophon() {
  return (
    <footer className="m-colophon" data-chapter="Next">
      <div className="m-colophon__cta">
        <h2 className="m-colophon__title">
          Have something that needs <em>shaping?</em>
        </h2>
        <div className="m-colophon__actions">
          <a href={CONTACT_URL} className="m-btn m-btn--ink m-btn--lg">
            Start a project <span aria-hidden>↗</span>
          </a>
          <a href={CAREERS_URL} className="m-btn m-btn--lg">
            Join the studio <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <div className="m-colophon__grid">
        <nav aria-label="Footer" className="m-colophon__col">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className="m-colophon__link">
              {item.label}
            </FlowLink>
          ))}
        </nav>
        <div className="m-colophon__col">
          <a href={CAREERS_URL} className="m-colophon__link">
            Careers <span aria-hidden>↗</span>
          </a>
          <a href={JOURNAL_URL} className="m-colophon__link">
            Journal <span aria-hidden>↗</span>
          </a>
          <a href={PRIVACY_URL} className="m-colophon__link">
            Privacy <span aria-hidden>↗</span>
          </a>
        </div>
        <div className="m-colophon__col">
          {SOCIALS.map((social) => (
            <a key={social.href} href={social.href} className="m-colophon__link">
              {social.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        <div className="m-colophon__col m-colophon__col--end">
          <a href={MAIN_SITE} className="m-colophon__link">
            Part of Digitally Next <span aria-hidden>↗</span>
          </a>
          <span className="m-colophon__copy">© {COPYRIGHT_YEAR} Digitally Next</span>
        </div>
      </div>
      <p className="m-colophon__end" aria-hidden>
        <span />
      </p>
    </footer>
  );
}
