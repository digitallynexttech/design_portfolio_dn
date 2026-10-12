"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import type { Object3D } from "three";
import { detectTier } from "@/features/stage/tier";

/**
 * True once `object`'s shaders are compiled. The compile runs in parallel (KHR_parallel_shader_compile)
 * while the object stays hidden; drawing it before then makes the renderer stop the main thread until
 * the GPU driver finishes, a one- to two-second freeze on a phone the moment an exhibit appears.
 * Call it after the scene's lights and environment are set: they are part of the compiled program.
 */
export function useCompiled(object: Object3D): boolean {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const [compiled, setCompiled] = useState<Object3D | null>(null);
  useEffect(() => {
    let live = true;
    const done = () => {
      if (live) setCompiled(object);
    };
    gl.compileAsync(object, camera, scene).then(done, done);
    return () => {
      live = false;
    };
  }, [gl, camera, scene, object]);
  return compiled === object;
}

/**
 * Pixel-ratio range for an exhibit canvas. Phones (and other low-tier devices) draw at most 1.5x: their
 * screens are 2.5-3x, and filling every device pixel of a lit, antialiased model costs far more than
 * the sharpness it buys at arm's length. Desktops keep 1.75x.
 */
export function exhibitDpr(): [number, number] {
  if (typeof window === "undefined") return [1, 1.5];
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return [1, coarse || detectTier({ ignoreMotion: true }) <= 1 ? 1.5 : 1.75];
}
