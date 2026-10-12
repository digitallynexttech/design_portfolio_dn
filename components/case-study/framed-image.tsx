import Image from "next/image";
import type { Frame, Img } from "@/content/types";

type Props = {
  image: Img;
  frame?: Frame;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/** Phone frames and tall images never grow past this, so a portrait screenshot doesn't fill a screen. */
const NARROW = "(min-width: 416px) 352px, 92vw";

/** Screenshots get a drawn browser or phone frame; photography is shown bare. */
export function FramedImage({ image, frame = "none", sizes = "(min-width: 1216px) 1120px, 92vw", priority, className = "" }: Props) {
  const tall = image.height / image.width > 1.25;
  const img = (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={frame === "phone" || tall ? NARROW : sizes}
      preload={priority}
      className="h-auto w-full"
    />
  );

  if (frame === "browser") {
    return (
      <div className={`overflow-hidden rounded-xl bg-[color-mix(in_oklab,var(--c-surface)_80%,black)] shadow-2xl shadow-black/40 ring-1 ring-white/10 ${className}`}>
        <div className="flex items-center gap-1.5 px-3.5 py-2.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
        </div>
        {img}
      </div>
    );
  }

  if (frame === "phone") {
    return (
      <div className={`mx-auto w-full max-w-[22rem] rounded-[2.4rem] bg-black p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/15 ${className}`}>
        <div className="overflow-hidden rounded-[1.9rem]">{img}</div>
      </div>
    );
  }

  // Bare images sit on the theme surface; on light themes a hairline keeps white screenshots from
  // dissolving into the page.
  return (
    <div
      className={`overflow-hidden rounded-lg bg-(--c-surface) in-data-[scheme=light]:ring-1 in-data-[scheme=light]:ring-(--c-line) ${tall ? "mx-auto max-w-[22rem]" : ""} ${className}`}
    >
      {img}
    </div>
  );
}
