import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";

/** The same content as the site footer, set as the closing card at the bottom of the sea. */
export function DeepFooter() {
  return (
    <footer className="dd-footer">
      <div className="dd-footer__cta">
        <p className="dd-label">Next</p>
        <h2 className="dd-footer__title">Have something that needs shaping?</h2>
        <div className="dd-footer__actions">
          <a href={CONTACT_URL} className="dd-btn dd-btn--red dd-btn--lg">
            Start a project <span aria-hidden>↗</span>
          </a>
          <a href={CAREERS_URL} className="dd-btn dd-btn--line dd-btn--lg">
            Join the studio <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <div className="dd-footer__links">
        <nav aria-label="Footer" className="dd-footer__col">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className="dd-footer__link">
              {item.label}
            </FlowLink>
          ))}
        </nav>
        <div className="dd-footer__col">
          <a href={CAREERS_URL} className="dd-footer__link">
            Careers <span aria-hidden>↗</span>
          </a>
          <a href={JOURNAL_URL} className="dd-footer__link">
            Journal <span aria-hidden>↗</span>
          </a>
          <a href={PRIVACY_URL} className="dd-footer__link">
            Privacy <span aria-hidden>↗</span>
          </a>
        </div>
        <div className="dd-footer__col">
          {SOCIALS.map((social) => (
            <a key={social.href} href={social.href} className="dd-footer__link">
              {social.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        <div className="dd-footer__col dd-footer__col--end">
          <a href={MAIN_SITE} className="dd-footer__link">
            Part of Digitally Next <span aria-hidden>↗</span>
          </a>
          <span className="dd-footer__copy">© {COPYRIGHT_YEAR} Digitally Next</span>
        </div>
      </div>
    </footer>
  );
}
