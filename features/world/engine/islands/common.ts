// The island toolkit: shared materials, a batcher that merges static parts into one draw call per
// material, signs set in the site's own typeface, docks with physics and prompts, lamps, and
// (re-exported from ../vegetation) the trees, rocks and grass every island shares.
import * as THREE from "three/webgpu";
import { abs, cameraViewMatrix, float, floor, hash, materialColor, materialRoughness, max, mix, normalWorld, positionWorld, smoothstep, step, vec3, vec4 } from "three/tsl";
import type { WorldData } from "../../data";
import { berth, dockEnd, radiusAt, shoreTable, type Island } from "../../layout";
import type { Audio } from "../audio";
import type { Interactions } from "../interact";
import type { Physics } from "../physics";
import type { Ripple } from "../ripple";
import { PAL, type Shared } from "../shared";
import { triplanar, type Textures } from "../textures";
import type { Props } from "./props";
import type { N } from "../tsl";
import { detail } from "../layers";

export type IslandCtx = {
  scene: THREE.Scene;
  shared: Shared;
  physics: Physics;
  ripple: Ripple;
  renderer: THREE.WebGPURenderer;
  camera: THREE.Camera;
  tier: 1 | 2 | 3;
  data: WorldData;
  interactions: Interactions;
  audio: Audio;
  reduced: boolean;
  textures: Textures;
  /** The GPU allows enough texture slots for triplanar detail. */
  rich: boolean;
  /** CC0 prop models (created by createIslands). */
  props: Props;
};

export type Part = {
  /** Fixed-rate logic (60 Hz), before physics. */
  step?: (dt: number) => void;
  /** Once per rendered frame. */
  update?: (dt: number, t: number, night: number, boat: { x: number; z: number }) => void;
  dispose?: () => void;
};

// ---------------------------------------------------------------------------------------------
// Materials

export function createMaterials(shared: Shared, tex: Textures, rich: boolean) {
  const { u } = shared;
  const cache = new Map<string, THREE.Material>();
  const cached = <M extends THREE.Material>(key: string, make: () => M): M => {
    let m = cache.get(key) as M | undefined;
    if (!m) {
      m = make();
      cache.set(key, m);
    }
    return m;
  };
  // Node graphs are shared between materials that differ only in colour or roughness: those come
  // from each material's own properties (materialColor, materialRoughness), so three builds one
  // shader for all of them instead of one per colour. That keeps the first load's compile short.
  const graphs = new Map<string, unknown>();
  const graph = <G>(key: string, make: () => G): G => {
    let g = graphs.get(key) as G | undefined;
    if (!g) {
      g = make();
      graphs.set(key, g);
    }
    return g;
  };
  const toView = (n: N) => cameraViewMatrix.mul(vec4(n, 0)).xyz;
  return {
    /**
     * A painted surface (plaster, render, gelcoat) that catches snow and darkens in rain. A concrete
     * scan underneath breaks up the flat colour and roughness, so walls read as built, not drawn.
     */
    paint(hex: string, rough = 0.85, metal = 0, settle = 1) {
      return cached(`paint:${hex}:${rough}:${metal}:${settle}`, () => {
        const m = new THREE.MeshStandardNodeMaterial({ color: hex, roughness: rough, metalness: metal });
        if (metal > 0.3) {
          const g = graph(`metal:${settle}`, () => ({
            color: shared.weathered(materialColor, settle),
            rough: materialRoughness.sub(u.wet.mul(0.2)).max(0.08),
          }));
          m.colorNode = g.color;
          m.roughnessNode = g.rough;
          return m;
        }
        const g = graph(`paint:${settle}`, () => {
          const det = triplanar(tex.set("concrete"), 0.3, { normalStrength: 0.45, cheap: !rich });
          const lum = det.color.dot(vec3(0.333)).div(0.42).clamp(0.6, 1.4);
          return {
            color: shared.weathered(materialColor.mul(mix(float(1), lum, 0.32)), settle),
            rough: materialRoughness.mul(det.rough.mul(0.35).add(0.8)).sub(u.wet.mul(0.35)).clamp(0.1, 1),
            normal: toView(det.normal),
          };
        });
        m.colorNode = g.color;
        m.roughnessNode = g.rough;
        m.normalNode = g.normal;
        return m;
      });
    },
    /** A seasonal palette colour; wood columns use real weathered planks. */
    pal(column: number, rough = 0.9) {
      return cached(`pal:${column}:${rough}`, () => {
        const m = new THREE.MeshStandardNodeMaterial({ roughness: rough, metalness: 0 });
        if (column === PAL.WOOD || column === PAL.WOOD_DARK) {
          const wood = triplanar(tex.set("planks"), 0.42, { normalStrength: 1.1, cheap: !rich });
          const tint = column === PAL.WOOD ? vec3(1.12, 1.0, 0.86) : vec3(0.62, 0.55, 0.48);
          // Wet, green-dark where the wood stands in the sea.
          const sea = float(1).sub(smoothstep(-0.2, 0.55, positionWorld.y));
          const col = mix(wood.color.mul(tint), vec3(0.05, 0.07, 0.05), sea.mul(0.75));
          m.colorNode = shared.weathered(col);
          m.roughnessNode = wood.rough.mul(0.9).add(0.1).mul(float(1).sub(sea.mul(0.4))).sub(u.wet.mul(0.3)).clamp(0.12, 1);
          m.normalNode = toView(wood.normal);
          return m;
        }
        m.colorNode = shared.weathered(shared.pal(column));
        return m;
      });
    },
    /**
     * A curtain wall: tinted glass panels between slim mullions and a spandrel band at every floor
     * (scaled with the world's towers, so a 13 m model reads as a tower of many storeys), each panel a touch different in tint and smoothness so the reflection breaks up
     * the way real glazing does, and a scatter of warm windows lit at night.
     */
    glass(hex: string) {
      return cached(`glass:${hex}`, () => {
        const m = new THREE.MeshStandardNodeMaterial({ color: hex, roughness: 0.06, metalness: 0.88 });
        const g = graph("glass", () => {
          const n = normalWorld;
          const facingX = step(abs(n.z), abs(n.x));
          const roof = smoothstep(0.6, 0.9, abs(n.y));
          const cu = mix(positionWorld.x, positionWorld.z, facingX).div(0.55);
          const cv = positionWorld.y.div(0.95);
          const fu = cu.fract();
          const fv = cv.fract();
          const mullion = float(1).sub(smoothstep(0.04, 0.08, fu).mul(float(1).sub(smoothstep(0.92, 0.96, fu))));
          const spandrel = smoothstep(0.74, 0.78, fv).mul(float(1).sub(smoothstep(0.97, 0.99, fv)));
          const frame = max(max(mullion, spandrel), roof);
          const id = hash(floor(cu).add(floor(cv).mul(57.31)).add(facingX.mul(13.7)));
          const pane = materialColor.mul(id.mul(0.35).add(0.78));
          const lit = step(0.7, id).mul(float(1).sub(frame)).mul(smoothstep(0.1, 0.6, u.night));
          return {
            color: mix(pane, vec3(0.13, 0.14, 0.16), frame),
            rough: mix(id.mul(0.08).add(0.03), float(0.5), frame),
            glow: vec3(1, 0.76, 0.46).mul(lit).mul(id.sub(0.7).mul(2).add(0.35)),
          };
        });
        m.colorNode = g.color;
        m.roughnessNode = g.rough;
        m.emissiveNode = g.glow;
        return m;
      });
    },
    /**
     * Glazing on low buildings: dark, reflective panes in a grid of slim frames by day, warm
     * interiors (`hex`) glowing through at night.
     */
    windows(hex = "#ffe2b5") {
      return cached(`windows:${hex}`, () => {
        const m = new THREE.MeshStandardNodeMaterial({ color: hex, roughness: 0.05, metalness: 0.8 });
        const g = graph("windows", () => {
          const n = normalWorld;
          const facingX = step(abs(n.z), abs(n.x));
          const cu = mix(positionWorld.x, positionWorld.z, facingX).div(1.2);
          const cv = positionWorld.y.div(1.1);
          const fu = cu.fract();
          const fv = cv.fract();
          const inU = smoothstep(0.03, 0.06, fu).mul(float(1).sub(smoothstep(0.94, 0.97, fu)));
          const inV = smoothstep(0.03, 0.07, fv).mul(float(1).sub(smoothstep(0.93, 0.97, fv)));
          const frame = float(1).sub(inU.mul(inV));
          const id = hash(floor(cu).add(floor(cv).mul(31.7)));
          return {
            color: mix(vec3(0.05, 0.07, 0.08).mul(id.mul(0.4).add(0.8)), vec3(0.12, 0.12, 0.13), frame),
            rough: mix(float(0.04), float(0.45), frame),
            metal: mix(float(0.8), float(0.3), frame),
            glow: materialColor.mul(float(1).sub(frame)).mul(mix(float(0.05), float(1.4), u.night)).mul(id.mul(0.5).add(0.75)),
          };
        });
        m.colorNode = g.color;
        m.roughnessNode = g.rough;
        m.metalnessNode = g.metal;
        m.emissiveNode = g.glow;
        return m;
      });
    },
    /** Lamps and windows: dim by day, bright at night. */
    glow(hex: string, day = 0.25, night = 2.2) {
      return cached(`glow:${hex}:${day}:${night}`, () => {
        const m = new THREE.MeshBasicNodeMaterial({ color: hex });
        m.colorNode = graph(`glow:${day}:${night}`, () => materialColor.mul(mix(float(day), float(night), u.night)));
        return m;
      });
    },
    /** Unlit brand colour (signs' accents, screens' frames). */
    flat(hex: string) {
      return cached(`flat:${hex}`, () => new THREE.MeshBasicNodeMaterial({ color: hex }));
    },
    /** A screen showing an image: self-lit, a touch brighter at night. */
    screen(tex: THREE.Texture) {
      const m = new THREE.MeshBasicNodeMaterial({ map: tex });
      m.colorNode = graph("screen", () => materialColor.rgb.mul(mix(float(0.92), float(1.12), u.night)));
      return m;
    },
    /** A printed board: lit like paper, dimmer at night but always legible. */
    paper(tex: THREE.Texture) {
      const m = new THREE.MeshBasicNodeMaterial({ map: tex });
      m.colorNode = graph("paper", () => materialColor.rgb.mul(mix(float(1), float(0.62), u.night)));
      return m;
    },
    dispose() {
      for (const m of cache.values()) m.dispose();
      cache.clear();
    },
  };
}

export type Materials = ReturnType<typeof createMaterials>;

// ---------------------------------------------------------------------------------------------
// Batching static parts

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();

export type Place = { x: number; y: number; z: number; ry?: number; rx?: number; rz?: number; s?: number | [number, number, number] };

export class Batch {
  private readonly parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private readonly meshes: THREE.Mesh[] = [];

  add(geometry: THREE.BufferGeometry, material: THREE.Material, at: Place): this {
    tmpE.set(at.rx ?? 0, at.ry ?? 0, at.rz ?? 0);
    tmpQ.setFromEuler(tmpE);
    const s = at.s ?? 1;
    if (typeof s === "number") tmpS.set(s, s, s);
    else tmpS.set(s[0], s[1], s[2]);
    tmpM.compose(tmpP.set(at.x, at.y, at.z), tmpQ, tmpS);
    const g = (geometry.index ? geometry.toNonIndexed() : geometry.clone()).applyMatrix4(tmpM);
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    const list = this.parts.get(material) ?? [];
    list.push(g);
    this.parts.set(material, list);
    return this;
  }

  build(scene: THREE.Scene, shadows = true): THREE.Mesh[] {
    for (const [material, list] of this.parts) {
      const merged = concat(list);
      for (const g of list) g.dispose();
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = shadows;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
    this.parts.clear();
    return this.meshes;
  }

  dispose() {
    for (const m of this.meshes) {
      m.removeFromParent();
      m.geometry.dispose();
    }
  }
}

function concat(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal"]) {
    const total = list.reduce((n, g) => n + g.attributes[name].array.length, 0);
    const array = new Float32Array(total);
    let offset = 0;
    for (const g of list) {
      array.set(g.attributes[name].array as Float32Array, offset);
      offset += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(array, 3));
  }
  out.computeBoundingSphere();
  return out;
}

// Shared primitive shapes (unit sized, scaled per use).
export const SHAPES = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  sphere: new THREE.SphereGeometry(0.5, 14, 10),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  torus: new THREE.TorusGeometry(0.5, 0.08, 6, 24),
};

// ---------------------------------------------------------------------------------------------
// Text

export function fontStack(variable: "--font-headline" | "--font-text" | "--font-geist-mono"): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || "'Helvetica Neue', Arial, sans-serif";
}

export type TextLine = { text: string; size: number; weight?: number; color: string; font?: "--font-headline" | "--font-text" | "--font-geist-mono"; gap?: number };

/** Draw lines of text onto a canvas texture, left aligned, with an optional accent bar. */
export function textTexture(lines: TextLine[], opts: { width: number; height: number; bg: string; accent?: string; padding?: number; align?: "left" | "center" }): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const draw = () => {
    ctx.clearRect(0, 0, opts.width, opts.height);
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, opts.width, opts.height);
    const pad = opts.padding ?? Math.round(opts.width * 0.07);
    if (opts.accent) {
      ctx.fillStyle = opts.accent;
      ctx.fillRect(0, 0, Math.round(opts.width * 0.025), opts.height);
    }
    const total = lines.reduce((h, l) => h + l.size * 1.12 + (l.gap ?? 0), 0);
    let y = (opts.height - total) / 2;
    for (const line of lines) {
      y += line.gap ?? 0;
      ctx.font = `${line.weight ?? 600} ${line.size}px ${fontStack(line.font ?? "--font-headline")}`;
      ctx.fillStyle = line.color;
      ctx.textBaseline = "top";
      ctx.textAlign = opts.align === "center" ? "center" : "left";
      const x = opts.align === "center" ? opts.width / 2 : pad + (opts.accent ? opts.width * 0.02 : 0);
      ctx.fillText(line.text, x, y, opts.width - pad * 2);
      y += line.size * 1.12;
    }
    tex.needsUpdate = true;
  };
  draw();
  // Redraw once the web fonts are ready, so signs use the site's typeface.
  void document.fonts?.ready.then(draw);
  return tex;
}

// ---------------------------------------------------------------------------------------------
// Signs, docks, lamps

export type Disposables = { textures: THREE.Texture[]; materials: THREE.Material[]; geometries: THREE.BufferGeometry[]; meshes: THREE.Object3D[]; cleanups: (() => void)[] };

export function disposables(): Disposables {
  return { textures: [], materials: [], geometries: [], meshes: [], cleanups: [] };
}

export function disposeAll(d: Disposables) {
  for (const t of d.textures) t.dispose();
  for (const m of d.materials) m.dispose();
  for (const g of d.geometries) g.dispose();
  for (const o of d.meshes) o.removeFromParent();
  for (const c of d.cleanups) c();
}

/** A board on two posts facing the camera (south), with the label set in the site's typeface. */
export function sign(
  ctx: IslandCtx,
  batch: Batch,
  mats: Materials,
  d: Disposables,
  at: { x: number; y: number; z: number },
  label: string,
  sub: string,
  accent: string,
  width = 7,
): THREE.Mesh {
  const height = width * 0.42;
  const tex = textTexture(
    [
      { text: label, size: 92, weight: 700, color: "#0a0a0a" },
      { text: sub, size: 44, weight: 500, color: "#3b3f45", font: "--font-text", gap: 14 },
    ],
    { width: 1024, height: 430, bg: "#f6f4ef", accent },
  );
  d.textures.push(tex);
  const material = mats.paper(tex);
  d.materials.push(material);
  const geometry = new THREE.PlaneGeometry(width, height);
  d.geometries.push(geometry);
  // Off the mirror: a bright board alone in a dark reflection reads as a smudge, not a sign.
  const board = detail(new THREE.Mesh(geometry, material));
  const postH = at.y + 1.4;
  board.position.set(at.x, postH + height / 2, at.z + 0.06);
  board.rotation.x = -0.18;
  ctx.scene.add(board);
  d.meshes.push(board);
  const wood = mats.pal(PAL.WOOD_DARK);
  batch.add(SHAPES.box, wood, { x: at.x, y: postH + height / 2, z: at.z - 0.05, rx: -0.18, s: [width + 0.25, height + 0.25, 0.12] });
  for (const side of [-1, 1]) batch.add(SHAPES.box, wood, { x: at.x + side * width * 0.36, y: at.y + postH / 2 - 0.3, z: at.z - 0.12, s: [0.18, postH + 0.6, 0.18] });
  return board;
}

/** A lamp post: dark pole, warm bulb that brightens at night. */
export function lamp(ctx: IslandCtx, batch: Batch, mats: Materials, x: number, y: number, z: number, h = 2.6) {
  if (ctx.tier === 1) {
    batch.add(SHAPES.cyl6, mats.paint("#24262b", 0.6, 0.2), { x, y: y + h / 2, z, s: [0.12, h, 0.12] });
    batch.add(SHAPES.sphere, mats.glow("#ffd9a0", 0.35, 3.2), { x, y: y + h + 0.1, z, s: 0.38 });
    return;
  }
  // A real cast-iron street lamp, with a bulb that glows (and blooms) at night.
  const height = h + 0.9;
  const post = ctx.props.place("lamp", height);
  post.position.set(x, y, z);
  ctx.scene.add(post);
  const bulb = new THREE.Mesh(SHAPES.sphere, mats.glow("#ffd9a0", 0.3, 5));
  bulb.scale.setScalar(0.22);
  bulb.position.set(x, y + height * 0.9, z);
  ctx.scene.add(bulb);
}

/** Build an island's dock: planks, posts, a lamp at the end, a pier collider and its prompt. */
export function dock(ctx: IslandCtx, batch: Batch, mats: Materials, island: Island, verb: string) {
  const table = shoreTable(island);
  const dir = { x: Math.cos(island.dock), z: Math.sin(island.dock) };
  const side = { x: -dir.z, z: dir.x };
  const shore = radiusAt(table, island.dock);
  const start = shore - 3;
  const end = shore + island.dockLength;
  const deckY = 0.95;
  const wood = mats.pal(PAL.WOOD);
  const dark = mats.pal(PAL.WOOD_DARK);
  const length = end - start;
  const midD = (start + end) / 2;
  const ry = Math.atan2(dir.x, dir.z);
  const cx = island.x + dir.x * midD;
  const cz = island.z + dir.z * midD;
  batch.add(SHAPES.box, wood, { x: cx, y: deckY, z: cz, ry, s: [2.4, 0.18, length] });
  // Plank seams.
  for (let k = 0; k < length; k += 0.9) {
    const dd = start + k;
    batch.add(SHAPES.box, dark, { x: island.x + dir.x * dd, y: deckY + 0.095, z: island.z + dir.z * dd, ry, s: [2.42, 0.02, 0.05] });
  }
  for (let k = 0; k <= length; k += 2.6) {
    const dd = start + k;
    for (const s of [-1, 1]) {
      const px = island.x + dir.x * dd + side.x * s * 1.1;
      const pz = island.z + dir.z * dd + side.z * s * 1.1;
      batch.add(SHAPES.cyl6, dark, { x: px, y: deckY - 0.9, z: pz, s: [0.26, 2.6, 0.26] });
    }
  }
  const ex = island.x + dir.x * end;
  const ez = island.z + dir.z * end;
  lamp(ctx, batch, mats, ex + side.x * 1.0, deckY, ez + side.z * 1.0, 2.2);
  // A lifebuoy on the last post, facing the water.
  if (ctx.tier >= 2) {
    const ring = ctx.props.place("lifebuoy", 0.78);
    ring.position.set(ex - side.x * 1.18, deckY - 0.1, ez - side.z * 1.18);
    ring.rotation.set(0, Math.atan2(side.x, side.z) + Math.PI / 2, 0);
    ctx.scene.add(ring);
  }
  // Bollards at the end.
  for (const s of [-1, 1]) batch.add(SHAPES.cyl, mats.paint("#1f2227", 0.5, 0.3), { x: ex + side.x * s * 0.8 - dir.x * 0.4, y: deckY + 0.3, z: ez + side.z * s * 0.8 - dir.z * 0.4, s: [0.3, 0.45, 0.3] });

  ctx.physics.segments.push({ ax: island.x + dir.x * (shore - 1), az: island.z + dir.z * (shore - 1), bx: ex, bz: ez, r: 1.25, id: `${island.id}-dock` });

  const b = berth(island);
  const endPoint = dockEnd(island, 3);
  ctx.interactions.add({
    id: island.id,
    kind: island.kind,
    ref: island.ref,
    label: island.label,
    verb,
    x: endPoint.x,
    z: endPoint.z,
    y: 3.2,
    reach: 9,
    berth: b,
    focus: new THREE.Vector3(island.x * 0.55 + endPoint.x * 0.45, 0, island.z * 0.55 + endPoint.z * 0.45),
    listed: true,
  });
  return { deckY, end: { x: ex, z: ez }, dir, side };
}

// Trees, palms, firs, ferns, grass and boulders live in vegetation.ts.
export { createFlora, plant } from "../vegetation";
