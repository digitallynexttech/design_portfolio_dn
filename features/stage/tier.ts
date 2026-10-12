// Device quality tiers (PLAN §13.4). T0 renders no canvas at all.
export type Tier = 0 | 1 | 2 | 3;

export type TierSettings = {
  /** Ripple simulation rows; columns follow the viewport aspect. */
  surfaceRes: number;
  /** Simulation substeps per frame. */
  substeps: number;
  maxDpr: number;
};

export const TIER_SETTINGS: Record<Exclude<Tier, 0>, TierSettings> = {
  1: { surfaceRes: 128, substeps: 1, maxDpr: 1.5 },
  2: { surfaceRes: 256, substeps: 2, maxDpr: 2 },
  3: { surfaceRes: 384, substeps: 2, maxDpr: 2 },
};

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

// The probe context is released at once: browsers cap live WebGL contexts, and the real canvases
// need every slot.
function hasWebGL2(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// What the hardware can draw never changes within a visit, so it is probed once. The visitor's
// preferences (motion, data) are read fresh on every call.
let hardwareTier: Tier | undefined;

function detectHardwareTier(): Tier {
  if (hardwareTier !== undefined) return hardwareTier;
  const nav = navigator as NavigatorHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  if (!hasWebGL2()) hardwareTier = 0;
  else if (cores <= 4 || memory <= 2) hardwareTier = 1;
  else if (coarse) hardwareTier = memory >= 6 && cores >= 8 ? 2 : 1;
  else hardwareTier = cores >= 8 && memory >= 8 ? 3 : 2;
  return hardwareTier;
}

// A first guess from cheap hints. The on-device benchmark in Phase 2 refines it and can only lower it.
// `ignoreMotion` asks what the device could draw even though the visitor prefers less motion (the
// caller then draws still frames).
export function detectTier(options: { ignoreMotion?: boolean } = {}): Tier {
  const nav = navigator as NavigatorHints;
  if (!options.ignoreMotion && prefersReducedMotion()) return 0;
  if (nav.connection?.saveData) return 0;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return 0;
  return detectHardwareTier();
}
