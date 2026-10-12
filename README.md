# Digitally Next Design: portfolio

The design and development studio's portfolio, built to live at **design.digitallynext.com**.

- **Concept:** "We are water": one liquid medium that takes the shape of each client's world.
- **Planning documents:** the plan is in [docs/PLAN.md](docs/PLAN.md), and the research it is based on is in `docs/research-brief.md` and `docs/dnms-findings.md` (internal: kept on the studio's machines, not in this repository). Draft 2, the explorable 3D world, is in [docs/draft-2.md](docs/draft-2.md): research, concept, and a build-status section listing where the build departs from the plan.

## Run it

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm build && pnpm start # production
```

- **Next.js 16.4** (App Router, Cache Components), with **React 19.3**, **Tailwind 4**, **three.js** with React Three Fiber, and **GSAP**.
- **Every page is prerendered:** 100 routes in the build (pages plus share images, icons and SEO files); the sitemap lists 64 addresses. The one dynamic route is `/api/weather`.

## Where things live

| Path | What it is |
|---|---|
| `content/work/<slug>.ts` | **One case study per file**, typed by `content/types.ts`. Register new ones in `content/work/index.ts`. |
| `content/exhibits/<slug>.ts` | Data for each case study's live exhibit |
| `content/team.ts`, `studio.ts`, `clients.ts`, `recognition.ts`, `archive.ts` | Team, services, process, logos, awards, older work |
| `app/` | Routes: `/`, `/work`, `/work/[slug]` (chapter 01), `/work/[slug]/[chapter]`, `/services`, `/about`, `/reel`, plus SEO files |
| `features/world/` | **The archipelago (draft 2):** the explorable 3D world behind "Set sail" on the home page. `layout.ts` is the map; `waves.ts` is the one wave model shared by the GPU and the physics; `engine/` is the three.js (WebGPU + TSL) engine with its own floating-body physics, weather and islands; `ui/` is the interface (HUD, panels, map, logbook, options, touch controls). See [docs/draft-2.md](docs/draft-2.md). |
| `content/world.ts` | The small digest of the content that the world receives, so case-study chapters never ship to it. |
| `public/world/tex`, `public/world/models` | The world's photo-scanned surfaces (sand, grass, rock, timber, teak, bark, concrete) and props (buoys, markers, lifebuoys, crates, lamps, boulders, fern), all CC0 from Poly Haven. Made by `python -I scripts/world-assets.py`, which downloads, resizes and compresses them (re-running skips finished files). |
| `app/api/weather/route.ts` | The visitor's approximate weather (Vercel geolocation headers → MET Norway), nothing stored. Falls back to New Delhi. |
| `features/water/` | The water. `surface/` is the ripple simulation behind every page. `forms/` is the particles that pour into each flagship's shape on the home page. `bus.ts` lets anything drop waves into it. |
| `features/exhibits/` | The live exhibit at the top of each case study. WebGL ones: SKELMET, Know Your Genes. The rest are DOM or canvas. |
| `features/stage/` | Device quality tiers (`tier.ts`). The rule that heavy WebGL waits for the visitor's first move, touch or scroll (`engage.ts`). |
| `components/liquid/` | `LiquidSurface`: every pop-up flows in from an edge like liquid. Built on the native `<dialog>`. |
| `components/case-study/` | Chapter navigation, hurdle cards, before/after demos, architecture diagrams, block renderer |
| `public/work/<slug>/` | Screenshots, posters and preview loops per case study |
| `app/styles/` | Area stylesheets imported by `app/globals.css`: `forms.css` (hero and particle forms), `home.css`, `work.css` (case studies), `pages.css`. Site-wide tokens (type scale, spacing, radii, easings, the `.btn` system) stay in `globals.css`. |

## Editing content
- **Writing:** plain language, calm and short. The rules are at the top of `content/types.ts` and in `docs/content-brief.md`.
- **Numbers:** every number needs a `source`. Sources are never shown on the site.
- **Testimonials:** they show in development, and on previews with `NEXT_PUBLIC_SHOW_DRAFTS=1`. **Production hides any quote whose `approved` is `null`.** Set `approved: { by, date }` once the named person has agreed to the wording.
- **Hurdle chapters:** a case study with more than five hurdles splits into two pages, "on screen" and "under the hood", using each hurdle's `group`.
- **Themes:** each case study's `theme` takes over every page of that study. Muted text colour is computed from the theme for contrast, so it doesn't need to be set by hand.

## Quality checks

```bash
pnpm exec tsc --noEmit && pnpm exec eslint .
node scripts/capture.mjs http://localhost:3000 ./.captures / /work /work/skelmet   # screenshots + console errors
node scripts/a11y.mjs http://localhost:3000 / /work /work/skelmet                   # axe, WCAG 2.2 AA
node scripts/world-flow.mjs http://localhost:3000 .captures/flow                    # the world, end to end (desktop)
node scripts/world-flow-phone.mjs http://localhost:3000 .captures/phone             # the world on an emulated Pixel 7
node scripts/world-a11y.mjs http://localhost:3000                                   # axe inside the open world
node scripts/world-shot.mjs "http://localhost:3000/world-test?tier=3&time=night&at=skelmet" out.png   # dev only
```

`/world-test` is a development-only harness (404 in production) that renders the engine bare. Its query string sets `tier` (1–3), `quality` (1–3, which turns auto quality off), `time` (dawn/day/dusk/night), `season`, `weather` (clear/cloudy/rain/storm/mist/snow), `at` (an island id, for fast travel) and `zoom`. Add `?webgl` to any world URL to force the WebGL 2 path. `window.__world.stats()` reports frames per second, CPU time per frame, draw calls and triangles.

**Last run (10 Oct 2026, production build, after the site-wide design pass):**
- axe: 0 violations on 25 routes (home, /work, /services, /about, /reel, 404, offline, and chapters across every case study), desktop and phone, and inside the open world.
- Lighthouse: desktop 99–100 performance on home, /work, a case study and /about; mobile 88–93 (home), 91 (/work), 89 (case study), 88 (/about). Accessibility, best practices and SEO are 100 on every route tested. The home mobile LCP is now the "We are water." headline waiting on its web font.
- The world: still about 10.5 s from Set sail to sailing; desktop and Pixel 7 flows pass with no console errors.

**Earlier run (10 Oct 2026, after the world's realism pass):**
- axe: 0 violations on home, `/work`, all making-of chapters, and inside the open world (HUD, map, panel, logbook, options).
- Lighthouse home: desktop 100 / 100 / 100 / 100; mobile performance 90–91, the rest 100. The mobile LCP is the hero's intro text repainting when the web font arrives.
- The world: WebGPU in Chrome (NVIDIA GPU) at 67–73 fps on full quality, about 10.5 s from Set sail to sailing; WebGL 2 in headless Chromium at tiers 1 and 2; desktop and Pixel 7 flows pass with no console errors.

**Earlier run (9 Oct 2026):** the same axe result; Lighthouse mobile performance 94.

**Draft 1 (8 Oct 2026):** axe 0 violations across 15 routes; Lighthouse desktop 100 across the board, mobile performance 89–96.

## Before launch
- **Domain:** point design.digitallynext.com at the deployment.
- **Main site:** link to it from digitallynext.com.
- **Testimonials:** get each one approved, then set `approved` (see above).
- **SEO log:** record the launch in `SEO/documentation/document.md`.
- **The world on real devices:** sail it on an iPhone (Safari), a mid-range Android and Firefox before launch; so far it has run in Chrome and Edge on a desktop GPU and in emulation.
- **Hosting:** the visitor's own weather needs Vercel's geolocation headers. Elsewhere, every visitor gets New Delhi's weather (which still works).
- **Credit line:** the making-of build chapter credits Karan Joshi "pairing with Claude, Anthropic's AI model" (`content/work/making-of.ts`). Keep or remove before launch.
