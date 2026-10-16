"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { FlowLink } from "@/components/ui/flow-link";

type Item = { label: string; href: string; minutes: number };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Sticky chapter bar. It slides down under the site header when the header shows and takes the top
 * when it hides; it stays still while chapters flow past it (its own view-transition name). The
 * progress line fills like water as the chapter is read.
 */
export function ChapterNav({ client, items }: { client: string; items: Item[] }) {
  const pathname = usePathname();
  const fill = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState(false);
  const current = Math.max(0, items.findIndex((item) => item.href === pathname));

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // Keep the current chapter in view when the bar is narrower than its chapters, and fade the edge
  // that has more chapters past it.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const fade = () => {
      const start = el.scrollLeft > 4;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      el.dataset.fade = start && end ? "both" : start ? "start" : end ? "end" : "none";
    };
    const item = el.querySelector<HTMLElement>('[aria-current="page"]')?.parentElement;
    if (item) el.scrollLeft = item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2;
    fade();
    el.addEventListener("scroll", fade, { passive: true });
    window.addEventListener("resize", fade);
    return () => {
      el.removeEventListener("scroll", fade);
      window.removeEventListener("resize", fade);
    };
  }, [current]);

  const direction = (index: number) => (index < current ? "back" : "forward");

  return (
    <div
      className="chapter-nav sticky z-30 border-b border-(--c-line) bg-[color-mix(in_oklab,var(--c-bg)_82%,transparent)] backdrop-blur-xl"
      style={{ viewTransitionName: "chapter-nav" }}
    >
      <nav aria-label="Chapters" className="flex items-center gap-6 px-(--gutter) py-3">
        <FlowLink
          href={items[0].href}
          direction="back"
          aria-label={`${client}: overview`}
          // Each client face draws 16px at its own size. Matching cap heights (not x-heights: SKELMET
          // and DNMS are all capitals) makes every wordmark read at one size.
          className="hit shrink-0 rounded-sm font-(family-name:--c-display) text-base [font-size-adjust:cap-height_0.7]"
        >
          {client}
        </FlowLink>

        <ol ref={list} className="chapter-nav__list relative hidden min-w-0 flex-1 gap-1 overflow-x-auto text-sm [scrollbar-width:none] lg:flex">
          {items.map((item, i) => (
            <li key={item.href} className="shrink-0">
              <FlowLink
                href={item.href}
                direction={direction(i)}
                aria-current={i === current ? "page" : undefined}
                className="block rounded-full px-3 py-1.5 text-(--c-muted) transition-colors hover:text-(--c-text) aria-[current=page]:bg-(--c-accent) aria-[current=page]:text-(--c-on-accent) pointer-coarse:py-3"
              >
                <span className="font-mono text-xs">{pad(i + 1)}</span> {item.label}
              </FlowLink>
            </li>
          ))}
        </ol>

        {/* The label truncates inside, so the button itself doesn't clip the 44px tap area (.hit). */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="hit ml-auto min-w-0 rounded-full border border-(--c-line) px-3.5 py-1.5 text-sm lg:hidden"
        >
          <span className="block truncate">
            <span className="font-mono text-xs">
              {pad(current + 1)}/{pad(items.length)}
            </span>{" "}
            {items[current]?.label} <span aria-hidden>▾</span>
          </span>
        </button>
      </nav>
      <span aria-hidden className="absolute inset-x-0 bottom-0 block h-0.5 origin-left bg-(--c-accent)" ref={fill} style={{ transform: "scaleX(0)" }} />

      <LiquidSurface open={open} onClose={() => setOpen(false)} origin="bottom" label={`${client} chapters`}>
        <p className="label text-(--c-muted)">{client}</p>
        <ol className="mt-4 grid gap-1">
          {items.map((item, i) => (
            <li key={item.href}>
              <FlowLink
                href={item.href}
                direction={direction(i)}
                onClick={() => setOpen(false)}
                aria-current={i === current ? "page" : undefined}
                className="group flex items-baseline gap-4 py-2 font-(family-name:--c-display) text-3xl tracking-tight text-(--c-muted) aria-[current=page]:text-(--c-text)"
              >
                <span className="font-mono text-sm text-(--c-accent-ink)">{pad(i + 1)}</span>
                <span className="min-w-0 flex-1 decoration-(--c-accent) decoration-2 underline-offset-[0.18em] group-aria-[current=page]:underline">
                  {item.label}
                </span>
                <span className="shrink-0 font-mono text-xs text-(--c-muted)">{item.minutes} min</span>
              </FlowLink>
            </li>
          ))}
        </ol>
      </LiquidSurface>
    </div>
  );
}
