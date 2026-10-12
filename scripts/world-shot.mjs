// Screenshots of the 3D world for development and for poster frames.
// Usage: node scripts/world-shot.mjs <url> <out.png> [width] [height] [waitMs] [--webgpu] [--mobile] [--dpr=2] [--keys=KeyW:2000,KeyA:500]
// Prints console errors and the engine status line. Uses SwiftShader so it runs on any machine.
import { chromium } from "@playwright/test";

const [url, out, w = "1440", h = "900", wait = "2500", ...flags] = process.argv.slice(2);
const webgpu = flags.includes("--webgpu");
const keysFlag = flags.find((f) => f.startsWith("--keys="));
const mobile = flags.includes("--mobile");
const dpr = Number(flags.find((f) => f.startsWith("--dpr="))?.slice(6) ?? 1);

// --webgpu uses the installed Chrome on the real GPU (fast, true WebGPU); otherwise headless
// Chromium on SwiftShader, which tests the WebGL 2 path.
const browser = await chromium.launch({
  ...(webgpu ? { channel: "chrome" } : {}),
  args: webgpu
    ? ["--enable-unsafe-webgpu"]
    : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: dpr, hasTouch: mobile, isMobile: mobile });
const logs = [];
page.on("console", (m) => {
  if (process.env.ALL_LOGS || m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message.slice(0, 400)}`));
const t0 = Date.now();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
// Hide the Next.js dev indicator so frames are clean.
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => undefined);
try {
  await page.waitForFunction(() => /running/.test(document.querySelector("#status")?.textContent ?? "") || document.documentElement.dataset.world === "running", null, { timeout: 180000 });
} catch {
  logs.push("[timeout] world never reported running");
}
const ready = Date.now() - t0;
if (keysFlag) {
  for (const step of keysFlag.slice(7).split(",")) {
    const [key, ms] = step.split(":");
    await page.keyboard.down(key);
    await page.waitForTimeout(Number(ms));
    await page.keyboard.up(key);
  }
}
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out, timeout: 180000 });
const status = await page.evaluate(() => document.querySelector("#status")?.textContent ?? document.documentElement.dataset.world ?? "");
console.log(JSON.stringify({ readyMs: ready, status, logs: logs.slice(0, 30) }, null, 1));
await browser.close();
