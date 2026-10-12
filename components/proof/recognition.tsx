import Image from "next/image";
import { RECOGNITION, type RecognitionItem } from "@/content/recognition";

/**
 * Awards, empanelment and alliances, as shown on digitallynext.com.
 * "full" (About): the award leads large, the alliances sit on light plates, no empty cells.
 * "compact" (home 01): a slim proof row of the featured items, under the client logos.
 */
export function Recognition({ variant = "full" }: { variant?: "compact" | "full" }) {
  return variant === "compact" ? <Compact /> : <Full />;
}

function Compact() {
  const featured = RECOGNITION.filter((item) => item.featured && item.image);
  return (
    <ul aria-label="Recognition" className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-12 sm:gap-y-6">
      {featured.map((item) => {
        const image = item.image!;
        const badge = image.width / image.height < 2;
        return (
          <li key={item.title} className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Image
              src={image.src}
              alt=""
              width={image.width}
              height={image.height}
              sizes={badge ? "64px" : "(min-width: 768px) 336px, 240px"}
              className={badge ? "h-14 w-auto shrink-0 md:h-16" : "h-8.5 w-auto shrink-0 rounded-md md:h-12"}
            />
            <p className="max-w-[26ch] text-sm leading-snug">
              <span className="block font-medium">{item.title}</span>
              <span className="block text-paper/70">{item.detail}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Full() {
  const lead = RECOGNITION.find((item) => item.featured && item.image);
  return (
    <ul className="grid gap-px overflow-hidden rounded-3xl bg-paper/10 sm:grid-cols-2 lg:grid-cols-4">
      {RECOGNITION.map((item) => {
        const leading = item === lead;
        return (
          <li
            key={item.title}
            className={`flex flex-col gap-4 bg-ink p-6 ${leading ? "sm:col-span-2 sm:flex-row sm:items-center sm:gap-8 lg:row-span-2 lg:flex-col lg:items-start lg:justify-between lg:p-10" : ""}`}
          >
            {item.image ? <Mark item={item} leading={leading} /> : null}
            <div>
              <p className={`font-semibold ${leading ? "text-xl md:text-2xl" : ""}`}>{item.title}</p>
              <p className="mt-2 text-sm text-paper/70">{item.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Mark({ item, leading }: { item: RecognitionItem; leading: boolean }) {
  const image = item.image!;
  if (leading) {
    return (
      <Image
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        sizes="(min-width: 1024px) 256px, 160px"
        className="h-40 w-auto shrink-0 lg:h-64"
      />
    );
  }
  if (item.plate) {
    return (
      <div className="flex h-16 items-center rounded-xl bg-paper px-4">
        <Image src={image.src} alt="" width={image.width} height={image.height} className="max-h-12 w-auto object-contain" />
      </div>
    );
  }
  return (
    <div className="flex h-16 items-center">
      <Image src={image.src} alt="" width={image.width} height={image.height} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw" className="h-auto max-h-16 w-full rounded-lg object-contain object-left" />
    </div>
  );
}
