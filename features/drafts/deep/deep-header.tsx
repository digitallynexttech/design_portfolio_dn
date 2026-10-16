"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

const OPEN_MENU = "dd-open-menu";

/**
 * The draft's own header: the top bar of the letterbox. Clear over the hero's black bar, an opaque
 * strip of abyss once the page moves, tucked away on the way down and back on the way up. Phones get
 * a Menu button that pours the site menu up from the bottom (DeepMenu, the shared LiquidSurface).
 */
export function DeepHeader() {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let last = window.scrollY;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      el.toggleAttribute("data-solid", y > 24);
      if (Math.abs(y - last) < 6) return;
      el.toggleAttribute("data-tucked", y > last && y > window.innerHeight * 0.6);
      last = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header ref={bar} className="dd-header" onFocusCapture={() => bar.current?.removeAttribute("data-tucked")}>
      {/* Not prefetched: decoding the home page's payload in the background cost the draft's first
          seconds a long task, and home is one click (and a fetch) away anyway. */}
      <FlowLink href="/" direction="back" prefetch={false} aria-label="Digitally Next Design, home" className="dd-header__logo">
        <Image src="/brand/logo-white.png" alt="" width={1512} height={321} sizes="152px" />
      </FlowLink>
      <nav aria-label="Main" className="dd-header__nav">
        {NAV.map((item) => (
          <FlowLink key={item.href} href={item.href} className="dd-header__link">
            {item.label}
          </FlowLink>
        ))}
        <a href={CONTACT_URL} className="dd-btn dd-btn--line dd-header__cta">
          <span className="dd-signal" aria-hidden />
          Start a project <span aria-hidden>↗</span>
        </a>
      </nav>
      <button type="button" className="dd-header__menu" aria-haspopup="dialog" onClick={() => window.dispatchEvent(new Event(OPEN_MENU))}>
        Menu
      </button>
    </header>
  );
}

/**
 * The phone menu sheet. Rendered at the end of the page rather than inside the header, so the
 * opening shot comes first in the HTML and paints with the first chunk the browser receives.
 */
export function DeepMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_MENU, onOpen);
    return () => window.removeEventListener(OPEN_MENU, onOpen);
  }, []);

  return (
    <LiquidSurface open={open} onClose={() => setOpen(false)} origin="bottom" label="Menu">
      <nav aria-label="Site" className="dd-sheet">
        {[{ href: "/", label: "Home" }, ...NAV].map((item) => (
          <FlowLink key={item.href} href={item.href} onClick={() => setOpen(false)} className="dd-sheet__link">
            {item.label}
          </FlowLink>
        ))}
        <div className="dd-sheet__actions">
          <a href={CONTACT_URL} className="dd-btn dd-btn--red">
            Start a project <span aria-hidden>↗</span>
          </a>
          <a href={CAREERS_URL} className="dd-btn dd-btn--line">
            Careers <span aria-hidden>↗</span>
          </a>
        </div>
      </nav>
    </LiquidSurface>
  );
}
