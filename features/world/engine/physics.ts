// Physics for a world where everything floats. A general engine (Rapier) weighs 1.65 MB gzipped;
// this one does what the archipelago needs in a few kilobytes: buoyancy on the same waves the GPU
// draws, keel drag, circle contacts against island shores, piers and each other, with spin.
import { LANDMASSES, radiusAt, shoreTable, WORLD_RADIUS, type Landmass } from "../layout";
import { seaHeight, shoreDamping } from "../waves";
import { sampleMask, type SeaMask } from "./mask";

const GRAVITY = 9.81;

export type Circle = { ox: number; oz: number; r: number };

export type Body = {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  yawRate: number;
  mass: number;
  inertia: number;
  /** Footprint in the body's own frame (−z is forward). */
  circles: Circle[];
  /** How deep it rides below the surface. */
  draft: number;
  /** Buoyancy spring stiffness and damping. */
  float: number;
  floatDamp: number;
  /** Horizontal drag per second in water (props); the boat applies its own keel model. */
  drag: number;
  angularDrag: number;
  restitution: number;
  airborne: boolean;
  /** Sea height under the body this step. */
  sea: number;
  enabled: boolean;
  onImpact?: (speed: number, with_: string) => void;
  onLand?: (speed: number) => void;
};

export type Segment = { ax: number; az: number; bx: number; bz: number; r: number; id: string };
export type Post = { x: number; z: number; r: number; id: string };

export function makeBody(partial: Partial<Body> & Pick<Body, "id" | "circles" | "mass">): Body {
  const r = Math.max(...partial.circles.map((c) => Math.hypot(c.ox, c.oz) + c.r));
  return {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    yawRate: 0,
    inertia: partial.mass * r * r * 0.5,
    draft: 0.2,
    float: 40,
    floatDamp: 7,
    drag: 0.6,
    angularDrag: 1.2,
    restitution: 0.3,
    airborne: false,
    sea: 0,
    enabled: true,
    ...partial,
  };
}

export class Physics {
  readonly bodies: Body[] = [];
  readonly segments: Segment[] = [];
  readonly posts: Post[] = [];
  /** Wave height multiplier from the weather. */
  waveAmp = 0.75;
  /** Shore ice 0–1 from the weather (flattens waves). */
  ice = 0;
  /** Wind push on light props. */
  wind = { x: 0, z: 0 };
  time = 0;

  constructor(private readonly mask: SeaMask) {}

  /** Sea height at (x, z) now, including shore and ice damping. Matches the water shader. */
  sea(x: number, z: number, t = this.time): number {
    const shallow = sampleMask(this.mask.shallow, x, z);
    const ice = sampleMask(this.mask.ice, x, z) * this.ice;
    return seaHeight(x, z, t, this.waveAmp) * shoreDamping(shallow, ice);
  }

  add(body: Body): Body {
    this.bodies.push(body);
    return body;
  }

  remove(body: Body) {
    const i = this.bodies.indexOf(body);
    if (i >= 0) this.bodies.splice(i, 1);
  }

  step(dt: number) {
    this.time += dt;
    for (const b of this.bodies) {
      if (!b.enabled) continue;
      const sea = this.sea(b.x, b.z);
      b.sea = sea;
      const target = sea - b.draft;
      const wasAirborne = b.airborne;
      if (b.y <= sea + 0.04) {
        if (wasAirborne && b.vy < -2.5) b.onLand?.(-b.vy);
        b.airborne = false;
        b.vy += ((target - b.y) * b.float - b.vy * b.floatDamp) * dt;
        const k = Math.exp(-b.drag * dt);
        b.vx *= k;
        b.vz *= k;
        b.vx += this.wind.x * dt / Math.max(0.2, b.mass);
        b.vz += this.wind.z * dt / Math.max(0.2, b.mass);
      } else {
        b.airborne = true;
        b.vy -= GRAVITY * dt;
      }
      b.yawRate *= Math.exp(-b.angularDrag * dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.yaw += b.yawRate * dt;
    }
    // Two passes settle stacked contacts (a crate pinned between the boat and a pier).
    for (let pass = 0; pass < 2; pass++) {
      for (const b of this.bodies) if (b.enabled) this.collideStatic(b);
      this.collidePairs();
    }
    for (const b of this.bodies) this.keepInside(b);
  }

  private worldCircle(b: Body, c: Circle): { x: number; z: number; rx: number; rz: number } {
    // Rotate the local offset by yaw (three.js convention: +yaw turns −z toward −x).
    const cos = Math.cos(b.yaw);
    const sin = Math.sin(b.yaw);
    const rx = c.ox * cos + c.oz * sin;
    const rz = -c.ox * sin + c.oz * cos;
    return { x: b.x + rx, z: b.z + rz, rx, rz };
  }

  private collideStatic(b: Body) {
    for (const c of b.circles) {
      const w = this.worldCircle(b, c);
      for (const land of LANDMASSES) this.againstLand(b, w, c.r, land);
      for (const s of this.segments) {
        const abx = s.bx - s.ax;
        const abz = s.bz - s.az;
        const t = Math.max(0, Math.min(1, ((w.x - s.ax) * abx + (w.z - s.az) * abz) / (abx * abx + abz * abz)));
        const px = s.ax + abx * t;
        const pz = s.az + abz * t;
        this.againstPoint(b, w, c.r, px, pz, s.r, s.id);
      }
      for (const p of this.posts) this.againstPoint(b, w, c.r, p.x, p.z, p.r, p.id);
    }
  }

  private againstLand(b: Body, w: { x: number; z: number; rx: number; rz: number }, r: number, land: Landmass) {
    const dx = w.x - land.x;
    const dz = w.z - land.z;
    const reach = land.r * 1.4 + r + 2;
    if (dx * dx + dz * dz > reach * reach) return;
    const d = Math.hypot(dx, dz) || 1e-4;
    const th = Math.atan2(dz, dx);
    const table = shoreTable(land);
    // Keep hulls just off the beach rather than on it.
    const clearance = land.r < 5 ? 0.4 : 0.9;
    const R = radiusAt(table, th) + clearance;
    const pen = R + r - d;
    if (pen <= 0) return;
    const e = 0.02;
    const dR = (radiusAt(table, th + e) - radiusAt(table, th - e)) / (2 * e);
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    // Normal of a polar curve: R·ê_r − R′·ê_θ.
    let nx = R * cos + dR * sin;
    let nz = R * sin - dR * cos;
    const len = Math.hypot(nx, nz) || 1;
    nx /= len;
    nz /= len;
    this.resolve(b, w.rx - nx * r, w.rz - nz * r, nx, nz, pen, land.id);
  }

  private againstPoint(b: Body, w: { x: number; z: number; rx: number; rz: number }, r: number, px: number, pz: number, pr: number, id: string) {
    const dx = w.x - px;
    const dz = w.z - pz;
    const d2 = dx * dx + dz * dz;
    const min = r + pr;
    if (d2 >= min * min) return;
    const d = Math.sqrt(d2) || 1e-4;
    const nx = dx / d;
    const nz = dz / d;
    this.resolve(b, w.rx - nx * r, w.rz - nz * r, nx, nz, min - d, id);
  }

  /** Push a body out along n and remove its velocity into the obstacle, with spin from the offset contact. */
  private resolve(b: Body, rx: number, rz: number, nx: number, nz: number, pen: number, id: string) {
    b.x += nx * pen;
    b.z += nz * pen;
    const vpx = b.vx + b.yawRate * rz;
    const vpz = b.vz - b.yawRate * rx;
    const vn = vpx * nx + vpz * nz;
    if (vn >= 0) return;
    const rn = rz * nx - rx * nz;
    const invM = 1 / b.mass;
    const invI = 1 / b.inertia;
    const j = (-(1 + b.restitution) * vn) / (invM + rn * rn * invI);
    b.vx += j * nx * invM;
    b.vz += j * nz * invM;
    b.yawRate += rn * j * invI;
    // A little scrape friction along the wall.
    const tx = -nz;
    const tz = nx;
    const vt = vpx * tx + vpz * tz;
    b.vx -= vt * tx * 0.12;
    b.vz -= vt * tz * 0.12;
    if (-vn > 1.2) b.onImpact?.(-vn, id);
  }

  private collidePairs() {
    const list = this.bodies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.enabled) continue;
      for (let k = i + 1; k < list.length; k++) {
        const b = list[k];
        if (!b.enabled) continue;
        // Bodies in the air pass over floating ones.
        if (Math.abs(a.y - b.y) > 1.6) continue;
        const ra = Math.max(...a.circles.map((c) => Math.hypot(c.ox, c.oz) + c.r));
        const rb = Math.max(...b.circles.map((c) => Math.hypot(c.ox, c.oz) + c.r));
        const dx0 = b.x - a.x;
        const dz0 = b.z - a.z;
        if (dx0 * dx0 + dz0 * dz0 > (ra + rb) * (ra + rb)) continue;
        for (const ca of a.circles) {
          const wa = this.worldCircle(a, ca);
          for (const cb of b.circles) {
            const wb = this.worldCircle(b, cb);
            const dx = wb.x - wa.x;
            const dz = wb.z - wa.z;
            const min = ca.r + cb.r;
            const d2 = dx * dx + dz * dz;
            if (d2 >= min * min) continue;
            const d = Math.sqrt(d2) || 1e-4;
            const nx = dx / d;
            const nz = dz / d;
            const pen = min - d;
            const invA = 1 / a.mass;
            const invB = 1 / b.mass;
            const share = invA / (invA + invB);
            a.x -= nx * pen * share;
            a.z -= nz * pen * share;
            b.x += nx * pen * (1 - share);
            b.z += nz * pen * (1 - share);
            // Contact offsets from each centre.
            const rax = wa.rx + nx * ca.r;
            const raz = wa.rz + nz * ca.r;
            const rbx = wb.rx - nx * cb.r;
            const rbz = wb.rz - nz * cb.r;
            const vax = a.vx + a.yawRate * raz;
            const vaz = a.vz - a.yawRate * rax;
            const vbx = b.vx + b.yawRate * rbz;
            const vbz = b.vz - b.yawRate * rbx;
            const vn = (vbx - vax) * nx + (vbz - vaz) * nz;
            if (vn >= 0) continue;
            const rna = raz * nx - rax * nz;
            const rnb = rbz * nx - rbx * nz;
            const e = Math.min(a.restitution, b.restitution) + 0.15;
            const j = (-(1 + e) * vn) / (invA + invB + (rna * rna) / a.inertia + (rnb * rnb) / b.inertia);
            a.vx -= j * nx * invA;
            a.vz -= j * nz * invA;
            a.yawRate -= (rna * j) / a.inertia;
            b.vx += j * nx * invB;
            b.vz += j * nz * invB;
            b.yawRate += (rnb * j) / b.inertia;
            if (-vn > 1.2) {
              a.onImpact?.(-vn, b.id);
              b.onImpact?.(-vn, a.id);
            }
          }
        }
      }
    }
  }

  /** A soft current turns visitors back at the edge of the map. */
  private keepInside(b: Body) {
    const d = Math.hypot(b.x, b.z);
    const soft = WORLD_RADIUS - 14;
    if (d <= soft) return;
    const nx = b.x / d;
    const nz = b.z / d;
    const over = d - soft;
    b.vx -= nx * over * 0.9 * (1 / 60);
    b.vz -= nz * over * 0.9 * (1 / 60);
    if (d > WORLD_RADIUS + 6) {
      b.x = nx * (WORLD_RADIUS + 6);
      b.z = nz * (WORLD_RADIUS + 6);
      const vn = b.vx * nx + b.vz * nz;
      if (vn > 0) {
        b.vx -= vn * nx;
        b.vz -= vn * nz;
      }
    }
  }
}
