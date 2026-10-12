// Phase 0 check: captures the hero on desktop and phone, with the water disturbed and at each beat.
// Usage: node scripts/capture-hero.mjs [baseUrl] [outDir]
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3210";
const out = process.argv[3] ?? "./.captures";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const errors = [];

async function open(context, label) {
  const page = await context.newPage();
  page.on("console", (msg) => msg.type() === "error" && errors.push(`[${label}] ${msg.text()}`));
  page.on("pageerror", (err) => errors.push(`[${label}] ${err.message}`));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  return page;
}

// Desktop
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await open(context, "desktop");
  await page.screenshot({ path: `${out}/desktop-1-hero.png` });

  await page.mouse.move(200, 520);
  for (let i = 0; i <= 30; i++) await page.mouse.move(200 + i * 34, 520 + Math.sin(i / 4) * 120, { steps: 2 });
  await page.mouse.click(1000, 640);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/desktop-2-ripples.png` });

  const track = await page.evaluate(() => document.querySelector(".hero-track")?.scrollHeight ?? 0);
  const stops = [
    ["mid-transition", 0.3],
    ["beat2", 0.5],
    ["beat3", 0.95],
  ];
  for (const [i, [label, f]] of stops.entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), (track - 900) * f);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${out}/desktop-${3 + i}-${label}.png` });
  }
  await context.close();
}

// Phone
{
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await open(context, "phone");
  await page.screenshot({ path: `${out}/phone-1-hero.png` });
  await page.touchscreen.tap(195, 520);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-2-tap.png` });
  await context.close();
}

// Reduced motion: no canvas, beats stacked as plain text.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await open(context, "reduced");
  await page.screenshot({ path: `${out}/reduced-motion.png`, fullPage: true });
  await context.close();
}

await browser.close();
console.log(errors.length ? `Console errors:\n${errors.join("\n")}` : "No console errors.");
