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

/**
 * Photos shown on in-world screens and billboards, at the size a 3 m screen can show
 * (scripts/world-assets.py makes them from the originals). Anything not listed loads as is.
 */
const SCREEN_COPIES: Record<string, string> = {
  "/studio/team.webp": "/world/img/studio-team.webp",
  "/studio/c1.webp": "/world/img/studio-c1.webp",
  "/studio/workhere.webp": "/world/img/studio-workhere.webp",
  "/work/dnms/dashboard-hr.webp": "/world/img/dnms-dashboard-hr.webp",
  "/work/dnms/analytics.webp": "/world/img/dnms-analytics.webp",
  "/work/dnms/project-goals.webp": "/world/img/dnms-project-goals.webp",
  "/work/dnms/ai-connections.webp": "/world/img/dnms-ai-connections.webp",
  "/video/reel-poster.webp": "/world/img/reel-poster.webp",
};
// The archive's floating screens (9 m wide).
const ARCHIVE = ["advent-global", "imet-global", "khaleej", "house-of-nandini", "mauli", "gajna-overseas", "sanjivani-edge", "opinova-foundation", "neotech-world-lab", "neet-playbook"];
for (const name of ARCHIVE) SCREEN_COPIES[`/archive/${name}.webp`] = `/world/img/archive-${name}.webp`;

export function screenImage(src: string): string {
  return SCREEN_COPIES[src] ?? src;
}

/** Resolves once every model requested so far has arrived (or failed). */
export async function modelsSettled() {
  while (pending.size) await Promise.allSettled([...pending]);
}
