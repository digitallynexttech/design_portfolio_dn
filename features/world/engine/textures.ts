// Photographic materials for the world: CC0 scans from Poly Haven (scripts/world-assets.py), mapped
// in world space so merged, UV-less geometry still gets real sand, grass, rock, planks and concrete.
import * as THREE from "three/webgpu";
import { abs, float, mix, normalize, normalWorld, positionWorld, pow, sqrt, texture, vec2, vec3 } from "three/tsl";
import type { N } from "./tsl";

export type TexName = "sand" | "grass" | "rock" | "darkrock" | "planks" | "concrete" | "teak" | "bark";

export type TexSet = { readonly albedo: THREE.Texture; readonly nr: THREE.Texture };

/**
 * Ground layers that fill the view get 1024 px colour on desktops at full quality. Everything else
 * (planks, concrete, the boat's teak, bark on thin trunks) never shows more than 512 px on screen:
 * the camera sits 22–86 m away.
 */
const FULL_RES = new Set<TexName>(["sand", "grass", "rock", "darkrock"]);

/**
 * @param lite phone-scale assets: 512 px colour and 256 px normals, which is what a phone's
 * screen samples anyway (the 256 px mip level covers almost the whole view).
 */
export function createTextures(opts: { tier: 1 | 2 | 3; lite: boolean; anisotropy: number }) {
  const loader = new THREE.TextureLoader();
  const cache = new Map<string, THREE.Texture>();
  const detailSize = opts.lite || opts.tier === 1 ? 256 : 512;

  const load = (url: string, srgb: boolean) => {
    let t = cache.get(url);
    if (t) return t;
    t = loader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = opts.anisotropy;
    cache.set(url, t);
    return t;
  };

  /** A texture set, fetched map by map on first use (the boat's teak and the bark use colour only). */
  const set = (name: TexName): TexSet => {
    const size = opts.tier === 3 && !opts.lite && FULL_RES.has(name) ? 1024 : 512;
    return {
      get albedo() {
        return load(`/world/tex/${name}-${size}-albedo.webp`, true);
      },
      get nr() {
        return load(`/world/tex/${name}-nr-${detailSize}.webp`, false);
      },
    };
  };

  /** A foliage card texture (RGBA, sRGB). */
  const card = (file: string) => {
    const t = load(`/world/tex/${file}`, true);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  };

  return {
    set,
    card,
    dispose() {
      for (const t of cache.values()) t.dispose();
      cache.clear();
    },
  };
}

export type Textures = ReturnType<typeof createTextures>;

/**
 * Unpack a detail sample: normal X and Y in red and green (Z rebuilt, it is always facing out),
 * roughness in blue. Returns the tangent-space normal (strength applied to X and Y) and roughness.
 */
function unpack(s: N, strength = 1): { n: N; rough: N } {
  const xy = s.xy.mul(2).sub(1);
  const z = sqrt(float(1).sub(xy.dot(xy)).max(0));
  return { n: vec3(xy.mul(strength), z), rough: s.z };
}

/**
 * Triplanar sampling: three planar projections blended by the surface normal, so cliffs, walls and
 * plateaus all read correctly without UVs. Returns colour, a world-space normal and roughness.
 */
export function triplanar(tex: TexSet, scale: N | number, opts: { normalStrength?: number; sharpness?: number; cheap?: boolean } = {}) {
  const s = typeof scale === "number" ? float(scale) : scale;
  const p = positionWorld.mul(s);
  const n = normalWorld;
  const k = opts.normalStrength ?? 1;
  if (opts.cheap) {
    // Top projection only (phones): one sample per map.
    const uv = p.xz;
    const albedo = texture(tex.albedo, uv);
    const d = unpack(texture(tex.nr, uv), k);
    const normal = normalize(n.add(vec3(d.n.x, 0, d.n.y.negate()).mul(0.6)));
    return { color: albedo.rgb, normal, rough: d.rough };
  }
  const w0 = pow(abs(n), vec3(opts.sharpness ?? 4));
  const w = w0.div(w0.x.add(w0.y).add(w0.z));
  const ax = texture(tex.albedo, p.zy);
  const ay = texture(tex.albedo, p.xz);
  const az = texture(tex.albedo, p.xy);
  const color = ax.rgb.mul(w.x).add(ay.rgb.mul(w.y)).add(az.rgb.mul(w.z));
  const dx = unpack(texture(tex.nr, p.zy), k);
  const dy = unpack(texture(tex.nr, p.xz), k);
  const dz = unpack(texture(tex.nr, p.xy), k);
  const tx = dx.n;
  const ty = dy.n;
  const tz = dz.n;
  // Whiteout blend: swizzle each tangent-space normal into world space around its axis.
  const wx = vec3(tx.z.mul(n.x.sign()), tx.y, tx.x);
  const wy = vec3(ty.x, ty.z.mul(n.y.sign()), ty.y.negate());
  const wz = vec3(tz.x, tz.y, tz.z.mul(n.z.sign()));
  const normal = normalize(wx.mul(w.x).add(wy.mul(w.y)).add(wz.mul(w.z)).add(n.mul(0.25)));
  const rough = dx.rough.mul(w.x).add(dy.rough.mul(w.y)).add(dz.rough.mul(w.z));
  return { color, normal, rough };
}

/** Top-down planar sampling for flat ground: cheaper than triplanar, same look on plateaus. */
export function planar(tex: TexSet, scale: number, normalStrength = 1) {
  const uv = positionWorld.xz.mul(scale);
  const a = texture(tex.albedo, uv);
  const d = unpack(texture(tex.nr, uv));
  return { color: a.rgb, tangent: vec2(d.n.x, d.n.y.negate()).mul(normalStrength), rough: d.rough };
}

/** Blend helper for weighted layers of colour. */
export function blend(base: N, layer: N, weight: N): N {
  return mix(base, layer, weight);
}
