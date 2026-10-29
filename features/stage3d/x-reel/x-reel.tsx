"use client";

import { useRef } from "react";
import { useThree3D } from "../use-three";
import "./x-reel.css";

const load = () => import("./x-reel.scene").then((m) => m.mount);

/**
 * Reel: the X sat on the top edge of the reel's frame, legs over the edge, watching (Karan, 29 Oct
 * 2026: 3D on the pages left without it). It looks at the pointer when it comes near, swings its legs
 * while the reel plays and waves when it ends (x-reel.scene.ts). Rendered inside the player's stage
 * (ReelPlayer's `stage`), where it reads the video's play, pause and end. Decorative.
 */
export function XReel() {
  const wrap = useRef<HTMLDivElement>(null);
  useThree3D(wrap, load);
  return (
    <div ref={wrap} className="s3 xr" aria-hidden>
      <canvas className="s3__gl" />
    </div>
  );
}
