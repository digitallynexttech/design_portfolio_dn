"use client";

import { useEffect, useId, useRef, useState } from "react";
import { H2S_CITIES, H2S_LEVELS, H2S_SYMPTOMS } from "@/content/exhibits/h2s";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

const RING = { low: "#1257C7", high: "#D98A1F", severe: "#B3431F" } as const;
const SPECKS = 220;

/** Hard water as scale-flecked murk; the slider conditions it toward clear. An illustration, not a lab result. */
function ConditionTank({ amount, active }: { amount: number; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const amountRef = useRef(amount);
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !active) return;
    const ctx = el.getContext("2d")!;
    const specks = Array.from({ length: SPECKS }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 3.2,
      v: 0.02 + Math.random() * 0.05,
      a: Math.random() * Math.PI * 2,
    }));
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== w * dpr || el.height !== h * dpr) {
        el.width = w * dpr;
        el.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = amountRef.current;
      // Murky grey-green turning to clear blue.
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgba(${Math.round(150 - 90 * t)}, ${Math.round(160 - 20 * t)}, ${Math.round(140 + 95 * t)}, 0.95)`);
      g.addColorStop(1, `rgba(${Math.round(90 - 70 * t)}, ${Math.round(100 - 10 * t)}, ${Math.round(95 + 120 * t)}, 0.95)`);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (const s of specks) {
        if (!reduced) {
          s.y -= s.v * dt * (0.4 + t);
          s.a += dt * (1 + t * 2);
          if (s.y < -0.02) s.y = 1.02;
        }
        const x = (s.x + Math.sin(s.a) * 0.01 * t) * w;
        const y = s.y * h;
        // Scale crystals are jagged and opaque; conditioned, they soften into faint round beads.
        ctx.globalAlpha = 0.85 - t * 0.65;
        ctx.fillStyle = t < 0.5 ? "#f1efe6" : "#dff0ff";
        ctx.beginPath();
        if (t < 0.5) {
          const k = s.r * (1.4 - t);
          ctx.moveTo(x, y - k);
          ctx.lineTo(x + k * 0.8, y);
          ctx.lineTo(x, y + k);
          ctx.lineTo(x - k * 0.8, y);
        } else {
          ctx.arc(x, y, s.r * (1.2 - t * 0.6), 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvas} className="h-full w-full rounded-[2rem]" aria-hidden />;
}

export default function H2sExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, "100px");
  const [amount, setAmount] = useState(0);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"condition" | "check">("condition");
  const sliderId = useId();

  useEffect(() => onReady(), [onReady]);

  const count = ticked.size;
  const level = count === 0 ? null : (H2S_LEVELS.find((l) => count <= l.upTo) ?? H2S_LEVELS[H2S_LEVELS.length - 1]);
  const circumference = 2 * Math.PI * 52;

  return (
    <div ref={host} className="absolute inset-0 overflow-hidden text-white" style={{ background: "linear-gradient(160deg, #0A0A1F, #0d2350 60%, #1257C7)" }}>
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-5 px-(--gutter) pt-16 pb-28 md:grid md:grid-cols-2 md:items-center md:gap-12 md:py-12">
        <div role="tablist" aria-label="Exhibit views" className="flex gap-2 md:hidden">
          {(["condition", "check"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className="rounded-full border border-white/25 px-4 py-2 text-sm aria-selected:bg-white aria-selected:text-[#0A0A1F]"
            >
              {key === "condition" ? "Condition the water" : "Check your home"}
            </button>
          ))}
        </div>

        <section className={`${tab === "condition" ? "flex" : "hidden"} min-h-0 flex-1 flex-col gap-4 md:flex md:h-[70%]`} aria-label="Hard water, conditioned">
          <div className="relative min-h-0 flex-1">
            <ConditionTank amount={amount / 100} active={inView} />
            <p className="absolute top-4 left-5 font-mono text-xs tracking-widest uppercase opacity-80">{amount < 50 ? "Hard water · scale" : "Conditioned"}</p>
          </div>
          <label htmlFor={sliderId} className="text-sm opacity-80">
            Drag to run water through the cartridge
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="w-full accent-[#FFD56A]"
          />
          <p className="text-xs opacity-60">Illustration of conditioning, not a lab result.</p>
        </section>

        <section className={`${tab === "check" ? "flex" : "hidden"} min-h-0 flex-1 flex-col gap-4 overflow-auto md:flex md:max-h-[80%]`} aria-label="Symptom check">
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 120 120" className="size-28 shrink-0 -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={level ? RING[level.tone] : "rgb(255 255 255 / 0.3)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - count / H2S_SYMPTOMS.length)}
                style={{ transition: "stroke-dashoffset 600ms var(--ease-flow), stroke 300ms" }}
              />
            </svg>
            <div aria-live="polite">
              <p className="font-display text-4xl font-semibold">
                {count}/{H2S_SYMPTOMS.length}
              </p>
              <p className="text-lg">{level ? level.label : "Tap the signs you see at home"}</p>
            </div>
          </div>
          <ul className="grid gap-1.5">
            {H2S_SYMPTOMS.map((symptom) => {
              const on = ticked.has(symptom.id);
              return (
                <li key={symptom.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setTicked((prev) => {
                        const next = new Set(prev);
                        if (next.has(symptom.id)) next.delete(symptom.id);
                        else next.add(symptom.id);
                        return next;
                      })
                    }
                    className="w-full rounded-xl border border-white/15 px-3 py-2 text-left text-sm leading-snug transition-colors aria-pressed:border-[#FFD56A] aria-pressed:bg-white/10"
                  >
                    {symptom.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs opacity-60">The same check runs on all {H2S_CITIES.length} city and state pages, with local data on each.</p>
        </section>
      </div>
    </div>
  );
}
