"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

/**
 * The draft's own header: the logo, the three pages and "Start a project". On phones the pages move
 * into a native modal dialog (focus held inside, Escape closes it), opened from a 44 px menu button
 * (three lines, named "Menu").
 */
export function DepthHeader() {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };

  return (
    <header className="dp-top">
      <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="dp-top__logo">
        <Image src="/brand/logo-white.png" alt="" width={1512} height={321} sizes="208px" loading="eager" />
      </FlowLink>
      <nav aria-label="Main" className="dp-top__nav">
        {NAV.map((item) => (
          <FlowLink key={item.href} href={item.href} className="dp-top__link">
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
              <FlowLink key={item.href} href={item.href} onClick={() => setOpen(false)} className="dp-menu__link">
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
