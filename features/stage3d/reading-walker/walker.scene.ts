import { createStage } from "../runtime";
import type { Mount } from "../use-three";
import { loadX } from "../x-model";
import { walkers } from "./state";

// The reading walker's X (reading-walker.tsx moves the canvas along the rail; this only poses what is
// in it). It walks while the page moves, its stride matched to the speed; it faces the way you read
// (its shoes point right, as in the logo), turns round to walk back, faces you when you stop, and
// waves once when the read is done. Reduced motion: it stands, facing you.

/** The view, in the X's units (it is one tall): a little room over its head and either side of it. */
const VIEW_H = 1.18;
/** Faster than this (CSS px/s) it walks; slower, after a moment, it stops. */
const MOVING = 8;
const STOP_AFTER = 0.3;
/** Facing: the way you read (a little turned into it), turned round to walk back, and to you. */
const YAW_ON = 0.3;
const YAW_BACK = Math.PI + 0.3;

export const mount: Mount = async (canvas, ctx) => {
  const stage = createStage(canvas, { rig: "x", fov: 30 });
  const x = await loadX();
  stage.scene.add(x.root);
  // feet a hair above the canvas's bottom edge, which sits on the rail
  const centre = VIEW_H / 2 - 0.03;
  const dist = VIEW_H / 2 / Math.tan((stage.camera.fov / 2) * (Math.PI / 180));
  stage.camera.position.set(0, centre, dist);
  stage.camera.lookAt(0, centre, 0);

  let yaw = 0;
  let still = 0;
  let walking = false;
  let waved = false;

  return {
    frame(dt) {
      const s = walkers.get(ctx.wrap);
      if (s && !ctx.still && dt > 0) {
        const moving = Math.abs(s.v) > MOVING;
        still = moving ? 0 : still + dt;
        if (moving && !walking) {
          walking = true;
          x.play("Walk", 0.18);
        } else if (!moving && walking && still > STOP_AFTER) {
          walking = false;
          x.play("Idle", 0.3);
        }
        if (walking) x.setSpeed(Math.min(2.6, Math.max(0.6, Math.abs(s.v) / (s.h * 1.4))));
        if (s.end && !walking && !waved) {
          waved = true;
          x.play("Wave");
        }
        if (!s.end) waved = false;
        const want = walking ? (s.dir > 0 ? YAW_ON : YAW_BACK) : 0;
        yaw += (want - yaw) * (1 - Math.exp(-dt * 7));
        x.root.rotation.y = yaw;
        x.update(dt, { lookX: walking ? 0.6 * s.dir : 0, lookY: s.end && !walking ? 0.4 : 0 });
      } else {
        x.root.rotation.y = 0;
        x.update(dt);
      }
      stage.render();
    },
    resize: stage.resize,
    dispose() {
      x.dispose();
      stage.dispose();
    },
  };
};
