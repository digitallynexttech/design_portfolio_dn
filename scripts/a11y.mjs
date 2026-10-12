// WCAG 2.2 AA check with axe on each route (desktop + phone). Usage: node scripts/a11y.mjs <baseUrl> <route> [route ...]
import { chromium, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const [base, ...routes] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let failures = 0;
for (const [label, options] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["phone", { ...devices["iPhone 13"] }]]) {
  const context = await browser.newContext({ ...options, reducedMotion: "reduce" });
  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(base + route, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(1200);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    for (const v of result.violations) {
      failures += v.nodes.length;
      console.log(`[${label} ${route}] ${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`);
      for (const n of v.nodes.slice(0, 2)) console.log(`    ${n.target.join(" ")} :: ${(n.failureSummary ?? "").split("\n")[1] ?? ""}`);
    }
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log(failures ? `${failures} violation nodes` : "No axe violations.");
