import * as THREE from "three";
import { FIGURE_H, loadAstronaut, type Astronaut } from "@/features/drafts/depth/astronaut";
import { createStage, type Stage } from "../runtime";
import type { Ctx, Mount, Mounted } from "../use-three";

// The astronaut on the pages that had no 3D (Karan, 29 Oct 2026): the home's own figure and the X on
// its shoulder (astronaut.ts), posed from its table and moved here. Three ways to be:
// - fall (/work): in freefall down the shaft with you, seen from above as it falls on its back; the
//   faster you scroll the faster it tumbles, and it rights itself as the fall slows; its head turns to
//   the wall the study in front of you hangs on.
// - ease (/about): at ease beside the head, turning a little toward the pointer; the X waves hello,
//   and again when the team photo is pointed at.
// - lost (404, offline): adrift, tumbling slowly end over end; on the 404 it can be flung round with
//   the pointer, and spins down to its own slow tumble.
// Reduced motion: one still frame, posed (use-three.ts calls frame with dt 0).

const FOV = 30;
const TAN = Math.tan((FOV * Math.PI) / 360);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
/** Eases a value toward a target at a rate (per second), frame-rate independent. */
const ease = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));

async function setup(canvas: HTMLCanvasElement, ctx: Ctx): Promise<{ stage: Stage; astro: Astronaut }> {
  const stage = createStage(canvas, { rig: "astronaut", fov: FOV });
  try {
    const astro = await loadAstronaut({ small: ctx.small, shadows: false, visorEnv: stage.scene.environment });
    stage.scene.add(astro.root);
    return { stage, astro };
  } catch (e) {
    stage.dispose();
    throw e;
  }
}

/**
 * Frames the figure in the canvas: "height", standing, as tall as nine tenths of it; "sphere", turning
 * any way, a sphere of radius r always inside it.
 */
function fit(stage: Stage, w: number, h: number, how: "height" | "sphere", r = 1) {
  stage.resize(w, h);
  const visible = how === "height" ? FIGURE_H / 0.9 : ((2 * r) / 0.92) * (h / Math.min(w, h));
  stage.camera.position.set(0, 0, visible / 2 / TAN);
  stage.camera.lookAt(0, 0, 0);
}

const done = (stage: Stage, astro: Astronaut, more?: () => void) => () => {
  more?.();
  astro.dispose();
  stage.dispose();
};

/** /work: freefall down the shaft beside the studies. */
export const mountFall: Mount = async (canvas, ctx): Promise<Mounted> => {
  const { stage, astro } = await setup(canvas, ctx);
  const root = astro.root;
  let lastY = window.scrollY;
  let speed = 0;
  let roll = -0.25;
  let spin = 0;
  let pitch = 0;
  let look = 0;
  let side = 0;
  let sideAt = -1;
  return {
    frame(dt, t) {
      const y = window.scrollY;
      // the fall's speed, from the scroll (px/s), smoothed
      if (dt > 0) speed = ease(speed, (y - lastY) / dt, 6, dt);
      lastY = y;
      const e = smooth(Math.abs(speed) / 1800);
      // the wall the study in front of you hangs on (read a few times a second, not every frame)
      if (dt === 0 || t - sideAt > 0.25) {
        sideAt = t;
        const current = document.querySelector<HTMLElement>(".wa-item[data-current]");
        side = current ? (current.dataset.side === "left" ? -1 : 1) : 0;
      }
      look = ease(look, side * 0.75, 3, dt);
      // a tumble that quickens with the fall, the way the fall goes, and rights itself as it slows
      spin = ease(spin, Math.sign(speed || 1) * (0.12 + 3 * e), 2.5, dt);
      roll += spin * dt;
      const upright = Math.round(roll / (2 * Math.PI)) * 2 * Math.PI - 0.25;
      roll = ease(roll, upright, 0.9 * (1 - e), dt);
      pitch = ease(pitch, clamp(speed / 3000, -0.5, 0.5), 3, dt);
      root.rotation.set(-0.2 + pitch + 0.07 * Math.sin(t * 0.7), 0.28 * look + 0.1 * Math.sin(t * 0.41), roll + 0.1 * Math.sin(t * 0.53));
      astro.frame({ dt, t, hero: 0, fall: 1, settle: 0, lookX: look, lookY: 0.25, xYaw: -root.rotation.y, drift: 0.55 + 0.45 * e });
      stage.render();
    },
    resize(w, h) {
      fit(stage, w, h, "sphere", 1.05);
    },
    dispose: done(stage, astro),
  };
};

/** /about: at ease beside the head; the X waves hello, and when the team photo is pointed at. */
export const mountEase: Mount = async (canvas, ctx): Promise<Mounted> => {
  const { stage, astro } = await setup(canvas, ctx);
  const root = astro.root;
  let px = 0;
  let py = 0;
  let lx = 0;
  let ly = 0;
  let now = 0;
  let waved = -10;
  let greeted = false;
  const wave = () => {
    // (one wave at a time, and not again for a moment)
    if (now - waved < 2.8) return;
    waved = now;
    astro.react("Wave");
  };
  const onMove = (e: PointerEvent) => {
    const r = ctx.wrap.getBoundingClientRect();
    px = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5), -1, 1);
    py = clamp(-(e.clientY - (r.top + r.height * 0.25)) / (window.innerHeight * 0.5), -1, 1);
  };
  const photo = document.querySelector(".team-photo");
  window.addEventListener("pointermove", onMove, { passive: true });
  photo?.addEventListener("pointerenter", wave);
  return {
    frame(dt, t) {
      now = t;
      if (!greeted && t > 1.2 && dt > 0) {
        greeted = true;
        wave();
      }
      lx = ease(lx, px, 2.5, dt);
      ly = ease(ly, py, 2.5, dt);
      // the body turns a little toward you, the head the rest of the way
      root.rotation.set(-ly * 0.08, -0.18 + lx * 0.4, 0.035 * Math.sin(t * 0.5));
      astro.frame({ dt, t, hero: 0, fall: 0, settle: 1, lookX: lx, lookY: ly, xYaw: -root.rotation.y + lx * 0.3, drift: 0.7 });
      stage.render();
    },
    resize(w, h) {
      fit(stage, w, h, "height");
    },
    dispose: done(stage, astro, () => {
      window.removeEventListener("pointermove", onMove);
      photo?.removeEventListener("pointerenter", wave);
    }),
  };
};

/** The slow tumble it always comes back to (rad/s about x, y, z). */
const DRIFT = new THREE.Vector3(0.06, 0.12, 0.04);

function lost(fling: boolean): Mount {
  return async (canvas, ctx): Promise<Mounted> => {
    const { stage, astro } = await setup(canvas, ctx);
    const root = astro.root;
    const angle = new THREE.Vector3(0.35, -0.5, 0.42);
    const spin = DRIFT.clone();
    let held = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    // Flung by the pointer: a drag turns it, and on release it keeps the spin it was given.
    const down = (e: PointerEvent) => {
      if (ctx.still) return;
      held = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      canvas.setPointerCapture(e.pointerId);
      ctx.wrap.setAttribute("data-held", "");
    };
    const move = (e: PointerEvent) => {
      if (!held) return;
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastT) / 1000);
      // (a screen's width of drag in a second is a few turns a second)
      spin.y = clamp(((e.clientX - lastX) / dt) * 0.006, -14, 14);
      spin.x = clamp(((e.clientY - lastY) / dt) * 0.006, -14, 14);
      angle.y += ((e.clientX - lastX) / canvas.clientWidth) * Math.PI * 1.6;
      angle.x += ((e.clientY - lastY) / canvas.clientHeight) * Math.PI * 1.6;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (!held) return;
      held = false;
      ctx.wrap.removeAttribute("data-held");
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    if (fling) {
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
    }
    return {
      frame(dt, t) {
        if (!held) {
          // spun down to its own slow tumble
          spin.x = ease(spin.x, DRIFT.x, 0.7, dt);
          spin.y = ease(spin.y, DRIFT.y, 0.7, dt);
          spin.z = ease(spin.z, DRIFT.z, 0.7, dt);
          angle.addScaledVector(spin, dt);
        }
        root.rotation.set(angle.x, angle.y, angle.z);
        astro.frame({ dt, t, hero: 0, fall: 1, settle: 0, lookX: 0.6 * Math.sin(t * 0.3), lookY: 0.2, xYaw: 0.4 * Math.sin(t * 0.23), drift: 1 });
        stage.render();
      },
      resize(w, h) {
        fit(stage, w, h, "sphere", 1.08);
      },
      dispose: done(stage, astro, () => {
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
      }),
    };
  };
}

/** 404: adrift, and can be flung round. */
export const mountLostFling = lost(true);
/** Offline: adrift. */
export const mountLost = lost(false);
