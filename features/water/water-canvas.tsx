"use client";

import "@/features/stage/quiet-three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { TIER_SETTINGS, type Tier } from "@/features/stage/tier";
import { onDrop, onWaterVisibility } from "./bus";
import { WaterSurface } from "./surface/water-surface";

type Props = {
  tier: Exclude<Tier, 0>;
  onReady: () => void;
  onFail: () => void;
};

// The surface is soft caustics and ripples, so it renders under native resolution and is scaled up;
// only the strongest devices go above 1×.
const PIXEL_RATIO: Record<Exclude<Tier, 0>, number> = { 1: 0.75, 2: 1, 3: 1.25 };
// Full frame rate for a while after the water is touched or the page scrolls; ~30 fps while it idles.
const LIVELY_MS = 3000;
const IDLE_FRAME_MS = 33;

/** Signals once real frames have been drawn, so the canvas can fade in over the CSS fallback. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 3) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

/** Drives the on-demand frame loop: every frame while the water is stirred, a slower pulse at rest. */
function Pump() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    // Start lively, so the first ripples and the fade-in run at full rate.
    let livelyUntil = performance.now() + LIVELY_MS;
    let last = 0;
    let raf = 0;
    const stir = () => {
      livelyUntil = performance.now() + LIVELY_MS;
    };
    const tick = (now: number) => {
      // A frame's slack (1 ms) keeps a 60 Hz screen on every other frame rather than every third.
      if (now < livelyUntil || now - last >= IDLE_FRAME_MS - 1) {
        last = now;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const offDrop = onDrop(stir);
    window.addEventListener("pointermove", stir, { passive: true });
    window.addEventListener("pointerdown", stir, { passive: true });
    window.addEventListener("scroll", stir, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      offDrop();
      window.removeEventListener("pointermove", stir);
      window.removeEventListener("pointerdown", stir);
      window.removeEventListener("scroll", stir);
    };
  }, [invalidate]);
  return null;
}

export default function WaterCanvas({ tier, onReady, onFail }: Props) {
  const settings = TIER_SETTINGS[tier];
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [dpr] = useState(() => Math.min(PIXEL_RATIO[tier], window.devicePixelRatio || 1));

  // Nothing renders while the tab is hidden or something covers the water.
  useEffect(() => {
    let uncovered = true;
    const update = () => setVisible(uncovered && document.visibilityState === "visible");
    const off = onWaterVisibility((value) => {
      uncovered = value;
      update();
    });
    document.addEventListener("visibilitychange", update);
    return () => {
      off();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <Canvas
      aria-hidden
      dpr={dpr}
      flat
      frameloop={visible ? "demand" : "never"}
      gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        // The large viewport: a phone's collapsing toolbar never resizes (and re-allocates) the canvas.
        height: "100lvh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: ready ? 1 : 0,
        transition: "opacity 900ms var(--ease-flow)",
      }}
      onCreated={({ gl }) => {
        const canRenderToFloat =
          gl.extensions.has("EXT_color_buffer_float") || gl.extensions.has("EXT_color_buffer_half_float");
        if (!canRenderToFloat) onFail();
      }}
    >
      <WaterSurface settings={settings} />
      {visible ? <Pump /> : null}
      <ReadySignal
        onReady={() => {
          setReady(true);
          onReady();
        }}
      />
    </Canvas>
  );
}
