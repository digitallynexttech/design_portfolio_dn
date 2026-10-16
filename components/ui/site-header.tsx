"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";
import { FlowLink } from "./flow-link";

export function SiteHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tucked = hidden && !menuOpen;

  // Hide on the way down, return on the way up (PLAN §6.1).
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sticky bars below the header (case-study chapters) read this to sit under it while it shows.
  useEffect(() => {
    document.documentElement.dataset.header = tucked ? "hidden" : "shown";
  }, [tucked]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const tuck = tucked ? "translateY(calc(-100% - 2rem))" : "none";

  return (
    <>
      {/* The header's glass sits beside it, not inside: the header's view-transition-name makes it
          a backdrop root, and a blur inside it could only see the header itself. */}
      <div
        aria-hidden
        className="site-header-glass transition-transform duration-(--dur-4) ease-flow"
        style={{ viewTransitionName: "site-header-glass", transform: tuck }}
      />
      <header
        className="site-header fixed inset-x-0 top-0 z-40 px-(--gutter) pt-5 transition-transform duration-(--dur-4) ease-flow"
        // A keyboard user tabbing into a tucked header brings it back.
        onFocusCapture={() => setHidden(false)}
        style={{ viewTransitionName: "site-header", transform: tuck }}
      >
        <div className="flex h-9.5 items-center justify-between gap-6">
          {/* py-2 makes the tap area 44px; -my-2 gives the height back, so the bar doesn't grow. */}
          <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="-my-2 shrink-0 py-2">
            <Image src="/brand/logo-white.png" alt="" width={1512} height={321} sizes="152px" preload className="logo-on-dark h-7 w-auto md:h-8" />
            <Image src="/brand/logo-color.png" alt="" width={1056} height={224} sizes="152px" className="logo-on-light h-7 w-auto md:h-8" />
          </FlowLink>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm md:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <FlowLink
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="px-1 py-2 opacity-80 transition-opacity hover:opacity-100 aria-[current=page]:opacity-100 pointer-coarse:py-3"
                >
                  {item.label}
                  {active ? (
                    <span className="stop" aria-hidden>
                      .
                    </span>
                  ) : null}
                </FlowLink>
              );
            })}
            <a href={CONTACT_URL} className="btn site-header__cta ml-2">
              Start a project <span aria-hidden>↗</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Phones: the menu lives in the thumb zone and flows up as a liquid sheet. Pinned through page
          changes like the header (globals.css, menu-pill). */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-haspopup="dialog"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-40 min-h-11.5 -translate-x-1/2 rounded-full border border-paper/15 bg-ink/70 px-6 text-sm font-medium text-paper backdrop-blur-xl transition-[scale] active:scale-97 md:hidden"
        style={{ viewTransitionName: "menu-pill" }}
      >
        Menu
      </button>
      <LiquidSurface open={menuOpen} onClose={() => setMenuOpen(false)} origin="bottom" label="Menu">
        <nav aria-label="Site" className="flex flex-col gap-1 pb-4">
          {[{ href: "/", label: "Home" }, ...NAV].map((item) => {
            const current = item.href === "/" ? pathname === "/" : isActive(item.href);
            return (
              // As in the header, the teal stop marks the page you're on. The focus ring follows the
              // sheet's corners.
              <FlowLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={current ? "page" : undefined}
                className="-mx-2 rounded-inner px-2 font-display text-5xl font-semibold tracking-tight text-paper/70 aria-[current=page]:text-paper"
              >
                {item.label}
                {current ? (
                  <span className="stop" aria-hidden>
                    .
                  </span>
                ) : null}
              </FlowLink>
            );
          })}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={CONTACT_URL} className="btn btn--primary">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="btn">
              Careers <span aria-hidden>↗</span>
            </a>
          </div>
        </nav>
      </LiquidSurface>
    </>
  );
}
