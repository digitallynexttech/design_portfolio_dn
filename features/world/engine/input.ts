// Keyboard, gamepad and the touch joystick, merged into one set of boat controls. The joystick and
// gamepad stick are screen-relative (push up to head north); the keyboard drives like a boat.
import type { Controls } from "./boat";

export type Input = ReturnType<typeof createInput>;

type Edge = "interact" | "hop" | "horn" | "options";

export function createInput(onEdge: (edge: Edge) => void) {
  const keys = new Set<string>();
  const stick = { x: 0, y: 0, active: false };
  const buttons = { boost: false, hop: false };
  let enabled = true;
  let padPrev: boolean[] = [];

  const onKeyDown = (event: KeyboardEvent) => {
    if (!enabled || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    const code = event.code;
    const driving = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "Space"];
    if (driving.includes(code)) event.preventDefault();
    if (!keys.has(code)) {
      if (code === "Space") onEdge("hop");
      if (code === "Enter" || code === "KeyE") {
        // Buttons handle their own Enter; only treat it as "interact" when the world itself has focus.
        if (!target || target.tagName !== "BUTTON") onEdge("interact");
      }
      if (code === "KeyH") onEdge("horn");
    }
    keys.add(code);
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
  const onBlur = () => keys.clear();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  const has = (...codes: string[]) => codes.some((c) => keys.has(c));

  return {
    setEnabled(next: boolean) {
      enabled = next;
      if (!next) keys.clear();
    },
    setStick(x: number, y: number, active: boolean) {
      stick.x = x;
      stick.y = y;
      stick.active = active;
    },
    setButton(name: "boost" | "hop", down: boolean) {
      if (name === "hop" && down && !buttons.hop) onEdge("hop");
      buttons[name] = down;
    },
    /** Merge every source into controls for a boat with heading `yaw`. */
    read(yaw: number): Controls & { moving: boolean } {
      let throttle = 0;
      let steer = 0;
      let boost = buttons.boost;
      if (enabled) {
        if (has("KeyW", "ArrowUp")) throttle += 1;
        if (has("KeyS", "ArrowDown")) throttle -= 1;
        if (has("KeyA", "ArrowLeft")) steer += 1;
        if (has("KeyD", "ArrowRight")) steer -= 1;
        if (has("ShiftLeft", "ShiftRight")) boost = true;
      }

      let sx = stick.active ? stick.x : 0;
      let sy = stick.active ? stick.y : 0;

      // Gamepad: left stick steers like the joystick, RT boosts, A interacts, B hops, Start opens options.
      const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = Array.from(pads).find((p) => p && p.connected);
      if (pad && enabled) {
        const ax = pad.axes[0] ?? 0;
        const ay = pad.axes[1] ?? 0;
        if (Math.hypot(ax, ay) > 0.18) {
          sx = ax;
          sy = -ay;
        }
        const pressed = pad.buttons.map((b) => b.pressed);
        if (pressed[0] && !padPrev[0]) onEdge("interact");
        if (pressed[1] && !padPrev[1]) onEdge("hop");
        if (pressed[9] && !padPrev[9]) onEdge("options");
        if ((pad.buttons[7]?.value ?? 0) > 0.3 || pressed[5]) boost = true;
        padPrev = pressed;
      }

      const mag = Math.min(1, Math.hypot(sx, sy));
      if (mag > 0.12) {
        // Screen up is north (−z). Turn toward the stick, then drive.
        const want = Math.atan2(-sx, sy);
        let diff = want - yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        steer = Math.max(-1, Math.min(1, diff * 2.4));
        throttle = mag * (Math.cos(diff) > 0.2 ? 1 : 0.35);
      }
      return { throttle, steer, boost, hop: false, moving: throttle !== 0 || steer !== 0 };
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    },
  };
}
