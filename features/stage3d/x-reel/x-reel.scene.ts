import * as THREE from "three";
import { createStage, rotateInModel } from "../runtime";
import type { Mount } from "../use-three";
import { loadX } from "../x-model";

// The reel's X (x-reel.tsx): seated on the frame's top hairline, its hips on the line, legs over the
// edge. It watches the picture below it; the pointer, when it comes near, takes its look. While the reel
// plays its legs swing, one after the other; when the reel ends it waves. Reduced motion: seated and
// still, watching.

/** The world the canvas shows, in X heights: above the seat (body, a waving arm), below it (legs), across. */
const VIEW = { above: 0.72, below: 0.5, w: 1.45 };
const FOV = 24;
/** Where its hips are, from its soles standing (an X height is 1): they sit on the line. */
const HIPS = 0.42;
/** How far it sits: past the shoulder's seat (1), so the legs come forward over the edge, toward you,
 *  rather than hanging down over the picture. */
const SIT = 1.5;
/** Pixels from the X within which the pointer takes its look. */
const NEAR = 320;

export const mount: Mount = async (canvas, ctx) => {
  const stage = createStage(canvas, { rig: "x", fov: FOV });
  const x = await loadX().catch((e: unknown) => {
    stage.dispose();
    throw e;
  });
  x.root.scale.setScalar(1 / x.height);
  // the hips on the seat line (world y 0), a hair in front of the frame
  x.root.position.set(0, -HIPS - 0.02, 0.05);
  stage.scene.add(x.root);
  const h = VIEW.above + VIEW.below;
  const cy = (VIEW.above - VIEW.below) / 2;
  const dist = h / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
  stage.camera.position.set(0, cy, dist);
  stage.camera.lookAt(0, cy, 0);

  const model = x.root.children[0];
  const legL = model.getObjectByName("legL") ?? null;
  const legR = model.getObjectByName("legR") ?? null;
  const AXIS = new THREE.Vector3(1, 0, 0);

  const video = ctx.wrap.closest(".reel__stage")?.querySelector<HTMLVideoElement>("video") ?? null;
  let playing = Boolean(video && !video.paused && !video.ended);
  let swing = playing ? 1 : 0;
  let phase = 0;
  let pointer: { x: number; y: number } | null = null;
  // watching: the picture is below it and to its right (it sits near the frame's left end)
  let yaw = 0.3;
  let lookX = 0.45;
  let lookY = -0.7;

  const onPlay = () => {
    playing = true;
  };
  const onPause = () => {
    playing = false;
  };
  const onEnded = () => {
    playing = false;
    if (!ctx.still) x.play("Wave");
  };
  const onMove = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
  };
  video?.addEventListener("play", onPlay);
  video?.addEventListener("pause", onPause);
  video?.addEventListener("ended", onEnded);
  window.addEventListener("pointermove", onMove, { passive: true });

  const frame = (dt: number) => {
    const box = canvas.getBoundingClientRect();
    const ox = box.left + box.width / 2;
    const oy = box.top + box.height * (VIEW.above / h) * 0.55;
    let wantYaw = 0.3;
    let wantX = 0.45;
    let wantY = -0.7;
    if (pointer) {
      const dx = pointer.x - ox;
      const dy = pointer.y - oy;
      if (Math.hypot(dx, dy) < NEAR) {
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        wantYaw = clamp(dx / NEAR) * 0.45;
        wantX = clamp(dx / (NEAR * 0.6));
        wantY = clamp(-dy / (NEAR * 0.6));
      }
    }
    const k = dt > 0 ? 1 - Math.exp(-dt * 5) : 1;
    yaw += (wantYaw - yaw) * k;
    lookX += (wantX - lookX) * k;
    lookY += (wantY - lookY) * k;
    // the legs: swinging while it plays, easing in and out of it
    swing += ((playing ? 1 : 0) - swing) * (dt > 0 ? 1 - Math.exp(-dt * 2.5) : 1);
    phase += dt * 3.2;
    x.root.rotation.y = yaw;
    x.update(dt, { sit: SIT, lookX, lookY });
    const a = 0.32 * swing;
    if (legL) rotateInModel(legL, model, AXIS, -a * Math.sin(phase));
    if (legR) rotateInModel(legR, model, AXIS, -a * Math.sin(phase + Math.PI));
    stage.render();
  };

  return {
    frame: (dt) => frame(dt),
    resize: stage.resize,
    dispose() {
      video?.removeEventListener("play", onPlay);
      video?.removeEventListener("pause", onPause);
      video?.removeEventListener("ended", onEnded);
      window.removeEventListener("pointermove", onMove);
      x.dispose();
      stage.dispose();
    },
  };
};
