// The visitor's boat: the runabout from boat-model.ts with the walking-X on its flag. Controls push
// a physics body; the hull then pitches and rolls on the same sea the GPU draws.
import * as THREE from "three/webgpu";
import { positionLocal, uniform, vec3 } from "three/tsl";
import { createBoatModel } from "./boat-model";
import type { Body, Physics } from "./physics";
import { makeBody } from "./physics";
import type { Ripple } from "./ripple";
import type { Shared } from "./shared";
import type { Textures } from "./textures";

export type Controls = {
  throttle: number;
  steer: number;
  boost: boolean;
  hop: boolean;
};

const ENGINE = 15;
/** Shift / the Boost pad: thrust multiplier, about 11 m/s top speed becoming about 18. */
const BOOST = 2.3;
const DRAG_Q = 0.085;
const DRAG_L = 0.35;
const KEEL = 4.2;
const STEER = 1.85;

function flagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 184;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f6f4ef";
  ctx.fillRect(0, 0, 256, 184);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  // The walking-X, cropped from the brand logo.
  const img = new Image();
  img.src = "/brand/logo-color.png";
  img
    .decode()
    .then(() => {
      // The mark is the first ~21% of the lockup's width.
      const w = img.naturalWidth * 0.225;
      const h = img.naturalHeight;
      const scale = Math.min(220 / w, 160 / h);
      ctx.drawImage(img, 0, 0, w, h, 128 - (w * scale) / 2, 92 - (h * scale) / 2, w * scale, h * scale);
      tex.needsUpdate = true;
    })
    .catch(() => undefined);
  return tex;
}

export type Boat = ReturnType<typeof createBoat>;

export function createBoat(scene: THREE.Scene, shared: Shared, physics: Physics, ripple: Ripple, tex: Textures) {
  const { u } = shared;
  const group = new THREE.Group();
  const hull = new THREE.Group();
  group.add(hull);
  const model = createBoatModel(shared, tex);
  hull.add(model.group);

  // Flag on a short staff at the stern: the walking-X, rippling in the wind and the boat's speed.
  const staffMat = new THREE.MeshStandardNodeMaterial({ color: "#e9ecef", roughness: 0.15, metalness: 1 });
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.2, 8), staffMat);
  staff.position.copy(model.flagMount).add(new THREE.Vector3(0.25, -0.05, 0.12));
  hull.add(staff);
  const flagMat = new THREE.MeshStandardNodeMaterial({ map: flagTexture(), side: THREE.DoubleSide, roughness: 0.85 });
  const flagGeometry = new THREE.PlaneGeometry(0.56, 0.4, 10, 2);
  flagGeometry.translate(0.28, 0, 0);
  const flutter = uniform(0);
  const fx = positionLocal.x;
  flagMat.positionNode = positionLocal.add(vec3(0, 0, fx.mul(fx).mul(flutter.mul(0.45)).mul(fx.mul(10).sub(u.time.mul(13)).sin())));
  const flag = new THREE.Mesh(flagGeometry, flagMat);
  flag.position.copy(staff.position).add(new THREE.Vector3(0, 0.38, 0));
  flag.rotation.y = Math.PI / 2;
  flag.castShadow = true;
  hull.add(flag);
  // Waterline: the hull's boot stripe (local y ≈ 0.34) sits at the surface.
  hull.position.y = -0.24;
  scene.add(group);

  const body: Body = physics.add(
    makeBody({
      id: "boat",
      mass: 1,
      inertia: 2.6,
      circles: [
        { ox: 0, oz: -1.8, r: 0.8 },
        { ox: 0, oz: 0, r: 1.05 },
        { ox: 0, oz: 1.75, r: 1.02 },
      ],
      draft: 0.12,
      float: 46,
      floatDamp: 8,
      drag: 0.05,
      angularDrag: 0.6,
      restitution: 0.32,
    }),
  );

  let pitch = 0;
  let roll = 0;
  let hopCooldown = 0;
  let wakeTimer = 0;
  let lastThrottle = 0;
  const fwd = new THREE.Vector2();

  return {
    group,
    body,
    place(x: number, z: number, heading: number) {
      body.x = x;
      body.z = z;
      body.y = physics.sea(x, z);
      body.vx = body.vy = body.vz = 0;
      body.yaw = heading;
      body.yawRate = 0;
    },
    /** Forward speed in m/s (negative when reversing). */
    speed() {
      return body.vx * -Math.sin(body.yaw) + body.vz * -Math.cos(body.yaw);
    },
    /** Apply controls for one physics step. Returns true if the boat hopped. */
    control(c: Controls, dt: number): boolean {
      lastThrottle = Math.abs(c.throttle);
      hopCooldown = Math.max(0, hopCooldown - dt);
      const fx = -Math.sin(body.yaw);
      const fz = -Math.cos(body.yaw);
      const rx = Math.cos(body.yaw);
      const rz = -Math.sin(body.yaw);
      const vF = body.vx * fx + body.vz * fz;
      const vR = body.vx * rx + body.vz * rz;
      if (body.airborne) return false;
      const thrust = c.throttle * ENGINE * (c.boost && c.throttle > 0 ? BOOST : 1) * (c.throttle < 0 ? 0.55 : 1);
      body.vx += fx * thrust * dt;
      body.vz += fz * thrust * dt;
      // The keel resists sliding sideways, so the hull carves instead of drifting.
      const keel = Math.min(1, KEEL * dt);
      body.vx -= rx * vR * keel;
      body.vz -= rz * vR * keel;
      const drag = (vF * Math.abs(vF) * DRAG_Q + vF * DRAG_L) * dt;
      body.vx -= fx * drag;
      body.vz -= fz * drag;
      const authority = Math.min(1, Math.max(0.35, Math.abs(vF) / 3.5));
      const target = c.steer * STEER * authority * (vF < -0.4 ? -1 : 1);
      body.yawRate += (target - body.yawRate) * Math.min(1, 5.5 * dt);
      if (c.hop && hopCooldown === 0) {
        body.vy = 5.2 + Math.min(3, Math.abs(vF) * 0.18);
        hopCooldown = 0.9;
        ripple.drop(body.x, body.z, 2.6, -0.9);
        return true;
      }
      return false;
    },
    /** Visual pose and wake, once per rendered frame. */
    update(dt: number, wind: number) {
      const fx = -Math.sin(body.yaw);
      const fz = -Math.cos(body.yaw);
      const rx = Math.cos(body.yaw);
      const rz = -Math.sin(body.yaw);
      const vF = body.vx * fx + body.vz * fz;
      let pitchTarget: number;
      let rollTarget: number;
      if (body.airborne) {
        pitchTarget = THREE.MathUtils.clamp(body.vy * 0.06, -0.45, 0.4);
        rollTarget = roll * 0.98;
      } else {
        const bow = physics.sea(body.x + fx * 2.4, body.z + fz * 2.4);
        const stern = physics.sea(body.x - fx * 2.3, body.z - fz * 2.3);
        const left = physics.sea(body.x - rx * 0.95, body.z - rz * 0.95);
        const right = physics.sea(body.x + rx * 0.95, body.z + rz * 0.95);
        // Planing: the bow lifts with speed, then settles as the hull climbs onto the plane.
        const plane = Math.max(0, vF) * 0.011 - Math.max(0, vF - 9) * 0.006;
        pitchTarget = Math.atan2(bow - stern, 4.7) + Math.min(0.1, plane);
        rollTarget = Math.atan2(left - right, 1.9) - body.yawRate * Math.max(0, vF) * 0.014;
      }
      const k = 1 - Math.exp(-7 * dt);
      pitch += (pitchTarget - pitch) * k;
      roll += (rollTarget - roll) * k;
      group.position.set(body.x, body.y, body.z);
      group.rotation.set(0, 0, 0);
      group.rotation.order = "YXZ";
      group.rotation.y = body.yaw;
      group.rotation.x = pitch;
      group.rotation.z = roll;
      flutter.value = Math.min(1, 0.25 + wind * 0.5 + Math.abs(vF) * 0.05);
      model.update(dt, lastThrottle, Math.abs(vF));
      fwd.set(fx, fz);

      // Wake: push water up at the bow and down at the stern while moving.
      wakeTimer += dt;
      const speed = Math.hypot(body.vx, body.vz);
      if (!body.airborne && speed > 0.6 && wakeTimer > 1 / 30) {
        wakeTimer = 0;
        const s = Math.min(0.5, speed * 0.045);
        ripple.drop(body.x + fx * 2.1, body.z + fz * 2.1, 1.7, s);
        ripple.drop(body.x - fx * 2.4, body.z - fz * 2.4, 2.1, -s * 0.8);
      }
    },
    dispose() {
      physics.remove(body);
      model.dispose();
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        }
      });
    },
  };
}
