"use client";

import "@/features/stage/quiet-three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Tier } from "@/features/stage/tier";
import { emitDrop, onWaterVisibility } from "../bus";
import { activeAnchor } from "./anchors";
import { buildShape, type FormId, type Shape } from "./shapes";

const COUNTS: Record<Exclude<Tier, 0>, number> = { 1: 9000, 2: 24000, 3: 48000 };
const DPR: Record<Exclude<Tier, 0>, number> = { 1: 1.25, 2: 1.5, 3: 1.75 };
const MORPH_SECONDS = 1.9;
/** The pour in two halves: the old shape drains to a pool, then the new one fills like a mould. */
const DRAIN = 0.45;
/** The pool and the rising surface lean toward the viewer, so they read as a disc, not a line. */
const TILT = 0.18;
/** How each shape turns while it holds: a full spin, or a sway around a three-quarter view. */
const MOTION: Record<FormId, { kind: "sway" | "spin"; base: number; amp: number }> = {
  x: { kind: "sway", base: 0, amp: 0.3 },
  skull: { kind: "sway", base: 0.35, amp: 0.55 },
  helix: { kind: "spin", base: 0, amp: 0 },
  screens: { kind: "sway", base: -0.18, amp: 0.3 },
  drop: { kind: "spin", base: 0, amp: 0 },
  pool: { kind: "sway", base: 0, amp: 0.2 },
};
// The water's own colour, which every shape passes through between clients (sRGB).
const WATER = new THREE.Color().setRGB(14 / 255, 200 / 255, 197 / 255);

const vertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aColorFrom;
  attribute vec3 aColorTo;
  attribute vec3 aNormFrom;
  attribute vec3 aNormTo;
  attribute vec4 aSeed; // jitter, size, phase, random
  uniform float uMix;
  uniform float uTime;
  uniform float uScale;
  uniform float uRotY;
  uniform float uTurbulence;
  uniform vec2 uPointer;
  uniform float uPointerForce;
  uniform vec2 uGravity;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uAlpha;
  uniform float uStill;
  uniform float uFade;
  uniform vec3 uWater;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpark;

  const float DRAIN = ${DRAIN.toFixed(2)};
  const float TILT = ${TILT.toFixed(2)};

  void main() {
    // --- The pour ------------------------------------------------------------------------------
    float drainT = clamp(uMix / DRAIN, 0.0, 1.0);
    float fillT = clamp((uMix - DRAIN) / (1.0 - DRAIN), 0.0, 1.0);
    float floorY = -1.0 + aSeed.w * 0.04;
    float floorZ = aFrom.z * 0.6;
    vec3 floorP = vec3(aFrom.x * 1.1, floorY + floorZ * TILT, floorZ);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 p;
    vec3 col;
    vec3 n;
    float glint = 0.0;
    float riding = 0.0;
    if (uMix < DRAIN) {
      // The drain line sweeps down through the old shape; whatever it passes falls to the floor.
      float start = (1.15 - aFrom.y) / 2.3 * 0.7 + aSeed.x * 0.05;
      float f = clamp((drainT - start) / 0.25, 0.0, 1.0);
      p = vec3(mix(aFrom.x, floorP.x, f), mix(aFrom.y, floorP.y, f * f), mix(aFrom.z, floorP.z, f));
      col = mix(aColorFrom, uWater, f);
      n = normalize(mix(aNormFrom, up, f));
      riding = f;
    } else {
      // The fill line rises through the new shape; points ride the surface until it reaches them.
      float level = mix(-1.15, 1.15, fillT);
      float gather = smoothstep(0.0, 0.28, fillT);
      float z = mix(floorZ, aTo.z, gather);
      float surf = max(floorY, level) + z * TILT;
      float y = min(aTo.y, surf);
      p = vec3(mix(floorP.x, aTo.x, gather), y, z);
      float settled = smoothstep(aTo.y - 0.06, aTo.y + 0.02, surf);
      col = mix(uWater, aColorTo, settled);
      n = normalize(mix(up, aNormTo, settled));
      riding = 1.0 - settled;
      glint = riding * (1.0 - smoothstep(0.0, 0.07, abs(y - surf))) * step(floorY, level);
    }

    // --- Life ----------------------------------------------------------------------------------
    float live = 1.0 - uStill;
    float w = 0.007 * (1.0 + uTurbulence * 4.0) * live;
    p += vec3(sin(uTime * 1.1 + aSeed.z * 9.0), cos(uTime * 0.9 + aSeed.z * 7.0), sin(uTime * 0.7 + aSeed.z * 5.0)) * w;
    // A slow ripple travelling over the surface.
    p += n * 0.012 * sin(dot(p, vec3(0.0, 5.0, 2.0)) - 2.2 * uTime) * live;

    float c = cos(uRotY), s = sin(uRotY);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    n = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
    p.xy += uGravity * (0.5 + p.y * 0.5) * 0.12 * live;

    vec4 world = modelMatrix * vec4(p * uScale, 1.0);
    // The cursor parts the water.
    vec2 d = world.xy - uPointer;
    float dist = length(d);
    float push = uPointerForce * smoothstep(140.0, 0.0, dist) * live;
    world.xy += (dist > 0.001 ? d / dist : vec2(0.0)) * push * 46.0;
    gl_Position = projectionMatrix * viewMatrix * world;

    // --- Light ---------------------------------------------------------------------------------
    vec3 L = normalize(vec3(-0.45, 0.65, 0.6));
    float lambert = max(dot(n, L), 0.0);
    float rim = pow(1.0 - abs(n.z), 3.0);
    float facing = mix(0.16, 1.0, smoothstep(-0.25, 0.3, n.z));
    float depth = mix(0.45, 1.0, clamp((p.z + 1.0) * 0.5, 0.0, 1.0));
    vec3 lit = col * (0.32 + 0.85 * lambert) + col * rim * 0.45;
    lit += vec3(1.0) * glint * 0.35;

    // A few points catch the light and twinkle.
    float spark = step(0.96, aSeed.w);
    float twinkle = pow(0.5 + 0.5 * sin(uTime * 2.6 + aSeed.z * 40.0), 6.0) * live;
    lit += vec3(1.0) * spark * twinkle * lambert * 0.8;

    vColor = lit;
    // Points in the pool or riding the surface are many in one place: each carries less light.
    vAlpha = uAlpha * uFade * facing * depth * mix(1.0, 0.4, riding) * (1.0 + glint * 0.5);
    vSpark = spark;
    gl_PointSize = uSize * aSeed.y * uPixelRatio * (1.0 + p.z * 0.25) * (1.0 + spark * 1.2);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpark;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(q, q);
    if (r2 > 1.0) discard;
    float soft = smoothstep(1.0, 0.15, r2);
    float core = smoothstep(0.3, 0.0, r2) * (0.5 + vSpark);
    float a = vAlpha * soft;
    // Added straight onto the page: light, never a dark halo (alpha stays 0 in the canvas).
    gl_FragColor = vec4(vColor * (a + core * vAlpha), 0.0);
  }
`;

type Props = { tier: Exclude<Tier, 0>; still?: boolean };

/** Where a point is mid-pour, worked out on the CPU exactly as the shader does, so a retarget never jumps. */
function pourState(
  mix: number,
  i: number,
  seeds: Float32Array,
  f: Float32Array,
  t: Float32Array,
  cf: Float32Array,
  ct: Float32Array,
  nf: Float32Array,
  nt: Float32Array,
  out: { p: number[]; c: number[]; n: number[] },
) {
  const fx = f[i * 3];
  const fy = f[i * 3 + 1];
  const fz = f[i * 3 + 2];
  const floorY = -1 + seeds[i * 4 + 3] * 0.04;
  const floorX = fx * 1.1;
  const floorZ = fz * 0.6;
  const W = [WATER.r, WATER.g, WATER.b];
  if (mix < DRAIN) {
    const drainT = Math.min(1, Math.max(0, mix / DRAIN));
    const start = ((1.15 - fy) / 2.3) * 0.7 + seeds[i * 4] * 0.05;
    const k = Math.min(1, Math.max(0, (drainT - start) / 0.25));
    out.p[0] = fx + (floorX - fx) * k;
    out.p[1] = fy + (floorY + floorZ * TILT - fy) * k * k;
    out.p[2] = fz + (floorZ - fz) * k;
    for (let c = 0; c < 3; c++) {
      out.c[c] = cf[i * 3 + c] + (W[c] - cf[i * 3 + c]) * k;
      out.n[c] = nf[i * 3 + c] + ((c === 1 ? 1 : 0) - nf[i * 3 + c]) * k;
    }
  } else {
    const fillT = Math.min(1, Math.max(0, (mix - DRAIN) / (1 - DRAIN)));
    const level = -1.15 + 2.3 * fillT;
    const g = Math.min(1, fillT / 0.28);
    const gather = g * g * (3 - 2 * g);
    const ty = t[i * 3 + 1];
    const z = floorZ + (t[i * 3 + 2] - floorZ) * gather;
    const surf = Math.max(floorY, level) + z * TILT;
    out.p[0] = floorX + (t[i * 3] - floorX) * gather;
    out.p[1] = Math.min(ty, surf);
    out.p[2] = z;
    const e = Math.min(1, Math.max(0, (surf - (ty - 0.06)) / 0.08));
    const settled = e * e * (3 - 2 * e);
    for (let c = 0; c < 3; c++) {
      out.c[c] = W[c] + (ct[i * 3 + c] - W[c]) * settled;
      out.n[c] = (c === 1 ? 1 : 0) + (nt[i * 3 + c] - (c === 1 ? 1 : 0)) * settled;
    }
  }
}

function Particles({ tier, still = false }: Props) {
  const count = COUNTS[tier];
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const invalidate = useThree((state) => state.invalidate);
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const cache = useRef(new Map<FormId, Shape>());
  const pending = useRef(new Set<FormId>());
  const state = useRef({
    current: "pool" as FormId,
    target: "pool" as FormId,
    mix: 1,
    poured: true,
    x: 0,
    y: 0,
    scale: 120,
    rot: 0,
    placed: false,
    pointer: new THREE.Vector2(-9999, -9999),
    force: 0,
    scrollV: 0,
    lastScroll: 0,
    fade: 0,
    gravity: new THREE.Vector2(),
  });

  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const seedsRef = useRef<Float32Array>(new Float32Array(0));

  const uniforms = useMemo(
    () => ({
      uMix: { value: 1 },
      uTime: { value: 0 },
      uScale: { value: 120 },
      uRotY: { value: 0 },
      uTurbulence: { value: 0 },
      uPointer: { value: new THREE.Vector2(-9999, -9999) },
      uPointerForce: { value: 0 },
      uGravity: { value: new THREE.Vector2() },
      uSize: { value: 3 },
      uPixelRatio: { value: 1 },
      // Fewer points each carry more light, so every tier reads at the same brightness.
      uAlpha: { value: 0.2 * Math.sqrt(24000 / count) },
      uStill: { value: still ? 1 : 0 },
      // The water shows itself only where a case is on screen; between cases it sinks away.
      uFade: { value: 0 },
      uWater: { value: new THREE.Vector3(WATER.r, WATER.g, WATER.b) },
    }),
    [count, still],
  );

  // Shapes are built lazily the first time they are needed, then cached.
  const ensure = (id: FormId) => {
    if (cache.current.has(id) || pending.current.has(id)) return;
    pending.current.add(id);
    buildShape(id, count)
      .then((shape) => cache.current.set(id, shape))
      .catch(() => cache.current.set(id, cache.current.get("pool")!))
      .finally(() => {
        pending.current.delete(id);
        invalidate();
      });
  };

  /** Start a pour from wherever the particles are right now, so retargeting mid-pour never jumps. */
  const morphTo = (id: FormId) => {
    const target = cache.current.get(id);
    const geometry = geometryRef.current;
    if (!target || !geometry) return;
    const seeds = seedsRef.current;
    const s = state.current;
    const attr = (name: string) => geometry.getAttribute(name) as THREE.BufferAttribute;
    const arr = (name: string) => attr(name).array as Float32Array;
    const f = arr("aFrom");
    const t = arr("aTo");
    const cf = arr("aColorFrom");
    const ct = arr("aColorTo");
    const nf = arr("aNormFrom");
    const nt = arr("aNormTo");
    const out = { p: [0, 0, 0], c: [0, 0, 0], n: [0, 0, 0] };
    const settledAll = s.mix >= 1;
    for (let i = 0; i < count; i++) {
      if (settledAll) {
        for (let k = 0; k < 3; k++) {
          f[i * 3 + k] = t[i * 3 + k];
          cf[i * 3 + k] = ct[i * 3 + k];
          nf[i * 3 + k] = nt[i * 3 + k];
        }
      } else {
        pourState(s.mix, i, seeds, f, t, cf, ct, nf, nt, out);
        for (let k = 0; k < 3; k++) {
          f[i * 3 + k] = out.p[k];
          cf[i * 3 + k] = out.c[k];
          nf[i * 3 + k] = out.n[k];
        }
      }
      for (let k = 0; k < 3; k++) {
        t[i * 3 + k] = target.positions[i * 3 + k];
        ct[i * 3 + k] = target.colors[i * 3 + k];
        nt[i * 3 + k] = target.normals[i * 3 + k];
      }
    }
    for (const name of ["aFrom", "aTo", "aColorFrom", "aColorTo", "aNormFrom", "aNormTo"]) attr(name).needsUpdate = true;
    s.current = id;
    s.mix = still ? 1 : 0;
    s.poured = still;
  };

  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = 0.7 + Math.random() * 0.6;
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = Math.random();
    }
    for (const name of ["position", "aFrom", "aTo", "aColorFrom", "aColorTo", "aNormFrom", "aNormTo"]) {
      geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    }
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    geometryRef.current = geometry;
    seedsRef.current = seeds;
    if (points.current) points.current.geometry = geometry;

    // Start as a resting pool, already formed.
    buildShape("pool", count).then((shape) => {
      cache.current.set("pool", shape);
      for (const name of ["aFrom", "aTo"]) (geometry.getAttribute(name).array as Float32Array).set(shape.positions);
      for (const name of ["aColorFrom", "aColorTo"]) (geometry.getAttribute(name).array as Float32Array).set(shape.colors);
      for (const name of ["aNormFrom", "aNormTo"]) (geometry.getAttribute(name).array as Float32Array).set(shape.normals);
      for (const name of ["aFrom", "aTo", "aColorFrom", "aColorTo", "aNormFrom", "aNormTo"]) geometry.getAttribute(name).needsUpdate = true;
      invalidate();
    });
    for (const id of ["helix", "screens", "drop"] as FormId[]) ensure(id);
    // The skull needs its 0.7 MB print file; fetch it once the page has settled, before it's needed.
    const skullTimer = window.setTimeout(() => ensure("skull"), 2500);
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const s = state.current;
      s.pointer.set(event.clientX - window.innerWidth / 2, window.innerHeight / 2 - event.clientY);
      s.force = 1;
    };
    const onLeave = () => (state.current.force = 0);
    const onScroll = () => invalidate();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(skullTimer);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      geometry.dispose();
      geometryRef.current = null;
    };
    // ensure and invalidate are stable for the lifetime of the canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useFrame((frame, delta) => {
    const s = state.current;
    const m = material.current;
    if (!m) return;

    const active = activeAnchor();
    const wanted: FormId = active?.form ?? "pool";
    if (wanted === "skull") ensure("skull");
    if (wanted !== s.target) s.target = wanted;
    if (s.target !== s.current && cache.current.has(s.target)) morphTo(s.target);
    s.mix = Math.min(1, s.mix + delta / MORPH_SECONDS);
    // As the new shape starts to fill, the water under it stirs.
    if (!s.poured && s.mix > DRAIN + 0.05 && active) {
      s.poured = true;
      emitDrop((active.rect.left + active.rect.width / 2) / size.width, (active.rect.top + active.rect.height * 0.85) / size.height, 0.5, 0.08);
    }

    // Glide toward the anchor's box; at rest, sink below the bottom of the screen.
    const goal = active
      ? {
          x: active.rect.left + active.rect.width / 2 - size.width / 2,
          y: size.height / 2 - (active.rect.top + active.rect.height / 2),
          scale: Math.min(active.rect.width, active.rect.height) * 0.46,
        }
      : { x: 0, y: -size.height * 0.62, scale: Math.min(size.width, size.height) * 0.4 };
    const k = still || !s.placed ? 1 : 1 - Math.pow(0.002, delta);
    s.placed = true;
    s.x += (goal.x - s.x) * k;
    s.y += (goal.y - s.y) * k;
    s.scale += (goal.scale - s.scale) * k;

    const motion = MOTION[s.current];
    const time = frame.clock.elapsedTime;
    if (still) s.rot = motion.base;
    else if (motion.kind === "spin") s.rot += delta * 0.32;
    else s.rot = motion.base + Math.sin(time * 0.4) * motion.amp;

    const scrollY = window.scrollY;
    s.scrollV += (Math.min(1, Math.abs(scrollY - s.lastScroll) / 40) - s.scrollV) * 0.1;
    s.lastScroll = scrollY;
    s.force *= Math.pow(0.4, delta);

    const fadeGoal = active ? 1 : 0;
    s.fade = still ? fadeGoal : s.fade + (fadeGoal - s.fade) * (1 - Math.exp(-(active ? 3 : 2) * delta));
    if (points.current) points.current.position.set(s.x, s.y, 0);
    const u = m.uniforms;
    u.uMix.value = s.mix;
    u.uFade.value = s.fade;
    u.uTime.value = time;
    u.uScale.value = s.scale;
    u.uRotY.value = s.rot;
    u.uTurbulence.value = s.scrollV;
    (u.uPointer.value as THREE.Vector2).copy(s.pointer);
    u.uPointerForce.value = s.force;
    (u.uGravity.value as THREE.Vector2).copy(s.gravity);
    u.uPixelRatio.value = dpr;
    u.uSize.value = Math.max(1.6, Math.min(3.6, s.scale / 90));
  });

  return (
    <points ref={points} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneFactor}
        blendSrcAlpha={THREE.ZeroFactor}
        blendDstAlpha={THREE.OneFactor}
      />
    </points>
  );
}

/**
 * The water's shapes on the home page: a layer of light added over the water surface, under the
 * text. It only draws while the selected work is near the screen, and, for visitors who prefer
 * less motion, only when something changes (each shape appears whole, without the pour).
 */
export default function FormsCanvas({ tier, still = false }: Props) {
  const [visible, setVisible] = useState(true);
  const [near, setNear] = useState(true);
  const [water, setWater] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    // Whatever covers the water (the 3D world, a full-screen surface) covers the shapes too.
    const offWater = onWaterVisibility(setWater);
    const work = document.getElementById("work");
    let observer: IntersectionObserver | undefined;
    if (work) {
      observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "60% 0px" });
      observer.observe(work);
    }
    document.documentElement.dataset.forms = "live";
    return () => {
      document.removeEventListener("visibilitychange", update);
      offWater();
      observer?.disconnect();
      delete document.documentElement.dataset.forms;
    };
  }, []);

  const frameloop = !visible || !near || !water ? "never" : still ? "demand" : "always";
  return (
    <Canvas
      aria-hidden
      orthographic
      camera={{ position: [0, 0, 500], near: 0.1, far: 2000, zoom: 1 }}
      dpr={[1, DPR[tier]]}
      frameloop={frameloop}
      gl={{ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Particles tier={tier} still={still} />
    </Canvas>
  );
}
