import * as THREE from "three";

// The space the flight falls through, kept sparse on purpose: one draw call of stars along the whole
// path (they stream past as the camera descends, which is most of the feeling of speed), two faint
// nebula sheets that travel with the camera and change colour with depth, and a soft glow behind
// each plane in its client's colour. No post-processing, nothing full-screen per pixel but the
// nebula's single texture lookup.

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aTint;
uniform float uTime;
uniform float uScale;
uniform float uMaxSize;
varying vec3 vTint;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = -mv.z;
  gl_PointSize = clamp(aSize * uScale / dist, 1.0, uMaxSize);
  // Far stars sink into the void; very near ones fade before they can flash past the lens.
  vAlpha = (1.0 - smoothstep(30.0, 76.0, dist)) * smoothstep(0.8, 3.5, dist);
  vAlpha *= 0.72 + 0.28 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0);
  vTint = aTint;
  gl_Position = projectionMatrix * mv;
}`;

const STAR_FRAG = /* glsl */ `
varying vec3 vTint;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float core = exp(-d * 4.0);
  gl_FragColor = vec4(vTint * core, core * vAlpha);
  #include <colorspace_fragment>
}`;

const NEB_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uOffset;
varying vec2 vUv;
void main() {
  float n = smoothstep(0.08, 0.75, texture2D(uMap, vUv * 0.85 + uOffset).r);
  // Soft at the edges so the sheet never shows its rectangle.
  vec2 e = smoothstep(vec2(0.0), vec2(0.28), vUv) * smoothstep(vec2(0.0), vec2(0.28), 1.0 - vUv);
  // uColor is sRGB and so is the canvas: added as it is, so the haze stays exactly as faint as set.
  gl_FragColor = vec4(uColor * n * uOpacity * e.x * e.y, 1.0);
}`;

const NEB_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** A tileable cloud: a few octaves of blurred random blobs, drawn once on a small canvas. */
function cloudTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.globalCompositeOperation = "lighter";
  for (const [count, radius, alpha] of [
    [10, 0.42, 0.16],
    [26, 0.2, 0.12],
    [60, 0.08, 0.08],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = radius * size * (0.6 + rand() * 0.8);
      // Drawn nine times so the texture wraps without a seam.
      for (const ox of [-size, 0, size])
        for (const oy of [-size, 0, size]) {
          const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          g.addColorStop(0, `rgba(255,255,255,${alpha})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
        }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export type Space = {
  /** Moves the nebula with the camera and grades it by depth; c is the camera's station coordinate. */
  update: (c: number, camera: THREE.PerspectiveCamera, t: number, pixelHeight: number) => void;
  /** A soft light in a client's colour behind one plane. */
  glow: (position: THREE.Vector3, size: number, color: string) => THREE.Mesh;
  setGlow: (glow: THREE.Mesh, strength: number) => void;
  dispose: () => void;
};

/**
 * Stars for a path from z = +20 down to z = -depth, in a hollow tube round the corridor so none of
 * them crosses the planes or the text. `count` is lowered on small and weak devices.
 */
export function createSpace(scene: THREE.Scene, depth: number, count: number): Space {
  const rng = (() => {
    let s = 1337;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  })();

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const tints = new Float32Array(count * 3);
  const warm = new THREE.Color("#ffe3c8");
  const cool = new THREE.Color("#cdd8ff");
  const paper = new THREE.Color("#f2f1ee");
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    // More stars toward the outside, a few close enough to stream past quickly.
    const r = 3.2 + Math.pow(rng(), 0.85) * 17;
    positions[i * 3] = Math.cos(a) * r * 1.5;
    positions[i * 3 + 1] = Math.sin(a) * r;
    positions[i * 3 + 2] = 20 - rng() * (depth + 40);
    sizes[i] = 0.9 + Math.pow(rng(), 3) * 3.4;
    phases[i] = rng();
    const pick = rng();
    c.copy(paper).lerp(pick < 0.2 ? warm : pick < 0.4 ? cool : paper, 0.8);
    tints[i * 3] = c.r;
    tints[i * 3 + 1] = c.g;
    tints[i * 3 + 2] = c.b;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  starGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  starGeometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 3));
  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: { uTime: { value: 0 }, uScale: { value: 300 }, uMaxSize: { value: 4 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = -2;
  scene.add(stars);

  // Two sheets far ahead of the camera, carried with it: the light at the bottom of the well.
  const cloud = cloudTexture();
  const sheetGeometry = new THREE.PlaneGeometry(1, 1);
  const sheets = [0, 1].map((i) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: NEB_VERT,
      fragmentShader: NEB_FRAG,
      uniforms: {
        uMap: { value: cloud },
        uColor: { value: new THREE.Color() },
        uOpacity: { value: 0 },
        uOffset: { value: new THREE.Vector2(i * 0.37, i * 0.61) },
      },
      // Behind everything else in the scene, so the planes cover it.
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const mesh = new THREE.Mesh(sheetGeometry, material);
    mesh.renderOrder = -3;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  });

  // Depth grades: the void at the top, a cold haze through the corridor, the brand's red far down.
  // In sRGB, added straight to the canvas: the brightest wisp adds about 6% light over the void, so
  // the words in front never lose contrast.
  const srgb = (hex: string) => {
    const c = new THREE.Color(hex);
    const out = { r: 0, g: 0, b: 0 };
    c.getRGB(out, THREE.SRGBColorSpace);
    return new THREE.Color(out.r, out.g, out.b);
  };
  const GRADES = [
    { at: 0, color: srgb("#6b7484"), opacity: 0.05 },
    { at: 3, color: srgb("#4f6a9c"), opacity: 0.08 },
    { at: 6, color: srgb("#8a3040"), opacity: 0.08 },
    { at: 10, color: srgb("#b02a32"), opacity: 0.09 },
  ];
  const graded = new THREE.Color();
  const forward = new THREE.Vector3();

  const glowTexture = (() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,255,255,0.28)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  })();
  const glows: THREE.Mesh[] = [];

  return {
    update(cs, camera, t, pixelHeight) {
      starMaterial.uniforms.uTime.value = t;
      // Point size in device pixels at 1 unit away, so stars keep their size at any resolution.
      starMaterial.uniforms.uScale.value = pixelHeight * 0.032;
      starMaterial.uniforms.uMaxSize.value = Math.max(2.5, pixelHeight / 240);

      let k = 0;
      while (k < GRADES.length - 2 && cs > GRADES[k + 1].at) k++;
      const g0 = GRADES[k];
      const g1 = GRADES[k + 1];
      const u = THREE.MathUtils.clamp((cs - g0.at) / (g1.at - g0.at), 0, 1);
      graded.copy(g0.color).lerp(g1.color, u);
      const opacity = THREE.MathUtils.lerp(g0.opacity, g1.opacity, u);
      camera.getWorldDirection(forward);
      sheets.forEach((sheet, i) => {
        const dist = 48 + i * 10;
        const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.6;
        sheet.position.copy(camera.position).addScaledVector(forward, dist);
        // Far away, so it drifts only a little across the screen as you descend.
        sheet.position.x += Math.sin(cs * 0.31 + i * 2) * h * 0.08;
        sheet.position.y += Math.cos(cs * 0.23 + i) * h * 0.06 - h * 0.12;
        sheet.quaternion.copy(camera.quaternion);
        sheet.rotateZ(i * 1.9 + cs * 0.015);
        sheet.scale.set(h * camera.aspect * 1.1, h, 1);
        const m = sheet.material as THREE.ShaderMaterial;
        (m.uniforms.uColor.value as THREE.Color).copy(graded);
        m.uniforms.uOpacity.value = opacity * (i ? 0.7 : 1);
        (m.uniforms.uOffset.value as THREE.Vector2).set(i * 0.37 + cs * 0.012, i * 0.61 - cs * 0.02);
      });
    },
    glow(position, size, color) {
      const mesh = new THREE.Mesh(
        sheetGeometry,
        new THREE.MeshBasicMaterial({
          map: glowTexture,
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
          fog: false,
        }),
      );
      mesh.position.copy(position);
      mesh.scale.setScalar(size);
      mesh.renderOrder = -1;
      scene.add(mesh);
      glows.push(mesh);
      return mesh;
    },
    setGlow(glow, strength) {
      (glow.material as THREE.MeshBasicMaterial).opacity = strength;
      glow.visible = strength > 0.002;
    },
    dispose() {
      starGeometry.dispose();
      starMaterial.dispose();
      for (const sheet of sheets) (sheet.material as THREE.Material).dispose();
      sheetGeometry.dispose();
      cloud.dispose();
      for (const glow of glows) (glow.material as THREE.Material).dispose();
      glowTexture.dispose();
    },
  };
}
