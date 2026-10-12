// Shared GPU state: the uniforms every material reads (time, weather, season, light) and the
// palette texture that colours the whole world. Seasons are rows of the palette, so the islands
// recolour by moving one uniform; nothing is re-modelled.
import * as THREE from "three/webgpu";
import {
  float,
  mix,
  normalWorld,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
import type { N } from "./tsl";

export const PAL = {
  SAND: 0,
  SAND_WET: 1,
  GRASS: 2,
  GRASS_DARK: 3,
  ROCK: 4,
  ROCK_DARK: 5,
  PATH: 6,
  LEAF_A: 7,
  LEAF_B: 8,
  TRUNK: 9,
  LINEN: 10,
  STONE: 11,
  WOOD: 12,
  WOOD_DARK: 13,
  WHITE: 14,
  CONCRETE: 15,
  PALM: 16,
} as const;

const COLS = 18;
const ROWS = 4; // spring, summer, autumn, winter

// [spring, summer, autumn, winter] per column, sRGB.
const SWATCHES: string[][] = [
  ["#ead9ad", "#f0dca6", "#e3cf9f", "#d8d3c3"], // sand
  ["#b7a27a", "#bca578", "#ad9a74", "#a39d8e"], // wet sand
  ["#8cc66a", "#71ad4b", "#aba049", "#8f9c87"], // grass
  ["#6ea956", "#58923d", "#b28637", "#7d8a7b"], // dark grass
  ["#8e8b86", "#918c84", "#8c8780", "#8f939a"], // rock
  ["#4a4651", "#4a4651", "#4a4651", "#55525d"], // dark rock (SKELMET)
  ["#c2a47a", "#c9a876", "#b89870", "#b3aa9a"], // path
  ["#92d27b", "#4f9a3d", "#e2792e", "#6f8069"], // leaves A
  ["#f3a9c4", "#3d8a37", "#c84a2b", "#dfe7ea"], // leaves B (blossom, deep green, rust, frost)
  ["#6b4b34", "#6b4b34", "#674632", "#5f4a3c"], // trunk
  ["#f2eadb", "#f3eadb", "#ede2cf", "#eceae4"], // linen (KYG)
  ["#c9c6c0", "#cbc7bf", "#c3beb5", "#c7c9cc"], // stone paving
  ["#a77b52", "#a97c51", "#9d734c", "#8f7a66"], // wood
  ["#6d4e35", "#6d4e35", "#664833", "#5e4c3f"], // dark wood
  ["#f6f4ef", "#f6f4ef", "#f3f0ea", "#f7f8f9"], // white paint
  ["#9fa3a6", "#a0a3a5", "#9b9c9c", "#a3a8ad"], // concrete
  ["#4f9a40", "#3f8a37", "#4d8a3a", "#5a7f55"], // palm fronds (evergreen)
  ["#ffffff", "#ffffff", "#ffffff", "#ffffff"], // spare
];

function paletteTexture(): THREE.DataTexture {
  const data = new Uint8Array(COLS * ROWS * 4);
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      // Raw sRGB bytes straight from the hex; the texture's colour space tells the GPU to decode
      // them once. (THREE.Color would linearise first, and dark swatches would come out black.)
      const hex = SWATCHES[c][r];
      const k = (r * COLS + c) * 4;
      data[k] = parseInt(hex.slice(1, 3), 16);
      data[k + 1] = parseInt(hex.slice(3, 5), 16);
      data[k + 2] = parseInt(hex.slice(5, 7), 16);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, COLS, ROWS, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function createShared() {
  const u = {
    time: uniform(0),
    /** 0..3 rows and blend between them, for season transitions. */
    seasonA: uniform(1),
    seasonB: uniform(1),
    seasonT: uniform(0),
    wind: uniform(0.2),
    windDir: uniform(new THREE.Vector2(0.8, 0.6)),
    /** Snow settled on surfaces, 0–1. */
    cover: uniform(0),
    wet: uniform(0),
    /** 0 at noon, 1 at midnight: windows, lamps and the glowing wake. */
    night: uniform(0),
    sunDir: uniform(new THREE.Vector3(0.4, 0.8, 0.3)),
    sunColor: uniform(new THREE.Color("#fff3df")),
    /** Seasonal multiplier on the grass texture (green in summer, gold in autumn, grey-green in winter). */
    grassTint: uniform(new THREE.Color(1, 1, 1)),
    /** Seasonal multiplier on foliage. */
    leafTint: uniform(new THREE.Color(1, 1, 1)),
    /** Sun (or moon) strength, as given to the directional light. */
    sunI: uniform(3),
    /** Sky light colour × strength, for surfaces lit outside the standard pipeline (the sea). */
    ambient: uniform(new THREE.Color("#5f7aa0")),
    skyTop: uniform(new THREE.Color("#5aa7e6")),
    skyHorizon: uniform(new THREE.Color("#cfe6f2")),
    fogColor: uniform(new THREE.Color("#cfe6f2")),
    fogNear: uniform(120),
    fogFar: uniform(420),
    flash: uniform(0),
    /** Sea state, mirrored from physics. */
    waveAmp: uniform(0.75),
    ice: uniform(0),
    cloud: uniform(0.1),
    rain: uniform(0),
    /** Brand teal for night glow. */
    teal: uniform(new THREE.Color("#0ec8c5")),
    /** Hard2Soft's channel: chalky water at A, clear at B. */
    chanA: uniform(new THREE.Vector2(0, 0)),
    chanB: uniform(new THREE.Vector2(0, 0)),
    chanW: uniform(0),
  };

  const palette = paletteTexture();

  /** Seasonal colour for a palette column (a float node or number). */
  const pal = (column: N | number): N => {
    const col = typeof column === "number" ? float(column) : column;
    const x = col.add(0.5).div(COLS);
    const a = texture(palette, vec2(x, u.seasonA.add(0.5).div(ROWS)));
    const b = texture(palette, vec2(x, u.seasonB.add(0.5).div(ROWS)));
    return mix(a.rgb, b.rgb, u.seasonT) as N;
  };

  /** Snow settles on upward faces above the waterline; rain darkens. */
  const weathered = (base: N, settle = 1): N => {
    const up = smoothstep(0.55, 0.85, normalWorld.y);
    const aboveWater = smoothstep(0.25, 0.9, positionWorld.y);
    const snow = u.cover.mul(up).mul(aboveWater).mul(settle);
    const wetBase = base.mul(mix(float(1), float(0.72), u.wet.mul(0.8)));
    return mix(wetBase, vec3(0.93, 0.95, 0.98), snow) as N;
  };

  return { u, palette, pal, weathered };
}

export type Shared = ReturnType<typeof createShared>;

/** Season name to palette row. */
export const SEASON_ROW = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
