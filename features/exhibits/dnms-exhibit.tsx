"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DNMS_REPLAY, DNMS_SCREENS } from "@/content/exhibits/dnms";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

const STEP_MS = 1300;

/** A wall of real DNMS screens beside a scripted replay of the AI connector answering a manager. */
export default function DnmsExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host);
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);
  const [front, setFront] = useState(0);
  const total = DNMS_REPLAY.steps.length + 2; // question, steps, answer
  useEffect(() => onReady(), [onReady]);

  useEffect(() => {
    if (!inView) return;
    // Every update comes from a timer, so the replay restarts cleanly each time it scrolls in.
    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => setShown(total), 0);
      return () => window.clearTimeout(id);
    }
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i >= total) window.clearInterval(timer);
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, STEP_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [inView, run, total]);

  const wall = DNMS_SCREENS.slice(0, 9);

  return (
    <div ref={host} className="absolute inset-0 overflow-hidden text-white" style={{ background: "radial-gradient(70% 60% at 20% 20%, #4c2fd1 0%, transparent 60%), radial-gradient(60% 60% at 90% 80%, #0891b2 0%, transparent 60%), #0b0d17" }}>
      <div className="grid h-full gap-6 px-(--gutter) pt-16 pb-24 md:grid-cols-[1.25fr_1fr] md:py-12">
        <div className="relative hidden md:block" style={{ perspective: "1600px" }}>
          <ul className="absolute inset-0 grid grid-cols-3 gap-3" style={{ transform: "rotateY(14deg) rotateX(6deg)", transformStyle: "preserve-3d" }}>
            {wall.map((screen, i) => (
              <li key={screen.src} className="relative">
                <button
                  type="button"
                  onClick={() => setFront(i)}
                  aria-label={`Show ${screen.module}`}
                  aria-pressed={front === i}
                  className="relative block h-full w-full overflow-hidden rounded-lg ring-1 ring-white/15 transition-transform duration-500 hover:-translate-y-1 aria-pressed:ring-2 aria-pressed:ring-cyan-300"
                  style={{ transform: front === i ? "translateZ(60px)" : undefined }}
                >
                  <Image src={screen.src} alt={screen.alt} fill sizes="22vw" className="object-cover object-top" />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[0.65rem]">{screen.module}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <section aria-label="Ask DNMS, replayed" className="flex min-h-0 flex-col rounded-2xl bg-black/45 p-5 ring-1 ring-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs tracking-widest text-cyan-200 uppercase">Claude × DNMS · replay</p>
            <button type="button" onClick={() => setRun((n) => n + 1)} className="rounded-full border border-white/25 px-3 py-1 text-xs hover:bg-white hover:text-black">
              Replay
            </button>
          </div>
          <ol
            // Scrolls once the replay outgrows the panel, so keyboard users can reach it too.
            tabIndex={0}
            aria-label="Replay log"
            className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto rounded-lg text-sm"
            aria-live="polite"
          >
            {shown >= 1 ? (
              <li className="self-end rounded-2xl rounded-br-sm bg-white px-3.5 py-2 text-[#0b0d17]">{DNMS_REPLAY.question}</li>
            ) : null}
            {DNMS_REPLAY.steps.slice(0, Math.max(0, shown - 1)).map((step, i) => (
              <li key={i} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="font-mono text-[0.7rem] text-cyan-200">
                  {step.tool}({step.input})
                </p>
                <p className="mt-1 text-white/80">{step.output}</p>
              </li>
            ))}
            {shown >= total ? <li className="rounded-2xl rounded-bl-sm bg-linear-to-br from-violet-500/40 to-cyan-500/30 px-3.5 py-2.5">{DNMS_REPLAY.answer}</li> : null}
          </ol>
          <p className="mt-3 text-xs text-white/55">Demo workspace and names. The AI uses the same permissions as the person asking.</p>
        </section>
      </div>
    </div>
  );
}
