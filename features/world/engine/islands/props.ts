// Real props from CC0 scans (Poly Haven, via scripts/world-assets.py): navigation buoys, channel
// markers, lifebuoys, crates and street lamps. Loaded once, cloned per use, sized in metres, and
// optionally recoloured (hue and saturation) so a red channel marker can become a teal service buoy.
import * as THREE from "three/webgpu";
import { color, float, hue, saturation, texture, uv } from "three/tsl";
import type { Shared } from "../shared";
import { detail } from "../layers";
import { loadGLTF } from "./loaders";

export type PropName = "buoy" | "marker" | "lifebuoy" | "crate" | "lamp";

export type Recolor = { hue?: number; saturation?: number; brightness?: number };

export function createProps(shared: Shared) {
  const cache = new Map<PropName, Promise<THREE.Object3D>>();
  const materials: THREE.Material[] = [];
  const recolored = new Map<string, THREE.Material>();

  const source = (name: PropName) => {
    let p = cache.get(name);
    if (!p) {
      p = loadGLTF(`/world/models/${name}.glb`).then((gltf) => gltf.scene);
      cache.set(name, p);
    }
    return p;
  };

  /** A node-material copy of a glTF standard material, with its colour shifted. */
  const recolor = (src: THREE.MeshStandardMaterial, key: string, rc: Recolor) => {
    const id = `${src.uuid}:${key}`;
    const existing = recolored.get(id);
    if (existing) return existing;
    const m = new THREE.MeshStandardNodeMaterial({
      roughness: src.roughness,
      metalness: src.metalness,
      normalMap: src.normalMap,
      roughnessMap: src.roughnessMap,
      metalnessMap: src.metalnessMap,
      aoMap: src.aoMap,
    });
    let c = src.map ? texture(src.map, uv()).rgb.mul(color(src.color)) : color(src.color);
    if (rc.hue) c = hue(c, float(rc.hue));
    if (rc.saturation !== undefined) c = saturation(c, float(rc.saturation));
    if (rc.brightness !== undefined) c = c.mul(rc.brightness);
    m.colorNode = shared.weathered(c, 0.6);
    recolored.set(id, m);
    materials.push(m);
    return m;
  };

  return {
    /**
     * Place a clone of a prop, `height` metres tall, standing on y = 0 of the returned group.
     * The group is returned immediately; the model arrives inside it when loaded.
     */
    place(name: PropName, height: number, rc?: Recolor): THREE.Group {
      const holder = new THREE.Group();
      void source(name).then((src) => {
        const model = src.clone(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const k = height / size.y;
        model.position.set(-center.x * k, -box.min.y * k, -center.z * k);
        model.scale.setScalar(k);
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (rc) mesh.material = recolor(mesh.material as THREE.MeshStandardMaterial, JSON.stringify(rc), rc);
        });
        holder.add(model);
        detail(holder);
      });
      return holder;
    },
    dispose() {
      for (const m of materials) m.dispose();
    },
  };
}

export type Props = ReturnType<typeof createProps>;

