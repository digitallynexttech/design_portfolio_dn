// Textures made at startup instead of downloaded: tileable ripple normals for the sea, foam lace,
// and the dancing light (caustics) that shallow water throws onto sand.
import * as THREE from "three/webgpu";

function lcg(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function finish(data: Uint8Array, size: number, mips = true): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.generateMipmaps = mips;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Small-ripple normals: a sum of sines whose wave numbers are whole cycles per tile, so the
 * pattern wraps without a seam.
 */
export function rippleNormals(size = 256): THREE.DataTexture {
  const rand = lcg(12345);
  const waves = Array.from({ length: 56 }, () => {
    const k = 2 + Math.floor(Math.pow(rand(), 1.6) * 26);
    const a = rand() * Math.PI * 2;
    return { kx: Math.round(Math.cos(a) * k), ky: Math.round(Math.sin(a) * k), amp: 1 / Math.pow(k, 1.25), phase: rand() * Math.PI * 2 };
  });
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let dx = 0;
      let dy = 0;
      const u = x / size;
      const v = y / size;
      for (const w of waves) {
        const c = Math.cos(Math.PI * 2 * (w.kx * u + w.ky * v) + w.phase) * w.amp * Math.PI * 2;
        dx += c * w.kx;
        dy += c * w.ky;
      }
      const s = 0.0065;
      const nx = -dx * s;
      const ny = -dy * s;
      const len = Math.hypot(nx, ny, 1);
      const k = (y * size + x) * 4;
      data[k] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[k + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[k + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[k + 3] = 255;
    }
  }
  return finish(data, size);
}

/** Cellular distance field (F1, F2) on a wrapping tile. */
function cells(size: number, count: number, seed: number, radius: number, shade: (f1: number, f2: number) => number): Uint8Array {
  const rand = lcg(seed);
  const points = Array.from({ length: count }, () => ({ x: rand(), y: rand(), r: 0.6 + rand() * 0.8 }));
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let f1 = 9;
      let f2 = 9;
      for (const p of points) {
        let dx = Math.abs(u - p.x);
        let dy = Math.abs(v - p.y);
        dx = Math.min(dx, 1 - dx);
        dy = Math.min(dy, 1 - dy);
        const d = Math.hypot(dx, dy) / (radius * p.r);
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
      const value = Math.max(0, Math.min(1, shade(f1, f2)));
      const k = (y * size + x) * 4;
      data[k] = data[k + 1] = data[k + 2] = Math.round(value * 255);
      data[k + 3] = 255;
    }
  }
  return data;
}

/** Foam lace: bright walls between bubbles, dimmer bubble centres. */
export function foamTexture(size = 256): THREE.DataTexture {
  return finish(cells(size, 90, 777, 0.06, (f1, f2) => Math.max(0, 1 - (f2 - f1) * 3.2) * 0.9 + Math.max(0, 1 - f1 * 0.9) * 0.45), size);
}

/** Caustics: the bright, wobbly net of light that waves focus onto a shallow seabed. */
export function causticsTexture(size = 256): THREE.DataTexture {
  return finish(cells(size, 70, 4242, 0.075, (f1, f2) => Math.pow(Math.max(0, 1 - (f2 - f1) * 4.5), 2.2)), size);
}
