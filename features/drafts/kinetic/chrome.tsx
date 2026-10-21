"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { CAREERS_URL, CONTACT_URL, NAV } from "@/lib/site";

/**
 * The draft's own header: the mark, the three pages and "Start a project". It draws in difference
 * mode, so the same white reads on the ink sections and turns ink over the paper one. On phones the
 * pages move into a native modal dialog (focus held inside, Escape closes) set in large type.
 */
export function KineticHeader() {
  const bar = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);

  // Out of the way while reading down the page; back as soon as the reader scrolls up.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let lastY = window.scrollY;
    let hidden = false;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const d = y - lastY;
      if (Math.abs(d) < 8 && y > 160) return;
      lastY = y;
      const next = y > 160 && d > 0;
      if (next !== hidden) {
        hidden = next;
        el.toggleAttribute("data-hidden", next);
      }
      // Back mid-page, it brings its own ground so it never sits on top of a heading.
      el.toggleAttribute("data-solid", y > 160);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

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
      <header ref={bar} className="dk-top">
        <FlowLink href="/" direction="back" aria-label="Digitally Next Design, home" className="dk-top__logo">
          <Image src="/brand/logo-mono-white.png" alt="" width={1360} height={288} sizes="128px" loading="eager" />
        </FlowLink>
        <nav aria-label="Main" className="dk-top__nav">
          {NAV.map((item) => (
            <FlowLink key={item.href} href={item.href} className="dk-top__link">
              {item.label}
            </FlowLink>
          ))}
          <a href={CONTACT_URL} className="dk-top__link dk-top__cta" data-magnetic>
            Start a project <span aria-hidden>↗</span>
          </a>
        </nav>
        <button ref={opener} type="button" className="dk-top__menu" aria-haspopup="dialog" onClick={() => setMenu(true)}>
          Menu
        </button>
      </header>

      <dialog
        ref={dialog}
        className="dk-menu"
        aria-label="Menu"
        onClose={() => setMenu(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dk-menu__sheet">
          <div className="dk-menu__head">
            <p className="dk-mono">Menu</p>
            <button type="button" className="dk-menu__close" onClick={close}>
              Close
            </button>
          </div>
          <nav aria-label="Site" className="dk-menu__nav">
            {NAV.map((item, i) => (
              <FlowLink key={item.href} href={item.href} onClick={() => setMenu(false)} className="dk-menu__link">
                <span className="dk-mono" aria-hidden>
                  0{i + 1}
                </span>
                {item.label}
              </FlowLink>
            ))}
          </nav>
          <div className="dk-menu__foot">
            <a href={CONTACT_URL} className="dk-btn dk-btn--red">
              Start a project <span aria-hidden>↗</span>
            </a>
            <a href={CAREERS_URL} className="dk-btn">
              Careers <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}

/**
 * Two page-wide behaviours. Headings marked data-reveal rise into place, word by word, as they
 * enter (IntersectionObserver, once; CSS transforms, no blur). Anything marked data-magnetic leans
 * a few pixels toward a mouse over it and springs back when it leaves.
 */
export function Effects() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>(".d-kinetic");
    if (!root) return;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";

    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    let io: IntersectionObserver | undefined;
    if (still) reveals.forEach((el) => el.classList.add("is-in"));
    else {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            io?.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      reveals.forEach((el) => io?.observe(el));
    }

    const cleanups: (() => void)[] = [];
    if (!still && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      for (const el of root.querySelectorAll<HTMLElement>("[data-magnetic]")) {
        let box: DOMRect | null = null;
        const enter = () => {
          el.style.transform = "";
          box = el.getBoundingClientRect();
          el.classList.add("is-pulled");
        };
        const move = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          if (!box) enter();
          const b = box!;
          const dx = e.clientX - (b.left + b.width / 2);
          const dy = e.clientY - (b.top + b.height / 2);
          const k = el.dataset.magnetic === "strong" ? 0.32 : 0.2;
          el.style.transform = `translate3d(${(dx * k).toFixed(1)}px, ${(dy * k * 1.2).toFixed(1)}px, 0)`;
        };
        const leave = () => {
          box = null;
          el.classList.remove("is-pulled");
          el.style.transform = "";
        };
        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointerenter", enter);
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      }
    }
    return () => {
      io?.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <span ref={ref} hidden />;
}
