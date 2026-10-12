// The walking-X, extruded from the real logo: trace the mark's outline from the PNG's alpha with
// marching squares, then extrude it into a solid. It becomes the lighthouse on the hub island.
import * as THREE from "three/webgpu";

type Pt = [number, number];

function loadMask(src: string, cropRight: number, targetH: number): Promise<{ grid: Uint8Array; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const srcW = Math.round(img.naturalWidth * cropRight);
      const scale = targetH / img.naturalHeight;
      const w = Math.round(srcW * scale);
      const h = targetH;
      const canvas = document.createElement("canvas");
      canvas.width = w + 2;
      canvas.height = h + 2;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, srcW, img.naturalHeight, 1, 1, w, h);
      const data = ctx.getImageData(0, 0, w + 2, h + 2).data;
      const grid = new Uint8Array((w + 2) * (h + 2));
      for (let i = 0; i < grid.length; i++) grid[i] = data[i * 4 + 3] > 110 ? 1 : 0;
      resolve({ grid, w: w + 2, h: h + 2 });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Marching squares over a binary grid → closed loops in pixel space. */
function trace(grid: Uint8Array, w: number, h: number): Pt[][] {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : grid[y * w + x]);
  const segs = new Map<string, string[]>();
  const pts = new Map<string, Pt>();
  const key = (p: Pt) => `${p[0]},${p[1]}`;
  const link = (a: Pt, b: Pt) => {
    const ka = key(a);
    const kb = key(b);
    pts.set(ka, a);
    pts.set(kb, b);
    (segs.get(ka) ?? segs.set(ka, []).get(ka)!).push(kb);
    (segs.get(kb) ?? segs.set(kb, []).get(kb)!).push(ka);
  };
  for (let y = -1; y < h; y++) {
    for (let x = -1; x < w; x++) {
      const tl = at(x, y);
      const tr = at(x + 1, y);
      const br = at(x + 1, y + 1);
      const bl = at(x, y + 1);
      const c = (tl << 3) | (tr << 2) | (br << 1) | bl;
      const top: Pt = [x + 1, y + 0.5];
      const right: Pt = [x + 1.5, y + 1];
      const bottom: Pt = [x + 1, y + 1.5];
      const left: Pt = [x + 0.5, y + 1];
      // Each edge midpoint joins exactly two cells, so the segments chain into closed loops.
      switch (c) {
        case 1: link(left, bottom); break;
        case 2: link(bottom, right); break;
        case 3: link(left, right); break;
        case 4: link(right, top); break;
        case 5: link(left, top); link(right, bottom); break;
        case 6: link(bottom, top); break;
        case 7: link(left, top); break;
        case 8: link(top, left); break;
        case 9: link(top, bottom); break;
        case 10: link(top, right); link(bottom, left); break;
        case 11: link(top, right); break;
        case 12: link(right, left); break;
        case 13: link(right, bottom); break;
        case 14: link(bottom, left); break;
      }
    }
  }
  const loops: Pt[][] = [];
  const used = new Set<string>();
  for (const start of segs.keys()) {
    if (used.has(start)) continue;
    const loop: Pt[] = [];
    let k: string | undefined = start;
    while (k && !used.has(k)) {
      used.add(k);
      loop.push(pts.get(k)!);
      const next: string[] = segs.get(k) ?? [];
      k = next.find((n) => !used.has(n)) ?? undefined;
    }
    if (loop.length > 6) loops.push(loop);
  }
  return loops;
}

function simplify(points: Pt[], tolerance: number): Pt[] {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((by - ay) * points[i][0] - (bx - ax) * points[i][1] + bx * ay - by * ax) / len;
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (worst > tolerance) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplify a closed loop: split it at the point farthest from the start, simplify both halves. */
function simplifyLoop(loop: Pt[]): Pt[] {
  let far = 0;
  let best = -1;
  for (let i = 1; i < loop.length; i++) {
    const d = (loop[i][0] - loop[0][0]) ** 2 + (loop[i][1] - loop[0][1]) ** 2;
    if (d > best) {
      best = d;
      far = i;
    }
  }
  const a = simplify(loop.slice(0, far + 1), 0.45);
  const b = simplify([...loop.slice(far), loop[0]], 0.45);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

function area(loop: Pt[]): number {
  let s = 0;
  for (let i = 0; i < loop.length; i++) {
    const [x1, y1] = loop[i];
    const [x2, y2] = loop[(i + 1) % loop.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

function inside(p: Pt, loop: Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const [xi, yi] = loop[i];
    const [xj, yj] = loop[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * The walking-X as an extruded solid, `height` metres tall, standing on y = 0, centred on x.
 * Returns the geometry plus the y where the shoes begin (for the red paint).
 */
export async function walkingX(height: number, depth: number): Promise<{ geometry: THREE.ExtrudeGeometry; shoeLine: number; width: number }> {
  const { grid, w, h } = await loadMask("/brand/logo-color.png", 0.225, 150);
  const loops = trace(grid, w, h).map(simplifyLoop);
  const scale = height / (h - 2);
  const toShape = (loop: Pt[]) => loop.map(([x, y]) => new THREE.Vector2(x * scale, (h - y) * scale));
  // Even depth = outer contour, odd = hole.
  const depthOf = (loop: Pt[]) => loops.filter((other) => other !== loop && inside(loop[0], other)).length;
  const shapes: THREE.Shape[] = [];
  for (const loop of loops) {
    if (depthOf(loop) % 2) continue;
    const outer = area(loop) > 0 ? loop : [...loop].reverse();
    const shape = new THREE.Shape(toShape(outer));
    for (const hole of loops) {
      if (hole === loop || depthOf(hole) % 2 === 0 || !inside(hole[0], loop)) continue;
      shape.holes.push(new THREE.Path(toShape(area(hole) < 0 ? hole : [...hole].reverse())));
    }
    shapes.push(shape);
  }
  const geometry = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: depth * 0.12, bevelSize: depth * 0.08, bevelSegments: 2, curveSegments: 4 });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -depth / 2);
  geometry.computeVertexNormals();
  return { geometry, shoeLine: height * 0.36, width: box.max.x - box.min.x };
}
