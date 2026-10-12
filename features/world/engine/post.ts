// The final image: the scene rendered with multisampling, a soft bloom so the sun's glints and the
// lamps glow, a gentle vignette, then filmic tone mapping. The light tier skips bloom and uses FXAA.
//
// The multisample count is fixed for the life of the world: every scene shader is compiled for it,
// so changing it would rebuild them all mid-voyage. Bloom can be switched off (auto quality) by
// swapping the output node, which rebuilds only the full-screen pass.
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
  // Vignette: a touch of darkening at the corners, like a lens.
  const d = screenUV.sub(0.5).length();
  const vignette = float(1).sub(smoothstep(0.45, 0.95, d).mul(0.22));
  const finish = (c: N) => vec4(c.rgb.mul(vignette), 1);
  const plain = finish(color);
  const bloomNode = tier >= 2 ? bloom(color, 0.6, 0.45, 0.9) : null;
  const glowing = bloomNode ? finish(color.add(bloomNode.mul(glow))) : plain;
  let bloomOn = !!bloomNode;
  pipeline.outputNode = tier === 1 ? fxaa(plain) : glowing;

  return {
    pipeline,
    /** The multisampled target the scene renders into (shaders are precompiled for it). */
    target: scenePass.renderTarget,
    /** Night and storms glow more (lamps, lightning); bright days less. */
    setGlow(value: number) {
      glow.value = bloomOn ? value : 0;
    },
    /** Bloom costs several blur passes a frame; off, they stop running (nothing else recompiles). */
    setBloom(on: boolean) {
      if (!bloomNode || on === bloomOn) return;
      bloomOn = on;
      pipeline.outputNode = on ? glowing : plain;
      pipeline.needsUpdate = true;
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
