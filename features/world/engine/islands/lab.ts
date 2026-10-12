// The Lab: work made for no client. A glass tank shows the wake simulation raw, as the GPU sees it;
// a cloud of particles keeps pouring itself into the shapes from the home page.
import * as THREE from "three/webgpu";
import { AdditiveBlending } from "three/webgpu";
import { abs, attribute, color, float, hash, instanceIndex, mix, positionLocal, smoothstep, texture, uniform, uv, vec3 } from "three/tsl";
import { drop, helix, screens, xMark, type Shape } from "@/features/water/forms/shapes";
import { ISLANDS } from "../../layout";
import { groundHeight, landById, scatter } from "../terrain";
import { type Batch, type Disposables, type IslandCtx, type Materials, type Part, SHAPES, sign, textTexture } from "./common";
import { detail } from "../layers";

type Flora = { tree: (x: number, y: number, z: number, s?: number, kind?: "round" | "pine" | "palm") => void };

export function buildLab(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables, flora: Flora): Part {
  const island = ISLANDS.find((i) => i.id === "lab")!;
  const land = landById("lab");
  const ground = (x: number, z: number) => groundHeight(land, x, z);
  const teal = "#0ec8c5";

  // The dome.
  const dx = island.x + 5;
  const dz = island.z + 1;
  const dy = ground(dx, dz) - 0.2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mats.paint("#f4f6f7", 0.35, 0.1));
  dome.position.set(dx, dy, dz);
  dome.castShadow = true;
  dome.receiveShadow = true;
  ctx.scene.add(dome);
  d.meshes.push(dome);
  d.geometries.push(dome.geometry);
  batch.add(SHAPES.cyl, mats.paint(teal, 0.4), { x: dx, y: dy + 0.4, z: dz, s: [8.7, 0.6, 8.7] });
  batch.add(SHAPES.box, mats.glow("#c9fffb", 0.25, 2.4), { x: dx, y: dy + 1.3, z: dz + 4.05, s: [2.2, 2.2, 0.08] });

  // The tank: the ripple simulation around the boat, drawn as heights.
  const tx = island.x - 5;
  const tz = island.z + 2;
  const ty = ground(tx, tz);
  batch.add(SHAPES.box, mats.paint("#1a1d22", 0.5, 0.2), { x: tx, y: ty + 0.7, z: tz, s: [8.4, 1.4, 8.4] });
  const tankMat = new THREE.MeshBasicNodeMaterial();
  const h = texture(ctx.ripple.texture, uv()).x;
  const level = smoothstep(-0.12, 0.12, h);
  tankMat.colorNode = mix(vec3(0.02, 0.05, 0.1), color(new THREE.Color(teal)).mul(1.4), level).add(vec3(abs(h).mul(2.5)));
  d.materials.push(tankMat);
  const tank = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 7.6), tankMat);
  tank.rotation.x = -Math.PI / 2;
  tank.position.set(tx, ty + 1.42, tz);
  ctx.scene.add(tank);
  d.meshes.push(tank);
  d.geometries.push(tank.geometry);
  const caption = textTexture(
    [
      { text: "Your wake, live", size: 70, weight: 700, color: "#f6f4ef" },
      { text: "The simulation the sea runs on, around your boat", size: 32, weight: 500, color: "#9fe9e6", font: "--font-text", gap: 6 },
    ],
    { width: 1024, height: 200, bg: "#0b0d10", padding: 36, accent: teal },
  );
  d.textures.push(caption);
  const capMat = mats.screen(caption);
  d.materials.push(capMat);
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.25), capMat);
  cap.position.set(tx, ty + 2.4, tz + 4.3);
  cap.rotation.x = -0.3;
  ctx.scene.add(cap);
  d.meshes.push(cap);
  d.geometries.push(cap.geometry);

  // The sculpture: particles that keep taking new shapes.
  const count = ctx.tier === 3 ? 2600 : ctx.tier === 2 ? 1700 : 900;
  const cx = island.x + 2;
  const cz = island.z + 7;
  const cy = ground(cx, cz);
  batch.add(SHAPES.cyl, mats.paint("#1a1d22", 0.5, 0.2), { x: cx, y: cy + 0.5, z: cz, s: [2.4, 1, 2.4] });
  const base = new THREE.OctahedronGeometry(0.07, 0);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.attributes.position);
  geometry.setAttribute("normal", base.attributes.normal);
  geometry.instanceCount = count;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy + 6, cz), 8);
  const from = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const to = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const cFrom = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const cTo = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  geometry.setAttribute("aFrom", from);
  geometry.setAttribute("aTo", to);
  geometry.setAttribute("aCFrom", cFrom);
  geometry.setAttribute("aCTo", cTo);
  d.geometries.push(geometry, base);
  const morph = uniform(1);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
  const delay = hash(instanceIndex.toFloat().add(7.7)).mul(0.45);
  const k = smoothstep(delay, delay.add(0.55), morph);
  const p = mix(attribute("aFrom", "vec3"), attribute("aTo", "vec3"), k);
  // Mid-flight particles lift and swirl, like poured water.
  const lift = k.mul(float(1).sub(k)).mul(4);
  material.positionNode = p.mul(3.2).add(vec3(cx, cy + 6.2, cz)).add(vec3(0, lift.mul(1.2), 0)).add(positionLocal);
  material.colorNode = mix(attribute("aCFrom", "vec3"), attribute("aCTo", "vec3"), k).mul(1.6);
  material.opacityNode = float(0.9);
  d.materials.push(material);
  const cloud = detail(new THREE.Mesh(geometry, material));
  cloud.frustumCulled = false;
  ctx.scene.add(cloud);
  d.meshes.push(cloud);

  const forms: (Shape | null)[] = [helix(count), screens(count), drop(count), null];
  void xMark(count).then((shape) => (forms[3] = shape));
  let formIndex = 0;
  const load = (attr: THREE.InstancedBufferAttribute, src: Float32Array) => {
    (attr.array as Float32Array).set(src);
    attr.needsUpdate = true;
  };
  load(from, forms[0]!.positions);
  load(to, forms[0]!.positions);
  load(cFrom, forms[0]!.colors);
  load(cTo, forms[0]!.colors);
  let hold = 0;

  sign(ctx, batch, mats, d, { x: island.x - 10.5, y: Math.max(0.5, ground(island.x - 10.5, island.z + 6.5)) + 0.2, z: island.z + 6.5 }, "The Lab", "Made for no client", teal, 5.2);
  for (const pnt of scatter(land, 5, { keepOut: [{ x: dx, z: dz, r: 5.5 }, { x: tx, z: tz, r: 5.5 }, { x: cx, z: cz, r: 2.5 }, { x: island.x - 10.5, z: island.z + 6.5, r: 4 }, { x: island.x + 4, z: island.z + 11, r: 4 }], seed: 341, minH: 0.6 })) flora.tree(pnt.x, pnt.y, pnt.z, 1, "palm");

  return {
    update(dt) {
      morph.value = Math.min(1.05, morph.value + dt * 0.45);
      if (morph.value >= 1.05) {
        hold += dt;
        if (hold > 4) {
          hold = 0;
          let next = (formIndex + 1) % forms.length;
          if (!forms[next]) next = 0;
          (from.array as Float32Array).set(to.array as Float32Array);
          (cFrom.array as Float32Array).set(cTo.array as Float32Array);
          from.needsUpdate = true;
          cFrom.needsUpdate = true;
          load(to, forms[next]!.positions);
          load(cTo, forms[next]!.colors);
          formIndex = next;
          morph.value = 0;
        }
      }
    },
  };
}
