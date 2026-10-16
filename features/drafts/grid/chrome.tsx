"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { setWaterCovered } from "@/features/water/bus";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

export type SheetRef = { id: string; no: string; name: string };

/** Where on screen a sheet becomes "current": its top passing 35% of the way down. */
const READ_LINE = 0.35;

/**
 * The document's chrome on this draft: a ruled header with a running head (the sheet you are on
 * and how far down the document you are), a red level line under it, the water-level gauge in the
 * left margin on wide screens (each sheet marked on it, and a link), and the phone's index.
 * All readouts are written straight to the DOM from one scroll frame; nothing re-renders on scroll.
 */
export function SheetChrome({ sheets }: { sheets: SheetRef[] }) {
  const header = useRef<HTMLElement>(null);
  const rail = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);

  // The site's WebGL water is hidden on this route (grid.css); this tells it to stop drawing too.
  useEffect(() => {
    setWaterCovered("draft-grid", true);
    return () => setWaterCovered("draft-grid", false);
  }, []);

  useEffect(() => {
    const top = header.current;
    const gauge = rail.current;
    if (!top || !gauge) return;
    const runNo = top.querySelector<HTMLElement>("[data-run-no]");
    const runName = top.querySelector<HTMLElement>("[data-run-name]");
    const runPct = top.querySelector<HTMLElement>("[data-run-pct]");
    const levelOut = gauge.querySelector<HTMLElement>("[data-level]");
    const marks = Array.from(gauge.querySelectorAll<HTMLElement>("[data-mark]"));
    const targets = sheets.map((s) => document.getElementById(s.id));

    let at: number[] = sheets.map(() => 0);
    let current = -1;
    let shownPct = "";
    let raf = 0;

    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      at = targets.map((el) => {
        if (!el) return 0;
        const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * READ_LINE;
        return Math.min(1, Math.max(0, y / max));
      });
      // On the gauge, marks keep a label's height apart, even where two sheets share a level.
      const shown = at.map((v) => v);
      for (let i = 1; i < shown.length; i++) shown[i] = Math.max(shown[i], shown[i - 1] + 0.03);
      marks.forEach((m, i) => m.style.setProperty("--at", Math.min(1, shown[i]).toFixed(4)));
    };

    const frame = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      top.style.setProperty("--p", p.toFixed(4));
      gauge.style.setProperty("--p", p.toFixed(4));
      const pct = (p * 100).toFixed(1).padStart(4, "0");
      if (pct !== shownPct) {
        shownPct = pct;
        if (runPct) runPct.textContent = pct;
        if (levelOut) levelOut.textContent = pct;
      }
      let now = 0;
      for (let i = 0; i < at.length; i++) if (p + 1e-4 >= at[i]) now = i;
      if (now !== current) {
        current = now;
        if (runNo) runNo.textContent = sheets[now]?.no ?? "";
        if (runName) runName.textContent = sheets[now]?.name ?? "";
        marks.forEach((m, i) => m.toggleAttribute("data-on", i === now));
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    measure();
    frame();
    // Images, fonts and the stacked sheets change the document's height after load.
    const ro = new ResizeObserver(() => {
      measure();
      kick();
    });
    ro.observe(document.body);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [sheets]);

  // The phone index is a native modal dialog: focus is held inside, Escape closes it.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (menu && !d.open) d.showModal();
    if (!menu && d.open) d.close();
  }, [menu]);

  const close = () => {
    setMenu(false);
    opener.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <header ref={header} className="dg-top">
        <div className="dg-top__bar">
          <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="dg-top__logo">
            <Image src="/brand/logo-color.png" alt="" width={1056} height={224} sizes="104px" loading="eager" />
          </FlowLink>
          <p className="dg-top__run" aria-hidden>
            <span className="dg-top__runno">
              § <span data-run-no>{sheets[0]?.no}</span>
            </span>
            <span data-run-name className="dg-top__runname">
              {sheets[0]?.name}
            </span>
            <span className="dg-top__leader" />
            <span className="dg-top__runpct">
              <span data-run-pct>00.0</span>%
            </span>
          </p>
          <nav aria-label="Main" className="dg-top__nav">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} className="dg-top__link">
                {item.label}
              </FlowLink>
            ))}
            <a href={CONTACT_URL} className="dg-btn dg-btn--ink dg-btn--sm">
              Start a project <span aria-hidden>↗</span>
            </a>
          </nav>
          <button ref={opener} type="button" className="dg-top__menu" aria-haspopup="dialog" onClick={() => setMenu(true)}>
            <span className="dg-top__menuicon" aria-hidden />
            Index
          </button>
        </div>
        <div className="dg-top__level" aria-hidden>
          <span />
        </div>
      </header>

      <nav ref={rail} className="dg-rail" aria-label="Sheets">
        <span className="dg-rail__scale" aria-hidden />
        <ol className="dg-rail__marks">
          {sheets.map((s) => (
            <li key={s.id} data-mark className="dg-rail__mark">
              <a href={`#${s.id}`} className="dg-rail__link">
                <span aria-hidden>{s.no}</span>
                <span className="sr-only">
                  {s.no} {s.name}
                </span>
              </a>
            </li>
          ))}
        </ol>
        <span className="dg-rail__level" aria-hidden>
          <span className="dg-rail__tri" />
        </span>
        <span className="dg-rail__read" aria-hidden>
          <span>LVL</span>
          <span data-level>00.0</span>
        </span>
      </nav>

      <dialog
        ref={dialog}
        className="dg-menu"
        aria-label="Index"
        onClose={() => setMenu(false)}
        onClick={(e) => {
          // A click on the backdrop (the dialog box itself, outside its sheet) closes it.
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dg-menu__sheet">
          <div className="dg-menu__head">
            <p className="dg-k">Index · {sheets.length} sheets</p>
            <button type="button" className="dg-menu__close" onClick={close}>
              Close
            </button>
          </div>
          <nav aria-label="Sheets on this page">
            <ol className="dg-menu__sheets">
              {sheets.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} onClick={() => setMenu(false)} className="dg-menu__sheet-link">
                    <span className="dg-menu__no">{s.no}</span>
                    {s.name}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <nav aria-label="Site" className="dg-menu__site">
            {NAV.map((item) => (
              <FlowLink key={item.href} href={item.href} onClick={() => setMenu(false)} className="dg-menu__link">
                {item.label} <span aria-hidden>→</span>
              </FlowLink>
            ))}
          </nav>
          <div className="dg-menu__cta">
            <a href={CONTACT_URL} className="dg-btn dg-btn--ink">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="dg-btn">
              Careers <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** New Delhi's time, to the second: a live readout in the title block. */
export function LocalTime() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => {
      el.textContent = format.format(new Date());
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span ref={ref} className="dg-num">
      --:--:--
    </span>
  );
}

/** The title's measured width in CSS pixels, kept true through resizes and the font swap. */
export function MeasureTitle() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const out = ref.current;
    const text = out?.closest(".dg-hero__title")?.querySelector<HTMLElement>(".dg-h1__text");
    if (!out || !text) return;
    const write = () => {
      out.textContent = String(Math.round(text.getBoundingClientRect().width));
    };
    const ro = new ResizeObserver(write);
    ro.observe(text);
    void document.fonts.ready.then(write);
    return () => ro.disconnect();
  }, []);
  return (
    <span ref={ref} className="dg-num">
      0000
    </span>
  );
}
