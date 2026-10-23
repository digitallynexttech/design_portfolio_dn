import * as THREE from "three";
import type { LoadKey, LoadReport } from "./loader-bus";

// Earth's limb behind the hero, ray-traced: one full-screen triangle, and every pixel intersects a
// sphere placed in the camera's own space. The limb is exact at any size (a sphere mesh this big
// shows facets at its edge), there is no overdraw, and the planet stays put while the camera falls
// past everything else. NASA's Blue Marble (day), Black Marble (city lights) and cloud maps, public
// domain; a Fresnel rim and a halo for the atmosphere; a soft glint on the oceans. As the descent
// begins it sinks out of the frame and fades.

const VERT = /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  // on the far plane: anything nearer (the planes, the gates) wins the depth test
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

const FRAG = /* glsl */ `
uniform mat4 uInvProj;
uniform vec3 uCenter;
uniform float uRadius;
uniform vec3 uSun;
uniform mat3 uSpin;
uniform sampler2D uDay;
uniform sampler2D uExtra;
uniform float uFade;
varying vec2 vNdc;

void main() {
  vec4 p = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 rd = normalize(p.xyz / p.w);
  vec3 oc = -uCenter;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uRadius * uRadius;
  float h = b * b - c;
  // how far the ray passes from the centre, for the halo beyond the limb
  float miss = length(oc - rd * b) - uRadius;
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  if (h > 0.0) {
    float t = -b - sqrt(h);
    vec3 pos = rd * t;
    vec3 n = normalize(pos - uCenter);
    vec3 nl = uSpin * n;
    // Longitude runs east, counter-clockwise seen from the north pole (+y), or the map is mirrored.
    vec2 uv = vec2(atan(-nl.z, nl.x) * 0.15915494 + 0.5, asin(clamp(nl.y, -1.0, 1.0)) * 0.31830989 + 0.5);
    vec3 day = texture2D(uDay, uv).rgb;
    vec3 ex = texture2D(uExtra, uv).rgb;
    float cloud = smoothstep(0.08, 0.85, ex.r);
    float ndl = dot(n, uSun);
    float lit = smoothstep(-0.1, 0.35, ndl);
    vec3 surf = mix(day, vec3(0.92, 0.94, 0.97), cloud);
    vec3 dayCol = surf * (max(ndl, 0.0) * 1.35 + 0.015);
    vec3 nightCol = vec3(1.0, 0.7, 0.38) * pow(ex.g, 2.0) * 0.55 * (1.0 - cloud);
    col = mix(nightCol, dayCol, lit);
    // sun glint on open water (the darkest, bluest texels)
    float ocean = smoothstep(0.16, 0.06, max(day.r, day.g)) * (1.0 - cloud);
    vec3 hv = normalize(uSun - rd);
    col += vec3(1.0, 0.86, 0.66) * pow(max(dot(n, hv), 0.0), 70.0) * ocean * 0.9 * lit;
    // atmosphere seen through, thicker toward the limb
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    vec3 sky = mix(vec3(0.9, 0.42, 0.14), vec3(0.28, 0.6, 1.0), smoothstep(-0.15, 0.3, ndl));
    col = mix(col, sky * (0.15 + 0.85 * smoothstep(-0.3, 0.2, ndl)), fres * 0.75);
    alpha = 1.0;
  }
  // the halo beyond the limb: a thin bright band falling off into space, lit where the sun is
  float band = exp(-max(miss, 0.0) / (uRadius * 0.016)) * step(0.0, miss);
  // the point on the ray nearest the centre: the halo is brightest on the side facing the sun
  float sunSide = smoothstep(-0.4, 0.4, dot(normalize(oc - rd * b), uSun));
  vec3 halo = vec3(0.3, 0.62, 1.0) * band * (0.25 + 0.75 * sunSide);
  col += halo;
  alpha = max(alpha, band);
  gl_FragColor = vec4(col, alpha * uFade);
  #include <colorspace_fragment>
}`;

export type Earth = {
  /** c: the camera's station coordinate (the planet sinks away as it grows); aspect: the canvas's. */
  update: (c: number, camera: THREE.PerspectiveCamera, t: number) => void;
  dispose: () => void;
};

/**
 * A texture fetched as a stream, so its bytes can be counted as they arrive (an <img> can't report
 * them), then decoded off the main thread. Flipped in the decode: WebGL can't flip an ImageBitmap.
 */
async function loadTexture(url: string, key: LoadKey, report?: LoadReport): Promise<THREE.Texture> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  let blob: Blob;
  if (res.body && report) {
    const reader = res.body.getReader();
    const parts: Uint8Array<ArrayBuffer>[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      loaded += value.byteLength;
      report.bytes(key, loaded, total);
    }
    blob = new Blob(parts, { type: res.headers.get("content-type") ?? "image/webp" });
  } else blob = await res.blob();
  report?.got(key);
  const bitmap = await createImageBitmap(blob, { imageOrientation: "flipY" });
  const texture = new THREE.Texture(bitmap as unknown as HTMLImageElement);
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

export async function createEarth(scene: THREE.Scene, small: boolean, report?: LoadReport): Promise<Earth> {
  const [day, extra] = await Promise.all([
    loadTexture(small ? "/space/earth-day-2k.webp" : "/space/earth-day-4k.webp", "earth-day", report),
    loadTexture("/space/earth-extra-2k.webp", "earth-extra", report),
  ]);
  day.colorSpace = THREE.SRGBColorSpace;
  for (const tex of [day, extra]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 8;
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uInvProj: { value: new THREE.Matrix4() },
      uCenter: { value: new THREE.Vector3() },
      uRadius: { value: 0.766 },
      uSun: { value: new THREE.Vector3(0.82, 0.3, -0.48).normalize() },
      uSpin: { value: new THREE.Matrix3() },
      uDay: { value: day },
      uExtra: { value: extra },
      uFade: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthFunc: THREE.LessEqualDepth,
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  // after the nebula and the stars (so it covers them), before the planes' transparent bits
  mesh.renderOrder = -1;
  scene.add(mesh);

  const spin = new THREE.Matrix4();
  const tilt = new THREE.Matrix4().makeRotationZ(0.36);
  const look = new THREE.Matrix4().makeRotationY(-1.15);
  return {
    update(c, camera, t) {
      const u = material.uniforms;
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      // Landscape: the centre 12 deg left and 46 deg below the view, so the limb arcs right across
      // the lower half. Portrait screens look up at it less. Falling sinks it.
      const portrait = camera.aspect < 1;
      const yaw = -0.21;
      const el = (portrait ? -0.62 : -0.8) - Math.min(c, 2) * 0.55;
      const D = 1;
      u.uCenter.value.set(Math.sin(yaw) * Math.cos(el) * D, Math.sin(el) * D, -Math.cos(yaw) * Math.cos(el) * D);
      u.uFade.value = 1 - THREE.MathUtils.smoothstep(c, 0.45, 1.15);
      mesh.visible = u.uFade.value > 0.002;
      // a slow turn of the globe under the clouds (the camera's own turn is ignored: it's that far away)
      spin.makeRotationY(t * 0.004).premultiply(look).premultiply(tilt);
      u.uSpin.value.setFromMatrix4(spin).transpose();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      day.dispose();
      extra.dispose();
    },
  };
}
