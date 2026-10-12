// Render layers. Small detail (grass, ferns, props, signs, particles) lives on its own layer: the
// main camera and the sun's shadow map see it, but the sea's mirror skips it, which keeps the
// reflection pass to the big shapes that actually read in a reflection. The sea and the sky sit
// on a layer only the main camera sees: the mirror never renders the water it is drawn on, and
// the sky's reflection comes from the environment map, where the sea's normals break it up.
import type * as THREE from "three/webgpu";

export const LAYER_DETAIL = 1;
export const LAYER_VIEW = 2;

/** Put an object and everything under it on the detail layer. */
export function detail<T extends THREE.Object3D>(object: T): T {
  object.traverse((o) => o.layers.set(LAYER_DETAIL));
  return object;
}
