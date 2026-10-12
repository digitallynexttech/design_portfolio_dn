// Photographic materials for the world: CC0 scans from Poly Haven (scripts/world-assets.py), mapped
// in world space so merged, UV-less geometry still gets real sand, grass, rock, planks and concrete.
import * as THREE from "three/webgpu";
import { abs, float, mix, normalize, normalWorld, positionWorld, pow, texture, vec2, vec3 } from "three/tsl";
import type { N } from "./tsl";

export type TexName = "sand" | "grass" | "rock" | "darkrock" | "planks" | "concrete" | "teak" | "bark";

export type TexSet = { albedo: THREE.Texture; nr: THREE.Texture };

export function createTextures(tier: 1 | 2 | 3, anisotropy: number) {
  const loader = new THREE.TextureLoader();
  const cache = new Map<string, THREE.Texture>();
  const size = tier === 3 ? 1024 : 512;

  const load = (url: string, srgb: boolean) => {
    let t = cache.get(url);
    if (t) return t;
    t = loader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = anisotropy;
    cache.set(url, t);
    return t;
  };

  const set = (name: TexName): TexSet => ({
    albedo: load(`/world/tex/${name}-${size}-albedo.webp`, true),
    nr: load(`/world/tex/${name}-512-nr.webp`, false),
  });

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

/** Unpack a normal-map sample (RGB 0–1) into a tangent-space vector. */
function unpack(n: N): N {
  return n.xyz.mul(2).sub(1);
}

/**
 * Triplanar sampling: three planar projections blended by the surface normal, so cliffs, walls and
 * plateaus all read correctly without UVs. Returns colour, a world-space normal and roughness.
 */
export function triplanar(tex: TexSet, scale: N | number, opts: { normalStrength?: number; sharpness?: number; cheap?: boolean } = {}) {
  const s = typeof scale === "number" ? float(scale) : scale;
  const p = positionWorld.mul(s);
  const n = normalWorld;
  if (opts.cheap) {
    // Top projection only (phones): one sample per map.
    const uv = p.xz;
    const albedo = texture(tex.albedo, uv);
    const nr = texture(tex.nr, uv);
    const t = unpack(nr).mul(vec3(opts.normalStrength ?? 1, opts.normalStrength ?? 1, 1));
    const normal = normalize(n.add(vec3(t.x, 0, t.y.negate()).mul(0.6)));
    return { color: albedo.rgb, normal, rough: nr.a };
  }
  const w0 = pow(abs(n), vec3(opts.sharpness ?? 4));
  const w = w0.div(w0.x.add(w0.y).add(w0.z));
  const ax = texture(tex.albedo, p.zy);
  const ay = texture(tex.albedo, p.xz);
  const az = texture(tex.albedo, p.xy);
  const color = ax.rgb.mul(w.x).add(ay.rgb.mul(w.y)).add(az.rgb.mul(w.z));
  const nx = texture(tex.nr, p.zy);
  const ny = texture(tex.nr, p.xz);
  const nz = texture(tex.nr, p.xy);
  const k = opts.normalStrength ?? 1;
  const tx = unpack(nx).mul(vec3(k, k, 1));
  const ty = unpack(ny).mul(vec3(k, k, 1));
  const tz = unpack(nz).mul(vec3(k, k, 1));
  // Whiteout blend: swizzle each tangent-space normal into world space around its axis.
  const wx = vec3(tx.z.mul(n.x.sign()), tx.y, tx.x);
  const wy = vec3(ty.x, ty.z.mul(n.y.sign()), ty.y.negate());
  const wz = vec3(tz.x, tz.y, tz.z.mul(n.z.sign()));
  const normal = normalize(wx.mul(w.x).add(wy.mul(w.y)).add(wz.mul(w.z)).add(n.mul(0.25)));
  const rough = nx.a.mul(w.x).add(ny.a.mul(w.y)).add(nz.a.mul(w.z));
  return { color, normal, rough };
}

/** Top-down planar sampling for flat ground: cheaper than triplanar, same look on plateaus. */
export function planar(tex: TexSet, scale: number, normalStrength = 1) {
  const uv = positionWorld.xz.mul(scale);
  const a = texture(tex.albedo, uv);
  const nr = texture(tex.nr, uv);
  const t = unpack(nr);
  return { color: a.rgb, tangent: vec2(t.x, t.y.negate()).mul(normalStrength), rough: nr.a };
}

/** Blend helper for weighted layers of colour. */
export function blend(base: N, layer: N, weight: N): N {
  return mix(base, layer, weight);
}
