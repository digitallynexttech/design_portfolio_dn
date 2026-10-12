"use client";

import { useEffect } from "react";
import { setWaterCovered } from "./bus";

/** Mounted by pages whose own background covers the water; resumes it when they unmount. */
export function WaterPause() {
  useEffect(() => {
    setWaterCovered("study", true);
    return () => setWaterCovered("study", false);
  }, []);
  return null;
}
