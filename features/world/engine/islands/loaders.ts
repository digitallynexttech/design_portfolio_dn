// glTF loading for the real client models (SKELMET's print file, the Know Your Genes mascots) and
// the CC0 props and scans. Draco decoder self-hosted at /draco/; meshopt bundled. Loaders are
// created once, on first use, and loads are tracked so the engine can wait for the world to arrive.
import type { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let loader: Promise<GLTFLoader> | null = null;

function getLoader(): Promise<GLTFLoader> {
  loader ??= (async () => {
    const [{ GLTFLoader }, { DRACOLoader }, { MeshoptDecoder }] = await Promise.all([
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/loaders/DRACOLoader.js"),
      import("three/examples/jsm/libs/meshopt_decoder.module.js"),
    ]);
    const l = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    l.setDRACOLoader(draco);
    l.setMeshoptDecoder(MeshoptDecoder);
    return l;
  })();
  return loader;
}

const pending = new Set<Promise<unknown>>();

export function loadGLTF(url: string): Promise<GLTF> {
  const p = getLoader().then((l) => l.loadAsync(url));
  pending.add(p);
  p.catch(() => undefined).finally(() => pending.delete(p));
  return p;
}

/** Resolves once every model requested so far has arrived (or failed). */
export async function modelsSettled() {
  while (pending.size) await Promise.allSettled([...pending]);
}
