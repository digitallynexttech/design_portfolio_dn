"use client";

import "@/features/stage/quiet-three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { ExhibitProps } from "./exhibit";
import { prefersReducedMotion, useInView } from "./use-in-view";

const MODEL = "/models/skelmet/skull.glb";
const BLAZE = new THREE.Color("#F0561E");
const EMBERS = 140;

type Spin = { yaw: number; pitch: number; vYaw: number; vPitch: number; flare: number; dragging: boolean };

/** The real print file, lit like SKELMET's "After Dark Garage" hero. */
function Skull({ spin, pointer, onReady }: { spin: React.RefObject<Spin>; pointer: React.RefObject<THREE.Vector2>; onReady: () => void }) {
  const { scene } = useGLTF(MODEL);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial | null>(null);
  const ready = useRef(false);

  const model = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2.3 / Math.max(size.x, size.y, size.z);
    root.position.copy(center).multiplyScalar(-scale);
    root.scale.multiplyScalar(scale);
    const filament = new THREE.MeshStandardMaterial({ color: BLAZE, roughness: 0.6, metalness: 0.02, emissive: BLAZE, emissiveIntensity: 0.03 });
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = filament;
    });
    return { root, filament };
  }, [scene]);

  useEffect(() => {
    material.current = model.filament;
    return () => model.filament.dispose();
  }, [model]);

  useFrame((state, delta) => {
    const s = spin.current;
    const g = group.current;
    if (!g) return;
    const reduced = prefersReducedMotion();

    // Momentum after a drag, easing back toward the cursor's gaze when left alone.
    if (!s.dragging) {
      s.vYaw *= Math.pow(0.04, delta);
      s.vPitch *= Math.pow(0.04, delta);
      const gazeYaw = pointer.current.x * 0.45;
      const gazePitch = -pointer.current.y * 0.25;
      s.yaw += s.vYaw * delta + (Math.abs(s.vYaw) < 0.4 ? (gazeYaw - wrap(s.yaw)) * Math.min(1, delta * 2.2) : 0);
      s.pitch += s.vPitch * delta + (gazePitch - s.pitch) * Math.min(1, delta * 2.2);
    }
    s.flare = Math.max(0, s.flare - delta * 1.4);

    g.rotation.set(s.pitch, s.yaw, -s.vYaw * 0.02);
    g.position.y = reduced ? 0 : Math.sin(state.clock.elapsedTime * 1.3) * 0.06;
    if (material.current) material.current.emissiveIntensity = 0.03 + s.flare * 0.9;

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <group ref={group}>
      <primitive object={model.root} />
    </group>
  );
}

function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** Embers drift upward; a hard fling throws a burst of them. */
function Embers({ spin }: { spin: React.RefObject<Spin> }) {
  const points = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(EMBERS * 3);
    const speeds = new Float32Array(EMBERS);
    for (let i = 0; i < EMBERS; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 - 0.5;
      speeds[i] = 0.15 + Math.random() * 0.35;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const geometry = points.current?.geometry;
    if (!geometry) return;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const boost = 1 + spin.current.flare * 6;
    for (let i = 0; i < EMBERS; i++) {
      attr.array[i * 3 + 1] += speeds[i] * delta * boost;
      attr.array[i * 3] += Math.sin(attr.array[i * 3 + 1] * 2 + i) * delta * 0.05;
      if (attr.array[i * 3 + 1] > 2.2) attr.array[i * 3 + 1] = -2.2;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#FF8A00" size={0.05} sizeAttenuation transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Studio() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.18;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight position={[-3.5, 2, 2.5]} intensity={3.4} color="#FF9A3C" />
      <directionalLight position={[3, 1.2, -2.5]} intensity={3.2} color="#7B5CFF" />
      <directionalLight position={[0.5, 4, 1.5]} intensity={0.35} color="#F7F4ED" />
    </>
  );
}

export default function SkelmetExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, "100px");
  const spin = useRef<Spin>({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, flare: 0, dragging: false });
  const pointer = useRef(new THREE.Vector2());
  const drag = useRef({ x: 0, y: 0, t: 0 });

  const fling = (vYaw: number) => {
    const s = spin.current;
    s.vYaw = vYaw;
    if (Math.abs(vYaw) > 9) s.flare = 1;
  };

  return (
    <div
      ref={host}
      tabIndex={0}
      role="application"
      aria-roledescription="3D model"
      aria-label="The SKELMET skull. Drag or use the arrow keys to spin it; press space to fling it."
      className="absolute inset-0 cursor-grab touch-pan-y outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-(--c-accent)"
      style={{ background: "radial-gradient(60% 70% at 50% 55%, #1a0f0a, #07060A 70%)" }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.current.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
        const s = spin.current;
        if (!s.dragging) return;
        const now = performance.now();
        const dt = Math.max(0.008, (now - drag.current.t) / 1000);
        const dx = event.clientX - drag.current.x;
        const dy = event.clientY - drag.current.y;
        s.yaw += dx * 0.012;
        s.pitch = Math.max(-0.6, Math.min(0.6, s.pitch + dy * 0.006));
        s.vYaw = (dx * 0.012) / dt;
        drag.current = { x: event.clientX, y: event.clientY, t: now };
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        spin.current.dragging = true;
        drag.current = { x: event.clientX, y: event.clientY, t: performance.now() };
      }}
      onPointerUp={() => {
        spin.current.dragging = false;
        fling(spin.current.vYaw);
      }}
      onPointerCancel={() => {
        spin.current.dragging = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") spin.current.vYaw -= 3;
        else if (event.key === "ArrowRight") spin.current.vYaw += 3;
        else if (event.key === " ") fling(14 * (Math.random() > 0.5 ? 1 : -1));
        else return;
        event.preventDefault();
      }}
    >
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-(family-name:--c-display) text-[13vw] leading-none tracking-tight text-transparent uppercase select-none [-webkit-text-stroke:1px_rgb(255_90_31/0.35)]"
      >
        Park the menace
      </p>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0, 6], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Studio />
        <Suspense fallback={null}>
          <Skull spin={spin} pointer={pointer} onReady={onReady} />
        </Suspense>
        <Embers spin={spin} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL);
