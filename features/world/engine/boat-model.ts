// The visitor's boat, modelled in code: a 5.4 m centre-console runabout. A lofted V hull with hard
// chines and a flared bow in glossy brand-red gelcoat over a white boot stripe and navy
// antifouling; white non-skid decks and a teak cockpit sole; a console with a tinted windshield and
// stainless grab rail, a helm seat, a bow sun pad, bow rails, rub rail and cleats; and an outboard
// with a propeller that spins with the throttle.
import * as THREE from "three/webgpu";
import { color, float, fract, min, mix, mx_noise_float, positionLocal, smoothstep, texture, vec2, vec3 } from "three/tsl";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Shared } from "./shared";
import type { Textures } from "./textures";

export const BOAT_LENGTH = 5.4;
const Z_BOW = -2.75;
const Z_STERN = 2.65;
const STATIONS = 52;

const zAt = (s: number) => Z_BOW + (Z_STERN - Z_BOW) * s;
const halfBeam = (s: number) => (s < 0.58 ? 1.04 * (1 - Math.pow(1 - s / 0.58, 2.3)) : 1.04 - (s - 0.58) * 0.08);
const sheer = (s: number) => 1.22 - 0.3 * Math.min(1, s / 0.55) - 0.04 * Math.max(0, s - 0.55);
const keelY = (s: number) => 0.92 * Math.pow(Math.max(0, 1 - s / 0.34), 1.7);
const chineHalf = (s: number) => halfBeam(s) * 0.86;
const chineY = (s: number) => keelY(s) + 0.3 + 0.12 * (1 - s);
export const FLOOR_Y = 0.6;

/** A surface lofted through sections (each an array of points of equal length). */
function loft(sections: THREE.Vector3[][], flip = false): THREE.BufferGeometry {
  const cols = sections[0].length;
  const positions: number[] = [];
  for (const sec of sections) for (const p of sec) positions.push(p.x, p.y, p.z);
  const index: number[] = [];
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (flip) index.push(a, b, c, b, d, c);
      else index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Make sure a surface's normals point away from `inside`; flip the winding if not. */
function orient(g: THREE.BufferGeometry, outward: (p: THREE.Vector3) => THREE.Vector3): THREE.BufferGeometry {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const i = Math.floor(pos.count / 2);
  const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
  const n = new THREE.Vector3(nor.getX(i), nor.getY(i), nor.getZ(i));
  if (n.dot(outward(p)) < 0) {
    const idx = g.index!.array as Uint16Array | Uint32Array;
    for (let k = 0; k < idx.length; k += 3) {
      const t = idx[k + 1];
      idx[k + 1] = idx[k + 2];
      idx[k + 2] = t;
    }
    g.index!.needsUpdate = true;
    g.computeVertexNormals();
  }
  return g;
}

function hullPieces() {
  const bottom: THREE.Vector3[][] = [];
  const sideS: THREE.Vector3[][] = [];
  const sideP: THREE.Vector3[][] = [];
  const B = 8;
  const T = 7;
  for (let i = 0; i <= STATIONS; i++) {
    const s = Math.max(0.004, i / STATIONS);
    const z = zAt(s);
    const ch = chineHalf(s);
    const cy = chineY(s);
    const ky = keelY(s);
    const hb = halfBeam(s);
    const sy = sheer(s);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= B; j++) {
      const x = -ch + (2 * ch * j) / B;
      const f = Math.pow(Math.abs(x) / Math.max(ch, 1e-3), 0.82);
      row.push(new THREE.Vector3(x, ky + (cy - ky) * f, z));
    }
    bottom.push(row);
    const s1: THREE.Vector3[] = [];
    const p1: THREE.Vector3[] = [];
    for (let j = 0; j <= T; j++) {
      const t = j / T;
      // A small spray-rail step at the chine, then the topside flaring out to the gunwale.
      const flare = 1 - Math.pow(1 - t, 2.2);
      const x = ch + 0.035 + (hb - ch - 0.035) * flare;
      const y = cy + 0.025 + (sy - cy - 0.025) * t;
      s1.push(new THREE.Vector3(x, y, z));
      p1.push(new THREE.Vector3(-x, y, z));
    }
    sideS.push(s1);
    sideP.push(p1);
  }
  const bottomG = orient(loft(bottom), () => new THREE.Vector3(0, -1, 0));
  const sideSG = orient(loft(sideS), () => new THREE.Vector3(1, 0, 0));
  const sidePG = orient(loft(sideP), () => new THREE.Vector3(-1, 0, 0));

  // Transom: the stern section's outline, filled.
  const s = 1;
  const outline = new THREE.Shape();
  const hb = halfBeam(s);
  const sy = sheer(s);
  const ch = chineHalf(s);
  const cy = chineY(s);
  outline.moveTo(-hb, sy);
  outline.lineTo(-ch - 0.035, cy + 0.025);
  for (let j = 0; j <= 8; j++) {
    const x = -ch + (2 * ch * j) / 8;
    outline.lineTo(x, cy * Math.pow(Math.abs(x) / ch, 0.82));
  }
  outline.lineTo(ch + 0.035, cy + 0.025);
  outline.lineTo(hb, sy);
  outline.lineTo(-hb, sy);
  const transom = new THREE.ShapeGeometry(outline);
  transom.translate(0, 0, Z_STERN);
  return { bottomG, sideSG, sidePG, transom };
}

function deckPieces() {
  // Foredeck: the bow out to 30% of the length, slightly cambered.
  const fore: THREE.Vector3[][] = [];
  for (let i = 0; i <= 18; i++) {
    const s = 0.005 + (0.3 - 0.005) * (i / 18);
    const z = zAt(s);
    const hb = halfBeam(s);
    const sy = sheer(s);
    fore.push([new THREE.Vector3(hb, sy, z), new THREE.Vector3(0, sy + 0.05, z), new THREE.Vector3(-hb, sy, z)]);
  }
  // Gunwale caps and inner liners, both sides, from the foredeck to the stern.
  const capS: THREE.Vector3[][] = [];
  const capP: THREE.Vector3[][] = [];
  const linS: THREE.Vector3[][] = [];
  const linP: THREE.Vector3[][] = [];
  const floor: THREE.Vector3[][] = [];
  for (let i = 0; i <= 30; i++) {
    const s = 0.3 + 0.7 * (i / 30);
    const z = zAt(s);
    const hb = halfBeam(s);
    const sy = sheer(s);
    const inner = hb - 0.14;
    capS.push([new THREE.Vector3(hb, sy, z), new THREE.Vector3(inner, sy + 0.01, z)]);
    capP.push([new THREE.Vector3(-inner, sy + 0.01, z), new THREE.Vector3(-hb, sy, z)]);
    linS.push([new THREE.Vector3(inner, sy + 0.01, z), new THREE.Vector3(inner - 0.06, FLOOR_Y, z)]);
    linP.push([new THREE.Vector3(-(inner - 0.06), FLOOR_Y, z), new THREE.Vector3(-inner, sy + 0.01, z)]);
    if (s <= 0.9) floor.push([new THREE.Vector3(inner - 0.06, FLOOR_Y, z), new THREE.Vector3(-(inner - 0.06), FLOOR_Y, z)]);
  }
  const foreG = orient(loft(fore), () => new THREE.Vector3(0, 1, 0));
  const caps = [orient(loft(capS), () => new THREE.Vector3(0, 1, 0)), orient(loft(capP), () => new THREE.Vector3(0, 1, 0))];
  const liners = [orient(loft(linS), () => new THREE.Vector3(-1, 0.2, 0)), orient(loft(linP), () => new THREE.Vector3(1, 0.2, 0))];
  const floorG = orient(loft(floor), () => new THREE.Vector3(0, 1, 0));
  // Bulkheads at the front of the cockpit and at the splash well.
  const bulk = (s: number, facing: number) => {
    const hb = halfBeam(s) - 0.2;
    const g = new THREE.PlaneGeometry(hb * 2, sheer(s) - FLOOR_Y);
    g.translate(0, (sheer(s) + FLOOR_Y) / 2, zAt(s));
    if (facing < 0) g.rotateY(Math.PI).translate(0, 0, 2 * zAt(s));
    return g;
  };
  // The rear deck over the splash well, level with the caps.
  const aft = new THREE.PlaneGeometry((halfBeam(0.95) - 0.14) * 2, zAt(1) - zAt(0.9));
  aft.rotateX(-Math.PI / 2);
  aft.translate(0, sheer(0.95) + 0.005, (zAt(1) + zAt(0.9)) / 2);
  return { foreG, caps, liners, floorG, bulkheads: [bulk(0.3, 1), bulk(0.9, -1)], aft };
}

/** Concatenate geometries (indexed or not) into one non-indexed geometry with normals. */
function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(n.attributes)) if (name !== "position" && name !== "normal") n.deleteAttribute(name);
    if (!n.attributes.normal) n.computeVertexNormals();
    return n;
  });
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal"]) {
    const total = flat.reduce((k, g) => k + g.attributes[name].array.length, 0);
    const arr = new Float32Array(total);
    let o = 0;
    for (const g of flat) {
      arr.set(g.attributes[name].array as Float32Array, o);
      o += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, 3));
  }
  for (const g of flat) g.dispose();
  out.computeBoundingSphere();
  return out;
}

const place = (g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
  g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(x, y, z);
  return g;
};

function tube(points: THREE.Vector3[], radius: number, segments = 32) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false);
}

export type BoatModel = ReturnType<typeof createBoatModel>;

export function createBoatModel(shared: Shared, tex: Textures) {
  const { u } = shared;
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, m: THREE.Material, shadow = true) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    geometries.push(g);
    return mesh;
  };

  // --- Materials -------------------------------------------------------------------------------
  const wetDarken = mix(float(1), float(0.94), u.wet);
  const gel = new THREE.MeshPhysicalNodeMaterial({ roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 });
  // Navy antifouling below the waterline, a white boot stripe, then brand-red topsides.
  const y = positionLocal.y;
  const navy = color(new THREE.Color("#132033"));
  const red = color(new THREE.Color("#d8141c"));
  const white = color(new THREE.Color("#f2f1ec"));
  const hullColor = mix(mix(navy, white, smoothstep(0.33, 0.345, y)), red, smoothstep(0.43, 0.445, y));
  gel.colorNode = hullColor.mul(wetDarken);
  gel.roughnessNode = mix(float(0.55), float(0.2), smoothstep(0.33, 0.345, y));
  materials.push(gel);

  const deckWhite = new THREE.MeshPhysicalNodeMaterial({ roughness: 0.55, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  // Non-skid: a faint diamond texture breaks up the white.
  const grain = mx_noise_float(positionLocal.mul(38)).mul(0.5).add(0.5);
  deckWhite.colorNode = mix(color(new THREE.Color("#eeeee8")), color(new THREE.Color("#d9d8d0")), grain.mul(0.35));
  deckWhite.roughnessNode = float(0.45).add(grain.mul(0.3));
  materials.push(deckWhite);

  const teakSet = tex.set("teak");
  const teak = new THREE.MeshStandardNodeMaterial({ roughness: 0.6, metalness: 0 });
  // Teak planks running fore and aft, with black caulking between them.
  const tuv = positionLocal.xz.mul(vec2(1.6, 0.25));
  const plank = fract(positionLocal.x.mul(7.5));
  const seam = float(1).sub(smoothstep(0.02, 0.05, min(plank, float(1).sub(plank))));
  teak.colorNode = texture(teakSet.albedo, tuv).rgb.mul(vec3(0.82, 0.68, 0.52)).mul(float(1).sub(seam.mul(0.85)));
  teak.roughnessNode = float(0.55).add(seam.mul(0.3));
  materials.push(teak);

  const steel = new THREE.MeshStandardNodeMaterial({ color: "#e9ecef", roughness: 0.14, metalness: 1 });
  materials.push(steel);
  const rubber = new THREE.MeshStandardNodeMaterial({ color: "#1d2024", roughness: 0.5, metalness: 0.1 });
  materials.push(rubber);
  const vinyl = new THREE.MeshPhysicalNodeMaterial({ color: "#efe6d4", roughness: 0.45, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") });
  materials.push(vinyl);
  const glass = new THREE.MeshPhysicalNodeMaterial({ color: "#1d2e33", roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.42, clearcoat: 1 });
  materials.push(glass);
  const engineMat = new THREE.MeshPhysicalNodeMaterial({ color: "#0e0f12", roughness: 0.28, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
  materials.push(engineMat);
  const engineRed = new THREE.MeshPhysicalNodeMaterial({ color: "#d8141c", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  materials.push(engineRed);
  const dash = new THREE.MeshStandardNodeMaterial({ color: "#17191d", roughness: 0.6 });
  materials.push(dash);
  const gauge = new THREE.MeshBasicNodeMaterial();
  gauge.colorNode = vec3(0.35, 0.9, 1).mul(u.night.mul(1.5).add(0.35));
  materials.push(gauge);
  const navRed = new THREE.MeshBasicNodeMaterial();
  navRed.colorNode = vec3(1, 0.06, 0.04).mul(u.night.mul(4).add(0.5));
  const navGreen = new THREE.MeshBasicNodeMaterial();
  navGreen.colorNode = vec3(0.08, 1, 0.3).mul(u.night.mul(4).add(0.5));
  const navWhite = new THREE.MeshBasicNodeMaterial();
  navWhite.colorNode = vec3(1, 0.97, 0.9).mul(u.night.mul(4).add(0.4));
  materials.push(navRed, navGreen, navWhite);

  // --- Hull and deck ---------------------------------------------------------------------------
  const hull = hullPieces();
  add(merge([hull.bottomG, hull.sideSG, hull.sidePG, hull.transom]), gel);
  const deck = deckPieces();
  add(merge([deck.foreG, ...deck.caps, ...deck.liners, ...deck.bulkheads, deck.aft]), deckWhite);
  add(deck.floorG, teak, false);

  // Rub rail along the gunwale, and a stainless strip on top of it.
  const rail: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const s = 0.01 + 0.99 * (i / 40);
    rail.push(new THREE.Vector3(halfBeam(s) + 0.015, sheer(s) - 0.02, zAt(s)));
  }
  const railP = rail.map((p) => new THREE.Vector3(-p.x, p.y, p.z)).reverse();
  add(tube([...railP, new THREE.Vector3(0, sheer(0) - 0.02, Z_BOW - 0.02), ...rail], 0.04, 120), rubber);

  // Bow rails on stanchions.
  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const s = 0.06 + 0.3 * (i / 10);
      pts.push(new THREE.Vector3(side * (halfBeam(s) - 0.06), sheer(s) + 0.32, zAt(s)));
    }
    pts.unshift(new THREE.Vector3(0, sheer(0.02) + 0.3, zAt(0.025)));
    add(tube(pts, 0.016), steel);
    for (const s of [0.1, 0.2, 0.33]) {
      const g = new THREE.CylinderGeometry(0.013, 0.013, 0.32, 8);
      add(place(g, side * (halfBeam(s) - 0.06), sheer(s) + 0.16, zAt(s)), steel);
    }
  }
  // Cleats.
  for (const [x, s] of [
    [0, 0.04],
    [-0.8, 0.95],
    [0.8, 0.95],
  ] as const) {
    const g = new RoundedBoxGeometry(0.18, 0.05, 0.05, 2, 0.02);
    add(place(g, x, sheer(s) + 0.05, zAt(s), 0, x === 0 ? Math.PI / 2 : 0), steel);
  }
  // Navigation lights: port red, starboard green at the bow; white all-round on a short pole aft.
  const lamp = (m: THREE.Material, x: number, yy: number, z: number) => add(new THREE.SphereGeometry(0.035, 10, 8).translate(x, yy, z), m, false);
  lamp(navRed, -0.12, sheer(0.02) + 0.08, zAt(0.03));
  lamp(navGreen, 0.12, sheer(0.02) + 0.08, zAt(0.03));

  // --- Sun pad, console, helm seat --------------------------------------------------------------
  const pad = new RoundedBoxGeometry(1.2, 0.1, 0.95, 3, 0.05);
  add(place(pad, 0, sheer(0.2) + 0.07, zAt(0.2), -0.06), vinyl);

  const cz = zAt(0.5);
  const console = new RoundedBoxGeometry(0.86, 0.95, 0.72, 4, 0.08);
  add(place(console, 0, FLOOR_Y + 0.47, cz), deckWhite);
  // Dash: a slanted dark panel with two glowing gauges and a wheel.
  const dashG = new RoundedBoxGeometry(0.78, 0.04, 0.42, 2, 0.02);
  add(place(dashG, 0, FLOOR_Y + 0.98, cz + 0.12, -0.45), dash);
  for (const gx of [-0.18, 0.02]) add(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 20).rotateX(Math.PI / 2 - 0.45).translate(gx, FLOOR_Y + 1.03, cz + 0.06), gauge, false);
  const wheel = new THREE.TorusGeometry(0.16, 0.018, 8, 28);
  add(place(wheel, 0.22, FLOOR_Y + 1.07, cz + 0.27, -0.9), rubber);
  // Windshield: a curved band of tinted acrylic, with a stainless grab rail above.
  const shield = new THREE.CylinderGeometry(0.62, 0.62, 0.36, 28, 1, true, -Math.PI * 0.32, Math.PI * 0.64);
  add(place(shield, 0, FLOOR_Y + 1.15, cz + 0.42, -0.35, Math.PI), glass, false);
  const grab = new THREE.TorusGeometry(0.5, 0.017, 8, 30, Math.PI);
  add(place(grab, 0, FLOOR_Y + 1.12, cz - 0.05, 0, 0, 0), steel);
  // VHF antenna.
  add(place(new THREE.CylinderGeometry(0.008, 0.016, 1.6, 6), 0.44, FLOOR_Y + 1.6, cz + 0.2, 0.25, 0, -0.08), deckWhite);

  // Helm seat (leaning post) behind the console.
  const sz = zAt(0.67);
  add(place(new RoundedBoxGeometry(0.75, 0.5, 0.5, 3, 0.06), 0, FLOOR_Y + 0.25, sz), deckWhite);
  add(place(new RoundedBoxGeometry(0.78, 0.13, 0.5, 3, 0.05), 0, FLOOR_Y + 0.56, sz), vinyl);
  add(place(new RoundedBoxGeometry(0.78, 0.4, 0.12, 3, 0.05), 0, FLOOR_Y + 0.85, sz + 0.24, 0.12), vinyl);
  // Cooler seat in front of the console.
  add(place(new RoundedBoxGeometry(0.62, 0.42, 0.42, 3, 0.05), 0, FLOOR_Y + 0.21, zAt(0.38)), deckWhite);
  add(place(new RoundedBoxGeometry(0.64, 0.08, 0.44, 3, 0.035), 0, FLOOR_Y + 0.46, zAt(0.38)), vinyl);
  // All-round light pole at the stern.
  add(place(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), -0.7, sheer(0.97) + 0.35, zAt(0.97)), steel);
  lamp(navWhite, -0.7, sheer(0.97) + 0.72, zAt(0.97));

  // --- Outboard ----------------------------------------------------------------------------------
  const motor = new THREE.Group();
  motor.position.set(0, sheer(1) - 0.05, Z_STERN + 0.18);
  group.add(motor);
  const mAdd = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    motor.add(mesh);
    geometries.push(g);
    return mesh;
  };
  mAdd(new RoundedBoxGeometry(0.46, 0.62, 0.66, 5, 0.16).translate(0, 0.42, 0.12), engineMat);
  mAdd(new RoundedBoxGeometry(0.47, 0.06, 0.67, 2, 0.02).translate(0, 0.2, 0.12), engineRed);
  mAdd(new RoundedBoxGeometry(0.3, 0.42, 0.34, 3, 0.07).translate(0, -0.06, 0.1), engineMat);
  mAdd(new RoundedBoxGeometry(0.12, 0.72, 0.24, 2, 0.04).translate(0, -0.6, 0.1), engineMat);
  mAdd(new RoundedBoxGeometry(0.42, 0.025, 0.42, 2, 0.01).translate(0, -0.66, 0.08), engineMat);
  mAdd(new THREE.CapsuleGeometry(0.075, 0.32, 4, 12).rotateX(Math.PI / 2).translate(0, -0.92, 0.12), engineMat);
  const prop = new THREE.Group();
  prop.position.set(0, -0.92, 0.38);
  motor.add(prop);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.1, 12).rotateX(Math.PI / 2), steel);
  prop.add(hub);
  geometries.push(hub.geometry);
  for (let b = 0; b < 3; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.012).translate(0, 0.12, 0), steel);
    blade.rotation.set(0.35, 0, (b / 3) * Math.PI * 2);
    prop.add(blade);
    geometries.push(blade.geometry);
  }
  // Bracket clamping the motor to the transom.
  add(place(new RoundedBoxGeometry(0.32, 0.3, 0.16, 2, 0.03), 0, sheer(1) - 0.12, Z_STERN + 0.06), engineMat);

  let spin = 0;
  return {
    group,
    /** Flag mount point on the stern, port side. */
    flagMount: new THREE.Vector3(-0.7, sheer(0.97) + 0.8, zAt(0.97)),
    update(dt: number, throttle: number, speed: number) {
      spin += dt * (4 + throttle * 60 + speed * 2);
      prop.rotation.z = spin;
      // The motor trims up a touch at speed.
      motor.rotation.x = -Math.min(0.12, speed * 0.008);
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
  };
}

