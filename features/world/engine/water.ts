// The sea. Vertices ride the shared wave set (waves.ts) so the boat floats on what you see. Every
// pixel then does what water does: refracts what's beneath it (sand in the shallows, the hull
// below the waterline), absorbs red light with depth so shallows run turquoise and depths go navy,
// reflects the islands and the sky by Fresnel, throws sun glitter, glows through thin wave crests,
// and foams wherever it meets something: beaches, piers, the hull, the wake.
import * as THREE from "three/webgpu";
import {
  abs,
  cameraFar,
  cameraNear,
  cameraPosition,
  cos,
  dot,
  exp,
  float,
  max,
  mix,
  mx_noise_float,
  normalize,
  NodeUpdateType,
  perspectiveDepthToViewZ,
  pmremTexture,
  positionLocal,
  positionView,
  positionWorld,
  pow,
  reflect,
  reflector,
  screenUV,
  sin,
  smoothstep,
  step,
  texture,
  uniform,
  vec2,
  vec3,
  viewportDepthTexture,
  viewportSharedTexture,
} from "three/tsl";
import { WAVES } from "../waves";
import { MASK_EXTENT, MASK_RES, type SeaMask } from "./mask";
import { foamTexture, rippleNormals } from "./procedural";
import { SIM_SIZE, type Ripple } from "./ripple";
import type { Shared } from "./shared";
import type { N } from "./tsl";
import { LAYER_VIEW } from "./layers";

/** Height and slope of the shared waves at world xz (vec2 node), scaled by `amp`. */
function waveNode(xz: N, t: N, amp: N): { h: N; dx: N; dz: N } {
  let h: N = float(0);
  let dx: N = float(0);
  let dz: N = float(0);
  for (const w of WAVES) {
    const theta = xz.x.mul(w.dx).add(xz.y.mul(w.dz)).mul(w.k).sub(t.mul(w.w)).add(w.phase);
    const s = max(sin(theta).add(1).mul(0.5), 0);
    h = h.add(pow(s, float(w.sharp)).mul(2).sub(1).mul(w.amp));
    const slope = pow(max(s, 1e-4), float(w.sharp - 1)).mul(cos(theta)).mul(w.sharp * w.amp * w.k);
    dx = dx.add(slope.mul(w.dx));
    dz = dz.add(slope.mul(w.dz));
  }
  return { h: h.mul(amp), dx: dx.mul(amp), dz: dz.mul(amp) };
}

export function maskTexture(mask: SeaMask): THREE.DataTexture {
  const tex = new THREE.DataTexture(mask.bytes, MASK_RES, MASK_RES, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export type Water = ReturnType<typeof createWater>;

export function createWater(scene: THREE.Scene, shared: Shared, maskTex: THREE.DataTexture, ripple: Ripple, tier: 1 | 2 | 3, envTexture: THREE.Texture, camera: THREE.Camera) {
  const { u } = shared;
  const origin = uniform(new THREE.Vector3());
  const normalsTex = rippleNormals(tier === 1 ? 128 : 256);
  const foamTex = foamTexture(tier === 1 ? 128 : 256);

  // A grid packed densely near the boat and loosely toward the horizon.
  const segments = tier === 3 ? 256 : tier === 2 ? 190 : 120;
  const size = 1600;
  const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setXYZ(i, Math.sign(x) * Math.pow(Math.abs(x), 2.1) * size * 0.5, 0, Math.sign(z) * Math.pow(Math.abs(z), 2.1) * size * 0.5);
  }
  geometry.computeBoundingSphere();

  const maskUV = (xz: N) => xz.add(MASK_EXTENT / 2).div(MASK_EXTENT);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: true });

  // --- Vertex: the shared waves, damped by the shore mask exactly as on the CPU ----------------
  const worldXZ = positionLocal.xz.add(origin.xz);
  const mv = texture(maskTex, maskUV(worldXZ)).level(float(0));
  const vDamp = float(1).sub(mv.r.mul(0.72)).mul(float(1).sub(mv.b.mul(u.ice).mul(0.85)));
  const vWave = waveNode(worldXZ, u.time, u.waveAmp.mul(vDamp));
  material.positionNode = vec3(positionLocal.x, vWave.h, positionLocal.z);

  // --- Fragment ------------------------------------------------------------------------------
  const p = positionWorld;
  const xz = p.xz;
  const toCam = cameraPosition.sub(p);
  const dist = toCam.length();
  const view = toCam.div(dist);
  const m = texture(maskTex, maskUV(xz));
  const shallow = m.r;
  const iceMask = m.b.mul(u.ice);
  const damp = float(1).sub(shallow.mul(0.72)).mul(float(1).sub(iceMask.mul(0.85)));
  const amp = u.waveAmp.mul(damp);
  const wave = waveNode(xz, u.time, amp);

  // Small ripples: two layers of the baked normals drifting with the wind, fading with distance.
  const near = float(1).sub(smoothstep(60, 520, dist));
  const drift = u.windDir.mul(u.time);
  const n1 = texture(normalsTex, xz.mul(0.03).add(drift.mul(0.014))).xy.mul(2).sub(1);
  const n2 = texture(normalsTex, vec2(xz.y, xz.x.negate()).mul(0.075).sub(drift.mul(0.021))).xy.mul(2).sub(1);
  // A fine third layer up close, so the surface breaks the sky into small glints, not big blotches.
  const fine = float(1).sub(smoothstep(15, 140, dist));
  const n3 = texture(normalsTex, xz.mul(0.19).add(drift.mul(0.05))).xy.mul(2).sub(1);
  const chop = float(0.3).add(u.wind.mul(0.4)).add(u.rain.mul(0.3)).mul(float(1).sub(iceMask.mul(0.9)));
  const detail = n1.mul(0.8).add(n2.mul(0.7)).add(n3.mul(fine).mul(float(0.45).add(u.rain.mul(0.4)))).mul(chop).mul(near.mul(0.8).add(0.2));

  // The boat's wake.
  const rUV = xz.sub(ripple.centerU).div(SIM_SIZE).add(0.5);
  const inWindow = float(1).sub(smoothstep(0.38, 0.48, max(abs(rUV.x.sub(0.5)), abs(rUV.y.sub(0.5)))));
  const t = ripple.texel;
  const r0 = texture(ripple.texture, rUV).x.mul(inWindow);
  const rdx = texture(ripple.texture, rUV.add(vec2(t, 0))).x.sub(texture(ripple.texture, rUV.sub(vec2(t, 0))).x);
  const rdz = texture(ripple.texture, rUV.add(vec2(0, t))).x.sub(texture(ripple.texture, rUV.sub(vec2(0, t))).x);
  const wakeK = inWindow.mul(1.8);

  const iceFlat = float(1).sub(iceMask.mul(0.85));
  const normal = normalize(
    vec3(
      wave.dx.add(rdx.mul(wakeK)).add(detail.x).mul(iceFlat).negate(),
      1,
      wave.dz.add(rdz.mul(wakeK)).add(detail.y).mul(iceFlat).negate(),
    ),
  );

  const nDotV = max(dot(normal, view), 0);
  const fresnel = float(0.02).add(pow(float(1).sub(nDotV), float(5)).mul(0.98));

  // Refraction and depth: how much water lies between the surface and whatever is behind it.
  const sceneZ = (uv: N) => perspectiveDepthToViewZ(viewportDepthTexture(uv).x, cameraNear, cameraFar);
  const waterZ = positionView.z;
  const thick0 = max(waterZ.sub(sceneZ(screenUV)), 0);
  const bend = normal.xz.mul(0.045).mul(smoothstep(0, 3, thick0)).div(dist.mul(0.012).add(1));
  const refrUV = screenUV.add(bend);
  // Don't refract things that sit in front of the water (the hull above the waterline).
  const valid = step(sceneZ(refrUV), waterZ);
  const uvR = mix(screenUV, refrUV, valid);
  const thick = max(waterZ.sub(sceneZ(uvR)), 0);
  const behind = viewportSharedTexture(uvR).rgb;

  // Light inside the water: sun through the surface plus sky light.
  const sunUp = smoothstep(-0.05, 0.25, u.sunDir.y);
  const light = u.sunColor.mul(u.sunI).mul(sunUp).mul(0.11).add(u.ambient.mul(0.55));
  const turbid = float(1).add(u.rain.mul(0.8)).add(u.waveAmp.sub(0.75).max(0).mul(0.5));
  const absorb = vec3(0.45, 0.15, 0.11).mul(turbid);
  const trans = exp(absorb.mul(thick).negate());
  const deepTint = mix(vec3(0.0, 0.055, 0.075), vec3(0.01, 0.075, 0.07), shallow);
  let body: N = behind.mul(trans).add(deepTint.mul(light).mul(float(1).sub(trans)));

  // Hard2Soft's channel: chalky, hard water at its mouth, clearing to soft blue at the far end.
  {
    const ab = u.chanB.sub(u.chanA);
    const len = ab.length().max(1e-3);
    const along = xz.sub(u.chanA).dot(ab).div(len.mul(len));
    const closest = u.chanA.add(ab.mul(along.clamp(0, 1)));
    const lateral = xz.sub(closest).length();
    const inside = float(1).sub(smoothstep(u.chanW.mul(0.7), u.chanW, lateral)).mul(smoothstep(-0.05, 0.02, along)).mul(float(1).sub(smoothstep(0.98, 1.05, along)));
    const hard = float(1).sub(smoothstep(0.15, 0.85, along));
    const chalk = vec3(0.62, 0.66, 0.62).mul(light).mul(1.6);
    const soft = vec3(0.04, 0.28, 0.6).mul(light).mul(1.4);
    body = mix(body, mix(soft, chalk, hard), inside.mul(0.78));
  }

  // Reflection: the real scene mirrored on the full tier, the sky's environment elsewhere.
  const refl = reflect(view.negate(), normal);
  const reflDir = vec3(refl.x, max(refl.y, 0.01), refl.z);
  // Slightly rough, more so with distance: many small waves average a cloud into a soft streak.
  let reflection: N = pmremTexture(envTexture, reflDir, float(0.1).add(smoothstep(20, 400, dist).mul(0.14))).rgb;
  let mirror: ReturnType<typeof reflector> | null = null;
  const mirrorMix = uniform(0.92);
  if (tier === 3) {
    mirror = reflector({ resolutionScale: 0.5, bounces: false });
    mirror.target.rotateX(-Math.PI / 2);
    // The mirror renders the big shapes only (layer 0); detail stays out of reflections.
    (mirror.reflector as unknown as { getVirtualCamera(c: THREE.Camera): THREE.Camera }).getVirtualCamera(camera).layers.set(0);
    scene.add(mirror.target);
    mirror.uvNode = mirror.uvNode!.add(normal.xz.mul(0.07).div(dist.mul(0.008).add(1)));
    // The mirror holds only real objects over a clear (alpha 0) background, so the sky between
    // them stays the environment's. Filtered edges are premultiplied, hence add, not mix.
    reflection = reflection.mul(float(1).sub(mirror.a.mul(mirrorMix))).add(mirror.rgb.mul(mirrorMix));
  }
  let color: N = mix(body, reflection, fresnel.mul(0.96));

  // Sun glitter: a tight HDR glint (bloom picks it up) over a broader sheen.
  const half = normalize(view.add(u.sunDir));
  const nh = max(dot(normal, half), 0);
  const glint = pow(nh, float(1400)).mul(60).add(pow(nh, float(160)).mul(0.9));
  color = color.add(u.sunColor.mul(u.sunI).mul(glint).mul(sunUp).mul(float(1).sub(u.cloud.mul(0.85))).mul(0.25));

  // Light glowing through thin wave crests when you look toward the sun.
  const crest = smoothstep(0.05, 0.6, wave.h.div(amp.max(0.25)));
  const backlit = pow(max(dot(view.negate(), u.sunDir).mul(0.5).add(0.5), 0), float(3));
  color = color.add(vec3(0.05, 0.38, 0.33).mul(u.sunColor).mul(u.sunI).mul(0.16).mul(crest).mul(backlit).mul(float(1).sub(fresnel)).mul(sunUp));

  // Foam: where water meets anything (shores, piers, the hull), the wake, and storm crests.
  const foamA = texture(foamTex, xz.mul(0.22).add(drift.mul(0.02))).r;
  const foamB = texture(foamTex, xz.mul(0.47).sub(drift.mul(0.03))).r;
  const lace = foamA.mul(0.65).add(foamB.mul(0.5));
  const wash = sin(m.g.mul(9).sub(u.time.mul(1.4)).add(mx_noise_float(vec3(xz.mul(0.08), u.time.mul(0.1))).mul(3))).mul(0.5).add(0.5);
  const contact = float(1).sub(smoothstep(0.0, 0.85, thick));
  const shoreFoam = max(contact, m.g.mul(wash).mul(0.85));
  const wakeFoam = smoothstep(0.04, 0.26, abs(r0).mul(wakeK));
  const crestFoam = smoothstep(0.5, 0.95, wave.h.div(amp.max(0.3))).mul(smoothstep(1.25, 2.2, u.waveAmp));
  const foamAmount = max(max(shoreFoam, wakeFoam), crestFoam).mul(smoothstep(0.2, 0.75, lace.add(max(shoreFoam, wakeFoam).mul(0.35))));
  const foamLight = light.mul(1.5).add(u.sunColor.mul(u.sunI).mul(sunUp).mul(0.1));
  color = mix(color, vec3(0.92, 0.95, 0.97).mul(foamLight), foamAmount.clamp(0, 1).mul(near.mul(0.6).add(0.4)));

  // At night the wake and the surf glow brand teal, like bioluminescence.
  const glow = wakeFoam.mul(foamAmount.mul(0.6).add(0.4)).add(shoreFoam.mul(foamAmount).mul(0.25)).clamp(0, 1);
  color = color.add(u.teal.mul(glow).mul(u.night).mul(0.5));

  // Ice: thin, cracked plates near the shore in winter, breaking up into floes and open water
  // further out, glassy enough to carry a little of the sky.
  const floeA = texture(foamTex, xz.mul(0.018)).r;
  const floeB = texture(foamTex, xz.mul(0.041).add(0.37)).r;
  const floes = smoothstep(0.42, 0.5, floeA.mul(0.6).add(floeB.mul(0.4)).add(iceMask.sub(0.55).mul(0.9)));
  const iceCover = smoothstep(0.2, 0.5, iceMask).mul(floes);
  const cracks = float(1).sub(smoothstep(0.0, 0.05, abs(texture(foamTex, xz.mul(0.05)).r.sub(0.5))));
  const iceColor = mix(vec3(0.72, 0.82, 0.88), vec3(0.42, 0.55, 0.62), cracks.mul(0.6).add(float(1).sub(floeA).mul(0.25))).mul(light.mul(2.6).add(0.05));
  color = mix(color, iceColor.add(reflection.mul(0.25)), iceCover.mul(0.94));

  // Lightning lifts it.
  color = color.add(vec3(0.4, 0.45, 0.6).mul(u.flash).mul(0.5));

  material.colorNode = color;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.layers.set(LAYER_VIEW);
  mesh.renderOrder = 2;
  scene.add(mesh);

  const snap = 8;
  return {
    mesh,
    /** Keep the grid centred under the camera's focus (snapped, so the surface never swims). */
    follow(x: number, z: number) {
      const sx = Math.round(x / snap) * snap;
      const sz = Math.round(z / snap) * snap;
      mesh.position.set(sx, 0, sz);
      origin.value.set(sx, 0, sz);
    },
    /** Switch the mirrored scene off (auto quality): the sea falls back to the sky's reflection. */
    setMirror(on: boolean) {
      if (!mirror) return;
      mirrorMix.value = on ? 0.92 : 0;
      mirror.reflector.updateBeforeType = on ? NodeUpdateType.FRAME : NodeUpdateType.NONE;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      normalsTex.dispose();
      foamTex.dispose();
      if (mirror) {
        mirror.target.removeFromParent();
        mirror.dispose();
      }
    },
  };
}
