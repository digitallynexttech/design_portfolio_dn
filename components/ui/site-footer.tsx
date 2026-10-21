import { CAREERS_URL, CONTACT_URL, COPYRIGHT_YEAR, JOURNAL_URL, MAIN_SITE, NAV, PRIVACY_URL, SOCIALS } from "@/lib/site";
import { MascotWindow } from "@/features/mascot/mascot-window";
import { FlowLink } from "./flow-link";

// Footer links: full-width 44px rows on touch screens (thumb-sized); with a mouse, compact and only as wide
// as their text, so hover and focus hug the words. Text stays at 75% over the water.
const LINK = "py-3 transition-colors hover:text-paper md:pointer-fine:py-1.5";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-paper/10 px-(--gutter) pt-section pb-28 md:pb-12">
      {/* .footer-cta: the case-study pages hide it on every chapter but the last. */}
      <div className="footer-cta flex flex-col items-center pb-20 text-center md:pb-28">
        <p className="label">(∞) Next</p>
        {/* Two staggered lines with the X's window beside the first; on phones the window leads. */}
        <h2 className="mt-16 flex flex-col items-center font-display text-statement font-semibold md:mt-14">
          <span className="flex flex-col items-center gap-5 md:translate-x-[-0.8em] md:flex-row md:items-end md:gap-[0.3em]">
            <span>Have something</span>
            <MascotWindow className="order-first md:order-0" />
          </span>
          <span className="md:translate-x-[0.8em]">
            that needs shaping<span className="stop">?</span>
          </span>
        </h2>
        <p className="mt-6 max-w-[34ch] text-lg text-balance text-(--text-2) md:mt-8">Tell us what you&apos;re making. We&apos;ll take its shape.</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center md:mt-10">
          <a
            href={CONTACT_URL}
            className="btn btn--primary btn--lg"
            data-mascot-wave
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
        <nav aria-label="Footer" className="flex flex-col pointer-fine:items-start">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className={LINK}>
              {item.label}
            </FlowLink>
          ))}
        </nav>
        <div className="flex flex-col pointer-fine:items-start">
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
        <div className="flex flex-col pointer-fine:items-start">
          {SOCIALS.map((social) => (
            <a key={social.href} href={social.href} className={LINK}>
              {social.label} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
        <div className="flex flex-col pointer-fine:items-start md:text-right md:pointer-fine:items-end">
          <a href={MAIN_SITE} className={LINK}>
            Part of Digitally Next <span aria-hidden>↗</span>
          </a>
          <span className="py-3 md:pointer-fine:py-1.5">© {COPYRIGHT_YEAR} Digitally Next</span>
        </div>
      </div>
    </footer>
  );
}
