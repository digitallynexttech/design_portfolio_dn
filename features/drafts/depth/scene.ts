import * as THREE from "three";
import { FIGURE_H, HELMET, loadAstronaut, type Astronaut } from "./astronaut";
import { createEarth, type Earth } from "./earth";
import type { LoadReport } from "./loader-bus";
import { createSpace, type Space } from "./space";
import { createXHop, type XHop } from "./x-hop";
import { STATION_DEPTH as D, type DepthPlane } from "./types";

// The flight's scene: one camera falling down -z through space. Each station's plane hangs at DIST
// in front of the camera's resting point; where it hangs on screen comes from the overlay's own box
// (CSS), so the HTML and the WebGL line up at every viewport size. The astronaut falls with the
// camera, a few metres ahead of it: where it floats on screen at each station also comes from CSS
// (the overlays' [data-astro] slots), and it is drawn in a second pass over a cleared depth buffer,
// so a plane sweeping past can never cut through it. After the flight it drops far ahead, small and
// hazy behind the page, and comes forward again at the contact gate. Lazy-loaded with three after
// the visitor engages; nothing here renders text.

/** A plane's distance from its station's resting camera. */
const DIST = 6;
/** The astronaut's distance ahead of the camera: beside the planes, and far ahead in the deep. */
const NEAR = 4.4;
const FAR = 17;
/** Fog and focus ranges, in view depth: the current plane is crisp, the next one a grey silhouette. */
const RANGE = new THREE.Vector4(8, 23.5, 7.5, 17);
const VOID = new THREE.Color("#070708");
const RED = "#e21f26";
/** Toward the sun: from the right, a little behind and above (as in the hero still). */
const SUN = new THREE.Vector3(1, 0.32, -0.45).normalize();
/** The visor's own world: desert, sun and the suit, captured from inside the helmet in Blender. */
const VISOR_PROBE = "/models/astronaut/visor-probe.exr";
/** Pointer parallax, in world units at full deflection. */
const PAR_X = 0.3;
const PAR_Y = 0.16;
/** How far a hovered plane turns toward the cursor, in radians. */
const TILT = 0.11;
/** Frames, crop marks and gates, in CSS pixels at the plane's distance. */
const FRAME_GAP = 10;
const MARK_GAP = 10;
const MARK_ARM = 18;

export type SceneFrame = {
  /** Camera position, in stations (smoothed), and its velocity in stations per second. */
  c: number;
  vel: number;
  /** Smoothed pointer, -1…1. */
  px: number;
  py: number;
  dt: number;
  /** Seconds since the flight began, for the astronaut's drift. */
  t: number;
  /** The page's scroll, for the contact gate below the flight. */
  scrollY: number;
  /** Raw pointer in normalised device coordinates, and whether it is over the scene itself. */
  mx: number;
  my: number;
  over: boolean;
};

export type DepthScene = {
  /** Draws one frame; true while something is still moving (a fade, a tilt, the video, the astronaut). */
  frame: (s: SceneFrame) => boolean;
  /** Re-reads the canvas size, every overlay box and every astronaut slot. */
  layout: () => void;
  /** What sits under a click or tap: a plane's key, "x" for the astronaut, or null. */
  pick: (mx: number, my: number) => string | null;
  /** Off while the tab is hidden: the reel pauses. */
  setRunning: (on: boolean) => void;
  /** Something is mid-move that wants every frame (the X's jumps). */
  animating: () => boolean;
  /** The X's hello, held while the preloader is up (holdHello), given when it lifts. */
  hello: () => void;
  /** Where the astronaut is on screen (CSS pixels): its box and a sample of its posed vertices, for
   *  the overlap checks in testing. */
  astroRect: () => { x: number; y: number; w: number; h: number; pts: number[]; visor: number[]; mascot: number[] } | null;
  /** Testing: how much of the X is inside the suit as posed now (astronaut.ts probe). */
  probeX: () => { inside: number; total: number; deepest: number } | null;
  dispose: () => void;
};

type Options = {
  canvas: HTMLCanvasElement;
  /** The sticky stage the overlays live in (and the boxes are measured against). */
  stage: HTMLElement;
  /** The fixed layer that holds the canvas: its size is the drawing size. */
  sky: HTMLElement;
  planes: DepthPlane[];
  /** The station coordinate where the flight ends. */
  exit: number;
  box: (key: string) => HTMLElement | null;
  /** The astronaut's slots inside the stage, one per station ([data-astro] = its coordinate). */
  slots: HTMLElement[];
  /** Its slot at the contact gate, in the page after the flight. */
  contact: HTMLElement | null;
  maxDpr: number;
  /** Stars along the whole path. */
  stars: number;
  /** The lighter astronaut and Earth (phones, weak GPUs). */
  small: boolean;
  /** Shadow maps (the X on the shoulder, the arm across the chest): desktop only. */
  shadows: boolean;
  /** Tooling: Earth and space alone, no astronaut or gates (the hero stills' sky is captured from it). */
  skyOnly?: boolean;
  /** Tooling: the astronaut alone on a transparent canvas (the contact gate's still is captured from it). */
  astroOnly?: boolean;
  /** The X's last jumps (x-hop.ts): where it stands on "Join the studio", the footer's sign-off and
   *  its X, and what to tell the page when the X has become that letter. */
  xPerch?: HTMLElement | null;
  xMark?: HTMLElement | null;
  xSlot?: Element | null;
  onXHome?: (on: boolean) => void;
  /** The preloader is up: the X keeps its hello (and every other wave) until hello() is called. */
  holdHello?: boolean;
  /** Where downloads and build steps are reported, for the preloader (loader-bus.ts). */
  progress?: LoadReport;
  onHover: (key: string | null) => void;
  /** A plane's texture is up: its HTML poster can go. */
  onReady: (key: string) => void;
  onAstroReady: () => void;
  onLost: () => void;
  /** Asks the journey for another frame (a texture arrived). */
  invalidate: () => void;
};

const VERT = /* glsl */ `
uniform float uBend;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  // Speed bends the sheet: the middle falls back, the edges lead.
  p.z -= sin(uv.x * 3.14159265) * uBend;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uReady;
uniform float uHover;
uniform vec3 uVoid;
uniform vec4 uRange;
varying vec2 vUv;
varying float vDepth;
void main() {
  vec3 c = mix(uVoid, texture2D(uMap, vUv).rgb, uReady);
  // Focus by distance: far planes are grey and dim, the one you reach is in full colour.
  float focus = 1.0 - smoothstep(uRange.z, uRange.w, vDepth);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 0.18 + 0.82 * focus);
  c *= (0.45 + 0.55 * focus) * (1.0 + 0.07 * uHover);
  // Far planes fade out rather than darken: over Earth a fogged plane would be a black box.
  gl_FragColor = vec4(c, 1.0 - smoothstep(uRange.x, uRange.y, vDepth));
  #include <colorspace_fragment>
}`;

type Plane = {
  spec: DepthPlane;
  holder: THREE.Group;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  frame: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  marks: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  glow: THREE.Mesh | null;
  rotY: number;
  tilt: THREE.Vector2;
  tiltTo: THREE.Vector2;
  hover: number;
  ready: number;
  state: "idle" | "loading" | "loaded";
  texture?: THREE.Texture;
};

/** One of the astronaut's places: screen position (NDC), height (share of the screen), distance. */
/**
 * One of the astronaut's places: screen position (NDC) of its anchor, height (share of the screen,
 * as the whole figure), distance; how it turns (yaw, pitch, roll, radians); how much of the hero
 * pose it holds; the X's extra turn; and the anchor's offset from the figure's centre (model units:
 * zero for a whole-figure slot, the helmet for the hero's).
 */
type Key = {
  at: number;
  x: number;
  y: number;
  h: number;
  dist: number;
  face: number;
  roll: number;
  lookY: number;
  yaw: number;
  pitch: number;
  hero: number;
  xYaw: number;
  ox: number;
  oy: number;
  oz: number;
};
type Accent = { at: number; color: THREE.Color };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const smoothstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));
const DEG = Math.PI / 180;

/** Catmull-Rom through four values, at t in 0…1 between b and c. */
function cr(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
}

/** An element's box relative to an ancestor, ignoring transforms (offsets only). */
function restRect(el: HTMLElement, stop: HTMLElement | null) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== stop) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function cssNumber(style: CSSStyleDeclaration, name: string, fallback: number) {
  const v = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

export async function createScene(o: Options): Promise<DepthScene> {
  const renderer = new THREE.WebGLRenderer({
    canvas: o.canvas,
    antialias: true,
    alpha: Boolean(o.astroOnly),
    powerPreference: "high-performance",
  });
  renderer.setClearColor(VOID, o.astroOnly ? 0 : 1);
  // Neutral tone mapping keeps the brand red red and the suit white; the planes and lines opt out.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.autoClear = false;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = o.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(VOID, RANGE.x, RANGE.y);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  const look = new THREE.Vector3();

  const blank = new THREE.DataTexture(new Uint8Array([7, 7, 8, 255]), 1, 1);
  blank.needsUpdate = true;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let disposed = false;
  let running = true;
  let W = 1;
  let H = 1;
  let tanHalf = Math.tan(THREE.MathUtils.degToRad(18));
  /** As high as a whole figure's top may reach, in NDC and in CSS px (--astro-clear-top, read on layout). */
  let clearTop = 1;
  let clearPx = 0;
  let bend = 0;

  // ---------- Space ----------
  const space: Space = createSpace(scene, (o.exit + 16) * D, o.stars);

  // ---------- Planes ----------
  const planeGeometry = new THREE.PlaneGeometry(1, 1, 32, 1);
  const planes: Plane[] = o.planes.map((spec) => {
    const holder = new THREE.Group();
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: blank },
        uReady: { value: 0 },
        uHover: { value: 0 },
        uBend: { value: 0 },
        uVoid: { value: VOID },
        uRange: { value: RANGE },
      },
      transparent: true,
    });
    const mesh = new THREE.Mesh(planeGeometry, material);
    mesh.userData.key = spec.key;
    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: spec.accent, transparent: true, opacity: 0.6, toneMapped: false }),
    );
    const marks = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xf2f1ee, transparent: true, opacity: 0.3, toneMapped: false }),
    );
    holder.add(mesh, frame, marks);
    scene.add(holder);
    // Each client's light, low behind its plane: it rises as the camera arrives.
    const glow = spec.kind === "work" ? space.glow(new THREE.Vector3(), 1, spec.accent) : null;
    // Planes hang on the walls of the corridor, turned slightly toward its middle.
    return {
      spec,
      holder,
      mesh,
      frame,
      marks,
      glow,
      rotY: spec.side * -0.15,
      tilt: new THREE.Vector2(),
      tiltTo: new THREE.Vector2(),
      hover: 0,
      ready: 0,
      state: "idle",
    };
  });

  // ---------- Gates: corner brackets between stations, so passing through space reads as motion ----------
  const gateMaterial = new THREE.LineBasicMaterial({ color: 0xf2f1ee, transparent: true, opacity: 0.2, toneMapped: false });
  const gateGeometry = new THREE.BufferGeometry();
  {
    const a = 0.09;
    const pts: number[] = [];
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        pts.push(sx, sy, 0, sx - sx * a, sy, 0);
        pts.push(sx, sy, 0, sx, sy - sy * a * 1.6, 0);
      }
    gateGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }
  const gates: THREE.LineSegments[] = [];
  for (let k = 0; k < o.exit; k++) {
    const gate = new THREE.LineSegments(gateGeometry, gateMaterial);
    gate.position.z = -(k + 0.5) * D;
    scene.add(gate);
    gates.push(gate);
  }

  // ---------- The reel's video, attached only near its station ----------
  const reel = planes.find((p) => p.spec.kind === "reel");
  let video: HTMLVideoElement | null = null;
  let videoTexture: THREE.VideoTexture | null = null;
  let videoPlaying = false;
  const ensureVideo = (src: string) => {
    if (video) return video;
    const v = document.createElement("video");
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.setAttribute("aria-hidden", "true");
    v.setAttribute("tabindex", "-1");
    v.className = "dp-video";
    v.src = src;
    v.addEventListener("playing", () => {
      videoPlaying = true;
      if (!videoTexture && reel) {
        videoTexture = new THREE.VideoTexture(v);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        reel.mesh.material.uniforms.uMap.value = videoTexture;
        reel.state = "loaded";
        o.onReady(reel.spec.key);
      }
      o.invalidate();
    });
    v.addEventListener("pause", () => {
      videoPlaying = false;
    });
    o.stage.appendChild(v);
    video = v;
    return v;
  };

  // ---------- Textures, by distance ----------
  const load = (p: Plane) => {
    p.state = "loading";
    const done = (texture: THREE.Texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = aniso;
      p.texture = texture;
      // The video may have taken the reel's plane already.
      if (p.mesh.material.uniforms.uMap.value === blank) p.mesh.material.uniforms.uMap.value = texture;
      p.state = "loaded";
      renderer.initTexture(texture);
      o.onReady(p.spec.key);
      o.invalidate();
    };
    const fallback = () => {
      new THREE.TextureLoader().load(p.spec.src, done, undefined, () => {
        p.state = "idle";
      });
    };
    if (typeof createImageBitmap !== "function") return fallback();
    // Decoded off the main thread.
    new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }).load(
      p.spec.src,
      (bitmap) => {
        const texture = new THREE.Texture(bitmap as unknown as HTMLImageElement);
        texture.flipY = false;
        texture.needsUpdate = true;
        done(texture);
      },
      undefined,
      fallback,
    );
  };

  // ---------- The astronaut: its own scene, lit for itself, drawn last ----------
  const charScene = new THREE.Scene();
  // Far ahead in the deep it sinks into the haze, so the page's text always reads over it.
  charScene.fog = new THREE.Fog(VOID, 7, 22);
  const rig = new THREE.Group();
  charScene.add(rig);
  // The sun: warm, from the right and a little behind. On desktop it casts the X's shadow onto the
  // shoulder and the arm's onto the chest; its frustum follows the astronaut's size (frame()).
  const keyLight = new THREE.DirectionalLight(0xffdcb0, 4.6);
  keyLight.castShadow = o.shadows;
  if (o.shadows) {
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0004;
  }
  // a cool fill from the front left, a cool rim from behind, and the station's colour from below
  const fillLight = new THREE.DirectionalLight(0xdfe6f5, 1.0);
  fillLight.position.set(-2.4, 0.6, 2.6);
  const rimLight = new THREE.DirectionalLight(0xafc6ff, 1.5);
  rimLight.position.set(-1.8, 2.2, -2.6);
  const accentLight = new THREE.DirectionalLight(RED, 0.55);
  accentLight.position.set(2.8, -1.4, 1.2);
  for (const light of [keyLight, fillLight, rimLight, accentLight]) {
    light.target = rig;
    rig.add(light);
  }
  // Earth's blue from below, black space above
  charScene.add(new THREE.HemisphereLight(0x161a24, 0x3a5784, 0.75));

  // The X off the shoulder (x-hop.ts) has a stage of its own, drawn after the astronaut. It takes off
  // in the astronaut's light (the same lights, from the same directions) and lands, on the button and
  // in the footer, in a warm light from the front, so its red and its shoes read: the astronaut's sun
  // comes from behind, and an X facing you would stand in shadow.
  const xScene = new THREE.Scene();
  const xSuit = [
    { light: new THREE.DirectionalLight(0xffdcb0, 4.6), dir: SUN, k: 4.6 },
    { light: new THREE.DirectionalLight(0xdfe6f5, 1.0), dir: fillLight.position, k: 1.0 },
    { light: new THREE.DirectionalLight(0xafc6ff, 1.5), dir: rimLight.position, k: 1.5 },
    { light: new THREE.DirectionalLight(RED, 0.55), dir: accentLight.position, k: 0.55 },
  ];
  const xStage = [
    { light: new THREE.DirectionalLight(0xfff0e4, 3.4), dir: new THREE.Vector3(-1.4, 1.8, 3), k: 3.4 },
    { light: new THREE.DirectionalLight(0xdfe6f5, 1.1), dir: new THREE.Vector3(2.4, 0.4, 2.2), k: 1.1 },
    { light: new THREE.DirectionalLight(0xffb8a8, 1.4), dir: new THREE.Vector3(0.8, 1.6, -3), k: 1.4 },
  ];
  for (const { light, dir } of [...xSuit, ...xStage]) {
    light.position.copy(dir).normalize().multiplyScalar(5);
    xScene.add(light);
  }
  const xHemi = new THREE.HemisphereLight(0x161a24, 0x3a5784, 0.75);
  xScene.add(xHemi);

  let astro: Astronaut | null = null;
  let astroVisible = false;
  let xhop: XHop | null = null;
  let earth: Earth | null = null;
  const envs: THREE.Texture[] = [];

  /** The suit's world: black space, Earth's blue glow from below, a hot sun. */
  const spaceEnv = (pmrem: THREE.PMREMGenerator) => {
    const envScene = new THREE.Scene();
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uSun: { value: SUN.clone() } },
      vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uSun;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float below = smoothstep(0.05, -0.65, d.y);
          vec3 c = mix(vec3(0.004, 0.005, 0.008), vec3(0.07, 0.12, 0.22), below);
          float s = max(dot(d, uSun), 0.0);
          c += vec3(1.0, 0.85, 0.64) * (pow(s, 1200.0) * 80.0 + pow(s, 8.0) * 0.12);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), material);
    envScene.add(sphere);
    const tex = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
    sphere.geometry.dispose();
    material.dispose();
    return tex;
  };

  const loadAstro = async () => {
    const { EXRLoader } = await import("three/examples/jsm/loaders/EXRLoader.js");
    const probe = await new EXRLoader()
      .loadAsync(VISOR_PROBE, (e) => o.progress?.bytes("visor", e.loaded, e.total))
      .catch(() => null);
    o.progress?.got("visor");
    if (disposed) return probe?.dispose();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let visorEnv: THREE.Texture | null = null;
    if (probe) {
      probe.mapping = THREE.EquirectangularReflectionMapping;
      visorEnv = pmrem.fromEquirectangular(probe).texture;
      probe.dispose();
      envs.push(visorEnv);
    }
    const suitEnv = spaceEnv(pmrem);
    envs.push(suitEnv);
    pmrem.dispose();
    const made = await loadAstronaut({ small: o.small, shadows: o.shadows, visorEnv, progress: o.progress });
    if (disposed) return made.dispose();
    charScene.environment = suitEnv;
    xScene.environment = suitEnv;
    charScene.environmentIntensity = 1;
    rig.add(made.root);
    astro = made;
    if (o.xPerch && o.xMark && o.xSlot && !o.astroOnly && !o.skyOnly) {
      xhop = createXHop({
        astro: made,
        world: xScene,
        camera,
        depth: NEAR,
        perch: o.xPerch,
        mark: o.xMark,
        slot: o.xSlot,
        onHome: (on) => o.onXHome?.(on),
      });
      xhop.layout();
    }
    // Compiled before it is shown, so its first frame doesn't stall.
    await renderer.compileAsync(charScene, camera);
    if (disposed) return;
    o.progress?.step("astro");
    o.onAstroReady();
    o.invalidate();
  };
  const loadEarth = async () => {
    const made = await createEarth(scene, o.small, o.progress);
    if (disposed) return made.dispose();
    earth = made;
    o.progress?.step("earth");
    o.invalidate();
  };

  // ---------- Layout: every plane where its overlay's box says, every slot where CSS put it ----------
  let keys: Key[] = [];
  let contact: (Key & { docY: number; px: number }) | null = null;
  // the hero is in plain sunlight; the corridor takes each client's colour; the deep, the brand red
  const accents: Accent[] = [{ at: 0, color: new THREE.Color("#ffe2c4") }];
  for (const p of o.planes) accents.push({ at: p.at, color: new THREE.Color(p.kind === "reel" ? "#c9d4ff" : p.accent) });
  accents.push({ at: o.exit, color: new THREE.Color(RED) });

  const layout = () => {
    const w = o.sky.clientWidth;
    const h = o.sky.clientHeight;
    if (!w || !h) return;
    W = w;
    H = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.maxDpr));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // Portrait screens get a wider lens, so a plane still fills the width at the same distance.
    camera.fov = camera.aspect >= 1 ? 36 : 50;
    camera.updateProjectionMatrix();
    tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // Portrait screens set text over the next plane's silhouette, so the fog closes sooner there.
    RANGE.y = camera.aspect >= 1 ? 23.5 : 20.5;
    if (scene.fog instanceof THREE.Fog) scene.fog.far = RANGE.y;

    const hh = DIST * tanHalf;
    const hw = hh * camera.aspect;
    const unit = (2 * hh) / H;
    for (const p of planes) {
      const el = o.box(p.spec.key);
      if (!el) continue;
      const r = restRect(el, o.stage);
      if (!r.w || !r.h) continue;
      // The box's edges as tangents from the camera. A turned plane has one edge nearer than the
      // other, so solve for the width and centre whose projected edges land exactly on the box.
      const ta = (((r.x / W) * 2 - 1) * hw) / DIST;
      const tb = ((((r.x + r.w) / W) * 2 - 1) * hw) / DIST;
      const sin = Math.sin(p.rotY);
      const cos = Math.cos(p.rotY);
      const half = ((tb - ta) * DIST) / (2 * cos - (ta + tb) * sin);
      const cx = tb * (DIST + half * sin) - half * cos;
      const cy = 1 - ((r.y + r.h / 2) / H) * 2;
      const pw = half * 2;
      const ph = pw * (r.h / r.w);
      p.holder.position.set(cx, cy * hh, -p.spec.at * D - DIST);
      p.mesh.scale.set(pw, ph, 1);
      if (p.glow) {
        p.glow.position.set(cx * 1.15, cy * hh - ph * 0.1, -p.spec.at * D - DIST - 2.5);
        p.glow.scale.setScalar(pw * 2.6);
      }

      const fx = pw / 2 + FRAME_GAP * unit;
      const fy = ph / 2 + FRAME_GAP * unit;
      p.frame.geometry.setFromPoints([
        new THREE.Vector3(-fx, -fy, 0),
        new THREE.Vector3(fx, -fy, 0),
        new THREE.Vector3(fx, fy, 0),
        new THREE.Vector3(-fx, fy, 0),
      ]);
      const g = MARK_GAP * unit;
      const a = MARK_ARM * unit;
      const pts: THREE.Vector3[] = [];
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          pts.push(new THREE.Vector3(sx * (fx + g), sy * fy, 0), new THREE.Vector3(sx * (fx + g + a), sy * fy, 0));
          pts.push(new THREE.Vector3(sx * fx, sy * (fy + g), 0), new THREE.Vector3(sx * fx, sy * (fy + g + a), 0));
        }
      p.marks.geometry.setFromPoints(pts);
    }
    // Gates sit just outside the frame when you rest between them, and sweep past as you move.
    const gh = (D / 2) * tanHalf * 1.07;
    for (const gate of gates) gate.scale.set(gh * camera.aspect, gh, 1);

    // The astronaut's places. A slot box is as tall as the whole figure, or (data-anchor="helmet")
    // is the helmet itself, and the body hangs below it. --face turns it toward the work (-1 left …
    // 1 right) unless --yaw (deg) says exactly; --pitch and --roll tilt it (deg); --look-y tips its
    // head; --hero (0…1) holds the hero pose; --x-yaw turns the X (deg).
    const next: Key[] = [];
    for (const el of o.slots) {
      const r = restRect(el, o.stage);
      if (!r.w || !r.h) continue;
      const cs = getComputedStyle(el);
      // --anchor-helmet lets a breakpoint switch a helmet slot back to a whole-figure one (phones)
      const helmet = cssNumber(cs, "--anchor-helmet", el.dataset.anchor === "helmet" ? 1 : 0) > 0.5;
      const face = cssNumber(cs, "--face", 0);
      next.push({
        at: Number(el.dataset.astro),
        x: ((r.x + r.w / 2) / W) * 2 - 1,
        y: 1 - ((r.y + r.h / 2) / H) * 2,
        h: helmet ? (r.h / H) * (FIGURE_H / HELMET.d) : r.h / H,
        dist: NEAR,
        face,
        roll: cssNumber(cs, "--roll", 0) * DEG,
        lookY: cssNumber(cs, "--look-y", 0),
        yaw: cssNumber(cs, "--yaw", face * 24) * DEG,
        pitch: cssNumber(cs, "--pitch", 0) * DEG,
        hero: cssNumber(cs, "--hero", 0),
        xYaw: cssNumber(cs, "--x-yaw", 0) * DEG,
        ox: helmet ? HELMET.x : 0,
        oy: helmet ? HELMET.y : 0,
        oz: helmet ? HELMET.z : 0,
      });
    }
    // Past the last plane it falls on ahead: far, small and to the side (--astro-deep-* on the sky).
    const sky = getComputedStyle(o.sky);
    next.push({
      at: o.exit,
      x: cssNumber(sky, "--astro-deep-x", 0.7) * 2 - 1,
      y: 1 - cssNumber(sky, "--astro-deep-y", 0.62) * 2,
      h: cssNumber(sky, "--astro-deep-h", 0.5),
      dist: FAR,
      face: -0.4,
      roll: -14 * DEG,
      lookY: 0.3,
      yaw: -0.4 * 24 * DEG,
      pitch: 0,
      hero: 0,
      xYaw: 0,
      ox: 0,
      oy: 0,
      oz: 0,
    });
    keys = next.sort((a, b) => a.at - b.at);
    clearPx = cssNumber(sky, "--astro-clear-top", 0);
    clearTop = 1 - (2 * clearPx) / H;
    xhop?.layout();

    contact = null;
    if (o.contact) {
      const r = restRect(o.contact, null);
      const cs = getComputedStyle(o.contact);
      const face = cssNumber(cs, "--face", -0.5);
      if (r.w && r.h)
        contact = {
          at: Infinity,
          x: ((r.x + r.w / 2) / W) * 2 - 1,
          y: 0,
          h: r.h / H,
          dist: NEAR,
          face,
          roll: cssNumber(cs, "--roll", 0) * DEG,
          lookY: cssNumber(cs, "--look-y", 0),
          yaw: cssNumber(cs, "--yaw", face * 24) * DEG,
          pitch: cssNumber(cs, "--pitch", 0) * DEG,
          hero: 0,
          xYaw: cssNumber(cs, "--x-yaw", 0) * DEG,
          ox: 0,
          oy: 0,
          oz: 0,
          docY: r.y + r.h / 2,
          px: r.h,
        };
    }
  };

  /** The astronaut's place at camera coordinate c, through the slots (Catmull-Rom, clamped ends). */
  const placeAt = (c: number, out: Key) => {
    const n = keys.length;
    if (!n) return false;
    if (c <= keys[0].at || n === 1) return Object.assign(out, keys[0]), true;
    if (c >= keys[n - 1].at) return Object.assign(out, keys[n - 1]), true;
    let i = 0;
    while (i < n - 2 && c > keys[i + 1].at) i++;
    const k0 = keys[Math.max(0, i - 1)];
    const k1 = keys[i];
    const k2 = keys[i + 1];
    const k3 = keys[Math.min(n - 1, i + 2)];
    const t = clamp01((c - k1.at) / (k2.at - k1.at));
    out.at = c;
    out.x = cr(k0.x, k1.x, k2.x, k3.x, t);
    out.y = cr(k0.y, k1.y, k2.y, k3.y, t);
    // Height and distance never overshoot: eased, not splined.
    const e = smooth(t);
    out.h = k1.h + (k2.h - k1.h) * e;
    out.dist = k1.dist + (k2.dist - k1.dist) * e;
    out.face = cr(k0.face, k1.face, k2.face, k3.face, t);
    out.roll = cr(k0.roll, k1.roll, k2.roll, k3.roll, t);
    out.yaw = cr(k0.yaw, k1.yaw, k2.yaw, k3.yaw, t);
    out.pitch = cr(k0.pitch, k1.pitch, k2.pitch, k3.pitch, t);
    out.lookY = k1.lookY + (k2.lookY - k1.lookY) * e;
    out.hero = k1.hero + (k2.hero - k1.hero) * e;
    out.xYaw = k1.xYaw + (k2.xYaw - k1.xYaw) * e;
    out.ox = k1.ox + (k2.ox - k1.ox) * e;
    out.oy = k1.oy + (k2.oy - k1.oy) * e;
    out.oz = k1.oz + (k2.oz - k1.oz) * e;
    return true;
  };

  // ---------- Picking ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: string | null = null;
  let lastC = 0;
  const targets: THREE.Object3D[] = [];
  const cast = (mx: number, my: number) => {
    ndc.set(mx, my);
    raycaster.setFromCamera(ndc, camera);
    if (astro && astroVisible && lastC < o.exit - 0.3) {
      const hit = raycaster.intersectObject(astro.hit, false)[0];
      if (hit) return hit;
    }
    targets.length = 0;
    for (const p of planes) if (Math.abs(lastC - p.spec.at) < 0.55) targets.push(p.mesh);
    return raycaster.intersectObjects(targets, false)[0];
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    o.onLost();
  };
  o.canvas.addEventListener("webglcontextlost", onLost);

  layout();
  await renderer.compileAsync(scene, camera);
  o.progress?.step("scene");

  // ---------- The astronaut's state, carried between frames ----------
  const place: Key = { at: 0, x: 0, y: 0, h: 0, dist: NEAR, face: 0, roll: 0, lookY: 0, yaw: 0, pitch: 0, hero: 0, xYaw: 0, ox: 0, oy: 0, oz: 0 };
  const accentNow = new THREE.Color();
  const anchorOff = new THREE.Vector3();
  let shadowSize = 0;
  let heroW = 0;
  let fallW = 0.6;
  let settleW = 0;
  let lookX = 0;
  let lookY = 0;
  let lastStation = -1;
  let lastReact = -10;
  let lastT = 0;
  let greeted = false;
  // While the preloader is up the X saves its waves; and the first frame with everyone in it is
  // reported once it is on screen.
  let holding = Boolean(o.holdHello);
  let framed = false;
  let arrived = false;

  const react = (clip: "Wave" | "Jump" | "Spin", t: number, cooldown = 2.5) => {
    if (!astro || holding || t - lastReact < cooldown) return;
    lastReact = t;
    astro.react(clip);
  };

  const frame = (s: SceneFrame): boolean => {
    if (disposed) return false;
    lastC = s.c;
    lastT = s.t;
    let busy = false;
    const k = 1 - Math.exp(-s.dt * 7);

    // Camera: the scroll's depth, plus a little parallax from the pointer.
    const z = -s.c * D;
    camera.position.set(s.px * PAR_X, s.py * PAR_Y, z);
    look.set(s.px * PAR_X * 0.4, s.py * PAR_Y * 0.4, z - 10);
    camera.lookAt(look);
    space.update(s.c, camera, s.t, H * renderer.getPixelRatio());
    earth?.update(s.c, camera, s.t);

    // Hover: the plane under the cursor turns toward it; the X waves at the cursor.
    let hit: THREE.Intersection | undefined;
    if (s.over) hit = cast(s.mx, s.my);
    const hitKey = (hit?.object.userData.key as string | undefined) ?? null;
    if (hitKey !== hovered) {
      hovered = hitKey;
      o.onHover(hovered);
      if (hovered === "x") react("Wave", s.t, 4);
    }

    bend += (THREE.MathUtils.clamp(s.vel * 0.06, -0.32, 0.32) - bend) * k;
    if (Math.abs(bend) > 0.002) busy = true;

    for (const p of planes) {
      const d = s.c - p.spec.at;
      if (p.state === "idle" && d > -1.7 && d < 1.2) load(p);
      // The reel waits out of sight until you start down (in the hero it would sit behind the helmet).
      p.holder.visible = d > (p.spec.kind === "reel" ? -0.75 : -2.4) && d < 0.9;
      if (p.glow) space.setGlow(p.glow, 0.2 * (1 - smoothstep(0.1, 0.9, Math.abs(d))) * smooth(p.ready));
      if (!p.holder.visible) continue;

      if (hit && hovered === p.spec.key && hit.uv) {
        p.tiltTo.set(-(hit.uv.y - 0.5) * 2 * TILT * 0.7, (hit.uv.x - 0.5) * 2 * TILT);
      } else p.tiltTo.set(0, 0);
      p.tilt.lerp(p.tiltTo, k);
      const hoverTo = hovered === p.spec.key ? 1 : 0;
      p.hover += (hoverTo - p.hover) * k;
      if (p.tilt.distanceTo(p.tiltTo) > 1e-4 || Math.abs(p.hover - hoverTo) > 1e-3) busy = true;
      if (p.state === "loaded" && p.ready < 1) {
        p.ready = Math.min(1, p.ready + s.dt / 0.8);
        busy = true;
      }

      p.holder.rotation.set(p.tilt.x, p.rotY + p.tilt.y, 0);
      p.holder.scale.setScalar(1 + p.hover * 0.012);
      const u = p.mesh.material.uniforms;
      u.uReady.value = smooth(p.ready);
      u.uHover.value = p.hover;
      u.uBend.value = bend;
      const near = 1 - smoothstep(RANGE.x, RANGE.y, camera.position.z - p.holder.position.z);
      p.frame.material.opacity = (0.5 + 0.5 * p.hover) * (0.35 + 0.65 * smooth(p.ready)) * near;
      p.marks.material.opacity = (0.18 + 0.22 * p.hover) * near;
    }
    // The corridor's brackets go with the last plane.
    gateMaterial.opacity = o.skyOnly ? 0 : 0.2 * (1 - smoothstep(o.exit - 0.7, o.exit - 0.1, s.c));

    // The reel plays only while the camera is near it.
    if (reel?.spec.video) {
      const near = Math.abs(s.c - reel.spec.at) < 0.7;
      if (near && running) {
        const v = ensureVideo(reel.spec.video);
        if (v.paused) void v.play().catch(() => undefined);
      } else if (video && !video.paused) video.pause();
      if (near && videoPlaying) busy = true;
    }

    // ---------- The astronaut ----------
    astroVisible = false;
    if (astro && placeAt(s.c, place)) {
      // A whole figure never reaches above the header: on short, wide windows the work's corner slots
      // start above the screen, and the path between them swings higher still. (A helmet-anchored
      // place, the hero's and the way out of it, is placed by its helmet and left alone.)
      if (!place.oy) place.y = Math.min(place.y, clearTop - place.h);
      // Below the flight: it waits at the contact gate, and comes forward as the gate rises.
      let arrive = 0;
      if (contact && s.c > o.exit - 0.5) {
        const vy = contact.docY - s.scrollY;
        arrive = smoothstep(H * 1.15, H * 0.62, vy);
        if (arrive > 0) {
          place.x += (contact.x - place.x) * arrive;
          place.y += (1 - (vy / H) * 2 - place.y) * arrive;
          place.h += (contact.h - place.h) * arrive;
          place.dist += (contact.dist - place.dist) * arrive;
          place.face += (contact.face - place.face) * arrive;
          place.roll += (contact.roll - place.roll) * arrive;
          place.lookY += (contact.lookY - place.lookY) * arrive;
          place.yaw += (contact.yaw - place.yaw) * arrive;
          place.pitch += (contact.pitch - place.pitch) * arrive;
          place.xYaw += (contact.xYaw - place.xYaw) * arrive;
        }
      }
      // In the deep it keeps falling: a slow sway and tumble, driven by the descent itself.
      const deep = smoothstep(o.exit - 0.4, o.exit + 0.6, s.c) * (1 - arrive);
      place.x += Math.sin(s.c * 0.9) * 0.06 * deep;
      place.y += Math.cos(s.c * 0.7) * 0.05 * deep;
      place.roll += Math.sin(s.c * 0.45) * 0.35 * deep;

      const dist = place.dist;
      const ph = dist * tanHalf;
      const pw = ph * camera.aspect;
      const scale = (place.h * 2 * ph) / FIGURE_H;
      astro.root.scale.setScalar(scale);
      // Falling faster leans it back and spreads its limbs; scrolling back up draws them in.
      const v = THREE.MathUtils.clamp(s.vel, -3, 3);
      heroW += (place.hero - heroW) * k;
      const fallTo = THREE.MathUtils.clamp((0.55 + 0.4 * deep + v * 0.16) * (1 - arrive) * (1 - place.hero), 0, 1);
      fallW += (fallTo - fallW) * k;
      settleW += (arrive - settleW) * k;
      astro.root.rotation.set(place.pitch - v * 0.035, place.yaw + s.px * 0.12, place.roll, "YXZ");
      // The anchor (the helmet, in the hero) sits on its slot; the figure hangs from it.
      anchorOff.set(place.ox, place.oy, place.oz).multiplyScalar(scale).applyEuler(astro.root.rotation);
      rig.position.set(place.x * pw, place.y * ph, z - dist).sub(anchorOff);
      // The visor's world turns with the astronaut (it holds the suit's own reflection).
      if (astro.visor) astro.visor.envMapRotation.copy(astro.root.rotation);
      // The sun's shadow frustum follows the figure's size.
      keyLight.position.copy(SUN).multiplyScalar(scale * FIGURE_H * 2 + 2);
      if (o.shadows && Math.abs(scale - shadowSize) > shadowSize * 0.02) {
        shadowSize = scale;
        const cam = keyLight.shadow.camera;
        const half = scale * FIGURE_H * 0.62;
        cam.left = cam.bottom = -half;
        cam.right = cam.top = half;
        cam.near = 0.1;
        cam.far = scale * FIGURE_H * 4 + 4;
        cam.updateProjectionMatrix();
        keyLight.shadow.normalBias = 0.012 * scale;
      }
      // Its head follows the X while the X is off on its own.
      const xAt = xhop?.free();
      const lookXTo = xAt ? (xAt.x - rig.position.x) / (scale * 1.5) : place.face * 0.55 + s.px * 0.5;
      const lookYTo = xAt ? (xAt.y - rig.position.y - scale * 0.7) / (scale * 1.5) : place.lookY * 0.8 + s.py * 0.4;
      lookX += (THREE.MathUtils.clamp(lookXTo, -1, 1) - lookX) * k;
      lookY += (THREE.MathUtils.clamp(lookYTo, -1, 1) - lookY) * k;
      // The station's light falls on it: the client's colour in the corridor, the brand red in the deep.
      let a = 0;
      while (a < accents.length - 2 && s.c > accents[a + 1].at) a++;
      const e = smoothstep(accents[a].at, accents[a + 1].at, s.c);
      accentNow.copy(accents[a].color).lerp(accents[a + 1].color, e);
      accentLight.color.copy(accentNow);
      xSuit[3].light.color.copy(accentNow);

      astro.frame({
        dt: s.dt,
        t: s.t,
        hero: heroW,
        fall: fallW,
        settle: settleW,
        lookX,
        lookY,
        xYaw: place.xYaw,
        drift: 1,
        xSit: xhop?.sit() ?? 1,
        xTuck: xhop?.tuck() ?? 0,
      });
      // The X's own way: onto "Join the studio" as the astronaut arrives, into the footer's letter.
      if (xhop) {
        camera.updateMatrixWorld();
        xhop.update({ t: s.t, scrollY: s.scrollY, arrive, W, H, tanHalf, clearTop: clearPx });
      }
      // Weightless things never quite stop: the journey keeps drawing (at ~30 fps once idle).
      busy = true;
      astroVisible = scale * FIGURE_H > 0.002;

      // Moments: a hello at the start, the X points out the reel, jumps at the first piece of work,
      // and waves from the gate at the end.
      if (!greeted && s.c < 0.4) {
        greeted = true;
        react("Wave", s.t, 0);
      } else if (s.c < 0.25) react("Wave", s.t, 9);
      const station = Math.round(s.c * 2) / 2;
      if (Math.abs(s.c - station) < 0.06 && station !== lastStation) {
        lastStation = station;
        if (station === 1) react("Wave", s.t);
        else if (station === 2) react("Jump", s.t);
      }
      if (!xhop && arrive > 0.92 && !arrived) {
        arrived = true;
        react("Wave", s.t, 1);
      } else if (arrive < 0.4) arrived = false;
    }

    renderer.clear();
    if (!o.astroOnly) renderer.render(scene, camera);
    if (astroVisible && !o.skyOnly) {
      renderer.clearDepth();
      renderer.render(charScene, camera);
    }
    // the X on its own: no depth cleared, so the astronaut still hides it where it passes behind
    if (xhop?.free() && !o.skyOnly) {
      const g = xhop.lit();
      for (const l of xSuit) l.light.intensity = l.k * (1 - g);
      for (const l of xStage) l.light.intensity = l.k * g;
      xHemi.intensity = 0.75 * (1 - 0.4 * g);
      renderer.render(xScene, camera);
    }
    if (!framed && astroVisible && earth) {
      framed = true;
      // the next frame callback comes after this one is presented
      requestAnimationFrame(() => o.progress?.step("frame"));
    }
    return busy;
  };

  // The astronaut and Earth load once the corridor is up.
  void loadAstro().catch(() => o.progress?.fail());
  void loadEarth().catch(() => o.progress?.fail());

  return {
    frame,
    layout,
    pick(mx, my) {
      const hit = cast(mx, my);
      const key = (hit?.object.userData.key as string | undefined) ?? null;
      if (key === "x" && astro) {
        lastReact = -10;
        astro.react("Spin");
      }
      return key;
    },
    hello() {
      if (!holding) return;
      holding = false;
      // Not here yet: it greets as usual when it arrives.
      if (!astro) return;
      greeted = true;
      lastReact = -10;
      react("Wave", lastT, 0);
      o.invalidate();
    },
    animating: () => xhop?.animating() ?? false,
    setRunning(on) {
      running = on;
      if (!on && video && !video.paused) video.pause();
    },
    // Exact, from the posed (skinned) vertices: only ever called by the test scripts.
    probeX: () => (astro && astroVisible ? astro.probe() : null),
    astroRect: () => {
      if (!astro || !astroVisible) return null;
      const v = new THREE.Vector3();
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      const pts: number[] = [];
      // The visor's and the X's own boxes too (CSS px: left, top, right, bottom), to frame the stills
      // against.
      const visor = [Infinity, Infinity, -Infinity, -Infinity];
      const xBox = [Infinity, Infinity, -Infinity, -Infinity];
      const grow = (b: number[], px: number, py: number) => {
        b[0] = Math.min(b[0], px);
        b[1] = Math.min(b[1], py);
        b[2] = Math.max(b[2], px);
        b[3] = Math.max(b[3], py);
      };
      astro.root.updateMatrixWorld(true);
      astro.x.seat.updateMatrixWorld(true);
      const shown = (n: THREE.Object3D | null) => {
        for (; n; n = n.parent) if (!n.visible) return false;
        return true;
      };
      const seen = new Set<THREE.Object3D>();
      const each = (n: THREE.Object3D) => {
        const mesh = n as THREE.Mesh;
        if (seen.has(n) || !mesh.isMesh || !(mesh.material as THREE.Material).visible || !shown(n)) return;
        seen.add(n);
        const isVisor = mesh.material === astro?.visor;
        const count = mesh.geometry.attributes.position.count;
        for (let i = 0; i < count; i += 3) {
          mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld).project(camera);
          x0 = Math.min(x0, v.x);
          x1 = Math.max(x1, v.x);
          y0 = Math.min(y0, v.y);
          y1 = Math.max(y1, v.y);
          const px = ((v.x + 1) / 2) * W;
          const py = ((1 - v.y) / 2) * H;
          pts.push(Math.round(px), Math.round(py));
          if (isVisor) grow(visor, px, py);
          if (mesh.userData.x) grow(xBox, px, py);
        }
      };
      astro.root.traverse(each);
      astro.x.seat.traverse(each);
      return { x: ((x0 + 1) / 2) * W, y: ((1 - y1) / 2) * H, w: ((x1 - x0) / 2) * W, h: ((y1 - y0) / 2) * H, pts, visor, mascot: xBox };
    },
    dispose() {
      disposed = true;
      o.canvas.removeEventListener("webglcontextlost", onLost);
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.remove();
      }
      videoTexture?.dispose();
      xhop?.dispose();
      astro?.dispose();
      for (const t of envs) t.dispose();
      earth?.dispose();
      space.dispose();
      for (const p of planes) {
        if (p.texture) {
          const image = p.texture.image as { close?: () => void } | undefined;
          p.texture.dispose();
          image?.close?.();
        }
        p.mesh.material.dispose();
        p.frame.geometry.dispose();
        p.frame.material.dispose();
        p.marks.geometry.dispose();
        p.marks.material.dispose();
      }
      planeGeometry.dispose();
      gateGeometry.dispose();
      gateMaterial.dispose();
      blank.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
