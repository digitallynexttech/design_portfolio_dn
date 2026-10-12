// Awards, partnerships and alliances. Images in public/recognition/.
// Sources (never rendered), all as shown on digitallynext.com:
// - CorporateLiveWire badge: digitallynext/public/admin-ajax.webp (an AVIF file; converted to WebP), used in Header.tsx.
// - JioStar: digitallynext/public/banner/ipl-desktop.webp, cropped to the logo row (offer button removed). HomePageClient.tsx.
// - Alliances: digitallynext/public/awards/a1–a3.webp, "Alliances & Recognition" (components/sections/AwardsAndRecognition.tsx).
// The alliance logos are full colour; WASME and Onfinity use dark text, so they sit on a light plate.
// The badge (transparent, dark navy) and the JioStar banner (its own purple field) read on ink without one.

export type RecognitionItem = {
  title: string;
  detail: string;
  image?: { src: string; width: number; height: number };
  /** Shown in the slim proof row on home (01). The first featured item leads the full grid. */
  featured?: boolean;
  /** The logo needs a light plate behind it to read on ink. */
  plate?: boolean;
};

export const RECOGNITION: RecognitionItem[] = [
  {
    title: "CorporateLiveWire Global Awards 2023/24",
    detail: "Winner.",
    image: { src: "/recognition/corporatelivewire-2023-24.webp", width: 582, height: 600 },
    featured: true,
  },
  {
    title: "JioStar empanelled agency partner",
    detail: "For the ICC Men's T20 World Cup and TATA IPL.",
    image: { src: "/recognition/jiostar-partner.webp", width: 1400, height: 202 },
    featured: true,
  },
  {
    title: "SMB Connect",
    detail: "Alliance partner.",
    image: { src: "/recognition/smb-connect.webp", width: 312, height: 185 },
    plate: true,
  },
  {
    title: "WASME",
    detail: "Alliance with the World Association for Small and Medium Enterprises.",
    image: { src: "/recognition/wasme.webp", width: 714, height: 231 },
    plate: true,
  },
  {
    title: "Onfinity",
    detail: "Alliance partner.",
    image: { src: "/recognition/onfinity.webp", width: 467, height: 114 },
    plate: true,
  },
];
