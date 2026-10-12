"use client";

import "@/features/stage/quiet-three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { KYG_CREW, KYG_GENEE } from "@/content/exhibits/kyg";
import type { ExhibitProps } from "./exhibit";
import { roomEnvironment } from "./room-environment";
import { exhibitDpr, useCompiled } from "./use-compiled";
import { prefersReducedMotion, useInView } from "./use-in-view";

const DRACO = "/draco/";
type Crew = (typeof KYG_CREW)[number];

/**
 * Wrap a clone of a loaded scene so it stands on y = 0 at a target height. Cloning (with skeletons)
 * keeps the cached GLTF untouched, so re-running the memo never shifts the model twice.
 */
function useFitted(source: THREE.Object3D, height: number) {
  return useMemo(() => {
    const scene = cloneSkinned(source);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    scene.position.x -= center.x;
    scene.position.y -= box.min.y;
    scene.position.z -= center.z;
    scene.traverse((child) => {
      // Animated limbs leave the bind-pose bounds; never cull them mid-jump.
      child.frustumCulled = false;
    });
    const wrapper = new THREE.Group();
    wrapper.add(scene);
    wrapper.scale.setScalar(height / size.y);
    return wrapper;
  }, [source, height]);
}

/** How far the two figures sit from centre: closer together on narrow portrait screens. */
function useSpread() {
  const width = useThree((state) => state.viewport.width);
  return Math.min(1.2, width * 0.24);
}

function Genee({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(KYG_GENEE.model, DRACO);
  const spread = useSpread();
  const fitted = useFitted(scene, 2.6);
  // Hidden until its shaders are compiled; the poster stays up until then.
  const compiled = useCompiled(fitted);
  const group = useRef<THREE.Group>(null);
  const ready = useRef(false);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const reduced = prefersReducedMotion();
    if (!reduced) {
      g.rotation.y = Math.sin(state.clock.elapsedTime * 0.17) * 0.5;
      g.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.012);
    }
    if (compiled && !ready.current) {
      ready.current = true;
      onReady();
    }
  });
  return (
    <group
      ref={group}
      visible={compiled}
      position={[-spread, -1.35, 0]}
      scale={spread < 1 ? 0.8 : 1}
    >
      <primitive object={fitted} />
    </group>
  );
}

function CrewMember({
  crew,
  signatureKey,
}: {
  crew: Crew;
  signatureKey: number;
}) {
  const { scene, animations } = useGLTF(crew.model, DRACO);
  const fitted = useFitted(scene, 2.05);
  // Each mascot appears once its shaders are ready (the first one compiles; the rest reuse it).
  const compiled = useCompiled(fitted);
  const spread = useSpread();
  const group = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, group);

  const playOnce = (name: string) => {
    const action = actions[name];
    const idle = actions[crew.clips.idle];
    if (!action || !idle) return;
    action.reset().setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.fadeIn(0.2).play();
    idle.fadeOut(0.2);
  };

  // Arrive with a jump, settle into idle; reduced motion keeps a slow idle only. Starts once the
  // mascot is visible, so the jump is never spent while its shaders are still compiling.
  useEffect(() => {
    const idle = actions[crew.clips.idle];
    if (!idle || !compiled) return;
    if (prefersReducedMotion()) {
      idle.setEffectiveTimeScale(0.5).play();
      return;
    }
    idle.play();
    playOnce(crew.clips.jump);
    const onFinished = (event: { action: THREE.AnimationAction }) => {
      if (event.action === idle) return;
      event.action.fadeOut(0.3);
      idle.reset().fadeIn(0.3).play();
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
    // playOnce reads the same actions object; re-run only when the crew member changes or appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, mixer, crew, compiled]);

  useEffect(() => {
    if (signatureKey === 0 || prefersReducedMotion()) return;
    playOnce(crew.clips.signature);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureKey]);

  return (
    <group
      ref={group}
      visible={compiled}
      position={[spread * 1.05, -1.35, 0.3]}
      scale={spread < 1 ? 0.8 : 1}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
        if (!prefersReducedMotion()) playOnce(crew.clips.wave);
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <primitive object={fitted} />
    </group>
  );
}

/** Studio light. `onLit` fires once the environment is set, so the mascots compile with it. */
function Lighting({ onLit }: { onLit: (lit: boolean) => void }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    // Neutral tone mapping keeps the brand teal teal; ACES shifts it toward mint.
    gl.toneMapping = THREE.NeutralToneMapping;
    let live = true;
    let env: THREE.Texture | undefined;
    void roomEnvironment(gl).then((texture) => {
      if (!live) return texture.dispose();
      env = texture;
      scene.environment = texture;
      onLit(true);
    });
    return () => {
      live = false;
      env?.dispose();
    };
  }, [gl, scene, onLit]);
  return (
    <>
      <directionalLight position={[2, 4, 3]} intensity={1.6} />
      <directionalLight
        position={[-3, 2, -2]}
        intensity={0.6}
        color="#7fe3d6"
      />
    </>
  );
}

export default function KygExhibit({ onReady }: ExhibitProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, "100px");
  const [dpr] = useState(exhibitDpr);
  const [index, setIndex] = useState(0);
  const [signature, setSignature] = useState(0);
  const [lit, setLit] = useState(false);
  const crew = KYG_CREW[index];

  const choose = (i: number) => {
    if (i === index) setSignature((n) => n + 1);
    else setIndex(i);
  };

  return (
    <div
      ref={host}
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(70% 80% at 50% 60%, #ffffff, #FAF6EF 55%, #E6F4F3)",
      }}
    >
      <Canvas
        dpr={dpr}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0.2, 6.2], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
        onPointerMissed={() => undefined}
      >
        <Lighting onLit={setLit} />
        {lit ? (
          <>
            <Suspense fallback={null}>
              <Genee onReady={onReady} />
            </Suspense>
            <Suspense fallback={null}>
              <group onClick={() => setSignature((n) => n + 1)}>
                <CrewMember key={crew.id} crew={crew} signatureKey={signature} />
              </group>
            </Suspense>
          </>
        ) : null}
      </Canvas>

      <div className="absolute right-(--gutter) bottom-24 left-(--gutter) flex flex-col items-end gap-3 md:bottom-5 md:left-auto">
        <p
          className="rounded-full bg-white/80 px-4 py-2 text-sm text-[#0E4D4B] backdrop-blur"
          aria-live="polite"
        >
          <strong>{crew.name}</strong> · {crew.family} - tap again:{" "}
          {crew.signature.toLowerCase()}
        </p>
        <ul
          className="flex flex-wrap justify-end gap-2"
          aria-label="Choose a mascot"
        >
          {KYG_CREW.map((member, i) => (
            <li key={member.id}>
              <button
                type="button"
                aria-pressed={i === index}
                onClick={() => choose(i)}
                className="flex items-center gap-2 rounded-full border border-[#0E4D4B]/20 bg-white/85 px-3.5 py-2 text-sm text-[#0E4D4B] backdrop-blur transition-colors aria-pressed:border-[#0E4D4B] aria-pressed:bg-[#0E4D4B] aria-pressed:text-white"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: member.color }}
                  aria-hidden
                />
                {member.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

useGLTF.preload(KYG_GENEE.model, DRACO);
// The first mascot too: both download while the light is being prepared.
useGLTF.preload(KYG_CREW[0].model, DRACO);
