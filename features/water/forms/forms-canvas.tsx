"use client";

import { useEffect, useRef } from "react";
import type { Tier } from "@/features/stage/tier";
import { emitDrop, onWaterVisibility } from "../bus";
import { type GL, Program, sizeCanvas, whenCompiled } from "../gl";
import { activeAnchor, anchorsInView, onAnchorsChange } from "./anchors";
import { createShapeBuilder } from "./shape-builder";
import type { FormId, Shape } from "./shapes";

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
const WATER = [14 / 255, 200 / 255, 197 / 255] as const;
const ATTRIBUTES = ["aFrom", "aTo", "aColorFrom", "aColorTo", "aNormFrom", "aNormTo", "aSeed"] as const;

const vertex = /* glsl */ `
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
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

/** Where points come from or go to: positions, colours and normals, three floats each. */
type PointSet = { position: Float32Array; color: Float32Array; normal: Float32Array };

/**
 * Where points start..end of a pour that is filling are right now, worked out on the CPU exactly as
 * the shader does, so retargeting it never jumps: that state becomes the next pour's starting shape.
 */
function freezeFill(mix: number, start: number, end: number, seeds: Float32Array, from: PointSet, to: PointSet, out: PointSet) {
  const fillT = Math.min(1, Math.max(0, (mix - DRAIN) / (1 - DRAIN)));
  const level = -1.15 + 2.3 * fillT;
  const g = Math.min(1, fillT / 0.28);
  const gather = g * g * (3 - 2 * g);
  const [wr, wg, wb] = WATER;
  const { position: fp } = from;
  const { position: tp, color: tc, normal: tn } = to;
  const { position: op, color: oc, normal: on } = out;
  for (let i = start; i < end; i++) {
    const j = i * 3;
    const floorY = -1 + seeds[i * 4 + 3] * 0.04;
    const floorX = fp[j] * 1.1;
    const floorZ = fp[j + 2] * 0.6;
    const ty = tp[j + 1];
    const z = floorZ + (tp[j + 2] - floorZ) * gather;
    const surf = Math.max(floorY, level) + z * TILT;
    op[j] = floorX + (tp[j] - floorX) * gather;
    op[j + 1] = Math.min(ty, surf);
    op[j + 2] = z;
    const e = Math.min(1, Math.max(0, (surf - (ty - 0.06)) / 0.08));
    const settled = e * e * (3 - 2 * e);
    oc[j] = wr + (tc[j] - wr) * settled;
    oc[j + 1] = wg + (tc[j + 1] - wg) * settled;
    oc[j + 2] = wb + (tc[j + 2] - wb) * settled;
    on[j] = tn[j] * settled;
    on[j + 1] = 1 + (tn[j + 1] - 1) * settled;
    on[j + 2] = tn[j + 2] * settled;
  }
}

/**
 * Shapes the cases need, asked for one per idle moment after the pool. They are built in a worker;
 * where none can start they are built here, and the pacing keeps that from being one long task.
 */
const PREPARE: FormId[] = ["skull", "helix", "drop", "screens"];

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** A column-major translation matrix (the points' model and the camera's view). */
function translation(out: Float32Array, x: number, y: number, z: number): Float32Array {
  out.fill(0);
  out[0] = out[5] = out[10] = out[15] = 1;
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

/** An orthographic projection one world unit per CSS pixel, centred, as three.js builds it. */
function orthographic(out: Float32Array, width: number, height: number, near: number, far: number): Float32Array {
  out.fill(0);
  out[0] = 2 / width;
  out[5] = 2 / height;
  out[10] = -2 / (far - near);
  out[14] = -(far + near) / (far - near);
  out[15] = 1;
  return out;
}

/** Builds the canvas's GL state and frame loop; returns how to tear it down. */
function start(canvas: HTMLCanvasElement, tier: Exclude<Tier, 0>, still: boolean): (() => void) | undefined {
  const root = document.documentElement;
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  }) as GL | null;
  if (!gl) {
    root.dataset.forms = "off";
    return;
  }
  const count = COUNTS[tier];
  const pixelRatio = Math.min(Math.max(1, window.devicePixelRatio || 1), DPR[tier]);
  // The window's size for now (reading the canvas's would force a layout); the observer corrects it.
  let width = window.innerWidth;
  let height = window.innerHeight;
  sizeCanvas(canvas, width, height, pixelRatio);

  const program = new Program(gl, vertex, fragment, [...ATTRIBUTES]);
  let compiled = false;
  let disposed = false;

  // Where every point comes from and goes to, in two sets that trade places as the water pours from
  // one shape into the next. The CPU keeps a copy so a pour can be retargeted.
  const makeSet = (): PointSet => ({ position: new Float32Array(count * 3), color: new Float32Array(count * 3), normal: new Float32Array(count * 3) });
  const KINDS = ["position", "color", "normal"] as const;
  const sets: [PointSet, PointSet] = [makeSet(), makeSet()];
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seeds[i * 4] = Math.random();
    seeds[i * 4 + 1] = 0.7 + Math.random() * 0.6;
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();
  }
  const newBuffer = (data: Float32Array | number, usage: number) => {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    if (typeof data === "number") gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    else gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return buffer;
  };
  // Sized now, filled when the resting pool is ready.
  const gpu = sets.map(() => KINDS.map(() => newBuffer(count * 3 * 4, gl.DYNAMIC_DRAW)));
  const seedBuffer = newBuffer(seeds, gl.STATIC_DRAW);
  // vaos[k] pours from set k into set 1 - k (attribute locations follow ATTRIBUTES).
  const vaos = [0, 1].map((k) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const bind = (buffer: WebGLBuffer, location: number, size: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    };
    KINDS.forEach((_, i) => {
      bind(gpu[k][i], i * 2, 3);
      bind(gpu[1 - k][i], i * 2 + 1, 3);
    });
    bind(seedBuffer, 6, 4);
    gl.bindVertexArray(null);
    return vao;
  });
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  let from = 0; // the set the points pour from
  const upload = (k: number) => {
    KINDS.forEach((kind, i) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu[k][i]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sets[k][kind]);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  };
  const write = (k: number, shape: Shape) => {
    sets[k].position.set(shape.positions);
    sets[k].color.set(shape.colors);
    sets[k].normal.set(shape.normals);
    upload(k);
  };

  const model = new Float32Array(16);
  const view = translation(new Float32Array(16), 0, 0, -500);
  const projection = orthographic(new Float32Array(16), width, height, 0.1, 2000);

  const s = {
    current: "pool" as FormId,
    target: "pool" as FormId,
    mix: 1,
    poured: true,
    x: 0,
    y: 0,
    scale: 120,
    rot: 0,
    placed: false,
    pointer: [-9999, -9999],
    force: 0,
    scrollV: 0,
    lastScroll: window.scrollY,
    fade: 0,
    gravity: [0, 0],
  };

  // Shapes are built lazily, off the main thread: the pool first, the one on screen at once, the
  // others one per idle moment, then cached.
  const builder = createShapeBuilder();
  const cache = new Map<FormId, Shape>();
  const pending = new Set<FormId>();
  const ensure = (id: FormId) => {
    if (cache.has(id) || pending.has(id)) return;
    pending.add(id);
    builder
      .build(id, count)
      .then((shape) => {
        cache.set(id, shape);
        // The resting pool is where every point starts.
        if (id === "pool") {
          write(0, shape);
          write(1, shape);
        }
      })
      .catch(() => {
        if (id !== "pool") cache.set(id, cache.get("pool")!);
      })
      .finally(() => {
        pending.delete(id);
        if (!disposed) wake();
      });
  };
  const w = window as IdleWindow;
  let idleId = 0;
  let idleTimer = 0;
  const prepareNext = () => {
    idleId = idleTimer = 0;
    if (disposed) return;
    const next = (["pool", ...PREPARE] as FormId[]).find((id) => !cache.has(id) && !pending.has(id));
    if (!next) return;
    ensure(next);
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(prepareNext, { timeout: 1500 });
    else idleTimer = window.setTimeout(prepareNext, 200);
  };
  if (w.requestIdleCallback) idleId = w.requestIdleCallback(prepareNext, { timeout: 500 });
  else idleTimer = window.setTimeout(prepareNext, 50);

  // Retargeting, so it never jumps and no frame pays for all of it. While a pour drains it reads
  // only where the points come from, so a new target simply takes the old one's place; once it
  // has settled, the old target becomes where they come from. Mid-fill, the pour holds still for a
  // few frames while the CPU works out exactly where every point is, a slice per frame, then
  // drains from there. A new target is written into the "to" set a frame later, while it drains.
  const SLICES = 3;
  let frozen = makeSet();
  let freezing = -1; // the next point to freeze, or -1
  let due: FormId | null = null;
  const startPour = (id: FormId) => {
    s.current = id;
    s.mix = still ? 1 : 0;
    s.poured = still;
  };
  /** Moves any retarget along; true while the pour is held. */
  const pour = (): boolean => {
    if (due) {
      write(1 - from, cache.get(due)!);
      due = null;
    }
    if (freezing >= 0) {
      // Back to the shape it was already filling: carry on.
      if (s.target === s.current) {
        freezing = -1;
        return false;
      }
      const end = Math.min(count, freezing + Math.ceil(count / SLICES));
      freezeFill(s.mix, freezing, end, seeds, sets[from], sets[1 - from], frozen);
      freezing = end;
      if (end < count) return true;
      freezing = -1;
      [sets[from], frozen] = [frozen, sets[from]];
      upload(from);
      const id = cache.has(s.target) ? s.target : s.current;
      startPour(id);
      due = id;
      return false;
    }
    const id = s.target;
    if (id === s.current || !cache.has(id)) return false;
    if (!still && s.mix < DRAIN) {
      write(1 - from, cache.get(id)!);
      s.current = id;
      s.poured = false;
      return false;
    }
    if (s.mix >= 1) {
      from = 1 - from;
      startPour(id);
      // Drawn whole at once without motion, it is needed now; otherwise from the next frame.
      if (still) write(1 - from, cache.get(id)!);
      else due = id;
      return false;
    }
    freezing = 0;
    return pour();
  };

  // The frame loop runs only while it has something to show.
  let visible = document.visibilityState === "visible";
  let near = false;
  let water = true;
  let raf = 0;
  let last = 0;
  let time = 0;
  let shown = false; // whether the canvas holds a drawn frame

  const clear = () => {
    if (!shown) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    shown = false;
  };

  const draw = () => {
    const u = (name: string) => program.uniform(name);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Light is added straight onto what's there; the canvas's own alpha stays as it was.
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    program.use();
    gl.uniformMatrix4fv(u("modelMatrix"), false, translation(model, s.x, s.y, 0));
    gl.uniformMatrix4fv(u("viewMatrix"), false, view);
    gl.uniformMatrix4fv(u("projectionMatrix"), false, projection);
    gl.uniform1f(u("uMix"), s.mix);
    gl.uniform1f(u("uTime"), time);
    gl.uniform1f(u("uScale"), s.scale);
    gl.uniform1f(u("uRotY"), s.rot);
    gl.uniform1f(u("uTurbulence"), s.scrollV);
    gl.uniform2f(u("uPointer"), s.pointer[0], s.pointer[1]);
    gl.uniform1f(u("uPointerForce"), s.force);
    gl.uniform2f(u("uGravity"), s.gravity[0], s.gravity[1]);
    gl.uniform1f(u("uSize"), Math.max(1.6, Math.min(3.6, s.scale / 90)));
    gl.uniform1f(u("uPixelRatio"), pixelRatio);
    // Fewer points each carry more light, so every tier reads at the same brightness.
    gl.uniform1f(u("uAlpha"), 0.2 * Math.sqrt(24000 / count));
    gl.uniform1f(u("uStill"), still ? 1 : 0);
    // The water shows itself only where a case is on screen; between cases it sinks away.
    gl.uniform1f(u("uFade"), s.fade);
    gl.uniform3f(u("uWater"), WATER[0], WATER[1], WATER[2]);
    gl.bindVertexArray(vaos[from]);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.bindVertexArray(null);
    shown = true;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || !near || !water || !compiled || !cache.has("pool")) {
      clear();
      return;
    }
    const delta = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    time += delta;

    const active = activeAnchor();
    const wanted: FormId = active?.form ?? "pool";
    if (wanted !== "pool") ensure(wanted);
    if (wanted !== s.target) s.target = wanted;
    if (!pour()) s.mix = Math.min(1, s.mix + delta / MORPH_SECONDS);
    // As the new shape starts to fill, the water under it stirs.
    if (!s.poured && s.mix > DRAIN + 0.05 && active) {
      s.poured = true;
      emitDrop((active.rect.left + active.rect.width / 2) / width, (active.rect.top + active.rect.height * 0.85) / height, 0.5, 0.08);
    }

    // Glide toward the anchor's box; at rest, sink below the bottom of the screen.
    const goal = active
      ? {
          x: active.rect.left + active.rect.width / 2 - width / 2,
          y: height / 2 - (active.rect.top + active.rect.height / 2),
          scale: Math.min(active.rect.width, active.rect.height) * 0.46,
        }
      : { x: 0, y: -height * 0.62, scale: Math.min(width, height) * 0.4 };
    const k = still || !s.placed ? 1 : 1 - Math.pow(0.002, delta);
    s.placed = true;
    s.x += (goal.x - s.x) * k;
    s.y += (goal.y - s.y) * k;
    s.scale += (goal.scale - s.scale) * k;

    const motion = MOTION[s.current];
    if (still) s.rot = motion.base;
    else if (motion.kind === "spin") s.rot += delta * 0.32;
    else s.rot = motion.base + Math.sin(time * 0.4) * motion.amp;

    const scrollY = window.scrollY;
    s.scrollV += (Math.min(1, Math.abs(scrollY - s.lastScroll) / 40) - s.scrollV) * 0.1;
    s.lastScroll = scrollY;
    s.force *= Math.pow(0.4, delta);
    const fadeGoal = active ? 1 : 0;
    s.fade = still ? fadeGoal : s.fade + (fadeGoal - s.fade) * (1 - Math.exp(-(active ? 3 : 2) * delta));

    // Nothing on screen and the water has sunk away: clear, and rest until a case comes into view.
    if (!active && !anchorsInView() && s.fade < 0.004 && s.mix >= 1) {
      clear();
      return;
    }
    draw();
    // Still: one frame per change. Otherwise, keep going.
    if (!still) raf = requestAnimationFrame(frame);
  };
  function wake() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }

  whenCompiled(gl, [program]).then(
    () => {
      compiled = true;
      wake();
    },
    () => {
      if (!disposed) root.dataset.forms = "off";
    },
  );

  const onLost = (event: Event) => {
    event.preventDefault();
    disposed = true;
    cancelAnimationFrame(raf);
    // The real pictures take the shapes' place.
    root.dataset.forms = "off";
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    s.pointer[0] = event.clientX - width / 2;
    s.pointer[1] = height / 2 - event.clientY;
    s.force = 1;
  };
  const onLeave = () => (s.force = 0);
  // Still frames follow the page as it scrolls.
  const onScroll = () => {
    if (still) wake();
  };
  const onVisibility = () => {
    visible = document.visibilityState === "visible";
    last = 0;
    wake();
  };
  const resizeObserver = new ResizeObserver(() => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch || (cw === width && ch === height)) return;
    width = cw;
    height = ch;
    sizeCanvas(canvas, width, height, pixelRatio);
    orthographic(projection, width, height, 0.1, 2000);
    shown = true; // resizing clears the canvas; draw (or clear) again
    wake();
  });
  resizeObserver.observe(canvas);
  // Whatever covers the water (the 3D world, a full-screen surface) covers the shapes too.
  const offWater = onWaterVisibility((value) => {
    water = value;
    last = 0;
    wake();
  });
  const offAnchors = onAnchorsChange(wake);
  // The selected work, with room to spare: the canvas rests outright (cleared) when it's far away.
  const work = document.getElementById("work");
  const nearObserver = new IntersectionObserver(
    ([entry]) => {
      near = entry.isIntersecting;
      last = 0;
      wake();
    },
    { rootMargin: "60% 0px" },
  );
  if (work) nearObserver.observe(work);
  else near = true;

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    if (idleId) w.cancelIdleCallback?.(idleId);
    window.clearTimeout(idleTimer);
    resizeObserver.disconnect();
    nearObserver.disconnect();
    offWater();
    offAnchors();
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    for (const buffer of [...gpu.flat(), seedBuffer]) gl.deleteBuffer(buffer);
    for (const vao of vaos) gl.deleteVertexArray(vao);
    program.dispose();
    builder.dispose();
    // Browsers cap live WebGL contexts; give this one back now rather than at garbage collection.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    delete root.dataset.forms;
  };
}

/**
 * The water's shapes on the home page: a layer of light added over the water surface, under the
 * text, on its own WebGL2 canvas. Its shader compiles and its shapes are built in the background as
 * the selected work approaches. It draws only while a case is on screen or the water is still
 * settling, and rests (cleared) the rest of the time; for visitors who prefer less motion it draws
 * only when something changes (each shape appears whole, without the pour).
 */
export default function FormsCanvas({ tier, still = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Set up in an idle moment, not inside the commit that mounted the canvas.
    const w = window as IdleWindow;
    let stop: (() => void) | undefined;
    let cancelled = false;
    const begin = () => {
      if (!cancelled) stop = start(canvas, tier, still);
    };
    const hasIdle = typeof w.requestIdleCallback === "function";
    const idle = hasIdle ? w.requestIdleCallback!(begin, { timeout: 400 }) : window.setTimeout(begin, 30);
    return () => {
      cancelled = true;
      if (hasIdle) w.cancelIdleCallback?.(idle);
      else window.clearTimeout(idle);
      stop?.();
    };
  }, [tier, still]);

  return (
    <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, display: "block", width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
  );
}
