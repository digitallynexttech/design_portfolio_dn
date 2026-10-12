import type { Img } from "../types";

// Exhibit data for the Know Your Genes case study.
// Every model below is Draco-compressed (KHR_draco_mesh_compression): load with the
// decoder self-hosted at /draco/. genee.glb also uses EXT_texture_webp and has no clips;
// its idle turn and breathing are done in code. Clip names were read from each GLB's JSON chunk.
// Sources: knowyourgenes/public/home/brand/mascot.glb; Blender/Knowyourgenes/web/{models,posters,README.md};
// colours from Blender/Knowyourgenes/scripts/mascots/specs.py (COLOURS, sRGB).

export const KYG_GENEE: { model: string; poster: Img } = {
  model: "/models/kyg/genee.glb",
  poster: {
    src: "/work/know-your-genes/genee-poster.webp",
    alt: "GENEe, the Know Your Genes mascot, in a white lab coat with a double helix for a hood, waving",
    width: 600,
    height: 1168,
  },
};

export const KYG_CREW: {
  id: string;
  name: string;
  family: string;
  signature: string;
  model: string;
  clips: { idle: string; wave: string; jump: string; signature: string };
  color: string;
  poster: Img;
}[] = [
  {
    id: "vita",
    name: "Vita",
    family: "Wellness & nutrition",
    signature: "Offers her apple",
    model: "/models/kyg/vita.glb",
    clips: { idle: "Idle", wave: "Wave", jump: "Jump", signature: "Signature" },
    color: "#78B866",
    poster: {
      src: "/work/know-your-genes/crew-vita.webp",
      alt: "Vita, the Know Your Genes wellness guide, with a leaf sprout on her helix, holding an apple",
      width: 600,
      height: 1227,
    },
  },
  {
    id: "cardi",
    name: "Cardi",
    family: "Heart & metabolism",
    signature: "Heartbeat",
    model: "/models/kyg/cardi.glb",
    clips: { idle: "Idle", wave: "Wave", jump: "Jump", signature: "Signature" },
    color: "#F7666A",
    poster: {
      src: "/work/know-your-genes/crew-cardi.webp",
      alt: "Cardi, the Know Your Genes heart-health guide, in a coral sweatband with a heart on the chest, waving",
      width: 600,
      height: 1093,
    },
  },
  {
    id: "dozy",
    name: "Dozy",
    family: "Sleep",
    signature: "Nods off",
    model: "/models/kyg/dozy.glb",
    clips: { idle: "Idle", wave: "Wave", jump: "Jump", signature: "Signature" },
    color: "#B3A3D5",
    poster: {
      src: "/work/know-your-genes/crew-dozy.webp",
      alt: "Dozy, the Know Your Genes sleep guide, in a lavender nightcap, hugging a moon pillow",
      width: 600,
      height: 1009,
    },
  },
  {
    id: "guard",
    name: "Guard",
    family: "Immunity",
    signature: "Raises the shield",
    model: "/models/kyg/guard.glb",
    clips: { idle: "Idle", wave: "Wave", jump: "Jump", signature: "Signature" },
    color: "#E2AA3C",
    poster: {
      src: "/work/know-your-genes/crew-guard.webp",
      alt: "Guard, the Know Your Genes immunity guide, in a golden cape, holding a shield with a plus",
      width: 600,
      height: 1124,
    },
  },
  {
    id: "glow",
    name: "Glow",
    family: "Skin",
    signature: "Star twirl",
    model: "/models/kyg/glow.glb",
    clips: { idle: "Idle", wave: "Wave", jump: "Jump", signature: "Signature" },
    color: "#F6B69C",
    poster: {
      src: "/work/know-your-genes/crew-glow.webp",
      alt: "Glow, the Know Your Genes skin guide, with peach cheeks, holding up a star",
      width: 600,
      height: 1180,
    },
  },
];
