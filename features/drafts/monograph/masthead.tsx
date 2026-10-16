"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

type Running = { label: string; folio: string };

/**
 * The book's running head. On wide screens a slim bar across the top: the imprint, the chapter
 * you are reading with its folio, and the way out. On phones the same line runs along the foot of
 * the page, in the thumb zone, with the Menu at its end, like the folio line of a pocket book.
 * The chapter comes from whichever [data-chapter] block crosses the middle of the screen.
 */
export function Masthead() {
  const [running, setRunning] = useState<Running>({ label: "Digitally Next Design", folio: "" });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(".d-monograph [data-chapter]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          setRunning({ label: el.dataset.chapter ?? "", folio: el.dataset.folio ?? "" });
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const block of blocks) observer.observe(block);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="m-head">
        <div className="m-head__bar">
          <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="m-head__logo">
            <Image src="/brand/logo-color.png" alt="" width={1056} height={224} sizes="152px" preload className="m-head__logo-img" />
          </FlowLink>
          <p className="m-head__running" aria-hidden>
            <span key={running.label} className="m-head__chapter">
              {running.label}
            </span>
            {running.folio ? <span className="m-head__folio">p.&nbsp;{running.folio}</span> : null}
          </p>
          <nav aria-label="Main" className="m-head__nav">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="m-head__link">
                {item.label}
              </FlowLink>
            ))}
            <a href={CONTACT_URL} className="m-head__cta">
              Start a project <span aria-hidden>↗</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Phones: the running foot, with the menu in reach of the thumb. */}
      <div className="m-foot">
        <p className="m-foot__running" aria-hidden>
          <span className="m-foot__folio">{running.folio ? `p. ${running.folio}` : "—"}</span>
          <span key={running.label} className="m-foot__chapter">
            {running.label}
          </span>
        </p>
        <button type="button" className="m-foot__menu" onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
          Menu
        </button>
      </div>
      <LiquidSurface open={menuOpen} onClose={() => setMenuOpen(false)} origin="bottom" label="Menu">
        <nav aria-label="Site" className="m-menu">
          <ol className="m-menu__list">
            {[{ href: "/", label: "Home" }, ...NAV].map((item, i) => (
              <li key={item.href}>
                <FlowLink href={item.href} onClick={() => setMenuOpen(false)} className="m-menu__link">
                  <span className="m-menu__no" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </FlowLink>
              </li>
            ))}
          </ol>
          <div className="m-menu__actions">
            <a href={CONTACT_URL} className="m-btn m-btn--ink">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="m-btn">
              Careers <span aria-hidden>↗</span>
            </a>
          </div>
        </nav>
      </LiquidSurface>
    </>
  );
}
