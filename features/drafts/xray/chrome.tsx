"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";
import { pad } from "./parts";

export type Mode = "design" | "build";

/** Fired on window whenever the page flips, so the lenses and the inspector can follow. */
export const MODE_EVENT = "dx:mode";

/** How long the scan line takes to cross the screen. */
const SCAN_MS = 900;

const calm = () =>
  document.documentElement.dataset.motion === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const round = (n: number) => Math.round(n);

type Metrics = { asc: number; desc: number; cap: number; xh: number };

/**
 * Build mode turns type into its metrics. For every [data-tm] element this measures the real line
 * box, baseline, cap height and x-height (from the font itself, through a canvas), hands them to
 * the CSS as custom properties, and writes the element's spec as its label.
 */
function measureType(root: HTMLElement) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return;
  const cache = new Map<string, Metrics>();
  for (const el of root.querySelectorAll<HTMLElement>("[data-tm]")) {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    if (!size) continue;
    const lh = cs.lineHeight === "normal" ? size * 1.2 : parseFloat(cs.lineHeight);
    const font = `${cs.fontStyle === "italic" ? "italic " : ""}${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    let m = cache.get(font);
    if (!m) {
      ctx.font = font;
      const box = ctx.measureText("Hxg");
      m = {
        asc: box.fontBoundingBoxAscent,
        desc: box.fontBoundingBoxDescent,
        cap: ctx.measureText("H").actualBoundingBoxAscent,
        xh: ctx.measureText("x").actualBoundingBoxAscent,
      };
      cache.set(font, m);
    }
    const base = (lh - (m.asc + m.desc)) / 2 + m.asc;
    el.style.setProperty("--tm-lh", `${lh.toFixed(2)}px`);
    el.style.setProperty("--tm-base", `${base.toFixed(2)}px`);
    el.style.setProperty("--tm-cap", `${(base - m.cap).toFixed(2)}px`);
    el.style.setProperty("--tm-x", `${(base - m.xh).toFixed(2)}px`);
    const name = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    const ls = parseFloat(cs.letterSpacing);
    el.dataset.tmLabel = `${name} ${cs.fontWeight} · ${round(size)}/${round(lh)}${Number.isFinite(ls) && Math.abs(ls) >= 0.05 ? ` · ${ls.toFixed(1)}` : ""} · cap ${round(m.cap)} · x ${round(m.xh)}`;
  }
}

/** Each section's top padding, measured, for its vertical dimension in Build mode. */
function measurePads(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>(".dx-pad")) {
    const host = el.parentElement;
    const out = el.querySelector<HTMLElement>("[data-pad]");
    if (!host || !out) continue;
    const v = String(round(parseFloat(getComputedStyle(host).paddingTop) || 0));
    if (out.textContent !== v) out.textContent = v;
  }
}

/**
 * The draft's chrome: a ruled header with the live pointer coordinates, the site nav, the
 * Design / Build switch and the way to start a project; the column overlay and scan line that
 * Build mode uses; and the phone's menu. The switch also answers to the B key.
 */
export function Chrome({ cols }: { cols: number }) {
  const header = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const modeRef = useRef<Mode>("design");
  const [mode, setMode] = useState<Mode>("design");
  const [menu, setMenu] = useState(false);

  // One function flips the page: it times each visible element to the scan line, swaps the
  // root's mode, and runs the scan. Everything after that is CSS transitions.
  const flipRef = useRef<(next: Mode) => void>(() => undefined);
  useEffect(() => {
    const root = header.current?.closest<HTMLElement>(".d-xray");
    if (!root) return;
    const scan = root.querySelector<HTMLElement>(".dx-scan");

    const flip = (next: Mode) => {
      if (next === modeRef.current) return;
      modeRef.current = next;
      setMode(next);
      const still = calm();
      const down = next === "build";
      if (down) {
        measureType(root);
        measurePads(root);
      }
      const vh = window.innerHeight;
      for (const el of root.querySelectorAll<HTMLElement>(".dx-plate, [data-tm], .dx-btn, .dx-bp")) {
        const r = el.getBoundingClientRect();
        let d = 0;
        if (!still && r.bottom > 0 && r.top < vh) {
          const at = Math.min(1, Math.max(0, r.top / vh));
          d = (down ? at : 1 - Math.min(1, Math.max(0, r.bottom / vh))) * SCAN_MS * 0.85;
        }
        el.style.setProperty("--sd", `${round(Math.max(0, d))}ms`);
      }
      root.dataset.mode = next;
      if (scan && !still) {
        scan.removeAttribute("data-dir");
        void scan.offsetWidth;
        scan.dataset.dir = down ? "down" : "up";
      }
      window.dispatchEvent(new CustomEvent<Mode>(MODE_EVENT, { detail: next }));
    };
    flipRef.current = flip;

    // Next keeps a page you leave as a hidden copy and re-runs effects when it comes back: the
    // switch keeps its state, so the page does too (no scan, it's already there).
    if (modeRef.current === "build") {
      root.dataset.mode = "build";
      measureType(root);
      measurePads(root);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "b" && e.key !== "B" && e.key !== "d" && e.key !== "D") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("dialog"))) return;
      if (e.key === "b" || e.key === "B") flip(modeRef.current === "build" ? "design" : "build");
      else flip("design");
    };
    const onScanEnd = () => scan?.removeAttribute("data-dir");

    // While in Build mode, the measurements follow the layout.
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (modeRef.current !== "build") return;
        measureType(root);
        measurePads(root);
      }, 120);
    };
    void document.fonts.ready.then(onResize);

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    scan?.addEventListener("animationend", onScanEnd);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      scan?.removeEventListener("animationend", onScanEnd);
      delete root.dataset.mode;
    };
  }, []);

  // The phone menu is a native modal dialog: focus is held inside, Escape closes it.
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

  const toggle = (
    <div className="dx-mode" role="group" aria-label="View the page as">
      <span className="dx-mode__thumb" aria-hidden />
      <button type="button" className="dx-mode__btn" aria-pressed={mode === "design"} onClick={() => flipRef.current("design")}>
        Design
      </button>
      <button type="button" className="dx-mode__btn" aria-pressed={mode === "build"} onClick={() => flipRef.current("build")}>
        Build
      </button>
    </div>
  );

  return (
    <>
      <header ref={header} className="dx-top">
        <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="dx-top__logo">
          <Image src="/brand/logo-color.png" alt="" width={1056} height={224} sizes="116px" loading="eager" />
        </FlowLink>
        <p className="dx-top__xy dx-k" aria-hidden>
          <span>x</span>
          <b data-coord="x">0000</b>
          <span>y</span>
          <b data-coord="y">0000</b>
        </p>
        <nav aria-label="Main" className="dx-top__nav">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className="dx-top__link">
              {item.label}
            </FlowLink>
          ))}
        </nav>
        <div className="dx-top__mode">
          {toggle}
          <span className="dx-top__key dx-k" aria-hidden>
            <kbd>B</kbd>
          </span>
        </div>
        <a href={CONTACT_URL} className="dx-btn dx-btn--ink dx-btn--sm dx-top__cta">
          Start a project <span aria-hidden>↗</span>
        </a>
        <button ref={opener} type="button" className="dx-top__menu" aria-haspopup="dialog" onClick={() => setMenu(true)}>
          <span className="dx-top__burger" aria-hidden />
          Menu
        </button>
      </header>

      {/* Build mode: the page's own column grid, drawn over everything, and the scan that flips it. */}
      <div className="dx-cols" aria-hidden>
        {Array.from({ length: cols }, (_, i) => (
          <span key={i} className="dx-cols__c" style={{ transitionDelay: `${i * 28}ms` }}>
            <i>{pad(i + 1)}</i>
          </span>
        ))}
      </div>
      <div className="dx-scan" aria-hidden>
        <span className="dx-scan__tag">Scan</span>
      </div>

      <dialog
        ref={dialog}
        className="dx-menu"
        aria-label="Menu"
        onClose={() => setMenu(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dx-menu__sheet">
          <div className="dx-menu__head">
            <p className="dx-k">Menu</p>
            <button type="button" className="dx-menu__close" onClick={close}>
              Close
            </button>
          </div>
          <nav aria-label="Site" className="dx-menu__nav">
            {NAV.map((item, i) => (
              <FlowLink key={item.href} href={item.href} onClick={() => setMenu(false)} className="dx-menu__link">
                <span className="dx-k" aria-hidden>
                  {pad(i + 1)}
                </span>
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dx-menu__cta">
            <a href={CONTACT_URL} className="dx-btn dx-btn--red dx-btn--lg">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="dx-btn dx-btn--lg">
              Join the studio <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
