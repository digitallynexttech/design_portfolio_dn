"use client";

import { useRef } from "react";
import { useThree3D } from "../use-three";
import "./x-spill.css";

const load = () => import("./x-spill.scene").then((m) => m.mount);

/**
 * The error page: the X knocked over on a hairline floor (Karan, 29 Oct 2026: 3D on the pages left
 * without it). It spins and falls on its side; pointing at or focusing "Try again" stands it back up
 * with a jump, and it falls again when you leave (x-spill.scene.ts). Decorative, and the page never
 * depends on it: if three.js, WebGL or the model fails, there is only the floor line.
 */
export function XSpill() {
  const wrap = useRef<HTMLDivElement>(null);
  useThree3D(wrap, load);
  return (
    <div ref={wrap} className="s3 xs" aria-hidden>
      <canvas className="s3__gl" />
    </div>
  );
}
