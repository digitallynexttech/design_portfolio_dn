"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { FlowLink } from "@/components/ui/flow-link";
import { setWaterCovered } from "@/features/water/bus";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

type Tone = { bg: string; fg: string };

/**
 * Draft 3's header. It takes the colour of whichever field it floats over: the logo, links and the
 * "Start a project" pill are drawn in that field's text colour (so they keep the field's contrast),
 * and once the page scrolls it sits on a capsule of the field's own colour. It tucks away on the way
 * down and returns on the way up. On phones a Menu pill in the thumb zone takes the colours of the
 * field at the bottom of the screen and opens the shared liquid sheet.
 *
 * It also rests the site's WebGL water for as long as this page is open: the draft paints its own
 * opaque fields, so the water would be drawing behind them unseen.
 */
export function DraftHeader() {
  const header = useRef<HTMLElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setWaterCovered("draft-current", true);
    return () => setWaterCovered("draft-current", false);
  }, []);

  // Leaving the page keeps it mounted but hidden (cacheComponents); flag <html> in the same commit,
  // so current.css hands the site's own header, footer and water back at once (see its top).
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.removeAttribute("data-dc-away");
    return () => html.setAttribute("data-dc-away", "");
  }, []);

  useEffect(() => {
    const bar = header.current;
    const menu = pill.current;
    const root = bar?.closest<HTMLElement>(".d-current");
    if (!bar || !menu || !root) return;
    let fields: { top: number; bottom: number; tone: Tone }[] = [];
    const measure = () => {
      const y = window.scrollY;
      fields = Array.from(root.querySelectorAll<HTMLElement>("[data-field]")).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top + y,
          bottom: r.bottom + y,
          tone: { bg: el.style.getPropertyValue("--bg"), fg: el.style.getPropertyValue("--fg") },
        };
      });
    };
    const at = (y: number) => fields.find((f) => y >= f.top && y < f.bottom)?.tone;

    let top: Tone | undefined;
    let bottom: Tone | undefined;
    let last = window.scrollY;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const y = window.scrollY;
      const t = at(y + 34);
      if (t && t !== top) {
        top = t;
        bar.style.setProperty("--hdr-bg", t.bg);
        bar.style.setProperty("--hdr-fg", t.fg);
      }
      const b = at(y + window.innerHeight - 44);
      if (b && b !== bottom) {
        bottom = b;
        menu.style.setProperty("--pill-bg", b.fg);
        menu.style.setProperty("--pill-fg", b.bg);
      }
      bar.toggleAttribute("data-scrolled", y > 8);
      if (Math.abs(y - last) > 6) {
        // A keyboard user inside the header keeps it in view.
        const hide = y > last && y > 160 && !bar.contains(document.activeElement);
        bar.toggleAttribute("data-tucked", hide);
        last = y;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    // No measuring here: the observer's first callback arrives after layout, so reading the fields'
    // positions then never forces a layout of its own during hydration.
    const ro = new ResizeObserver(() => {
      measure();
      kick();
    });
    ro.observe(root);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, []);

  return (
    <>
      <header ref={header} className="dc-header" onFocusCapture={() => header.current?.removeAttribute("data-tucked")}>
        <div className="dc-header__bar">
          {/* Not prefetched: the home page's payload is large, and loading it would compete with this page's first paint. */}
          <FlowLink href="/" direction="back" prefetch={false} aria-label="Digitally Next Design, home" className="dc-header__home">
            <span className="dc-logo" aria-hidden />
          </FlowLink>
          <nav aria-label="Main" className="dc-header__nav">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="dc-header__link">
                {item.label}
              </FlowLink>
            ))}
            <a href={CONTACT_URL} className="dc-header__cta">
              Start a project <span aria-hidden>↗</span>
            </a>
          </nav>
        </div>
      </header>

      <button ref={pill} type="button" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" className="dc-menu-pill">
        <span className="dc-menu-pill__drop" aria-hidden />
        Menu
      </button>
      <LiquidSurface open={menuOpen} onClose={() => setMenuOpen(false)} origin="bottom" label="Menu">
        <nav aria-label="Site" className="dc-sheet">
          {[{ href: "/", label: "Home" }, ...NAV].map((item) => (
            <FlowLink key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="dc-sheet__link">
              {item.label}
            </FlowLink>
          ))}
          <div className="dc-sheet__actions">
            <a href={CONTACT_URL} className="dc-btn dc-btn--solid">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="dc-btn">
              Careers <span aria-hidden>↗</span>
            </a>
          </div>
        </nav>
      </LiquidSurface>
    </>
  );
}
