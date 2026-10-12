"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { TierSettings } from "@/features/stage/tier";
import { onDrop } from "../bus";
import { RippleSim, createFullscreenTriangle } from "./ripple-sim";
import { displayFrag, fullscreenVert } from "./shaders";

const SIM_HZ = 60;

// Shader colours are written straight to the framebuffer (no colour-space chunk), so pass sRGB as-is.
function srgb(hex: string): THREE.Vector3 {
  const n = Number.parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function columnsFor(rows: number, width: number, height: number): number {
  return Math.max(8, Math.round((rows * width) / Math.max(1, height)));
}

export function WaterSurface({ settings }: { settings: TierSettings }) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  // The canvas spans the large viewport (100lvh), so pointers map against its size, not the window's.
  const sizeRef = useRef(size);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  const simRef = useRef<RippleSim | null>(null);
  const colsRef = useRef(0);
  const accumulator = useRef(0);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => createFullscreenTriangle(), []);
  const uniforms = useMemo(
    () => ({
      uState: { value: null as THREE.Texture | null },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uScroll: { value: 0 },
      uInk: { value: srgb("#0a0a0a") },
      uTeal: { value: srgb("#0ec8c5") },
      uPaper: { value: srgb("#fafaf8") },
    }),
    [],
  );

  useEffect(() => {
    const rows = settings.surfaceRes;
    const cols = columnsFor(rows, window.innerWidth, window.innerHeight);
    colsRef.current = cols;
    const sim = new RippleSim(gl, cols, rows);
    simRef.current = sim;
    return () => {
      sim.dispose();
      simRef.current = null;
    };
  }, [gl, settings.surfaceRes]);

  // Only rebuild when the aspect really changes, so a phone's collapsing URL bar doesn't wipe the ripples.
  useEffect(() => {
    const material = materialRef.current;
    if (material) material.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    const sim = simRef.current;
    if (!sim) return;
    const cols = columnsFor(settings.surfaceRes, size.width, size.height);
    if (Math.abs(cols - colsRef.current) / colsRef.current > 0.08) {
      colsRef.current = cols;
      sim.resize(cols, settings.surfaceRes);
    }
  }, [settings.surfaceRes, size.height, size.width]);

  // Pointer and touch stir the water; fast strokes are interpolated so they leave a continuous wake.
  useEffect(() => {
    let lastX = -1;
    let lastY = -1;
    let lastT = 0;

    const add = (x: number, y: number, strength: number, radius: number) =>
      simRef.current?.addDrop({ x, y, strength, radius });

    const onMove = (event: PointerEvent) => {
      const width = Math.max(1, sizeRef.current.width);
      const height = Math.max(1, sizeRef.current.height);
      const x = event.clientX / width;
      const y = event.clientY / height;
      const now = performance.now();
      if (lastX >= 0) {
        const aspect = width / height;
        const distance = Math.hypot((x - lastX) * aspect, y - lastY);
        const seconds = Math.max(0.016, (now - lastT) / 1000);
        const touchBoost = event.pointerType === "touch" ? 1.5 : 1;
        const strength = Math.min(0.7, (distance / seconds) * 0.2) * touchBoost;
        if (strength > 0.015) {
          const segments = Math.min(4, Math.ceil(distance / 0.03));
          for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            add(lastX + (x - lastX) * t, lastY + (y - lastY) * t, strength, 0.028);
          }
        }
      }
      lastX = x;
      lastY = y;
      lastT = now;
    };

    const onDown = (event: PointerEvent) =>
      add(event.clientX / sizeRef.current.width, event.clientY / sizeRef.current.height, 1.1, 0.04);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    const offBus = onDrop((drop) => simRef.current?.addDrop(drop));
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      offBus();
    };
  }, []);

  useFrame((state, delta) => {
    const sim = simRef.current;
    const material = materialRef.current;
    if (!sim || !material) return;

    // Fixed-rate simulation so waves travel at the same speed on 60 Hz and 120 Hz screens.
    accumulator.current = Math.min(accumulator.current + delta, 4 / SIM_HZ);
    while (accumulator.current >= 1 / SIM_HZ) {
      sim.step(settings.substeps);
      accumulator.current -= 1 / SIM_HZ;
    }

    const u = material.uniforms;
    u.uState.value = sim.texture;
    (u.uTexel.value as THREE.Vector2).copy(sim.texel);
    u.uTime.value = state.clock.elapsedTime;
    u.uScroll.value = Math.min(3, window.scrollY / Math.max(1, window.innerHeight));
  });

  // R3F disposes the geometry and material when this unmounts.
  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={fullscreenVert}
        fragmentShader={displayFrag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
