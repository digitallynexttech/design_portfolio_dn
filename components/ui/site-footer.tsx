import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { FlowLink } from "./flow-link";

// Footer links: 40px tall rows on phones (thumb-sized), compact on desktop. Text stays at 75% over the water.
const LINK = "py-2.5 transition-colors hover:text-paper md:py-1.5";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-paper/10 px-(--gutter) pt-section pb-28 md:pb-12">
      {/* .footer-cta: the case-study pages hide it on every chapter but the last. */}
      <div className="footer-cta pb-20 md:pb-28">
        <p className="label">(∞) Next</p>
        <h2 className="mt-4 font-display text-d1 font-semibold">
          Have something that needs shaping<span className="stop">?</span>
        </h2>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-12">
          <a
            href={CONTACT_URL}
            className="btn btn--primary btn--lg"
          >
            Start a project <span aria-hidden>↗</span>
          </a>
          <a
            href={CAREERS_URL}
            className="btn btn--lg"
          >
            Join the studio <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 text-sm text-paper/75 md:grid-cols-4">
        <nav aria-label="Footer" className="flex flex-col">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className={LINK}>
              {item.label}
            </FlowLink>
          ))}
        </nav>
        <div className="flex flex-col">
          <a href={CAREERS_URL} className={LINK}>
            Careers <span aria-hidden>↗</span>
          </a>
          <a href={JOURNAL_URL} className={LINK}>
            Journal <span aria-hidden>↗</span>
          </a>
          <a href={PRIVACY_URL} className={LINK}>
            Privacy <span aria-hidden>↗</span>
          </a>
        </div>
        <div className="flex flex-col">
          {SOCIALS.map((social) => (
            <a key={social.href} href={social.href} className={LINK}>
              {social.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        <div className="flex flex-col md:text-right">
          <a href={MAIN_SITE} className={LINK}>
            Part of Digitally Next <span aria-hidden>↗</span>
          </a>
          <span className="py-2.5 md:py-1.5">© {COPYRIGHT_YEAR} Digitally Next</span>
        </div>
      </div>
    </footer>
  );
}
