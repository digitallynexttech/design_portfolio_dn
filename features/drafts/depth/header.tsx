"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

/**
 * The draft's own header: the logo, the three pages and "Start a project". On phones the pages move
 * into a native modal dialog (focus held inside, Escape closes it), opened from a 44 px menu button
 * (three lines, named "Menu"). Scrolling on down the page it slides up out of view, and scrolling
 * back up brings it down again (Karan, 23 Oct 2026); it is always there near the top, while its
 * menu is open and while a key has focus in it. Every page has it (Karan, 26 Oct 2026: the home's
 * theme everywhere): the others in .dn-theme (site-chrome.tsx), where it marks the page you're on
 * and keeps still through page transitions (`transitionName`). html[data-header] says whether it
 * shows, for the case studies' chapter bar, which sits under it (work.css).
 */
export function DepthHeader({ transitionName }: { transitionName?: string }) {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    // a few px either way is a hand on the wheel, not a direction
    const STEP = 8;
    const TOP = 80;
    let last = window.scrollY;
    let raf = 0;
    const show = (on: boolean) => {
      el.toggleAttribute("data-hidden", !on);
      document.documentElement.dataset.header = on ? "shown" : "hidden";
    };
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      if (y < TOP || open) {
        show(true);
        last = y;
      } else if (y - last > STEP) {
        show(false);
        last = y;
      } else if (last - y > STEP) {
        show(true);
        last = y;
      }
    };
    const onFocus = () => show(true);
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocus);
      cancelAnimationFrame(raf);
    };
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  const close = () => {
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };

  return (
    <header ref={bar} className="dp-top" style={transitionName ? { viewTransitionName: transitionName } : undefined}>
      <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="dp-top__logo">
        <Image src="/brand/logo-white.png" alt="" width={1512} height={321} sizes="208px" loading="eager" />
      </FlowLink>
      <nav aria-label="Main" className="dp-top__nav">
        {NAV.map((item) => (
          <FlowLink key={item.href} href={item.href} className="dp-top__link" aria-current={current(item.href)}>
            {item.label}
          </FlowLink>
        ))}
        <a href={CONTACT_URL} className="dp-top__cta">
          Start a project <span aria-hidden>↗</span>
        </a>
      </nav>
      <button ref={opener} type="button" className="dp-top__menu" aria-haspopup="dialog" aria-label="Menu" onClick={() => setOpen(true)}>
        <span className="dp-top__bars" aria-hidden />
      </button>

      <dialog
        ref={dialog}
        className="dp-menu"
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dp-menu__sheet">
          <div className="dp-menu__head">
            <span className="dp-k">Digitally Next Design</span>
            <button type="button" className="dp-menu__close" onClick={close}>
              Close
            </button>
          </div>
          <nav aria-label="Site" className="dp-menu__nav">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} onClick={() => setOpen(false)} className="dp-menu__link" aria-current={current(item.href)}>
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dp-menu__cta">
            <a href={CONTACT_URL} className="dp-btn dp-btn--red">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="dp-btn">
              Careers <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </dialog>
    </header>
  );
}
