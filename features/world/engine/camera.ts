// A fixed-angle three-quarter camera: it never rotates, so north is always up the screen and the
// map stays readable. It follows the boat with a little lookahead and leans toward docks nearby.
import * as THREE from "three/webgpu";
import { LAYER_DETAIL, LAYER_VIEW } from "./layers";

export type FollowCamera = ReturnType<typeof createCamera>;

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 2000);
  camera.layers.enable(LAYER_DETAIL);
  camera.layers.enable(LAYER_VIEW);
  const target = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const magnet = new THREE.Vector3();
  let magnetWeight = 0;
  let distance = 46;
  let zoom = 46;
  let portrait = false;
  let shake = 0;
  let fovBase = 42;
  let boost = 0;

  function limits() {
    return portrait ? { min: 30, max: 96, rest: 58 } : { min: 22, max: 86, rest: 46 };
  }

  return {
    camera,
    target,
    resize(width: number, height: number) {
      const wasPortrait = portrait;
      portrait = height > width * 1.05;
      camera.aspect = width / height;
      fovBase = portrait ? 50 : 42;
      camera.fov = fovBase + boost * 7;
      camera.updateProjectionMatrix();
      if (wasPortrait !== portrait) zoom = distance = limits().rest;
    },
    /** Zoom by a factor delta (wheel/pinch); positive pulls back. */
    zoom(delta: number) {
      const l = limits();
      zoom = THREE.MathUtils.clamp(zoom * Math.exp(delta), l.min, l.max);
    },
    /** Lean toward a point of interest (a dock) with weight 0–1. */
    setMagnet(point: THREE.Vector3 | null, weight: number) {
      if (point) magnet.copy(point);
      magnetWeight = point ? weight : 0;
    },
    /** Boosting 0–1: the view widens and pulls back a little, so speed reads on screen. */
    setBoost(amount: number) {
      if (Math.abs(amount - boost) < 0.002) return;
      boost = amount;
      camera.fov = fovBase + boost * 7;
      camera.updateProjectionMatrix();
    },
    kick(amount: number) {
      shake = Math.min(1, shake + amount);
    },
    snap(x: number, z: number) {
      target.set(x, 0, z);
    },
    update(dt: number, x: number, z: number, vx: number, vz: number, reduced: boolean) {
      desired.set(x + vx * 0.55, 0, z + vz * 0.55);
      if (magnetWeight > 0) desired.lerp(magnet, magnetWeight);
      const k = 1 - Math.exp(-3 * dt);
      target.lerp(desired, k);
      distance += (zoom - distance) * (1 - Math.exp(-6 * dt));
      // Close in, the camera drops toward the horizon; pulled back, it rises toward a map view.
      const l = limits();
      const elevation = THREE.MathUtils.lerp(0.4, 0.92, THREE.MathUtils.clamp((distance - l.min) / (l.max - l.min), 0, 1));
      const reach = distance + boost * 4;
      camera.position.set(target.x, target.y + Math.sin(elevation) * reach, target.z + Math.cos(elevation) * reach);
      if (shake > 0 && !reduced) {
        camera.position.x += (Math.random() - 0.5) * shake * 0.5;
        camera.position.y += (Math.random() - 0.5) * shake * 0.5;
      }
      shake = Math.max(0, shake - dt * 2.5);
      // Aim a little above and ahead of the boat: it sits low in the frame, islands and sky get the room.
      camera.lookAt(target.x, target.y + 4.5, target.z - 9);
    },
  };
}
