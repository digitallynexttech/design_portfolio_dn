"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { CLIENTS } from "@/content/clients";

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * A logo's optical-size factor and its rendered width, mirroring .logo-current__logo in home.css:
 * height clamp(1.15rem, k × 1.75rem, 2.5rem), and clamp(1.625rem, k × 2.5rem, 3.5rem) from 768 px.
 * The `sizes` keeps phones and desktops from fetching variants several times wider than the logo.
 */
function logoFit(width: number, height: number) {
  const aspect = width / height;
  const k = Math.sqrt(2.6 / aspect);
  const phone = Math.ceil(aspect * clamp(1.15, k * 1.75, 2.5) * 16);
  const desktop = Math.ceil(aspect * clamp(1.625, k * 2.5, 3.5) * 16);
  return { k: k.toFixed(3), sizes: `(min-width: 768px) ${desktop}px, ${phone}px` };
}

/**
 * Client logos carried on a slow current. A visible Pause control stops it (WCAG 2.2.2), and it also
 * rests under the pointer. With reduced motion every logo shows once, still, in a centred wrap.
 * Each logo is sized optically by its aspect ratio (--logo-k), so wide wordmarks don't shout.
 */
export function ClientWall({ label }: { label?: string }) {
  const [paused, setPaused] = useState(false);
  const row = [...CLIENTS, ...CLIENTS];
  return (
    <div className="logo-current" data-paused={paused ? "" : undefined}>
      <div className="flex items-center justify-between gap-4">
        {label ? <p className="label">{label}</p> : <span />}
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="logo-current__toggle btn font-mono text-micro text-paper/75 uppercase aria-pressed:border-teal/60 aria-pressed:text-teal"
        >
          {/* A toggle keeps one label; aria-pressed and the teal pressed state carry "paused". */}
          <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 fill-current">
            <path d="M2 1h2v8H2zM6 1h2v8H6z" />
          </svg>
          Pause
        </button>
      </div>
      <div className="logo-current__viewport mt-4 overflow-hidden">
        <ul className="logo-current__track flex w-max items-center py-4" aria-label="Clients">
          {row.map((client, i) => {
            const fit = logoFit(client.logo.width, client.logo.height);
            return (
              <li key={`${client.name}-${i}`} aria-hidden={i >= CLIENTS.length || undefined} className="shrink-0">
                <Image
                  src={client.logo.src}
                  alt={i >= CLIENTS.length ? "" : client.name}
                  width={client.logo.width}
                  height={client.logo.height}
                  sizes={fit.sizes}
                  style={{ "--logo-k": fit.k } as CSSProperties}
                  className="logo-current__logo opacity-70 brightness-0 invert transition-opacity hover:opacity-100"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
