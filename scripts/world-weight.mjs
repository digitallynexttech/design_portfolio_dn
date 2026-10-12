// What the world costs a visitor: bytes over the wire from "Set sail" until it is running (cache
// disabled, as a first visit), how long that takes, how smooth the first seconds are, and the
// frame rate once sailing. Runs installed Chrome on the real GPU (WebGPU) with normal frame pacing.
// Usage: node scripts/world-weight.mjs <origin> [--phone] [--throttle=4] [--dpr=1] [--sail=8000] [--json=out.json]
//   --phone       Pixel 7 (412×839 @ 2.625, touch) instead of a 1440×900 desktop
//   --throttle=N  CPU slowdown via DevTools (4 = a mid-range phone)
//   --sail=MS     how long to keep measuring after the world starts (default 8 s)
//   --engage      the visitor moves and scrolls for 3 s before sailing; bytes fetched then are
//                 reported as `preClick` (what a home visit costs before anyone sets sail)
//   --hover=MS    the pointer rests on Set sail for MS before the click (a person aiming)
//   --quality=Q   as if Q (1|2|3|auto) had been picked in Options
import { chromium, devices } from "@playwright/test";
import { writeFileSync } from "node:fs";

const [origin = "http://localhost:3440", ...flags] = process.argv.slice(2);
const flag = (name, fallback) => {
  const f = flags.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!f) return fallback;
  return f.includes("=") ? f.split("=")[1] : true;
};
const phone = !!flag("phone", false);
const throttle = Number(flag("throttle", 1));
const dpr = Number(flag("dpr", 1));
const sailMs = Number(flag("sail", 8000));
const jsonOut = flag("json", null);

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const context = phone ? await browser.newContext({ ...devices["Pixel 7"] }) : await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message.slice(0, 300)}`));

const requests = new Map();
const preRequests = new Map();
let counting = false;
let precounting = false;
let clickAt = 0;
cdp.on("Network.requestWillBeSent", (e) => {
  if (precounting) preRequests.set(e.requestId, { url: e.request.url, bytes: 0 });
  if (!counting) return;
  requests.set(e.requestId, { url: e.request.url, at: Date.now() - clickAt, bytes: 0, done: false });
});
cdp.on("Network.loadingFinished", (e) => {
  const p = preRequests.get(e.requestId);
  if (p) p.bytes = e.encodedDataLength;
  const r = requests.get(e.requestId);
  if (!r) return;
  r.bytes = e.encodedDataLength;
  r.done = true;
  r.end = Date.now() - clickAt;
});
cdp.on("Network.responseReceived", (e) => {
  const r = requests.get(e.requestId);
  if (r) r.encoding = e.response.headers["content-encoding"] ?? e.response.headers["Content-Encoding"] ?? "";
});

await page.goto(origin + "/", { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(4000);
const env = await page.evaluate(() => ({
  coarse: matchMedia("(pointer: coarse)").matches,
  memory: navigator.deviceMemory ?? null,
  dpr: devicePixelRatio,
  gpu: "gpu" in navigator,
}));
// --quality=1|2|3|auto: as if the visitor had picked it in Options (saved prefs, both formats).
const quality = flag("quality", null);
if (quality) {
  await page.evaluate((q) => {
    const value = q === "auto" ? "auto" : Number(q);
    localStorage.setItem("dn-world-prefs-v2", JSON.stringify({ quality: value }));
    localStorage.setItem("dn-world-prefs-v3", JSON.stringify({ quality: value, chosen: true }));
  }, quality);
}
if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });

// Record every animation frame from the click on, to find stalls in the first seconds, and when
// each loading step's message first appears.
await page.evaluate(() => {
  const w = window;
  w.__frames = [];
  w.__phases = [];
  const tick = (t) => {
    w.__frames.push(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  let last = "";
  const watch = () => {
    const text = document.querySelector(".world-loading p")?.textContent ?? "";
    if (text && text !== last) {
      last = text;
      w.__phases.push([Math.round(performance.now()), text]);
    }
  };
  new MutationObserver(watch).observe(document.body, { subtree: true, childList: true, characterData: true });
});

const sailButton = page.getByRole("button", { name: /^Set sail/ }).first();
if (flag("engage", false)) {
  precounting = true;
  for (const [x, y] of [
    [200, 300],
    [600, 420],
    [300, 500],
  ])
    await page.mouse.move(x, y, { steps: 5 });
  await page.evaluate(() => window.scrollBy(0, 240));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(3000);
  precounting = false;
}
const hoverMs = Number(flag("hover", 0));
if (hoverMs > 0) {
  await sailButton.hover();
  await page.waitForTimeout(hoverMs);
}
const pre = [...preRequests.values()];
const preClick = { kb: Math.round(pre.reduce((n, r) => n + r.bytes, 0) / 1024), jsKb: Math.round(pre.filter((r) => /\.js(\?|$)/.test(r.url)).reduce((n, r) => n + r.bytes, 0) / 1024) };

counting = true;
clickAt = Date.now();
const clickPerf = await page.evaluate(() => performance.now());
await sailButton.click();
await page.waitForFunction(() => document.documentElement.dataset.world === "running" || document.documentElement.dataset.world === "error", null, { timeout: 240000, polling: 100 });
const runningAt = Date.now() - clickAt;
const runningPerf = await page.evaluate(() => performance.now());
const state = await page.evaluate(() => document.documentElement.dataset.world);
const bytesAtRunning = [...requests.values()].filter((r) => r.done && r.end <= runningAt).reduce((n, r) => n + r.bytes, 0);

// Sail a little so the frame rate is measured while moving (desktop: hold W; phone: just watch).
const stats = [];
const t0 = Date.now();
if (!phone) await page.keyboard.down("KeyW");
while (Date.now() - t0 < sailMs) {
  await page.waitForTimeout(1000);
  const s = await page.evaluate(() => (window.__worldStats ? window.__worldStats() : null));
  if (s) stats.push(s);
  if (!phone && Date.now() - t0 > 2500) await page.keyboard.up("KeyW");
}
if (!phone) await page.keyboard.up("KeyW");
const frames = await page.evaluate(() => window.__frames);
const phases = (await page.evaluate(() => window.__phases)).map(([t, text]) => `${Math.round((t - clickPerf) / 100) / 10}s ${text}`);
const total = [...requests.values()].filter((r) => r.done).reduce((n, r) => n + r.bytes, 0);

// Frame intervals: the first 5 s after running, and the last 4 s of the run.
const intervals = (from, to) => {
  const list = frames.filter((t) => t >= from && t <= to);
  const d = [];
  for (let i = 1; i < list.length; i++) d.push(list[i] - list[i - 1]);
  return d;
};
const summary = (d) => {
  if (!d.length) return null;
  const sorted = [...d].sort((a, b) => a - b);
  const sum = d.reduce((a, b) => a + b, 0);
  return { fps: Math.round((d.length * 1000) / sum), p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]), max: Math.round(sorted.at(-1)), over50: d.filter((x) => x > 50).length };
};
const lastFrame = frames.at(-1) ?? runningPerf;
const early = summary(intervals(runningPerf, runningPerf + 5000));
const late = summary(intervals(lastFrame - 4000, lastFrame));

const group = (u) => {
  const p = new URL(u).pathname;
  if (p.startsWith("/world/tex/")) return "textures";
  if (p.startsWith("/world/models/") || p.startsWith("/models/")) return "models";
  if (p.startsWith("/draco/")) return "draco";
  if (p.endsWith(".js") || p.includes("/chunks/")) return "js";
  if (p.startsWith("/_next/image") || /\.(webp|png|jpe?g|avif)$/.test(p)) return "images";
  if (p.startsWith("/api/")) return "api";
  return "other";
};
const byGroup = {};
for (const r of requests.values()) {
  if (!r.done) continue;
  const g = group(r.url);
  byGroup[g] = (byGroup[g] ?? 0) + r.bytes;
}
const kb = (n) => Math.round(n / 1024);
const files = [...requests.values()]
  .filter((r) => r.done)
  .sort((a, b) => b.bytes - a.bytes)
  .map((r) => ({ kb: kb(r.bytes), at: r.at, path: new URL(r.url).pathname + (new URL(r.url).search.length > 1 ? "?…" : ""), enc: r.encoding || "" }));

const result = {
  device: phone ? "Pixel 7" : `desktop 1440x900 @${dpr}`,
  throttle,
  env,
  state,
  loadMs: runningAt,
  preClick,
  phases,
  kbAtRunning: kb(bytesAtRunning),
  kbTotal: kb(total),
  kbByGroup: Object.fromEntries(Object.entries(byGroup).map(([k, v]) => [k, kb(v)])),
  firstSeconds: early,
  sailing: late,
  engine: stats.slice(-4),
  errors: errors.slice(0, 10),
  files: files.slice(0, 60),
};
console.log(JSON.stringify({ ...result, files: files.slice(0, 25) }, null, 1));
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(result, null, 1));

await browser.close();
