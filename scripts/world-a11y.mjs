// axe (WCAG 2.2 AA) inside the open world: the HUD, a project panel, the map, the logbook and options.
// Usage: node scripts/world-a11y.mjs <origin>
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const origin = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const results = [];
const check = async (label) => {
  await page.waitForTimeout(2500);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  results.push({ label, violations: r.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`) });
};
await page.goto(origin + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /^Set sail/ }).first().click();
await page.waitForFunction(() => document.documentElement.dataset.world === "running", null, { timeout: 180000 });
await check("world HUD");
await page.keyboard.press("KeyM");
await check("map");
await page.getByRole("navigation", { name: "Fast travel" }).getByRole("button", { name: /SKELMET/ }).click();
await page.waitForTimeout(2000);
await page.keyboard.press("Enter");
await check("study panel");
await page.keyboard.press("Escape");
await page.waitForTimeout(1500);
await page.keyboard.press("KeyL");
await check("logbook");
await page.keyboard.press("Escape");
await page.waitForTimeout(1500);
await page.keyboard.press("KeyO");
await check("options");
for (const r of results) console.log(`${r.label}: ${r.violations.length ? r.violations.join("\n  ") : "0 violations"}`);
await browser.close();
