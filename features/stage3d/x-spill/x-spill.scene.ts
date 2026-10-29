import * as THREE from "three";
import { createStage } from "../runtime";
import type { Mount } from "../use-three";
import { loadX } from "../x-model";

// The error page's X (x-spill.tsx). It comes in spinning, tips over on its right side and lies there,
// rocking a little, eyes wandering. Pointing at or focusing "Try again" rights it (a quick turn back
// up on its shoe's edge, and a jump); leaving lets it fall again, after a moment. It turns about the
// outer edge of its right shoe, on the floor line, so lying and standing it is always on the floor.
// Reduced motion: lying still; standing, still, while "Try again" is in hand. Any error here stops it
// quietly: an error page must not have an error of its own.

/** The world the canvas shows, in X heights: across, up (room for the jump), and the floor's place. */
const VIEW = { w: 3.0, h: 1.45, foot: 0.05 };
const FOV = 22;
const DOWN = Math.PI / 2;

type State =
  | { name: "spin"; t: number }
  | { name: "fall"; t: number; from: number }
  | { name: "down"; t: number }
  | { name: "up"; t: number; from: number }
  | { name: "stand"; t: number };

/** Falling: slow to start, quick at the end (gravity), and a small bounce on landing. */
function fallCurve(u: number) {
  if (u < 0.7) return (u / 0.7) ** 2;
  const b = (u - 0.7) / 0.3;
  return 1 - 0.07 * Math.sin(Math.PI * b);
}
/** Righting itself: quick, past upright, and back. */
function upCurve(u: number) {
  const c = 1.7;
  const v = u - 1;
  return 1 + (c + 1) * v * v * v + c * v * v;
}

export const mount: Mount = async (canvas, ctx) => {
  const stage = createStage(canvas, { rig: "x", fov: FOV });
  const x = await loadX().catch((e: unknown) => {
    stage.dispose();
    throw e;
  });
  x.root.scale.setScalar(1 / x.height);
  // the pivot: the outer edge of its right shoe (the viewer's right), on the floor
  const half = 0.47;
  const pivot = new THREE.Group();
  // centred lying down (it lies across [pivot, pivot + 1])
  pivot.position.set(-0.5 + 0.08, 0, 0);
  x.root.position.set(-half, 0, 0);
  pivot.add(x.root);
  stage.scene.add(pivot);
  const cy = VIEW.h / 2 - VIEW.foot;
  const dist = VIEW.h / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
  stage.camera.position.set(0, cy, dist);
  stage.camera.lookAt(0, cy, 0);

  const button = ctx.wrap.closest("main")?.querySelector<HTMLElement>(".dn-actions button") ?? null;
  let state: State = ctx.still ? { name: "down", t: 0 } : { name: "spin", t: 0 };
  let angle = ctx.still ? DOWN : 0;
  let held = false;
  let away = 0;
  let clock = 0;
  let broken = false;
  if (!ctx.still) x.play("Spin", 0.1);

  const go = (next: State) => {
    state = next;
  };
  const hold = (on: boolean) => {
    held = on;
    away = 0;
    if (ctx.still) {
      angle = on ? 0 : DOWN;
      go(on ? { name: "stand", t: 0 } : { name: "down", t: 0 });
      frame(0);
      return;
    }
    if (on && state.name !== "up" && state.name !== "stand") {
      go({ name: "up", t: 0, from: angle });
      x.play("Jump", 0.12);
    }
  };
  const onEnter = () => hold(true);
  const onLeave = () => hold(false);
  button?.addEventListener("pointerenter", onEnter);
  button?.addEventListener("pointerleave", onLeave);
  button?.addEventListener("focus", onEnter);
  button?.addEventListener("blur", onLeave);

  function step(dt: number) {
    clock += dt;
    state.t += dt;
    let lookX = 0;
    let lookY = 0;
    switch (state.name) {
      case "spin":
        angle = 0;
        if (state.t > 0.9) go({ name: "fall", t: 0, from: 0 });
        break;
      case "fall": {
        const u = Math.min(1, state.t / 0.75);
        angle = state.from + (DOWN - state.from) * fallCurve(u);
        if (u >= 1) go({ name: "down", t: 0 });
        break;
      }
      case "down":
        // rocking a little on its side, eyes wandering
        angle = DOWN - (ctx.still ? 0 : 0.035 * (0.5 + 0.5 * Math.sin(clock * 1.3)));
        lookX = ctx.still ? 0.4 : Math.sin(clock * 0.7);
        lookY = ctx.still ? 0.3 : 0.35 * Math.sin(clock * 0.5 + 1);
        break;
      case "up": {
        const u = Math.min(1, state.t / 0.45);
        angle = state.from * (1 - upCurve(u));
        if (u >= 1) go({ name: "stand", t: 0 });
        break;
      }
      case "stand": {
        angle = 0;
        // looking at the button that stood it up
        const b = button?.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();
        if (b) {
          lookX = Math.max(-1, Math.min(1, (b.left + b.width / 2 - (c.left + c.width / 2)) / 400));
          lookY = Math.max(-1, Math.min(1, -(b.top + b.height / 2 - (c.top + c.height * 0.4)) / 400));
        }
        if (!held) {
          away += dt;
          if (away > 1.2) {
            x.play("Spin", 0.15);
            go({ name: "spin", t: 0.5 });
          }
        }
        break;
      }
    }
    pivot.rotation.z = -angle;
    x.update(dt, { lookX, lookY });
  }

  function frame(dt: number) {
    if (broken) return;
    try {
      step(dt);
      stage.render();
    } catch {
      broken = true;
    }
  }

  return {
    frame: (dt) => frame(dt),
    resize: stage.resize,
    dispose() {
      button?.removeEventListener("pointerenter", onEnter);
      button?.removeEventListener("pointerleave", onLeave);
      button?.removeEventListener("focus", onEnter);
      button?.removeEventListener("blur", onLeave);
      x.dispose();
      stage.dispose();
    },
  };
};
