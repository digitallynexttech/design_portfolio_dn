// The studio island: our building, real team photos on billboards, and a marina where every boat
// carries the name of someone who makes the work.
import * as THREE from "three/webgpu";
import { ISLANDS } from "../../layout";
import { PAL } from "../shared";
import { groundHeight, landById, scatter } from "../terrain";
import { type Batch, type Disposables, type IslandCtx, type Materials, type Part, SHAPES, lamp, sign, textTexture } from "./common";
import { detail } from "../layers";
import { screenImage } from "./loaders";

type Flora = { tree: (x: number, y: number, z: number, s?: number, kind?: "round" | "pine" | "palm") => void };

export function buildStudio(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const island = ISLANDS.find((i) => i.id === "studio")!;
  const land = landById("studio");
  const ground = (x: number, z: number) => groundHeight(land, x, z);
  const red = "#e21f26";

  // The building: white, two storeys, glass front, a red line.
  const bx = island.x - 1;
  const bz = island.z - 2;
  const by = ground(bx, bz) - 0.1;
  const white = mats.paint("#f6f4ef", 0.7);
  batch.add(SHAPES.box, white, { x: bx, y: by + 3, z: bz, s: [11, 6, 7] });
  batch.add(SHAPES.box, mats.windows(), { x: bx, y: by + 1.6, z: bz + 3.52, s: [9.6, 2.2, 0.05] });
  batch.add(SHAPES.box, mats.windows(), { x: bx, y: by + 4.4, z: bz + 3.52, s: [9.6, 2.0, 0.05] });
  batch.add(SHAPES.box, mats.paint(red, 0.6), { x: bx, y: by + 3, z: bz + 3.56, s: [11, 0.3, 0.06] });
  batch.add(SHAPES.box, mats.paint("#2b2e33", 0.6), { x: bx, y: by + 6.1, z: bz, s: [11.4, 0.25, 7.4] });

  // Billboards: real photos of the studio.
  const photos = ctx.data.studioPhotos.slice(0, 3);
  const spots = [
    { x: island.x - 10, z: island.z + 3, ry: 0.35 },
    { x: island.x + 9, z: island.z + 4, ry: -0.35 },
    { x: island.x - 1, z: island.z - 9, ry: 0 },
  ];
  photos.forEach((photo, i) => {
    const s = spots[i];
    const y = ground(s.x, s.z);
    const h = 3.2;
    const w = h * (photo.width / photo.height);
    const mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats.paint("#2b2e33", 0.6));
    mesh.position.set(s.x + Math.sin(s.ry) * 0.12, y + 2.2 + h / 2, s.z + Math.cos(s.ry) * 0.12);
    mesh.rotation.y = s.ry;
    ctx.scene.add(mesh);
    d.meshes.push(mesh);
    d.geometries.push(mesh.geometry);
    batch.add(SHAPES.box, mats.pal(PAL.WOOD_DARK), { x: s.x, y: y + 2.2 + h / 2, z: s.z, ry: s.ry, s: [w + 0.3, h + 0.3, 0.15] });
    for (const k of [-1, 1]) batch.add(SHAPES.box, mats.pal(PAL.WOOD_DARK), { x: s.x + Math.cos(s.ry) * k * w * 0.35, y: y + 1.1, z: s.z - Math.sin(s.ry) * k * w * 0.35, s: [0.2, 2.6, 0.2] });
    new THREE.TextureLoader().load(screenImage(photo.src), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      d.textures.push(tex);
      const m = mats.screen(tex);
      d.materials.push(m);
      mesh.material = m;
    });
  });

  // The marina: one boat per person, named on the stern.
  const team = ctx.data.team;
  const rowZ = island.z + 26;
  const x0 = island.x + 22 - ((team.length - 1) * 4.3) / 2;
  batch.add(SHAPES.box, mats.pal(PAL.WOOD), { x: island.x + 22, y: 0.55, z: rowZ - 3.6, s: [team.length * 4.3 + 4, 0.18, 1.8] });
  for (let k = 0; k <= team.length; k++) batch.add(SHAPES.cyl6, mats.pal(PAL.WOOD_DARK), { x: x0 - 2.15 + k * 4.3, y: -0.2, z: rowZ - 2.8, s: [0.3, 2, 0.3] });
  ctx.physics.segments.push({ ax: x0 - 3, az: rowZ - 3.6, bx: x0 + (team.length - 1) * 4.3 + 3, bz: rowZ - 3.6, r: 1.0, id: "marina" });
  const hullColors = ["#f6f4ef", "#e21f26", "#0ec8c5", "#1d2a44", "#f6f4ef", "#f4b33c"];
  const boats: { group: THREE.Group; x: number; z: number; phase: number }[] = [];
  team.forEach((person, i) => {
    const x = x0 + i * 4.3;
    const z = rowZ;
    const group = new THREE.Group();
    const hull = new THREE.Mesh(SHAPES.box, mats.paint(hullColors[i % hullColors.length], 0.45));
    hull.scale.set(1.5, 0.8, 3.4);
    hull.position.y = 0.2;
    hull.castShadow = true;
    const bow = new THREE.Mesh(SHAPES.cone, mats.paint(hullColors[i % hullColors.length], 0.45));
    bow.scale.set(1.5, 1.2, 0.8);
    bow.rotation.x = -Math.PI / 2;
    bow.position.set(0, 0.2, -2.1);
    const cabin = new THREE.Mesh(SHAPES.box, mats.paint("#f3f1ec", 0.6));
    cabin.scale.set(1.1, 0.7, 1.2);
    cabin.position.set(0, 0.9, 0.1);
    group.add(hull, bow, cabin);
    const tex = textTexture(
      [
        { text: person.name, size: 70, weight: 700, color: "#0a0a0a" },
        { text: person.title, size: 38, weight: 500, color: "#4a4f57", font: "--font-text", gap: 6 },
      ],
      { width: 768, height: 200, bg: "#f6f4ef", padding: 28, accent: person.group === "WEM" ? "#0ec8c5" : person.group === "VIM" ? red : "#9aa0a8" },
    );
    d.textures.push(tex);
    const m = mats.screen(tex);
    d.materials.push(m);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.94), m);
    plate.position.set(0, 2.15, 1.9);
    plate.rotation.x = -0.25;
    group.add(plate);
    d.geometries.push(plate.geometry);
    const post = new THREE.Mesh(SHAPES.box, mats.pal(PAL.WOOD_DARK));
    post.scale.set(0.12, 1.4, 0.12);
    post.position.set(0, 1.3, 1.75);
    group.add(post);
    // Moored bow-in, so the name on the stern faces the open water (and the camera).
    group.position.set(x, 0, z);
    ctx.scene.add(detail(group));
    d.meshes.push(group);
    ctx.physics.posts.push({ x, z, r: 1.3, id: `marina-${i}` });
    boats.push({ group, x, z, phase: i * 0.9 });
  });

  sign(ctx, batch, mats, d, { x: island.x + 5, y: ground(island.x + 5, island.z + 9) + 0.2, z: island.z + 9 }, "The studio", "Who poured it", red, 6);
  lamp(ctx, batch, mats, island.x - 1, ground(island.x - 1, island.z + 10), island.z + 10);
  for (const p of scatter(land, 10, { keepOut: [{ x: bx, z: bz, r: 7.5 }, ...spots.map((s) => ({ x: s.x, z: s.z, r: 3.5 })), { x: island.x + 5, z: island.z + 9, r: 4.5 }, { x: island.x - 4, z: island.z + 12, r: 4 }], seed: 321 })) flora.tree(p.x, p.y, p.z);

  return {
    update(_dt, t) {
      for (const b of boats) {
        b.group.position.y = ctx.physics.sea(b.x, b.z) - 0.25;
        b.group.rotation.z = Math.sin(t * 1.2 + b.phase) * 0.04;
      }
    },
  };
}
