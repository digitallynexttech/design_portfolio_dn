"use client";

import { useRef, useState } from "react";
import { world } from "../store";

const RADIUS = 56;

/**
 * Phone controls: a floating joystick wherever the left thumb lands (steer by pointing where you
 * want to go), and hold-to-boost / tap-to-hop on the right. Two fingers on the water zoom.
 */
export function TouchControls() {
  const [stick, setStick] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);

  const move = (x: number, y: number) => {
    const o = origin.current;
    if (!o) return;
    let dx = x - o.x;
    let dy = y - o.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setStick({ x: o.x, y: o.y, dx, dy });
    world.engine()?.setStick(dx / RADIUS, -dy / RADIUS, true);
  };

  const end = () => {
    origin.current = null;
    setStick(null);
    world.engine()?.setStick(0, 0, false);
  };

  return (
    <div className="world-touch" aria-hidden>
      <div
        className="absolute bottom-0 left-0 h-[55%] w-[55%]"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          e.currentTarget.setPointerCapture(e.pointerId);
          origin.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          move(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (origin.current?.id === e.pointerId) move(e.clientX, e.clientY);
        }}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {stick ? (
        <div className="world-stick" style={{ left: stick.x, top: stick.y }}>
          <span className="world-stick__knob" style={{ transform: `translate(${stick.dx}px, ${stick.dy}px)` }} />
        </div>
      ) : (
        <p className="pointer-events-none absolute bottom-24 left-6 text-sm text-paper/70">Drag here to sail</p>
      )}
      <div className="absolute right-4 bottom-6 flex flex-col items-end gap-3">
        <button
          type="button"
          tabIndex={-1}
          className="world-pad"
          onPointerDown={() => world.engine()?.setButton("hop", true)}
          onPointerUp={() => world.engine()?.setButton("hop", false)}
          onPointerCancel={() => world.engine()?.setButton("hop", false)}
        >
          Hop
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="world-pad world-pad--boost"
          onPointerDown={() => world.engine()?.setButton("boost", true)}
          onPointerUp={() => world.engine()?.setButton("boost", false)}
          onPointerCancel={() => world.engine()?.setButton("boost", false)}
          onPointerLeave={() => world.engine()?.setButton("boost", false)}
        >
          Boost
        </button>
      </div>
    </div>
  );
}
