"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { HG_PRODUCTS, HG_RIVER } from "@/content/exhibits/happy-ganga";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion } from "./use-in-view";

const STAGES = ["Bottle", "Bucket", "Floor", "Drain", "River"];
const STAGE_X = [130, 390, 650, 910, 1170];

/** The brand's own river, flowing in its gradient, under product shots that tilt toward the pointer. */
export default function HappyGangaExhibit({ onReady }: ExhibitProps) {
  const row = useRef<HTMLUListElement>(null);
  useEffect(() => onReady(), [onReady]);

  useEffect(() => {
    const el = row.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      for (const item of Array.from(el.children) as HTMLElement[]) {
        const rect = item.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
        const dy = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
        item.style.transform = `perspective(900px) rotateY(${dx * 22}deg) rotateX(${-dy * 14}deg) translateY(${dy * -8}px)`;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(90% 80% at 50% 0%, #F5FCFD, #CDE9DC 60%, #0896AC)" }}>
      {/* Phones: the line runs nearly edge to edge, so it starts below the exhibit's More button. */}
      <p className="absolute top-16 left-1/2 -translate-x-1/2 text-center font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold whitespace-nowrap text-[#06222A] md:top-8">
        Healthy Families. Happy Rivers.
      </p>

      <ul ref={row} className="absolute inset-x-0 top-[22%] mx-auto flex h-[46%] max-w-4xl items-end justify-center gap-[3vw] px-6 md:top-[18%]">
        {HG_PRODUCTS.slice(0, 4).map((product) => (
          <li key={product.name} className="relative h-full transition-transform duration-300 ease-out will-change-transform">
            <span className="absolute inset-x-[-12%] bottom-[-4%] h-[40%] rounded-full blur-2xl" style={{ background: product.color }} aria-hidden />
            <Image
              src={product.image.src}
              alt={product.image.alt}
              width={product.image.width}
              height={product.image.height}
              // Drawn by height (46% of the exhibit), so ~0.4 of that wide: under 12rem on desktop.
              sizes="(min-width: 768px) 12rem, 22vw"
              className="relative h-full w-auto drop-shadow-xl"
            />
          </li>
        ))}
      </ul>

      <svg viewBox={HG_RIVER.viewBox} preserveAspectRatio="none" className="absolute inset-x-0 bottom-[6%] h-[26%] w-full" role="img" aria-label="The river journey: bottle, bucket, floor, drain, river">
        <defs>
          <linearGradient id="hg-river" gradientUnits="userSpaceOnUse" x1="0" x2="1300" y1="0" y2="0">
            <stop offset="0%" stopColor="#FFC400" />
            <stop offset="45%" stopColor="#FF7300" />
            <stop offset="100%" stopColor="#0896AC" />
          </linearGradient>
        </defs>
        <path d={HG_RIVER.d} fill="none" stroke="url(#hg-river)" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={HG_RIVER.d} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="hg-flow" />
        {STAGES.map((stage, i) => (
          <g key={stage}>
            <circle cx={STAGE_X[i]} cy={i % 2 ? 53 : 170.5} r="9" fill="#ffffff" stroke="#06222A" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <text x={STAGE_X[i]} y={i % 2 ? 22 : 225} textAnchor="middle" className="fill-[#06222A] text-[30px] font-semibold">
              {stage}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
