// End-to-end check of the world from the home page: hero → Set sail → sail → dock → panel → case
// study → Back. Saves a screenshot at each step and prints console errors.
// Usage: node scripts/world-flow.mjs <origin> <outDir> [--mobile]
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [origin = "http://localhost:3000", out = ".captures/flow", ...flags] = process.argv.slice(2);
const mobile = flags.includes("--mobile");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const context = mobile ? await browser.newContext({ ...devices["Pixel 7"] }) : await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const logs = [];
page.on("console", (m) => {
  if (m.type() === "error") logs.push(`[error] ${m.text().slice(0, 300)}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`));
const shot = async (name) => {
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => undefined);
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 120000 });
};
const step = (s) => console.log(`- ${s}`);

await page.goto(origin + "/", { waitUntil: "networkidle", timeout: 120000 });
await shot("01-hero");
step("hero loaded");

await page.getByRole("button", { name: /^Set sail/ }).first().click();
await page.waitForFunction(() => document.documentElement.dataset.world === "running", null, { timeout: 180000 });
await page.waitForTimeout(2500);
await shot("02-world");
step(`world running at ${await page.evaluate(() => location.href)}`);

if (mobile) {
  // Drag the joystick up for a few seconds.
  const box = page.viewportSize();
  const x = 80;
  const y = box.height - 140;
  await page.touchscreen.tap(x, y);
  step("touch tapped");
} else {
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(2600);
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(800);
  await shot("03-sailed");
  step("sailed north");
}

// Fast travel to SKELMET through the map, then open its panel.
await page.keyboard.press("KeyM");
await page.waitForTimeout(1200);
await shot("04-map");
await page.getByRole("navigation", { name: "Fast travel" }).getByRole("button", { name: /SKELMET/ }).click();
await page.waitForTimeout(2500);
await shot("05-skelmet");
const near = await page.locator(".world-prompt").textContent();
step(`prompt: ${near}`);
await page.locator(".world-prompt").click();
await page.waitForTimeout(1500);
await shot("06-panel");
step("panel open");

await page.getByRole("link", { name: /Read the case study/ }).click();
await page.waitForURL(/\/work\/skelmet/, { timeout: 60000 });
await page.waitForTimeout(1500);
await shot("07-case-study");
step(`navigated to ${page.url()}`);

await page.goBack();
await page.waitForFunction(() => document.documentElement.dataset.world === "running", null, { timeout: 60000 });
await page.waitForTimeout(1500);
await shot("08-back");
step(`back at ${page.url()}`);

await page.getByRole("button", { name: /Classic site/ }).click();
await page.waitForTimeout(1200);
await shot("09-classic");
step(`classic at ${page.url()} world=${await page.evaluate(() => document.documentElement.dataset.world)}`);

console.log(JSON.stringify({ errors: logs.slice(0, 20) }, null, 1));
await browser.close();
