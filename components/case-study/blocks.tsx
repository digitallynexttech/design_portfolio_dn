import type { CSSProperties } from "react";
import type { Block, Frame, Img } from "@/content/types";
import { fontFamily } from "@/lib/client-fonts";
import { Architecture } from "./architecture";
import { FramedImage, NARROW } from "./framed-image";

function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * Readable text colour for a swatch: whichever of the brand ink and paper contrasts more. Mid-tones
 * where even the better one misses 4.5:1 fall back to pure black or white.
 */
function inkOn(hex: string): string {
  const pick = (dark: string, light: string) => (contrast(hex, dark) >= contrast(hex, light) ? dark : light);
  const brand = pick("#0a0a0a", "#fafaf8");
  return contrast(hex, brand) >= 4.5 ? brand : pick("#000000", "#ffffff");
}

type Level = 2 | 3;

/** Reading-column images: up to the 70rem column on desktop, the page width minus gutters on phones. */
const COLUMN = "(min-width: 1216px) 1120px, 92vw";
const WIDE = "(min-width: 1520px) 1472px, 100vw";

/** Width share of each image in a pair when both are shown at the same height. */
function pairLayout(images: [Img, Img], frames?: [Frame, Frame]) {
  const ratios = images.map((img) => img.width / img.height);
  const total = ratios[0] + ratios[1];
  const columns = ratios.map((r) => `${r.toFixed(4)}fr`).join(" ");
  // Two portrait images sit together in the reading column rather than at the far edges of a wide row.
  const portrait = ratios.every((r) => r < 0.8);
  const sizes = ratios.map((r, i) =>
    frames?.[i] === "phone"
      ? NARROW
      : `(min-width: 1520px) ${Math.round((1472 * r) / total)}px, (min-width: 768px) ${Math.round((100 * r) / total)}vw, 100vw`,
  );
  return { columns, sizes, portrait };
}

function BlockView({ block, level }: { block: Block; level: Level }) {
  const H = `h${level}` as const;
  switch (block.kind) {
    case "prose":
      return (
        <section className="study-prose reveal">
          {block.heading ? <H className="study-h3">{block.heading}</H> : null}
          <div className="study-prose__body">
            {block.paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        </section>
      );

    case "figure":
      return (
        <figure className={`reveal my-16 ${block.wide ? "study-wide" : ""}`}>
          <FramedImage image={block.image} frame={block.frame} sizes={block.wide ? WIDE : COLUMN} />
          {block.caption ? <figcaption className="mt-4 text-sm text-(--c-muted)">{block.caption}</figcaption> : null}
        </figure>
      );

    case "pair": {
      // Both images share a height: each column is as wide as its image's aspect ratio asks for.
      const { columns, sizes, portrait } = pairLayout(block.images, block.frames);
      return (
        <figure className={`reveal my-16 ${portrait ? "mx-auto max-w-3xl" : "study-wide"}`}>
          <div className="grid items-center gap-6 md:grid-cols-(--pair)" style={{ "--pair": columns } as CSSProperties}>
            {block.images.map((image, i) => (
              <FramedImage key={image.src} image={image} frame={block.frames?.[i]} sizes={sizes[i]} />
            ))}
          </div>
          {block.caption ? <figcaption className="mt-4 text-sm text-(--c-muted)">{block.caption}</figcaption> : null}
        </figure>
      );
    }

    case "palette":
      return (
        <section className="reveal my-16">
          {block.heading ? <H className="study-h3 mb-6">{block.heading}</H> : null}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {block.colors.map((color) => (
              <li
                key={color.hex + color.name}
                className="flex aspect-[4/3] flex-col justify-between rounded-xl p-4 ring-1 ring-black/10"
                style={{ background: color.hex, color: inkOn(color.hex) }}
              >
                <span className="font-medium">{color.name}</span>
                <span className="font-mono text-xs">
                  {color.hex.toUpperCase()}
                  {color.note ? ` · ${color.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      );

    case "typeface":
      return (
        <section className="reveal my-16 grid gap-8 md:grid-cols-2">
          {block.families.map((family) => (
            <div key={family.name} className="rounded-2xl border border-(--c-line) p-6">
              <p className="label">{family.role}</p>
              <p className="mt-2 text-sm text-(--c-muted)">{family.name}</p>
              <p className="mt-6 text-5xl leading-none md:text-6xl" style={{ fontFamily: fontFamily[family.font] }}>
                {block.sample}
              </p>
              <p className="mt-4 text-lg" style={{ fontFamily: fontFamily[family.font] }}>
                Aa Bb Cc 0123456789
              </p>
            </div>
          ))}
        </section>
      );

    case "facts":
      return (
        <section className="reveal my-14">
          {block.heading ? <H className="study-h3 mb-6">{block.heading}</H> : null}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {block.items.map((item) => (
              <div key={item.label} className="border-t border-(--c-line) pt-4">
                <dt className="label">{item.label}</dt>
                <dd className="mt-2 text-lg leading-snug">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );

    case "list":
      return (
        <section className="study-prose reveal">
          {block.heading ? <H className="study-h3">{block.heading}</H> : null}
          <div className="study-prose__body">
            <ul className="study-list">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      );

    case "timeline":
      return (
        <section className="reveal my-16">
          {block.heading ? <H className="study-h3 mb-6">{block.heading}</H> : null}
          <ol className="relative grid gap-5 border-l border-(--c-line) pl-6">
            {block.items.map((item) => (
              <li key={item.date + item.label} className="relative">
                <span className="absolute top-2 -left-[1.72rem] size-2.5 rounded-full bg-(--c-accent)" aria-hidden />
                <p className="font-mono text-xs text-(--c-muted)">{item.date}</p>
                <p className="mt-1">{item.label}</p>
              </li>
            ))}
          </ol>
        </section>
      );

    case "architecture":
      return <Architecture block={block} level={level} />;

    case "stack":
      return (
        <section className="reveal my-12">
          {block.heading ? <H className="study-h3 mb-5">{block.heading}</H> : null}
          <ul className="flex flex-wrap gap-2">
            {block.items.map((item) => (
              <li key={item} className="rounded-full border border-(--c-line) px-3.5 py-1.5 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
  }
}

/** Renders a chapter's blocks. `level` is the heading level of block headings (3 under a section h2). */
export function Blocks({ blocks, level = 2 }: { blocks: Block[]; level?: Level }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockView key={`${block.kind}-${i}`} block={block} level={level} />
      ))}
    </>
  );
}
