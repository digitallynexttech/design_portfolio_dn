// Things on the water: toys to push (buoys, crates), ramps to jump, the message in a bottle, the
// drive-in reel screen, the six service buoys, the Lab's weather buoys, the reef of older work and
// the trophy rock.
import * as THREE from "three/webgpu";
import { color, mix, positionLocal, smoothstep } from "three/tsl";
import { archiveSlots, BOTTLE_HOME, RECOGNITION_ROCK, REEL_SCREEN, SERVICE_BUOYS, WEATHER_BUOYS } from "../../layout";
import { world } from "../../store";
import { makeBody, type Body } from "../physics";
import { PAL } from "../shared";
import { groundHeight, landById } from "../terrain";
import { type Batch, type Disposables, type IslandCtx, type Materials, type Part, SHAPES, textTexture } from "./common";
import { detail } from "../layers";

type Floater = { body: Body; object: THREE.Object3D; lift: number; anchor?: { x: number; z: number; k: number } };

/** Keep a mesh on its floating body, tilted with the local slope of the sea. */
function poseFloater(ctx: IslandCtx, f: Floater) {
  const b = f.body;
  const sx = (ctx.physics.sea(b.x + 0.8, b.z) - ctx.physics.sea(b.x - 0.8, b.z)) / 1.6;
  const sz = (ctx.physics.sea(b.x, b.z + 0.8) - ctx.physics.sea(b.x, b.z - 0.8)) / 1.6;
  f.object.position.set(b.x, b.y + f.lift, b.z);
  f.object.rotation.set(Math.atan(sz) * 0.9, b.yaw, -Math.atan(sx) * 0.9, "YXZ");
}

function buoyMesh(mats: Materials, body: string, band: string, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number, s: [number, number, number]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y * scale;
    m.scale.set(s[0] * scale, s[1] * scale, s[2] * scale);
    m.castShadow = true;
    g.add(m);
  };
  add(SHAPES.cyl, mats.paint(body, 0.5), 0.3, [1, 1.3, 1]);
  add(SHAPES.cyl, mats.paint(band, 0.5), 0.55, [1.02, 0.28, 1.02]);
  add(SHAPES.cone, mats.paint(body, 0.5), 1.3, [0.9, 0.7, 0.9]);
  add(SHAPES.sphere, mats.glow("#fff0c8", 0.3, 3), 1.75, [0.28, 0.28, 0.28]);
  return g;
}

// The six weather buoys: one channel marker, recoloured per state.
const WEATHER_RECOLOR: Record<string, { hue?: number; saturation?: number; brightness?: number }> = {
  live: { hue: Math.PI * 0.98, saturation: 1.15 },
  clear: { hue: 0.82, saturation: 1.2, brightness: 1.25 },
  rain: { hue: 3.75, saturation: 1.0 },
  storm: { hue: 4.25, saturation: 0.8, brightness: 0.55 },
  mist: { saturation: 0.08, brightness: 1.25 },
  snow: { saturation: 0, brightness: 1.9 },
};

export function buildExtras(ctx: IslandCtx, batch: Batch, mats: Materials, d: Disposables): Part {
  const floaters: Floater[] = [];
  const updates: ((dt: number, t: number, night: number, boat: { x: number; z: number }) => void)[] = [];
  const steps: ((dt: number) => void)[] = [];
  const addFloater = (object: THREE.Object3D, body: Body, lift: number, anchor?: Floater["anchor"]) => {
    ctx.scene.add(detail(object));
    d.meshes.push(object);
    ctx.physics.add(body);
    floaters.push({ body, object, lift, anchor });
  };

  // --- Toys around the hub -------------------------------------------------------------------
  const toyBuoys = [
    { x: 14, z: 46 },
    { x: -15, z: 44 },
    { x: 22, z: 30 },
    { x: -22, z: 26 },
    { x: 30, z: 52 },
    { x: -32, z: 50 },
  ];
  toyBuoys.forEach((p, i) => {
    const body = makeBody({ id: `toy-buoy-${i}`, mass: 0.3, circles: [{ ox: 0, oz: 0, r: 0.6 }], draft: 0.45, float: 30, floatDamp: 5, drag: 0.9, angularDrag: 1.5, restitution: 0.5 });
    body.x = p.x;
    body.z = p.z;
    const toy = ctx.tier === 1 ? buoyMesh(mats, i % 2 ? "#f6f4ef" : "#e21f26", i % 2 ? "#e21f26" : "#f6f4ef", 0.9) : ctx.props.place("buoy", 2.1, i % 2 ? { saturation: 0.15, brightness: 1.5 } : undefined);
    addFloater(toy, body, -0.45, { x: p.x, z: p.z, k: 0.25 });
  });
  const crates = [
    { x: 9, z: 52 },
    { x: -8, z: 56 },
    { x: 26, z: 40 },
    { x: -27, z: 36 },
    { x: 4, z: 62 },
  ];
  crates.forEach((p, i) => {
    const body = makeBody({ id: `toy-crate-${i}`, mass: 0.45, circles: [{ ox: 0, oz: 0, r: 0.8 }], draft: 0.25, float: 26, floatDamp: 5, drag: 0.7, angularDrag: 1.1, restitution: 0.35 });
    body.x = p.x;
    body.z = p.z;
    body.yaw = Math.random() * 3;
    const g = new THREE.Group();
    const box = new THREE.Mesh(SHAPES.box, mats.pal(PAL.WOOD));
    box.scale.set(1.15, 1.0, 1.15);
    box.castShadow = true;
    const band = new THREE.Mesh(SHAPES.box, mats.pal(PAL.WOOD_DARK));
    band.scale.set(1.18, 0.16, 1.18);
    const band2 = band.clone();
    band.position.y = 0.3;
    band2.position.y = -0.3;
    if (ctx.tier === 1) {
      g.add(box, band, band2);
      addFloater(g, body, 0.2, { x: p.x, z: p.z, k: 0.06 });
    } else {
      // A real wooden sea chest, bobbing half-sunk.
      g.add(ctx.props.place("crate", 1.0));
      addFloater(g, body, -0.42, { x: p.x, z: p.z, k: 0.06 });
    }
  });

  // --- Ramps: ride up and launch off the lip -------------------------------------------------
  const ramps = [
    { x: 30, z: 14, dir: 0, len: 8, width: 4.2, height: 1.7 },
    { x: -32, z: 18, dir: Math.PI, len: 8, width: 4.2, height: 1.7 },
  ];
  for (const r of ramps) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(r.len, r.height);
    shape.lineTo(r.len, 0);
    shape.lineTo(0, 0);
    const wedge = new THREE.ExtrudeGeometry(shape, { depth: r.width, bevelEnabled: false });
    wedge.translate(0, 0, -r.width / 2);
    d.geometries.push(wedge);
    const ry = -r.dir;
    batch.add(wedge, mats.paint("#e9e4da", 0.8), { x: r.x, y: -0.15, z: r.z, ry });
    // Red chevrons on the slope.
    for (let k = 1; k < 4; k++) {
      const along = (k / 4) * r.len;
      batch.add(SHAPES.box, mats.paint("#e21f26", 0.6), {
        x: r.x + Math.cos(r.dir) * along,
        y: -0.15 + (along / r.len) * r.height + 0.04,
        z: r.z + Math.sin(r.dir) * along,
        ry,
        rz: Math.atan2(r.height, r.len),
        s: [0.5, 0.04, r.width * 0.9],
      });
    }
    // The wedge is solid. Its low front edge is the only way on: anything that meets a side or the
    // back below the ramp's height there bounces off, so nothing sails into it or under it. A hull
    // on the slope rides its surface, loses speed to gravity on the way up, and launches off the lip.
    const fx = Math.cos(r.dir);
    const fz = Math.sin(r.dir);
    const slope = r.height / r.len;
    const half = r.width / 2;
    const top = (a: number) => -0.15 + Math.min(r.len, Math.max(0, a)) * slope;
    // A hull clears the wedge where its top is no more than CLEAR above the body's reference height.
    // Getting on is more forgiving (RIDE): at speed a hull runs low in the troughs, and the front lip
    // sits under the water, so any hull meeting it head-on rides up.
    const CLEAR = 0.2;
    const RIDE = 0.6;
    steps.push((dt) => {
      for (const b of ctx.physics.bodies) {
        if (!b.enabled) continue;
        const along = (b.x - r.x) * fx + (b.z - r.z) * fz;
        const lateral = (b.x - r.x) * -fz + (b.z - r.z) * fx;
        if (along < -6 || along > r.len + 6 || Math.abs(lateral) > half + 6) continue;
        if (along >= -3 && along <= r.len && Math.abs(lateral) <= half && top(along) <= b.y + RIDE) {
          if (along < 0) continue;
          const surface = top(along) + 0.25;
          const speedAlong = b.vx * fx + b.vz * fz;
          if (b.y < surface) {
            b.y = surface;
            b.vy = Math.max(b.vy, speedAlong * slope * 1.15);
          }
          b.vx -= fx * 9.81 * slope * dt;
          b.vz -= fz * 9.81 * slope * dt;
          continue;
        }
        const cos = Math.cos(b.yaw);
        const sin = Math.sin(b.yaw);
        for (const c of b.circles) {
          const wx = b.x + c.ox * cos + c.oz * sin;
          const wz = b.z - c.ox * sin + c.oz * cos;
          const al = (wx - r.x) * fx + (wz - r.z) * fz;
          const lat = (wx - r.x) * -fz + (wz - r.z) * fx;
          if (al < 0 || al > r.len + c.r || Math.abs(lat) > half + c.r) continue;
          if (top(al) <= b.y + CLEAR) continue;
          // Out through whichever face is nearest: a side, or the back.
          const pSide = half + c.r - Math.abs(lat);
          const pBack = r.len + c.r - al;
          const s = Math.sign(lat) || 1;
          const nx = pSide < pBack ? -fz * s : fx;
          const nz = pSide < pBack ? fx * s : fz;
          const pen = Math.min(pSide, pBack);
          b.x += nx * pen;
          b.z += nz * pen;
          const vn = b.vx * nx + b.vz * nz;
          if (vn < 0) {
            b.vx -= nx * vn * (1 + b.restitution);
            b.vz -= nz * vn * (1 + b.restitution);
            if (-vn > 1.5) b.onImpact?.(-vn, "ramp");
          }
        }
      }
    });
  }

  // --- Message in a bottle -------------------------------------------------------------------
  {
    const g = new THREE.Group();
    const glass = new THREE.MeshStandardNodeMaterial({ color: "#3f8f6b", roughness: 0.15, metalness: 0, transparent: true, opacity: 0.78 });
    d.materials.push(glass);
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 14), glass);
    bodyMesh.rotation.z = Math.PI / 2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.45, 12), glass);
    neck.rotation.z = -Math.PI / 2;
    neck.position.x = 0.75;
    const cork = new THREE.Mesh(SHAPES.cyl, mats.pal(PAL.WOOD));
    cork.scale.set(0.2, 0.22, 0.2);
    cork.rotation.z = Math.PI / 2;
    cork.position.x = 1.05;
    const note = new THREE.Mesh(SHAPES.cyl, mats.paint("#f4ecd8", 0.9));
    note.scale.set(0.22, 0.7, 0.22);
    note.rotation.z = Math.PI / 2;
    g.add(bodyMesh, neck, cork, note);
    for (const m of [bodyMesh, neck]) d.geometries.push(m.geometry);
    g.scale.setScalar(1.4);
    const body = makeBody({ id: "bottle", mass: 0.2, circles: [{ ox: 0, oz: 0, r: 0.8 }], draft: 0.05, float: 22, floatDamp: 4, drag: 0.8, angularDrag: 0.8, restitution: 0.4 });
    body.x = BOTTLE_HOME.x;
    body.z = BOTTLE_HOME.z;
    addFloater(g, body, 0.05, { x: BOTTLE_HOME.x, z: BOTTLE_HOME.z, k: 0.12 });
    const point = ctx.interactions.add({
      id: "bottle",
      kind: "bottle",
      ref: "contact",
      label: "Message in a bottle",
      verb: "Read the message",
      x: body.x,
      z: body.z,
      y: 2.2,
      reach: 7,
      berth: { x: BOTTLE_HOME.x, z: BOTTLE_HOME.z + 6, heading: 0 },
      focus: new THREE.Vector3(BOTTLE_HOME.x, 0, BOTTLE_HOME.z),
    });
    updates.push(() => {
      point.x = body.x;
      point.z = body.z;
      body.yawRate += 0.002;
    });
  }

  // --- Drive-in screen: the reel -------------------------------------------------------------
  {
    const s = REEL_SCREEN;
    const posterTex = new THREE.TextureLoader().load("/video/reel-poster.webp");
    posterTex.colorSpace = THREE.SRGBColorSpace;
    d.textures.push(posterTex);
    const video = document.createElement("video");
    video.src = "/video/reel.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.crossOrigin = "anonymous";
    const videoTex = new THREE.VideoTexture(video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    d.textures.push(videoTex);
    const screenMat = mats.screen(posterTex);
    d.materials.push(screenMat);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(s.width, s.height), screenMat);
    screen.position.set(s.x, 3 + s.height / 2, s.z);
    ctx.scene.add(screen);
    d.meshes.push(screen);
    d.geometries.push(screen.geometry);
    batch.add(SHAPES.box, mats.paint("#16181c", 0.6, 0.2), { x: s.x, y: 3 + s.height / 2, z: s.z - 0.25, s: [s.width + 0.8, s.height + 0.8, 0.4] });
    for (const side of [-1, 1]) {
      batch.add(SHAPES.box, mats.paint("#16181c", 0.6, 0.2), { x: s.x + side * s.width * 0.3, y: 1.2, z: s.z - 0.3, s: [0.5, 4.5, 0.5] });
      batch.add(SHAPES.cyl, mats.paint("#e21f26", 0.6), { x: s.x + side * s.width * 0.3, y: -0.2, z: s.z - 0.3, s: [2.4, 1.2, 2.4] });
      ctx.physics.posts.push({ x: s.x + side * s.width * 0.3, z: s.z - 0.3, r: 1.3, id: "reel-pylon" });
    }
    const title = textTexture([{ text: "The reel", size: 120, weight: 700, color: "#f6f4ef" }], { width: 1024, height: 200, bg: "#16181c", align: "center" });
    d.textures.push(title);
    const titleMat = mats.screen(title);
    d.materials.push(titleMat);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), titleMat);
    label.position.set(s.x, 3 + s.height + 1.2, s.z - 0.02);
    ctx.scene.add(label);
    d.meshes.push(label);
    d.geometries.push(label.geometry);
    ctx.interactions.add({
      id: "reel",
      kind: "reel",
      ref: "reel",
      label: "The reel",
      verb: "Watch the reel",
      x: s.x,
      z: s.z + 8,
      y: 2.5,
      reach: 12,
      berth: { x: s.x, z: s.z + 14, heading: 0 },
      focus: new THREE.Vector3(s.x, 0, s.z + 2),
    });
    let playing = false;
    updates.push((_dt, _t, _n, boat) => {
      const near = Math.hypot(boat.x - s.x, boat.z - s.z) < 95 && world.get().visible;
      if (near && !playing) {
        playing = true;
        video.preload = "auto";
        void video.play().then(
          () => {
            screenMat.colorNode = mats.screen(videoTex).colorNode;
            screenMat.needsUpdate = true;
          },
          () => (playing = false),
        );
      } else if (!near && playing) {
        playing = false;
        video.pause();
      }
    });
    d.cleanups.push(() => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    });
  }

  // --- Six service buoys --------------------------------------------------------------------
  ctx.data.services.slice(0, SERVICE_BUOYS.length).forEach((service, i) => {
    const p = SERVICE_BUOYS[i];
    // A channel marker, recoloured from red to the brand teal.
    const g = new THREE.Group();
    g.add(ctx.tier === 1 ? buoyMesh(mats, "#0ec8c5", "#f6f4ef", 1.5) : ctx.props.place("marker", 3.3, { hue: Math.PI * 0.98, saturation: 1.15 }));
    const tag = textTexture(
      [
        { text: String(i + 1).padStart(2, "0"), size: 74, weight: 700, color: "#0ec8c5", font: "--font-geist-mono" },
        { text: service.title, size: 46, weight: 600, color: "#f6f4ef", gap: 6 },
      ],
      { width: 760, height: 220, bg: "#0b0d10", padding: 34 },
    );
    d.textures.push(tag);
    const tagMat = mats.screen(tag);
    d.materials.push(tagMat);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.33), tagMat);
    board.position.set(0, 4.6, 0);
    board.rotation.x = -0.2;
    g.add(board);
    d.geometries.push(board.geometry);
    g.position.set(p.x, -0.1, p.z);
    ctx.scene.add(detail(g));
    d.meshes.push(g);
    ctx.physics.posts.push({ x: p.x, z: p.z, r: 0.9, id: `service-${i}` });
    ctx.interactions.add({
      id: `service-${service.id}`,
      kind: "service",
      ref: service.id,
      label: service.title,
      verb: `Service ${String(i + 1).padStart(2, "0")}: ${service.title}`,
      x: p.x,
      z: p.z + 2,
      y: 5.2,
      reach: 6.5,
      berth: { x: p.x, z: p.z + 5, heading: 0 },
      focus: new THREE.Vector3(p.x, 0, p.z),
    });
    const phase = i * 0.7;
    updates.push((_dt, t) => {
      g.position.y = ctx.physics.sea(p.x, p.z) - 0.55;
      g.rotation.z = Math.sin(t * 1.1 + phase) * 0.05;
    });
  });

  // --- Weather buoys at the Lab -------------------------------------------------------------
  const weatherColor: Record<string, string> = { live: "#0ec8c5", clear: "#f5c542", rain: "#5b8bd6", storm: "#4a4f7a", mist: "#c9d3da", snow: "#f6f8fa" };
  WEATHER_BUOYS.forEach((wb, i) => {
    const g = new THREE.Group();
    g.add(ctx.tier === 1 ? buoyMesh(mats, weatherColor[wb.state], "#1a1c20", 1.25) : ctx.props.place("marker", 2.7, WEATHER_RECOLOR[wb.state]));
    const flag = textTexture([{ text: wb.label, size: 64, weight: 700, color: "#0a0a0a" }], { width: 512, height: 150, bg: "#f6f4ef", align: "center" });
    d.textures.push(flag);
    const flagMat = mats.screen(flag);
    d.materials.push(flagMat);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.94), flagMat);
    board.position.set(0, 3.9, 0);
    board.rotation.x = -0.2;
    g.add(board);
    d.geometries.push(board.geometry);
    g.position.set(wb.x, -0.1, wb.z);
    ctx.scene.add(detail(g));
    d.meshes.push(g);
    ctx.physics.posts.push({ x: wb.x, z: wb.z, r: 0.8, id: `weather-${wb.state}` });
    const verb =
      wb.state === "live" ? "Back to your own weather" : wb.state === "clear" ? "Clear the sky" : wb.state === "rain" ? "Make it rain" : wb.state === "storm" ? "Call a storm" : wb.state === "mist" ? "Bring in the mist" : "Make it snow";
    ctx.interactions.add({
      id: `weather-${wb.state}`,
      kind: "weather",
      ref: wb.state,
      label: wb.label,
      verb,
      x: wb.x,
      z: wb.z + 1.5,
      y: 4.6,
      reach: 4.2,
      berth: { x: wb.x, z: wb.z + 5, heading: 0 },
      focus: new THREE.Vector3(wb.x, 0, wb.z),
      action: () => {
        const pick = world.get().pick;
        world.set({ pick: { ...pick, weather: wb.state }, toast: wb.state === "live" ? "Back to your local weather." : `${wb.label}. Sail to “Your weather” to undo.` });
        ctx.audio.chime();
      },
    });
    updates.push((_dt, t) => {
      g.position.y = ctx.physics.sea(wb.x, wb.z) - 0.5;
      g.rotation.z = Math.sin(t * 1.3 + i) * 0.05;
    });
  });

  // --- The reef: older work on floating screens ----------------------------------------------
  const slots = archiveSlots(ctx.data.archive.length);
  ctx.data.archive.forEach((entry, i) => {
    const slot = slots[i];
    const w = 9;
    const h = 5.6;
    const frame = new THREE.Group();
    frame.position.set(slot.x, 0, slot.z);
    // Face the hub, so every screen reads from the open water.
    frame.rotation.y = Math.atan2(-slot.x, 6 - slot.z);
    ctx.scene.add(frame);
    d.meshes.push(frame);
    const placeholder = mats.paint("#20242a", 0.6);
    const screen: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(new THREE.PlaneGeometry(w, h), placeholder);
    screen.position.set(0, 2.2 + h / 2, 0.22);
    frame.add(screen);
    d.geometries.push(screen.geometry);
    const back = new THREE.Mesh(SHAPES.box, mats.paint("#16181c", 0.5, 0.2));
    back.scale.set(w + 0.5, h + 0.5, 0.35);
    back.position.set(0, 2.2 + h / 2, 0);
    back.castShadow = true;
    const pole = new THREE.Mesh(SHAPES.cyl, mats.paint("#e9e4da", 0.6));
    pole.scale.set(1.8, 2.6, 1.8);
    pole.position.y = 0.6;
    frame.add(back, pole);
    const caption = textTexture(
      [
        { text: entry.client, size: 64, weight: 700, color: "#f6f4ef" },
        { text: `${entry.sector} · ${entry.platform}${entry.year ? ` · ${entry.year}` : ""}`, size: 34, weight: 500, color: "#b8bcc2", font: "--font-text", gap: 6 },
      ],
      { width: 900, height: 170, bg: "#16181c", padding: 30 },
    );
    d.textures.push(caption);
    const capMat = mats.screen(caption);
    d.materials.push(capMat);
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(w, w * (170 / 900)), capMat);
    cap.position.set(0, 2.2 + h + 1.25, 0.2);
    frame.add(cap);
    d.geometries.push(cap.geometry);
    ctx.physics.posts.push({ x: slot.x, z: slot.z, r: 1.4, id: `reef-${i}` });
    const out = { x: -slot.x / Math.hypot(slot.x, slot.z - 6), z: -(slot.z - 6) / Math.hypot(slot.x, slot.z - 6) };
    ctx.interactions.add({
      id: `archive-${i}`,
      kind: "archive",
      ref: String(i),
      label: entry.client,
      verb: `Visit ${entry.client}`,
      x: slot.x + out.x * 6,
      z: slot.z + out.z * 6,
      y: 3,
      reach: 7,
      berth: { x: slot.x + out.x * 10, z: slot.z + out.z * 10, heading: Math.atan2(-out.x, -out.z) + Math.PI },
      focus: new THREE.Vector3(slot.x, 0, slot.z),
    });
    let loaded = false;
    updates.push((_dt, _t, _n, boat) => {
      if (loaded || Math.hypot(boat.x - slot.x, boat.z - slot.z) > 130) return;
      loaded = true;
      new THREE.TextureLoader().load(entry.image.src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        d.textures.push(tex);
        const m = mats.screen(tex);
        d.materials.push(m);
        screen.material = m;
      });
    });
    updates.push((_dt, t) => {
      frame.position.y = ctx.physics.sea(slot.x, slot.z) * 0.6 + Math.sin(t * 0.8 + i) * 0.05;
    });
  });

  // --- Trophy rock: recognition --------------------------------------------------------------
  {
    const land = landById("trophy");
    const y = groundHeight(land, RECOGNITION_ROCK.x, RECOGNITION_ROCK.z);
    const gold = new THREE.MeshStandardNodeMaterial({ roughness: 0.25, metalness: 0.85 });
    gold.colorNode = mix(color(new THREE.Color("#d9a441")), color(new THREE.Color("#ffe39a")), smoothstep(0.0, 2.5, positionLocal.y));
    d.materials.push(gold);
    const profile = [
      [0, 0],
      [0.9, 0],
      [0.9, 0.2],
      [0.3, 0.35],
      [0.22, 1.1],
      [0.5, 1.3],
      [1.1, 2.0],
      [1.25, 2.9],
      [1.1, 2.95],
      [0.95, 2.1],
      [0, 1.55],
    ].map(([x, yy]) => new THREE.Vector2(x, yy));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 24), gold);
    cup.position.set(RECOGNITION_ROCK.x, y + 1.2, RECOGNITION_ROCK.z);
    cup.castShadow = true;
    ctx.scene.add(cup);
    d.meshes.push(cup);
    d.geometries.push(cup.geometry);
    batch.add(SHAPES.box, mats.paint("#16181c", 0.5), { x: RECOGNITION_ROCK.x, y: y + 0.6, z: RECOGNITION_ROCK.z, s: [2, 1.2, 2] });
    ctx.interactions.add({
      id: "recognition",
      kind: "recognition",
      ref: "recognition",
      label: "Recognition",
      verb: "See our recognition",
      x: RECOGNITION_ROCK.x,
      z: RECOGNITION_ROCK.z + 8,
      y: 4,
      reach: 8,
      berth: { x: RECOGNITION_ROCK.x, z: RECOGNITION_ROCK.z + 12, heading: 0 },
      focus: new THREE.Vector3(RECOGNITION_ROCK.x, 0, RECOGNITION_ROCK.z),
    });
    updates.push((dt) => {
      cup.rotation.y += dt * 0.4;
    });
  }

  return {
    step(dt) {
      for (const f of floaters) {
        if (f.anchor) {
          // A slack mooring line: things drift when pushed, then ease home.
          f.body.vx += (f.anchor.x - f.body.x) * f.anchor.k * dt;
          f.body.vz += (f.anchor.z - f.body.z) * f.anchor.k * dt;
        }
      }
      for (const s of steps) s(dt);
    },
    update(dt, t, night, boat) {
      for (const f of floaters) poseFloater(ctx, f);
      for (const u of updates) u(dt, t, night, boat);
    },
    dispose() {
      for (const f of floaters) ctx.physics.remove(f.body);
    },
  };
}
