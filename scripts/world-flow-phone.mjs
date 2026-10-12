// Phone check (Pixel 7): hero → sound on → Set sail → joystick drag → boost → map → dock → panel.
// Usage: node scripts/world-flow-phone.mjs <origin> <outDir>
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [origin = "http://localhost:3000", out = ".captures/phone"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ ...devices["Pixel 7"] });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));
page.on("pageerror", (e) => errors.push(e.message.slice(0, 300)));
const shot = (n) => page.screenshot({ path: `${out}/${n}.png`, timeout: 120000 });
const cdp = await context.newCDPSession(page);
const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });

await page.goto(origin + "/", { waitUntil: "networkidle" });
await shot("01-hero");
// Sound is a switch beside Set sail: turn it on, then sail.
await page.getByRole("button", { name: "Sound" }).tap();
await page.getByRole("button", { name: /^Set sail/ }).first().tap();
await page.waitForFunction(() => document.documentElement.dataset.world === "running", null, { timeout: 180000 });
await page.waitForTimeout(2000);
await shot("02-world");

const { height } = page.viewportSize();
await touch("touchStart", 90, height - 170);
for (let i = 0; i < 12; i++) {
  await touch("touchMove", 90 + i * 2, height - 170 - i * 5);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(600);
await shot("03-joystick");
await page.waitForTimeout(2200);
await touch("touchEnd", 0, 0);
await page.waitForTimeout(800);
await shot("04-sailed");
const pos = await page.evaluate(() => (window).__lastBoat ?? null);
console.log("boat:", JSON.stringify(pos));

await page.getByRole("button", { name: "Map" }).tap();
await page.waitForTimeout(2500);
await shot("05-map");
await page.getByRole("navigation", { name: "Fast travel" }).getByRole("button", { name: /Know Your Genes/ }).first().tap();
await page.waitForTimeout(3000);
await shot("06-kyg");
await page.locator(".world-prompt").tap({ force: true });
await page.waitForTimeout(3000);
await shot("07-panel");
console.log(JSON.stringify({ errors }, null, 1));
await browser.close();
