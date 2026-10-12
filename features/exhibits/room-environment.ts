import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** The PMREMGenerator internals used to build its filter materials ahead of time. */
type PmremInternals = {
  _setSize?: (cubeSize: number) => void;
  _allocateTargets?: () => THREE.WebGLRenderTarget;
  _ggxMaterial?: THREE.Material | null;
  _blurMaterial?: THREE.Material | null;
};

/** fromScene's default cube size; the warm-up must allocate the same targets fromScene will reuse. */
const PMREM_SIZE = 256;

/**
 * three's RoomEnvironment, prefiltered for PBR, without freezing the page. PMREM's GGX filter is a
 * 256-sample loop that Direct3D (Chrome on Windows) unrolls, so compiling it the usual way blocks
 * the main thread for about half a second, with the room's own materials and the blur on top. Here
 * all of those programs compile in parallel first (KHR_parallel_shader_compile); fromScene then finds
 * them ready and only draws. The warm-up reads two PMREMGenerator internals; if a three upgrade
 * renames them it is skipped and the environment is generated exactly as before, only less smoothly.
 */
export async function roomEnvironment(gl: THREE.WebGLRenderer, sigma = 0.04): Promise<THREE.Texture> {
  const pmrem = new THREE.PMREMGenerator(gl);
  const room = new RoomEnvironment();
  try {
    await warm(gl, pmrem as unknown as PmremInternals, room);
  } catch {
    // Fall through: generate without the warm-up.
  }
  const texture = pmrem.fromScene(room, sigma).texture;
  pmrem.dispose();
  room.dispose();
  return texture;
}

async function warm(gl: THREE.WebGLRenderer, pmrem: PmremInternals, room: THREE.Scene): Promise<void> {
  if (typeof pmrem._setSize !== "function" || typeof pmrem._allocateTargets !== "function") return;
  pmrem._setSize(PMREM_SIZE);
  // Creates the filter materials and the ping-pong target that fromScene reuses at this size.
  const target = pmrem._allocateTargets();
  // Program variants depend on which attributes exist: mirror PMREM's planes (position, no normal).
  const quad = new THREE.BufferGeometry();
  quad.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9), 3));
  const jobs: Promise<unknown>[] = [];
  const previous = gl.getRenderTarget();
  try {
    // PMREM draws everything into half-float targets: binding one gives the same programs (no tone
    // mapping, working colour space) as the real passes.
    gl.setRenderTarget(target);
    for (const material of [pmrem._ggxMaterial, pmrem._blurMaterial]) {
      if (material) jobs.push(gl.compileAsync(new THREE.Mesh(quad, material), new THREE.OrthographicCamera()));
    }
    jobs.push(gl.compileAsync(room, new THREE.PerspectiveCamera(90, 1, 0.1, 100)));
  } finally {
    gl.setRenderTarget(previous);
    target.dispose();
  }
  await Promise.all(jobs);
  quad.dispose();
}
