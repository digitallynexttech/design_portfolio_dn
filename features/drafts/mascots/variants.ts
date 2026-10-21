// The ten DN X variants for the team's review (19 Oct 2026). Built in Blender from one script
// (Blender/DigitallyNext/scripts/variants.py): the same skeleton and the same clips, so every one
// waves the same way. Files: public/models/dn-x-variants/<id>.glb and its poster, <id>.webp.

export type MascotVariant = {
  id: string;
  name: string;
  line: string;
  traits: { shape: string; face: string; arms: string; finish: string };
};

export const MASCOT_VARIANTS: MascotVariant[] = [
  {
    id: "01-original",
    name: "Original",
    line: "The X as it is on the site now.",
    traits: { shape: "Slab serif", face: "Oval eyes, small smile", arms: "Mittens", finish: "Satin red" },
  },
  {
    id: "02-big-eyes",
    name: "Big Eyes",
    line: "The same X with animated-film eyes.",
    traits: { shape: "Slab serif", face: "Big eyes, brows, open grin", arms: "Mittens", finish: "Satin red" },
  },
  {
    id: "03-chunky",
    name: "Chunky Toy",
    line: "Inflated like a vinyl toy.",
    traits: { shape: "Fat strokes, round serifs", face: "Bead eyes, blush", arms: "Stubby, round hands", finish: "Candy gloss" },
  },
  {
    id: "04-editorial",
    name: "Editorial",
    line: "A high-contrast book serif.",
    traits: { shape: "Hairline thin stroke, sharp serifs", face: "Dot eyes, small smile", arms: "Thin, round hands", finish: "Matte" },
  },
  {
    id: "05-rubber-hose",
    name: "Rubber Hose",
    line: "A 1930s cartoon character.",
    traits: { shape: "Slab serif", face: "Pie-cut eyes, open grin", arms: "Black noodle arms, white gloves", finish: "Satin red" },
  },
  {
    id: "06-sans",
    name: "Sans",
    line: "A modern geometric X, no serifs.",
    traits: { shape: "Rounded ends, even strokes", face: "Pill eyes, wide smile", arms: "Mittens", finish: "Gloss" },
  },
  {
    id: "07-chrome",
    name: "Chrome",
    line: "The original shape in polished red chrome.",
    traits: { shape: "Slab serif", face: "Oval eyes, small smile", arms: "Mittens", finish: "Red chrome" },
  },
  {
    id: "08-clay",
    name: "Clay",
    line: "Hand-made in plasticine.",
    traits: { shape: "Soft lumps all over", face: "Bead eyes", arms: "Mittens", finish: "Matte clay" },
  },
  {
    id: "09-wood-type",
    name: "Wood Type",
    line: "A block of printing type.",
    traits: { shape: "Crisp block, sharp slab serifs", face: "Oval eyes, small smile", arms: "Mittens", finish: "Red face, dark sides" },
  },
  {
    id: "10-plush",
    name: "Plush",
    line: "A soft toy.",
    traits: { shape: "Puffy as a cushion", face: "Button eyes, stitched smile", arms: "Stubby, round hands", finish: "Fabric sheen" },
  },
];
