// Screenshot routes on desktop and phone, and report console errors and failed requests.
// Usage: node scripts/capture.mjs <baseUrl> <outDir> <route> [route ...] [--full] [--phone-only] [--desktop-only]
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const [base, out, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const routes = rest.filter((a) => !a.startsWith("--"));
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const problems = [];

const targets = [];
if (!flags.has("--phone-only")) targets.push(["desktop", { viewport: { width: 1440, height: 900 } }]);
if (!flags.has("--desktop-only")) targets.push(["phone", { ...devices["iPhone 13"] }]);

for (const [label, options] of targets) {
  const context = await browser.newContext(options);
  for (const route of routes) {
    const page = await context.newPage();
    const tag = `${label} ${route}`;
    page.on("console", (msg) => msg.type() === "error" && problems.push(`[${tag}] console: ${msg.text()}`));
    page.on("pageerror", (err) => problems.push(`[${tag}] pageerror: ${err.message}`));
    page.on("response", (res) => res.status() >= 400 && problems.push(`[${tag}] ${res.status()} ${res.url()}`));
    await page.goto(base + route, { waitUntil: "networkidle", timeout: 90_000 });
    // WebGL waits for engagement (features/stage/engage.ts), so act like a visitor first.
    if (label === "phone") await page.touchscreen.tap(5, 5);
    else await page.mouse.move(720, 450);
    await page.waitForTimeout(3500);
    const name = `${label}${route.replaceAll("/", "_") || "_home"}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: flags.has("--full") });
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(problems.length ? problems.join("\n") : "No problems.");
