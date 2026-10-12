// The hub: Digitally Next's own island. The walking-X stands as a lighthouse, its lantern sweeping
// the water at night and in mist; the dock opens the story of how this world was built.
import * as THREE from "three/webgpu";
import { AdditiveBlending } from "three/webgpu";
import { color, float, mix, normalView, positionLocal, smoothstep, uniform, uv, vec3 } from "three/tsl";
import { PAL } from "../shared";
import { groundHeight, landById, scatter } from "../terrain";
import { type Batch, type Disposables, type IslandCtx, type Materials, type Part, SHAPES, lamp, sign } from "./common";
import { walkingX } from "./mark";

export function buildHub(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: { tree: (x: number, y: number, z: number, s?: number, kind?: "round" | "pine" | "palm") => void }): Part {
  const land = landById("hub");
  const { u } = ctx.shared;

  // Stepping stones from the dock up to the lighthouse.
  const stone = mats.paint("#b8b1a4", 0.9);
  for (let z = 14, k = 0; z > -1.5; z -= 1.15, k++) {
    for (const side of [-1, 1]) {
      const x = Math.sin(z * 0.25) * 0.8 + side * (0.55 + (k % 3) * 0.06);
      const y = groundHeight(land, x, z);
      batch.add(SHAPES.cyl6, stone, { x, y: y + 0.03, z: z + side * 0.2, ry: k * 0.9, s: [0.95 + (k % 2) * 0.2, 0.12, 0.8] });
    }
  }

  // Plinth for the lighthouse.
  const baseX = 0;
  const baseZ = -4;
  const baseY = groundHeight(land, baseX, baseZ);
  batch.add(SHAPES.cyl, mats.paint("#8f8b83", 0.95), { x: baseX, y: baseY + 0.8, z: baseZ, s: [7.5, 2.4, 7.5] });
  batch.add(SHAPES.cyl, mats.paint("#e9e6df", 0.7), { x: baseX, y: baseY + 2.1, z: baseZ, s: [6.8, 0.3, 6.8] });
  const top = baseY + 2.25;

  const group = new THREE.Group();
  group.position.set(baseX, top, baseZ);
  ctx.scene.add(group);
  d.meshes.push(group);

  // The mark: teal water, red shoes (bottom third), as on the home page.
  // Lacquered like a sculpture: deep colour under a glossy clear coat that mirrors the sky.
  const markMat = new THREE.MeshPhysicalNodeMaterial({ roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
  const height = 13;
  markMat.colorNode = ctx.shared.weathered(mix(color(new THREE.Color("#c4121a")), color(new THREE.Color("#06a6a4")), smoothstep(height * 0.33, height * 0.37, positionLocal.y)), 0.6);
  markMat.emissiveNode = color(new THREE.Color("#0ec8c5")).mul(u.night.mul(0.25)).mul(smoothstep(height * 0.33, height * 0.37, positionLocal.y));
  d.materials.push(markMat);
  void walkingX(height, 2.2)
    .then(({ geometry }) => {
      d.geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, markMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    })
    .catch((e: unknown) => console.error("walkingX failed", e));

  // The lantern: a steel mast up through the mark to a gallery deck with a railing, a glazed lamp
  // room with the light inside, and a red dome with a vent and a lightning rod.
  const lanternY = height + 1.6;
  const lz = baseZ - 1.3;
  const iron = mats.paint("#1d2024", 0.45, 0.6);
  const lamp0 = top + lanternY;
  batch.add(new THREE.CylinderGeometry(0.11, 0.16, 1, 10), iron, { x: baseX, y: top + lanternY / 2, z: lz, s: [1, lanternY, 1] });
  batch.add(new THREE.CylinderGeometry(1.5, 1.3, 0.22, 24), iron, { x: baseX, y: lamp0, z: lz });
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    batch.add(SHAPES.cyl6, iron, { x: baseX + Math.cos(a) * 1.4, y: lamp0 + 0.45, z: lz + Math.sin(a) * 1.4, s: [0.04, 0.8, 0.04] });
  }
  batch.add(new THREE.TorusGeometry(1.4, 0.035, 6, 40), iron, { x: baseX, y: lamp0 + 0.85, z: lz, rx: Math.PI / 2 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    batch.add(SHAPES.box, iron, { x: baseX + Math.cos(a) * 0.82, y: lamp0 + 0.95, z: lz + Math.sin(a) * 0.82, ry: -a, s: [0.06, 1.5, 0.06] });
  }
  const glassMat = new THREE.MeshPhysicalNodeMaterial({ color: "#c9dde3", roughness: 0.02, metalness: 0, transparent: true, opacity: 0.28, clearcoat: 1 });
  d.materials.push(glassMat);
  const glassRoom = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 1.5, 24, 1, true), glassMat);
  glassRoom.position.set(baseX, lamp0 + 0.95, lz);
  ctx.scene.add(glassRoom);
  d.meshes.push(glassRoom);
  d.geometries.push(glassRoom.geometry);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 16), mats.glow("#fff4cf", 0.8, 6));
  lens.position.set(baseX, lamp0 + 0.95, lz);
  ctx.scene.add(lens);
  d.meshes.push(lens);
  d.geometries.push(lens.geometry);
  const dome = new THREE.SphereGeometry(0.95, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  d.geometries.push(dome);
  batch.add(dome, mats.paint("#c4121a", 0.4, 0.3), { x: baseX, y: lamp0 + 1.7, z: lz });
  batch.add(SHAPES.sphere, iron, { x: baseX, y: lamp0 + 2.72, z: lz, s: 0.3 });
  batch.add(SHAPES.cyl6, iron, { x: baseX, y: lamp0 + 3.2, z: lz, s: [0.03, 0.9, 0.03] });

  // The sweeping beam: two soft cones, visible at night, in storms and in mist.
  const beamMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, side: THREE.DoubleSide });
  const beamOn = uniform(0);
  const along = uv().y;
  beamMat.colorNode = vec3(1, 0.93, 0.72);
  // uv.y is 1 at the lantern and 0 at the far end of the cone.
  // Faces turned toward the viewer read as light; silhouettes fade, so the cone looks like a soft beam.
  const facing = normalView.z.abs().pow(1.6);
  beamMat.opacityNode = along.pow(1.8).mul(float(1).sub(smoothstep(0.95, 1.0, along))).mul(facing).mul(beamOn).mul(0.26);
  d.materials.push(beamMat);
  const beamGeometry = new THREE.ConeGeometry(3.6, 40, 20, 1, true);
  beamGeometry.translate(0, -20, 0);
  beamGeometry.rotateZ(Math.PI / 2);
  d.geometries.push(beamGeometry);
  const beam = new THREE.Group();
  beam.position.set(baseX, lamp0 + 0.95, lz);
  for (const k of [0, Math.PI]) {
    const cone = new THREE.Mesh(beamGeometry, beamMat);
    cone.rotation.y = k;
    cone.rotation.z = -0.22;
    cone.renderOrder = 6;
    beam.add(cone);
  }
  ctx.scene.add(beam);
  d.meshes.push(beam);
  ctx.physics.posts.push({ x: baseX, z: baseZ, r: 4, id: "lighthouse" });

  // A modern boathouse: white render, a glazed front with slim black mullions, a flat roof that
  // overhangs on timber, and a timber deck facing the water.
  const cx = 8;
  const cz = 2;
  const cy = groundHeight(land, cx, cz) - 0.1;
  const ry = -0.3;
  const local = (lx: number, lz2: number) => ({ x: cx + Math.cos(ry) * lx + Math.sin(ry) * lz2, z: cz - Math.sin(ry) * lx + Math.cos(ry) * lz2 });
  const render = mats.paint("#f1efe9", 0.85);
  const at = (lx: number, ly: number, lz2: number, s: [number, number, number], m: THREE.Material) => {
    const p = local(lx, lz2);
    batch.add(SHAPES.box, m, { x: p.x, y: cy + ly, z: p.z, ry, s });
  };
  at(0, 0.35, 0, [5.6, 0.7, 4.6], mats.paint("#9d988e", 0.95));
  at(-2.6, 1.95, 0, [0.4, 2.6, 4.2], render);
  at(2.6, 1.95, 0, [0.4, 2.6, 4.2], render);
  at(0, 1.95, -2.0, [5.6, 2.6, 0.3], render);
  const glazing = new THREE.MeshPhysicalNodeMaterial({ color: "#1b2a30", roughness: 0.04, metalness: 0.3, clearcoat: 1 });
  d.materials.push(glazing);
  at(0, 1.95, 2.0, [4.8, 2.5, 0.06], glazing);
  at(0, 1.6, 1.98, [4.6, 1.6, 0.02], mats.glow("#ffd9a8", 0.05, 1.6));
  for (const mx of [-2.4, -1.2, 0, 1.2, 2.4]) at(mx, 1.95, 2.05, [0.07, 2.55, 0.08], iron);
  at(0, 3.22, 2.05, [4.9, 0.08, 0.08], iron);
  at(0, 3.45, 0.35, [6.6, 0.28, 5.6], mats.paint("#3a3d42", 0.8));
  at(0, 3.28, 0.35, [6.4, 0.06, 5.4], mats.pal(PAL.WOOD));
  at(0, 0.55, 3.6, [6, 0.12, 2.6], mats.pal(PAL.WOOD));

  // The welcome sign at the foot of the dock.
  const signY = groundHeight(land, -5.5, 12.5);
  sign(ctx, batch, mats, d, { x: -5.5, y: Math.max(0.6, signY), z: 12.5 }, "We are water.", "Pour us into anything.", "#e21f26", 7.4);
  lamp(ctx, batch, mats, 2.5, groundHeight(land, 2.5, 11), 11);
  lamp(ctx, batch, mats, -2.5, groundHeight(land, -2.5, 4), 4);

  for (const p of scatter(land, 16, { keepOut: [{ x: 0, z: 6, r: 3.5 }, { x: baseX, z: baseZ, r: 6 }, { x: cx, z: cz, r: 4.5 }, { x: -5.5, z: 12.5, r: 4.5 }, { x: 0, z: 14, r: 3 }], seed: 5 })) {
    flora.tree(p.x, p.y, p.z, 0.8 + Math.random() * 0.5, Math.random() < 0.25 ? "pine" : "round");
  }

  let angle = 0;
  return {
    update(dt, _t, night) {
      angle += dt * 0.55;
      beam.rotation.y = angle;
      beamOn.value = Math.max(night, Math.min(1, u.cloud.value * 0.5 + (ctx.shared.u.fogNear.value < 70 ? 0.6 : 0)));
      beam.visible = beamOn.value > 0.03;
    },
  };
}
