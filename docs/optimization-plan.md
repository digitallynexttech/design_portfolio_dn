# Optimisation plan: fit the Vercel free plan, and never lag

12 Oct 2026. Brief from Karan: "make it work on the Vercel free plan without lagging; make it so optimized".

## What the free (Hobby) plan allows each month

| Resource | Hobby allowance | What uses it here |
|---|---|---|
| Fast Data Transfer | 100 GB | every byte sent to visitors |
| Function invocations | 1,000,000 | pages that render on request, `/api/weather` |
| Active CPU | 4 hours | the same functions' CPU time |
| Fast Origin Transfer | 10 GB | CDN cache misses |
| Image Optimization transformations | **5,000** | every new `next/image` size × format |
| Image cache reads / writes | 300K / 100K | `next/image` served from cache |

Hobby is for non-commercial use; a company site should move to Pro when it launches for real. Until then, everything below keeps it comfortably inside the free allowances.

## Baseline (live, 12 Oct, empty cache)

| Visit | Transfer | Notes |
|---|---|---|
| Home, first paint | 0.55 MB | each web font downloads twice (148 KB of fonts) |
| Home, scrolled through | 1.9 MB | the 568 KB SKELMET skull model loads only for the particles; 760 KB of 3D code |
| Case study (SKELMET) | 1.4 MB | skull model 568 KB |
| 3D world | 8.6 MB | textures 3.7 MB, models 4 MB (KYG mascots 1.5 MB) |
| Rendering | 66 case-study pages are only partly static | each view runs a function |

## Targets

- **Zero functions per page view.** Every page fully static; only `/api/weather` runs, cached hard.
- **Images:** under 1,500 distinct optimised variants across the whole site (5,000 allowed), cached for 31 days.
- **Weight:** first paint ≤ 0.45 MB; home scrolled through ≤ 1.2 MB; world ≤ 5 MB on desktop, ≤ 3.5 MB on phones.
- **Smoothness:** home scrolling holds 60 fps on a mid-range phone (no frame over 50 ms at 4× CPU slowdown); the world starts on Full and steps down by itself if a device can't hold it, unless the visitor picked a quality in Options.
- **Scores:** Lighthouse mobile ≥ 95 on home, ≥ 90 on case studies; accessibility, best practices and SEO stay at 100.

## Workstreams (one agent each, separate git worktrees, strict file ownership)

1. **Platform: free-plan fit.** Make all case-study pages fully static; cache `/api/weather` per city and call it once per visit. Tune `next/image`: WebP only, fewer sizes, one quality, 31-day cache. Add long cache headers for files that never change (models, textures, video, images).
2. **Home: smooth and light.** Bake the skull's particle points into a small file instead of loading the 568 KB model on home. Load the 3D code only as the visitor reaches the parts that need it. Cut main-thread work in the water, particles, hero and services reel, and verify at 4× CPU slowdown.
3. **Weight: fonts, case studies, shared assets.** Fix the double font download. Trim the font files and preload only what the first paint needs. Lighten the case-study exhibits and images. Remove unused packages and shrink the reel video.
4. **World: lighter and adaptive.** Shrink textures and models (KYG mascots) and keep phone downloads small. Full by default, but step down automatically when a device can't hold it (an explicit choice in Options is kept).

Then: merge, production build, measure against the targets, push, check live.
