import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { FIELDS, fieldStyle } from "./colour";

/** The page ends where it began: the red field pours back in, with the same footer content as the site. */
export function DraftFooter() {
  return (
    <footer className="dc-field dc-footer" data-field style={fieldStyle(FIELDS.red)}>
      <div className="dc-footer__cta">
        <p className="dc-tag">Next</p>
        <h2 className="dc-mega dc-footer__title">Have something that needs shaping?</h2>
        <div className="dc-footer__actions">
          <a href={CONTACT_URL} className="dc-btn dc-btn--solid dc-btn--lg">
            Start a project <span aria-hidden>↗</span>
          </a>
          <a href={CAREERS_URL} className="dc-btn dc-btn--lg">
            Join the studio <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <div className="dc-footer__links">
        <nav aria-label="Footer" className="dc-footer__col">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className="dc-footer__link">
              {item.label}
            </FlowLink>
          ))}
        </nav>
        <div className="dc-footer__col">
          <a href={CAREERS_URL} className="dc-footer__link">
            Careers <span aria-hidden>↗</span>
          </a>
          <a href={JOURNAL_URL} className="dc-footer__link">
            Journal <span aria-hidden>↗</span>
          </a>
          <a href={PRIVACY_URL} className="dc-footer__link">
            Privacy <span aria-hidden>↗</span>
          </a>
        </div>
        <div className="dc-footer__col">
          {SOCIALS.map((social) => (
            <a key={social.href} href={social.href} className="dc-footer__link">
              {social.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        <div className="dc-footer__col dc-footer__col--end">
          <a href={MAIN_SITE} className="dc-footer__link">
            Part of Digitally Next <span aria-hidden>↗</span>
          </a>
          <span className="dc-footer__note">© {COPYRIGHT_YEAR} Digitally Next</span>
        </div>
      </div>
      <span className="dc-footer__mark" aria-hidden />
    </footer>
  );
}
