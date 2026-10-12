// Client logo wall. Every file is a dark mark on a transparent background, trimmed, at most 240 px tall;
// the site renders them white with a CSS filter (brightness(0) invert(1)).
// Sources (never rendered), prepared by scratch/assets/prep-logos.py:
// - RealtyCanvas … Kan & Krishme: digitallynext/public/home/client13–31.webp (each checked by eye).
// - Tata, Happiness Gurukul, Alpine Talent Solutions, iMET Global: previous_portfolio/public/logos/7, 9, 15, 17.webp.
// - SKELMET: skelmet/public/brand/skelmet-lockup.png. Know Your Genes: knowyourgenes/public/kyg/logo/kyg-ink.svg
//   (same paths as kyg-brand.svg, in black). Happy Ganga: HappyGangav1/theme/assets/hg-logo.webp (mark + wordmark).
//   Leocym: LeocymDN/public/brand/leocym-lockup.png.
// - Signia, Happiness Gurukul and Alpine have their inner shapes cut out so they survive the white filter.
export const CLIENTS: { name: string; logo: { src: string; width: number; height: number } }[] = [
  { name: "SKELMET", logo: { src: "/logos/skelmet.webp", width: 691, height: 240 } },
  { name: "Know Your Genes", logo: { src: "/logos/know-your-genes.svg", width: 798, height: 322 } },
  { name: "Hard2Soft", logo: { src: "/logos/hard2soft.webp", width: 338, height: 240 } },
  { name: "Happy Ganga", logo: { src: "/logos/happy-ganga.webp", width: 468, height: 240 } },
  { name: "Leocym India", logo: { src: "/logos/leocym.webp", width: 167, height: 240 } },
  { name: "TalentiFi-X", logo: { src: "/logos/talentifix.webp", width: 990, height: 240 } },
  { name: "RealtyCanvas", logo: { src: "/logos/realty-canvas.webp", width: 736, height: 240 } },
  { name: "Tata Tele Business Services", logo: { src: "/logos/tata-tele-business-services.webp", width: 1000, height: 197 } },
  { name: "Tata", logo: { src: "/logos/tata.webp", width: 278, height: 240 } },
  { name: "ICAR", logo: { src: "/logos/icar.webp", width: 194, height: 240 } },
  { name: "RICS", logo: { src: "/logos/rics.webp", width: 690, height: 240 } },
  { name: "LifeStraw", logo: { src: "/logos/lifestraw.webp", width: 1000, height: 151 } },
  { name: "ISIC", logo: { src: "/logos/isic.webp", width: 602, height: 240 } },
  { name: "Signia", logo: { src: "/logos/signia.webp", width: 212, height: 240 } },
  { name: "Pusa Krishi", logo: { src: "/logos/pusa-krishi.webp", width: 333, height: 240 } },
  { name: "Advent Global Solutions", logo: { src: "/logos/advent-global.webp", width: 1000, height: 175 } },
  { name: "iMET Global", logo: { src: "/logos/imet-global.webp", width: 633, height: 209 } },
  { name: "Khaleej", logo: { src: "/logos/khaleej.webp", width: 779, height: 240 } },
  { name: "House of Nandini", logo: { src: "/logos/house-of-nandini.webp", width: 394, height: 240 } },
  { name: "Gajna Overseas", logo: { src: "/logos/gajna-overseas.webp", width: 649, height: 240 } },
  { name: "Sanjivani Edge", logo: { src: "/logos/sanjivani-edge.webp", width: 666, height: 240 } },
  { name: "NeoTech World Lab", logo: { src: "/logos/neotech-world-lab.webp", width: 459, height: 240 } },
  { name: "SensuQ", logo: { src: "/logos/sensuq.webp", width: 1000, height: 226 } },
  { name: "SoulSmith", logo: { src: "/logos/soulsmith.webp", width: 232, height: 240 } },
  { name: "Kan & Krishme", logo: { src: "/logos/kan-and-krishme.webp", width: 349, height: 240 } },
  { name: "Happiness Gurukul", logo: { src: "/logos/happiness-gurukul.webp", width: 536, height: 240 } },
  { name: "Alpine Talent Solutions", logo: { src: "/logos/alpine-talent-solutions.webp", width: 330, height: 240 } },
];
