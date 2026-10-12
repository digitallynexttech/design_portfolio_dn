// The final image: the scene rendered with multisampling, a soft bloom so the sun's glints and the
// lamps glow, a gentle vignette, then filmic tone mapping. Phones skip bloom and keep FXAA only.
import * as THREE from "three/webgpu";
import { float, pass, screenUV, smoothstep, uniform, vec4 } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { fxaa } from "three/examples/jsm/tsl/display/FXAANode.js";
import type { N } from "./tsl";

export type Post = ReturnType<typeof createPost>;

export function createPost(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.Camera, tier: 1 | 2 | 3) {
  const pipeline = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera, { samples: tier === 3 ? 4 : tier === 2 ? 2 : 0 });
  const color = scenePass.getTextureNode("output");
  const glow = uniform(tier === 1 ? 0 : 0.22);
  let out: N = color;
  let bloomNode: ReturnType<typeof bloom> | null = null;
  if (tier >= 2) {
    bloomNode = bloom(color, 0.6, 0.45, 0.9);
    out = out.add(bloomNode.mul(glow));
  }
  // Vignette: a touch of darkening at the corners, like a lens.
  const d = screenUV.sub(0.5).length();
  const vignette = float(1).sub(smoothstep(0.45, 0.95, d).mul(0.22));
  out = vec4(out.rgb.mul(vignette), 1);
  pipeline.outputNode = tier === 1 ? fxaa(out) : out;

  return {
    pipeline,
    /** The multisampled target the scene renders into (shaders are precompiled for it). */
    target: scenePass.renderTarget,
    /** Night and storms glow more (lamps, lightning); bright days less. */
    setGlow(value: number) {
      glow.value = tier === 1 ? 0 : value;
    },
    render() {
      pipeline.render();
    },
    dispose() {
      bloomNode?.dispose();
      pipeline.dispose();
    },
  };
}
