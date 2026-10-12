# Digitally Next portfolio: build plan (v3)

> **Build status, 8 Oct 2026:** v1 is built and awaiting Karan's review. See README.md for how to run it.
>
> **What was built**
>
> - Home, Work and archive, 10 multi-chapter case studies (each with a live exhibit), Services, About, Reel, 404, offline page and PWA.
> - All SEO files.
> - Production build: 89 prerendered pages.
>
> **Changes from this plan**
>
> - **Water surface:** a ripple simulation instead of stable fluids (§13.3).
> - **Particle counts:** 7k / 18k / 36k per tier instead of the 16k–524k range.
> - **When WebGL loads:** heavy WebGL waits for the visitor's first move, touch or scroll on every device (`features/stage/engage.ts`).
> - **Testimonials:** drafts are hidden in production rather than failing the build (§9).
> - **Lighthouse mobile:** Know Your Genes scores 89, one point under the §14.1 budget.

Revised 8 Oct 2026. Source material: [research-brief.md](research-brief.md).
Live address: **design.digitallynext.com**. Built by Karan and Claude.

### What changed since v2

| Karan's direction                                                          | What changed                                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Industry-standard sitemap and sections, less reliance on the old portfolio | New sitemap that follows award-winning agency sites (§5): Work, Services, About, plus external links for Careers and Contact. The old portfolio is no longer a reference. |
| It will be submitted for website design awards                             | New §2 maps each award's judging criteria to specific parts of the site. New §15 lists the award submission kit.                                                          |
| The phone version has to be just as good                                   | New §7: a mobile experience designed on its own terms, not shrunk down. Includes tilting the phone to pour the water.                                                     |
| Robot dropped completely                                                   | Removed from the plan. Something new may come later.                                                                                                                      |
| DNMS in, Cue out                                                           | Cue removed. H2S becomes the 4th flagship, because it is literally about water.                                                                                           |
| Hurdles worked out from the code; company data from DNMS                   | Hurdles now come from three sources: code, git history and DNMS task history (§10.2). Team names and project credits come from DNMS (§11).                                |
| Full client permission; testimonials drafted in-house for now              | Testimonials are drafted by us, but **production builds refuse any quote not marked as approved** (§9).                                                                   |
| Team is Karan + Claude                                                     | Schedule re-planned at about 13 weeks (§16). Design happens directly in code, with a review from Karan at the end of each phase.                                          |

---

## 0. At a glance

**Purpose.** Show how far Digitally Next's designers and developers can go, so that clients _want_ to work with us. The site should also be good enough to win **Awwwards Site of the Day, Developer and Mobile Excellence awards, and CSS Design Awards**.

**Concept: "We are water."**

- One continuous liquid takes the shape of each client's world:
  - it forms the walking-X logo, then pours into a skull, twists into a DNA helix, flows between DNMS screens, and turns cloudy hard water clear;
  - pop-ups flow in like liquid; pages flow into each other.
- On phones, you tilt the device and the water sloshes.

**Scope for v1**

- Main pages: Home, Work, Services, About, 404.
- **4 flagship case studies × 6 chapters**: SKELMET, Know Your Genes, DNMS, H2S.
- **6 standard case studies × 4 chapters**: Happy Ganga, Leocym, KYG microsite network, TalentiFi-X, Chetan Mangalwedhe, RealtyCanvas.
- An archive of older projects.
- A showreel.
- Contact and Careers link out to digitallynext.com.

**Timeline.** About 13 weeks (§16).

---

## 1. Decisions

| #   | Decision               | Answer                                                                                                                                                                                                                                     |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Hero line              | **Option A** (the three-beat sequence in §3.2)                                                                                                                                                                                             |
| D2  | Robot mascot           | Removed completely                                                                                                                                                                                                                         |
| D3  | Brand red              | `#E21F26`. Water is tinted with teal `#0EC8C5`; ink `#0A0A0A`; paper `#FAFAF8`.                                                                                                                                                            |
| D4  | Fonts                  | Stack Sans Headline + Stack Sans Text + Geist Mono. **Check in Phase 0** that Headline is on Google Fonts.                                                                                                                                 |
| D5  | Client permissions     | Granted for every featured client                                                                                                                                                                                                          |
| D6  | Domain                 | design.digitallynext.com                                                                                                                                                                                                                   |
| D7  | DNMS / Cue             | DNMS included as a studio product (demo data only); Cue not included                                                                                                                                                                       |
| D8  | Team                   | Karan + Claude                                                                                                                                                                                                                             |
| D9  | Reviews / testimonials | No review platforms. We draft testimonials, and each one ships only once it is marked approved.                                                                                                                                            |
| D10 | Company facts          | **12+ years** · **50+ brands** · **12–15 people**. No founding year appears anywhere on the site.                                                                                                                                          |
| D11 | Hurdle sources         | Code, git history and DNMS task history. Company data comes from DNMS.                                                                                                                                                                     |
| D12 | Team section           | Real studio group photos from digitallynext.com (`careers/c1–c11`, `figma/careers/careers-team`, `careers-workhere`). The current team is listed by name and role in **large type**, with no individual portraits, since none exist (§11). |
| D13 | Former team members    | Not credited                                                                                                                                                                                                                               |

---

## 2. What the awards judge, and how we score

| Award                          | What it judges                                                                                                                      | Where we earn it                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Awwwards Site of the Day**   | **Design 40%**, **Usability 30%**, **Creativity 20%**, **Content 10%**. Scored by 18+ jury members; outliers removed.               | **Design:** one strict system (type, grid, colour, motion tokens) with client themes inside it. **Usability:** a clear nav, flow rules (§4), fast, accessible. **Creativity:** the water concept and its touch and tilt interactions. **Content:** case studies with real hurdles and fixes, which is rare and valuable. |
| **Awwwards Developer Award**   | Code quality: semantic HTML and SEO, animations and transitions, accessibility, performance, responsive design, markup and metadata | Server-rendered semantic HTML · View Transitions · WCAG 2.2 AA · §13 budgets enforced in CI · structured data                                                                                                                                                                                                            |
| **Awwwards Mobile Excellence** | Mobile friendliness, performance, usability and PWA. A score of **75/100** earns the badge.                                         | §7 mobile design · mobile Lighthouse ≥ 90 · installable PWA with an offline page                                                                                                                                                                                                                                         |
| **CSS Design Awards**          | **UI 40%**, **UX 30%**, **Innovation 30%**                                                                                          | Liquid surfaces, the water engine and tilt-to-pour are the innovation; the rest is the same work as above                                                                                                                                                                                                                |
| FWA / CSS Winner (secondary)   | Innovation and craft                                                                                                                | The water engine and exhibits                                                                                                                                                                                                                                                                                            |

**What this means for the build:** usability and design together are 70% of the Awwwards score. The plan treats clarity, speed and consistency as the base, and the spectacle sits on top of them.

---

## 3. Concept and copy

### 3.1 "We are water"

- **Water takes the shape of whatever holds it.** That is what we do for every client:
  - an editorial calm for a DNA-testing lab;
  - a black garage glow for a helmet brand;
  - an operating system for our own company.
- **The metaphor becomes literal for three clients:** H2S (hard water to soft), Happy Ganga (a river) and Leocym (water treatment).
- **Colour:**
  - water is tinted with brand teal `#0EC8C5`;
  - brand red `#E21F26` marks energy, calls to action and the walking-X's shoes.

### 3.2 Hero line options (D1)

|         | Line                                                                                                                                     | Tone                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **A** ★ | **"We are water."** → on scroll: **"Pour us into anything."** → **"Soft enough to take any shape. Relentless enough to carve canyons."** | A three-beat sequence played as the water morphs. Bold, and builds. |
| B       | "Shapeless by nature. Unforgettable by design."                                                                                          | Confident, polished                                                 |
| C       | "Every brand is a different glass. We fill them all."                                                                                    | Explains the concept outright                                       |
| D       | "Water carved the Grand Canyon. Your website is the easy part."                                                                          | Cheeky, attention-grabbing                                          |
| E       | "Give us any shape. We'll fill it, then we'll move mountains."                                                                           | Ambitious                                                           |
| F       | "No fixed form. No limits."                                                                                                              | Minimal, punchy                                                     |

Supporting line beneath the hero: _"Digitally Next - design, development and 3D, from New Delhi."_

### 3.3 Voice

- The existing brand voice: calm, clipped, three-part statements; headings end with a teal full stop.
- Water words are used sparingly - _pour, shape, flow, carve_ - never more than one per paragraph.
- Hurdle chapters are written in plain language for non-developers.

---

## 4. Rules for every element

### 4.1 The UX test

Every element must do at least one of these:

- explain the work;
- guide the visitor;
- prove our skill on something real.

**Out:** sound, custom cursor, preloader, robot, Lab page, particle playground, easter eggs, 3D gallery ring, contact form, newsletter, chat widget, cookie banner.

### 4.2 Flow rules

1. **One continuous water body** on a persistent canvas. It changes shape; it never blinks out.
2. **Transitions follow direction:** next from the right, back from the left, deeper from below.
3. **Things grow from what you touched.** Pop-ups and page transitions start at the element you tapped.
4. **No dead ends.** Every page ends by handing you on to the next logical place.
5. **Native scroll, never hijacked.** Sticky sections only.
6. **One rhythm:** `flow-in` 600 ms (expo-out `0.16,1,0.3,1`), `flow-out` 350 ms, `ripple` 900 ms.
7. **The water responds to you:** cursor, touch, scroll speed, and on phones, tilt. It never moves on its own in a way that pulls attention from the content.

---

## 5. Sitemap (industry standard)

Award-winning agency sites converge on **Work · Services · About · Careers · Contact**, with detailed case studies at the centre. We follow that.

```
design.digitallynext.com
├── /                         Home
├── /work                     Work index (grid + filters, archive below)
│   └── /work/[slug]          Case study, chapter 01 Overview
│       └── /work/[slug]/[chapter]   brief · design · build · hurdles · outcome
├── /services                 Services: what we do, how, and the proof
├── /about                    About: story, principles, team, process, clients, recognition, studio
├── /reel                     Showreel, opened in the Liquid media viewer (also a sharable route)
├── /contact   → 308 redirect to https://www.digitallynext.com/contact
├── /careers   → 308 redirect to https://www.digitallynext.com/careers
├── 404 · /offline (PWA)
└── sitemap.xml · robots.txt · llms.txt · manifest.webmanifest · share images per route
```

**Main navigation:** Work · Services · About · **Start a project ↗**

**Footer:**

- Work · Services · About · Careers ↗ · Journal ↗ (the main site's blog) · Privacy ↗ (the main site's policy);
- socials;
- "Part of Digitally Next".

---

## 6. Pages

### 6.1 Global shell

- **Water stage.** One persistent WebGL canvas.
- **Header.**
  - Walking-X logo and nav.
  - It hides when you scroll down and comes back when you scroll up.
  - On mobile it becomes a **bottom "Menu" pill** within thumb reach, which opens a Liquid sheet (§7).
- **Page transitions.** View Transitions for the DOM, plus a water wave from the travel direction.
- **Scroll.** Lenis on desktop, native scroll on touch.
- **First paint.** The headline appears instantly; the water fades in once ready. No preloader.
- **Footer.** As in §5. The water lies still here, as a calm surface.

### 6.2 Home `/`

| #   | Section (industry-standard order) | Content                                                                                                                                       | Water / interaction                                                                                                                                        |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Hero**                          | The chosen hero line (§3.2) · supporting line · **▶ Play reel** · Scroll ↓                                                                    | The water forms the walking-X; cursor or touch stirs it; tilt on phones. The three-beat line plays as the water reshapes.                                  |
| 2   | **Positioning**                   | 2–3 sentences: who we are and what we do, then the numbers: **12+ years · 50+ brands · 12–15 people**                                         | The water settles; the text fills in as you scroll                                                                                                         |
| 3   | **Selected work**                 | The 4 flagships. Each shows: client, one line, 2 numbers, a short quote, "View case study →"                                                  | The water **pours into each project's form** (§12) and the background takes that project's colours. Hover or tap and the form settles into the real asset. |
| 4   | **More work**                     | 6 standard case studies + "All work →"                                                                                                        | A short preview flows up on hover or long-press                                                                                                            |
| 5   | **Services**                      | 6 services, one line each, each listing its proof projects → /services                                                                        | Water fills each card as it enters view                                                                                                                    |
| 6   | **Clients**                       | Logo wall (permission granted)                                                                                                                | A slow current; pauses on hover or focus                                                                                                                   |
| 7   | **Testimonials & recognition**    | Approved quotes · CorporateLiveWire Global Awards 2023/24 · JioStar empanelled partner (T20 World Cup / IPL) · SMB Connect · WASME · Onfinity | Testimonial carousel you can drive by keyboard                                                                                                             |
| 8   | **About teaser**                  | A real studio group photo and the team's names, then "Meet the studio →"                                                                      | The photo has a slow water-ripple displacement on hover or touch                                                                                           |
| 9   | **Closing CTA**                   | "Have something that needs shaping?" → **Start a project ↗**                                                                                  | On click the water **flows out** to the right, then the browser goes to digitallynext.com/contact                                                          |

### 6.3 Work `/work`

- **Grid of case studies.** Each card shows the poster, client, year, disciplines and "6 chapters".
- **Filters:** discipline, industry, platform. Kept in the URL; on mobile they open as a Liquid sheet.
- **Archive below the grid:** Advent Global, iMET Global, Khaleej, House of Nandini, Mauli, Gajna Overseas, Sanjivani Edge, Opinova Foundation, NeoTech World Lab, NEET Playbook, Deepak Goel. Cards link to the live sites.

### 6.4 Case study: chapters

- **Routes:** `/work/[slug]` is chapter 01; `/work/[slug]/[chapter]` is the rest.
- **Chapter count:** flagships have 6; standard case studies have 4 (Brief, Design and Build combined).

| Chapter                | Content                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **01 Overview**        | The **live exhibit** (§12) · client, year, services, platform, live link · a 3-sentence summary · 3 numbers · short quote · team credits |
| **02 Brief**           | The client's business, the problem, constraints, what success meant                                                                      |
| **03 Design**          | The identity shown live: colour tokens, a type specimen in the client's font, key components and decisions                               |
| **04 Build**           | An animated architecture diagram, key systems in plain language, the stack                                                               |
| **05 Hurdles & fixes** | 4–8 hurdles in the format below. Split into two pages if there are more than 5.                                                          |
| **06 Outcome**         | Results (sourced numbers only), the full testimonial, what happened after launch → next project                                          |

**Each hurdle follows the same format:**

- the hurdle;
- why it was hard;
- what we tried;
- the fix;
- the result;
- **see it** - an interactive before/after where it helps explain;
- who solved it.

**Navigation inside a case study:**

- a sticky chapter bar whose progress line fills like water;
- next and previous links at the end of every chapter;
- the client's theme stays on across all of its chapters.

### 6.5 Services `/services`

Six services. Each says: what you get, how we approach it, the tools, and **projects that prove it** (links into the relevant case-study chapter).

| Service                                                         | Proof                                        |
| --------------------------------------------------------------- | -------------------------------------------- |
| **Brand & digital identity**                                    | Happy Ganga, Leocym, KYG microsites          |
| **UI/UX & design systems**                                      | Know Your Genes, Leocym, DNMS                |
| **Websites & creative development** (Next.js, WebGL/3D, motion) | SKELMET, Know Your Genes, Chetan Mangalwedhe |
| **E-commerce** (Shopify and custom)                             | H2S, Happy Ganga, SKELMET                    |
| **Platforms & products**                                        | DNMS, Know Your Genes portals, RealtyCanvas  |
| **Search & AI visibility** (SEO/AEO/GEO)                        | TalentiFi-X, H2S city pages                  |

The page ends with the process: Discover · Design · Build · Test · Launch · Care. Each step links to a real hurdle.

### 6.6 About `/about`

1. **Story.** 12+ years, from Delhi; part of the Digitally Next group led by Group CEO Deepak Goel. Then "We are water".
2. **Principles**, four short lines:
   - **Adapt** - take the client's shape;
   - **Flow** - no friction for users;
   - **Carve** - persistence through hard problems (links to hurdles);
   - **Clear** - honest, plain communication.
3. **Team** (D12):
   - a full-bleed studio group photo;
   - VIM and WEM names in large type, each with role and the projects that person shipped (hovering or tapping a name lights up their projects);
   - the rest of the studio in a smaller row (§11).
4. **How we work.** The six steps, with evidence.
5. **Clients & recognition.** Logos, awards, alliances.
6. **The studio.** Office photos (careers set `c1–c11`).
7. Careers ↗ and Start a project ↗.

### 6.7 Reel `/reel`

- **What it is:** a 60–90 s showreel of the **real sites in motion**. Built from Playwright screen recordings, assembled with ffmpeg, under 8 MB with a poster frame.
- **Where it plays:** opens in the Liquid media viewer from the hero's "Play reel". It is also a page of its own, for sharing.

### 6.8 404 and offline

- **404:** the water ripples. "This page doesn't exist. These do:" with three case studies and a link to Work.
- **Offline (PWA):** a short note with a "try again" button, plus whatever was already cached.

---

## 7. Mobile: designed as its own experience

The phone version is **designed separately, not shrunk down**. Every Phase 0 style frame has a 390 px version, and every section is reviewed on a real phone before it is called done.

| Area            | Mobile design                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**       | Touch is a first-class input. Drag stirs the water; a tap sends a ripple. **"Tilt to pour":** an opt-in toggle (iOS needs a tap to grant motion permission), after which tilting the phone sloshes the water like a glass. It turns off automatically under reduced motion. |
| **Navigation**  | A bottom Menu pill in the thumb zone opens a Liquid sheet from below. The case-study chapter bar becomes a compact progress pill that opens into a chapter sheet. "Next chapter" is a bottom pill.                                                                          |
| **Composition** | Mobile layouts are designed per section, not stacked desktop columns. Big type, single column, generous spacing, and water forms framed for portrait.                                                                                                                       |
| **Exhibits**    | Adapted for touch: drag the skull with one finger, tap a mascot, swipe the H2S slider, pinch-free throughout.                                                                                                                                                               |
| **Quality**     | Tiers come from an **on-device benchmark, not "is it a phone"**. Recent phones (iPhone 13+, Snapdragon 8-class) get full liquid shading. Older ones get the lighter tier.                                                                                                   |
| **Performance** | Mobile LCP < 2.0 s on 4G · mobile Lighthouse ≥ 90 · < 1.5 MB before interaction · Liquid surfaces at 60 fps                                                                                                                                                                 |
| **PWA**         | Manifest, icons, theme colour, install prompt (never forced), offline page, and cached shell and posters. This covers the Mobile Excellence "PWA" criterion.                                                                                                                |
| **Testing**     | iPhone 13 and 15 (Safari) · Pixel 6a · a low-end Samsung A-series · Karan's own phone at every review                                                                                                                                                                       |

---

## 8. Liquid surface system (all pop-ups)

Every overlay flows in from a side or out of the control that opened it, the way Apple's Liquid Glass sheets and menus do, and drains back the same way.

**Overlays in v1 (only these):**

- mobile menu sheet;
- filter sheet;
- chapter sheet (mobile);
- media and reel viewer (morphs out of the thumbnail or button);
- exhibit info popover.

**Behaviour:**

- **Opening:**
  - The leading edge bulges out like liquid, overshoots slightly, then settles under spring physics (`flow-in`).
  - The content fades up once the surface has settled.
- **Closing:** it drains back into where it came from (`flow-out`). Esc, clicking outside and swiping toward the origin all close it, and it can be interrupted at any point.
- **Material:**
  - background blur and saturation, a soft edge highlight, and a tint from the water underneath;
  - refraction distortion where the browser supports it (Chromium), plain blur elsewhere.
- **Link to the water:** the background water gets a push from the same edge.
- **Accessibility:**
  - Radix Dialog and Popover underneath: focus trap, inert background, focus returned to the trigger;
  - reduced motion swaps the animation for a 150 ms fade.
- **Performance:** only transforms and clip-path animate.

**Build:** one primitive, `components/liquid/LiquidSurface.tsx`.

- `origin`: `left` | `right` | `bottom` | `{ anchor }`.
- `variant`: `sheet` | `popover` | `viewer`.
- The shape is an SVG path driven by a spring solver and applied as a `clip-path`.
- The prototype is a **Phase 0 spike**.

---

## 9. Social proof

| Type            | What we have                                                                                                                                                                                                                                             | Where it shows                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Recognition     | CorporateLiveWire Global Awards 2023/24 winner; JioStar empanelled agency partner (ICC Men's T20 World Cup, TATA IPL)                                                                                                                                    | Home §7, About                                    |
| Alliances       | SMB Connect, WASME, Onfinity                                                                                                                                                                                                                             | Home §7, About                                    |
| Clients         | About 30 logos (permission granted)                                                                                                                                                                                                                      | Home §6, About                                    |
| Results         | Public on digitallynext.com: Khaleej 5X ROAS in month one · Mauli 4X ROAS in 2 months · Signia 400% media recognition / +30% revenue · Advent Global 3X visibility. From our own logs: TalentiFi-X mobile Lighthouse 79→94 · SEO checklist 81→123 / 199. | Home §3, chapter 06                               |
| Testimonials    | **Drafted by us** for each featured client                                                                                                                                                                                                               | Chapter 01 (short) and chapter 06 (full), Home §7 |
| Proof it's real | Every case study links to its live site; the reel shows the sites running                                                                                                                                                                                | Throughout                                        |

**Rule for testimonials.** Each quote in `content/testimonials.ts` has an `approved: { by, date } | null` field.

- Development and preview builds show drafts, with a visible "draft" marker.
- **Production builds fail** if a published page uses an unapproved quote. This is the same idea as the build-time claims check on Leocym.
- Approval means the named person has seen and agreed to the wording.

---

## 10. Case-study content

### 10.1 Line-up

| Tier     | Project               | Chapters | Credits (DNMS project teams)                                                                                                                                                               |
| -------- | --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flagship | **SKELMET**           | 6        | Web: Diwakar Jha, Karan Joshi · Design: Pratik Paul · Video: Dev Lal · MAP: Harsh Kumar · Account: Teesha Jain                                                                             |
| Flagship | **Know Your Genes**   | 6        | Web: Diwakar Jha (payments, checkout, test pages, migration), Karan Joshi (pages, QA, 13-domain audit, mascot) · Design: Pratik Paul, Komal Gautam · Video: Dev Lal · Account: Teesha Jain |
| Flagship | **DNMS**              | 6        | Web: Karan Joshi, Diwakar Jha · Design: Komal Gautam · Video: Dev Lal · Account: Teesha Jain                                                                                               |
| Flagship | **H2S**               | 6        | Web: Mridul Singh Bisht (all builds), Diwakar Jha (planning) · Design: Komal Gautam · Video: Dev Lal · Account: Teesha Jain                                                                |
| Standard | Happy Ganga           | 4        | Web: Karan Joshi (lead), Mridul Singh Bisht, Diwakar Jha · Design: Komal Gautam · Video: Dev Lal · Account: Teesha Jain                                                                    |
| Standard | Leocym (Rudione)      | 4        | Web: Mridul Singh Bisht (Rudione), Diwakar Jha (Leocym), Karan Joshi · Design: Komal Gautam · Account: Teesha Jain                                                                         |
| Standard | KYG microsite network | 4        | Same as Know Your Genes                                                                                                                                                                    |
| Standard | TalentiFi-X           | 4        | Design: Komal Gautam · Web: Diwakar Jha, Mridul Singh Bisht, Karan Joshi · Video: Dev Lal                                                                                                  |
| Standard | Chetan Mangalwedhe    | 4        | Confirm with Karan                                                                                                                                                                         |
| Standard | RealtyCanvas          | 4        | Design: Pratik Paul, Anukriti Singh, Komal Gautam · Web: Diwakar Jha, Karan Joshi, Mridul Singh Bisht · Video: Dev Lal                                                                     |

### 10.2 How hurdles get written

Each project's hurdles come from three sources. Karan reviews each one.

1. **The code.** Comments that explain workarounds, unusual architecture, build scripts, fallbacks, audits and docs. The challenges that "would become a hurdle" are visible in the code itself (for example a worker-based renderer or photo plates with the product removed).
2. **Git history.** Fix commits, reverts and refactors, with their dates.
3. **DNMS task history.** Fix tasks, tasks put on hold and why, and launch QA tasks. For example, the Know Your Genes web-team tasks include:
   - "security audit and animation lag fixes";
   - "Responsive layout fix for the One Lifetime Curve section";
   - "KYG payment flow creation and fixing its bugs";
   - "runbook to move knowyourgenes.in from Vercel to our VPS";
   - "KYG launch QA: cross-browser and mobile";
   - on hold because "Figma is not ready";
   - "Audit of all 13 domains website".

**Guardrail:** even with full client permission, a hurdle never publishes secrets, unfixed weaknesses, or attack details. "We found and closed exposed credentials" is fine; _which_ credentials is not.

### 10.3 Hurdle bank (first pass; grows in Phase 1)

**Confirmed in DNMS on 8 Oct.** Full detail is in [dnms-findings.md](dnms-findings.md). The strongest new items:

- **SKELMET:**
  - the 3D hero went from **8.9 MB to 1 MB** in a push that ran to 4 AM;
  - **Shiprocket built in one day**, with 48 new tests (87 passing);
  - a security audit, its fixes and a re-check, all in one day;
  - **live in about 10 days**, every task on time;
  - Lighthouse 100 for accessibility, best practices and SEO.
- **Know Your Genes:**
  - **"Figma is not ready"**: design deadlines were set the same day and the page shipped that day;
  - a **rebrand mid-build** (new logo and Figma, three pages rebuilt in three days);
  - payments tested overnight;
  - launch QA together with an audit of all 13 sister domains;
  - a move off Vercel to the company's own server.
- **H2S:**
  - **6 festival themes in 7 weeks**;
  - **6 site-wide price rounds** in a month;
  - the HDFC payment gateway;
  - speed and SEO work ending at **average Google position 6.9 across 7,745 impressions**.
- **Happy Ganga:**
  - built ahead of incomplete content and still **shipped 3 days early**;
  - **a hurdle that became a feature**: two tasks timed at once double-counted hours, so the studio built a shared clock into DNMS. This links the Happy Ganga and DNMS case studies.
- **DNMS:** multi-tenant on 26 Aug, the Claude/MCP connector on 5–6 Oct, the parallel-timer fix, duplicate push notifications fixed.

**Not for public chapters:** internal staffing changes, timers left running, task backfilling, and overdue counts.

**SKELMET**

1. ✱ **Two skulls on screen.** The 3D skull landed on photos that already showed a skull. Fix: photo "plates" with the skull removed, cross-faded in as the model arrives.
2. **3D blocked scrolling and typing.** Fix: rendering moved into a Web Worker on an OffscreenCanvas.
3. ✱ **The model lagged a frame behind the scroll.** Fix: the browser's scroll-driven animations.
4. **A print file isn't a web file.** Fix: a script that orients, welds, smooths, reduces and compresses it.
5. ✱ **The first visit was too heavy.** Fix: a captured poster frame on the same animation clock, so the switch to live 3D is invisible.
6. **The 3D library was too heavy.** Fix: dropped react-three-fiber, saving about 638 KB.
7. **Double payments and double-processed orders.** Fix: server-side pricing, transactional stock, idempotent webhooks, atomic order statuses.
8. **Zero-downtime deploys on our own server.** Fix: blue-green deploys with health checks and rollback.

**Know Your Genes**

1. ✱ **The brand teal turned mint in 3D.** Fix: neutral tone mapping and tuned lights.
2. **AI-generated models arrived at 10–56 MB.** Fix: an optimisation pipeline brought them to about 0.5 MB.
3. ✱ **A blank frame appeared before the mascot drew.** Fix: poster until the first real frame, load near the viewport, error fallback.
4. **Animation lag**, from the DNMS task "security audit and animation lag fixes". Fix: confirm details in the code.
5. ✱ **The One Lifetime Curve broke on small screens**, from a DNMS task. Fix: confirm details in the code.
6. **Storytelling that pins without scroll-jacking.** Fix: sticky panes, with progress measured from the track.
7. **A payment flow with many edge cases**, from DNMS tasks. Fix: Razorpay signature checks, webhook, tests.
8. **Moving hosting from Vercel to our VPS** (DNMS runbook task). Fix: confirm details.
9. **Design and build ran in parallel** (on hold: "Figma is not ready"). Fix: built page by page as the design landed. Confirm with Karan.

**DNMS**

1. **Letting AI act for a person without a second permission system.** Fix: AI calls reuse the web app's own route handlers through a delegated session.
2. **Helping an AI find the right one of 300+ endpoints.** Fix: a catalogue of 304 endpoints generated at build time, plus a search tool.
3. **Securing the AI login.** Fix: PKCE, hashed tokens, rotating refresh tokens, signed links that expire.
4. **Biometric attendance devices.** Fix: Hikvision sync with live progress and a schedule.
5. ✱ **Help guides kept going out of date.** Fix: 269 screenshots re-captured automatically.
6. ✱ **The wrong theme flashed on load.** Fix: a boot script that runs before first paint.
7. **The weekly digest risked going out twice.** Fix: the database enforces send-once.

**H2S** (expand in Phase 1 from code and DNMS: 135 tasks, 306 resources)

1. **43 city pages without 43 templates.** Fix: one data-driven Liquid template fed by per-city data.
2. ✱ **Video reels slowed the pages.** Fix: lazy loading, playing only while on screen.
3. ✱ **Visitors couldn't tell whether they had hard water.** Fix: an interactive symptom checker with a live gauge.
4. **Building on Shopify's newest theme architecture.** Fix: nested theme blocks and an A/B product template.

**Standard case studies (2–4 hurdles each)**

- **Happy Ganga:** ✱ the theme drifted from Figma → line-by-line parity check; prices risked being hard-coded → read from variant data.
- **Leocym:** marketing claims had to stay compliant → the build fails on unapproved claims; mail landed in spam → Reply-To handling; accessibility → 0 axe violations.
- **TalentiFi-X:** only 9 of 40 pages indexed → canonical URLs, structured data and IndexNow; ✱ jobs page mobile Lighthouse 79 → 94.
- **KYG microsites:** 13 identities on one base → shared foundation with per-site design systems; live audit of 111 pages (a DNMS task) → issues fixed.
- **Chetan Mangalwedhe, RealtyCanvas:** take these from code and DNMS in Phase 1.

✱ = good candidate for an interactive before/after.

---

## 11. Team (from DNMS)

Sourced from the DNMS employee directory: 14 active people, which fits "12–15". Only names, teams and roles are used here. DNMS holds **no photos** for current staff.

| Group              | People (DNMS role)                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WEM - web**      | Diwakar Jha (Team Lead, Full Stack) · Mridul Singh Bisht (Specialist) · Karan Joshi (Full Stack Developer)                                                              |
| **VIM - design**   | Pratik Paul (Specialist) · Komal Gautam (Specialist) · Anukriti Singh (Trainee)                                                                                         |
| **VIM - video**    | Dev Lal (Specialist)                                                                                                                                                    |
| Also in the studio | Teesha Jain (SMO, account owner on most projects) · Gokul Menon (Alliances & Partnerships Manager) · Harsh Kumar (PR) · Ayushi Pandey (HR) · Manpreet (Admin) · interns |
| Leadership         | Deepak Goel, Group CEO                                                                                                                                                  |

Former team members are not credited (D13).

**Decided (8 Oct):**

- **Photos.** Use the real studio group photos already public on digitallynext.com:
  - `careers/c1–c11`; `c9`, `c10` and `c11` are 3000 px+ originals, good for full-bleed use;
  - `figma/careers/careers-team.webp` and `careers-workhere.webp`;
  - not the `pexels-*` or whiteboard images, which look like stock.
  - **No individual portraits exist, so the team is typographic:** names set large, with role and shipped projects underneath.
  - We never guess which face belongs to which name.
- **Public titles show discipline, not seniority grade:**
  - Diwakar Jha - Web Lead;
  - Mridul Singh Bisht and Karan Joshi - Full Stack Developer;
  - Pratik Paul and Komal Gautam - Designer;
  - Anukriti Singh - Designer;
  - Dev Lal - Video & Motion.

---

## 12. Exhibits (chapter 01 live demos)

Every exhibit has four parts:

- the live interaction;
- a poster frame;
- keyboard and touch controls;
- a short text description.

| Project             | Water moment                                                             | Then you can…                                                                                                            | Theme                                                 |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **SKELMET**         | Water pours into a skull mould and becomes the **real print-file skull** | Drag to spin it with momentum; it docks onto a product photo                                                             | `#07060A` / blaze `#FF5A1F`; Anton                    |
| **Know Your Genes** | Water twists into a **DNA helix**                                        | Meet GENEe, whose eyes follow you; tap Vita, Cardi, Dozy, Guard or Glow for their Signature moves                        | eden `#0E4D4B` / linen `#FAF6EF`; Figtree + Cormorant |
| **DNMS**            | Droplets flow as **data between floating screens**                       | Watch a scripted "Ask DNMS" replay of the AI connector                                                                   | Aurora violet→cyan; Inter                             |
| **H2S**             | **Cloudy hard water with crystals**                                      | Drag the cartridge slider: the water clears and the crystals dissolve; a live symptom gauge; 43 cities light up on a map | blue `#1257C7`; Inter + Bricolage                     |
| Happy Ganga         | A **river** along the brand's own path                                   | Tilt the drop                                                                                                            | teal `#0896AC` / amber; Gabarito                      |
| Leocym              | Odour particles in water                                                 | Toggle **mask vs neutralise**                                                                                            | indigo `#282864` / orange `#F07814`; Montserrat       |
| KYG microsites      | One water body pours into **13 different glasses**                       | Flip through the 13 identities                                                                                           | Each site's own colours                               |
| TalentiFi-X         | Gauges **fill like water levels** from 79 to 94                          | Toggle before and after                                                                                                  | `#0000FF` / cyan                                      |
| Chetan Mangalwedhe  | Droplets connected in a network                                          | Push the network with the cursor                                                                                         | emerald `#4ECCA3`                                     |
| RealtyCanvas        | -                                                                        | Swipe the reel deck                                                                                                      | navy / gold                                           |

---

## 13. Technical architecture

### 13.1 Stack

| Layer        | Choice                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router, React 19, React Compiler), TypeScript strict, pnpm                                        |
| Styling      | **Tailwind v4** + CSS custom-property themes (client takeovers are token swaps)                                       |
| 3D           | **three.js** via **React Three Fiber v9** + **drei**                                                                  |
| Water        | Our own GPU simulation, WebGL2 (§13.3)                                                                                |
| Post effects | `postprocessing`: bloom on red highlights, grain, vignette                                                            |
| Motion       | **GSAP 3.13+** (ScrollTrigger, SplitText) + **Lenis**. One animation library only.                                    |
| Overlays     | Radix Dialog/Popover + LiquidSurface                                                                                  |
| Content      | TypeScript + MDX in `content/`, checked by a zod schema; testimonial approval gate                                    |
| PWA          | Web app manifest + a small service worker (offline page, cached shell and posters)                                    |
| Analytics    | Vercel Analytics + Speed Insights (cookieless); events for chapter completion, before/after use and contact click-out |
| Hosting      | Vercel; design.digitallynext.com; a preview deploy per PR                                                             |

### 13.2 Persistent water stage

- A single `<Canvas>` in `app/layout.tsx`, never unmounted.
- Pages register their water **forms** (`hero.x`, `flagship.skelmet`…).
- DOM sections anchor 3D with drei `<View>`.
- On route changes, the water morphs to the next form while a wave comes in from the travel direction.
- Off-screen views don't render, and a hidden tab pauses everything.

### 13.3 Water engine (`features/water`)

**A. Surface** - _built in Phase 0:_

- **Decision:** a wave-equation height field (ripples) replaces the stable-fluids plan. It reads more literally as water, costs less on phones, and tilt maps onto it naturally.
- **Code:**
  - `features/water/surface/*` holds the simulation and shading;
  - `features/water/bus.ts` lets any feature drop waves into the water.
- **Inputs:** cursor or touch, scroll speed, phone tilt, Liquid surfaces and page transitions.
- **Look:** shaded as a teal-tinted surface.

**B. Forms**

- GPU particles (float textures, ping-pong passes).
- **Forces:** a spring toward the target shape, curl noise, density-grid cohesion so the particles hold together like liquid, cursor or touch, and tilt as a gravity vector.
- **Rendering as liquid (screen-space fluid):** depth and thickness → smoothing → normals → refraction, Fresnel, highlights, absorption.
- **Target shapes:** sampled from models (skull, mascots), vector paths (walking-X, river), text, and shapes generated in code (helix, network, glasses). Sampling runs in a Web Worker.

### 13.4 Device quality tiers

Chosen from a GPU lookup plus a 1-second on-device benchmark. Drops down automatically if frames run slow.

| Tier                                         | Surface  | Form particles | Liquid shading  | Pixel density |
| -------------------------------------------- | -------- | -------------- | --------------- | ------------- |
| **T0** (no WebGL, reduced motion, save-data) | gradient | posters        | -               | -             |
| **T1** (older phones, low-end GPUs)          | 128²     | 16k            | simplified      | ≤ 1.5×        |
| **T2** (recent phones, most laptops)         | 256²     | 131k           | full            | ≤ 2×          |
| **T3** (discrete GPUs, Apple M-series)       | 512²     | 262k–524k      | full + caustics | adaptive      |

### 13.5 Walking-X

- Traced to SVG from `logo1-white.webp` and cleaned up by hand. This gives the site a proper logo file, favicons and PWA icons.
- The same SVG is the water's target shape in the hero.

### 13.6 Folder structure

Follows the studio's feature-folder convention.

```
dn_portfolio/
  app/                       (site)/page · work/ · work/[slug]/ · work/[slug]/[chapter]/ · services/ · about/ · reel/
                             contact/ + careers/ (308) · not-found · offline · sitemap · robots · llms.txt · manifest · opengraph-image
  features/
    water/  stage/           water engine · persistent canvas, tiers, transitions, tilt input
    exhibits/<slug>/         scene · poster · controls · screen-reader text
    case-study/              chapter shell · chapter nav · hurdle card · before/after · architecture diagram
    home/ work/ services/ about/
  components/
    liquid/                  LiquidSurface (sheet · popover · viewer)
    ui/                      header · bottom menu pill · footer · reveal text · media
  content/                   work/<slug>/{meta.ts, overview, brief, design, build, hurdles, outcome}.mdx
                             team.ts · clients.ts · testimonials.ts · recognition.ts · services.ts · stats.ts
  lib/                       gsap + lenis · motion tokens · themes · seo · schema · analytics
  public/                    models/ · posters/ · video/ · img/ · logos/ · icons/
  scripts/                   optimise-models · capture-posters · capture-screens · build-reel · sample-targets
```

---

## 14. Performance, accessibility, SEO

### 14.1 Budgets (enforced in CI)

| Metric                                        | Budget                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| LCP (75th percentile, mid-range mobile on 4G) | **< 2.0 s**; the LCP element is always the server-rendered headline                     |
| CLS / INP                                     | < 0.05 / < 200 ms                                                                       |
| JavaScript before 3D (gzipped)                | < 120 KB                                                                                |
| 3D core chunk (gzipped)                       | < 350 KB, loaded after first paint                                                      |
| Home transfer before interaction              | < 1.5 MB mobile / < 3 MB desktop                                                        |
| Each model / clip / reel                      | < 600 KB / < 4 MB / < 8 MB                                                              |
| Frame rate                                    | 60 fps T2/T3, ≥ 30 fps T1; Liquid surfaces at 60 fps everywhere                         |
| Lighthouse                                    | Mobile and desktop: Performance ≥ 90 · Accessibility 100 · Best Practices 100 · SEO 100 |

### 14.2 Accessibility

- **Target:** WCAG 2.2 AA, checked by axe on every route in CI.
- **The canvas** is `aria-hidden`. Every exhibit has a DOM equivalent and keyboard and touch controls.
- **Reduced motion:** still water, native scroll, 150 ms fades, tilt off.
- **Client themes:** contrast checked per theme.
- **Interaction:** no hover-only content; touch targets of at least 44 px.

### 14.3 SEO

- Metadata per chapter, and a generated share image per case study in its own colours.
- **Structured data:**
  - `Organization` with `parentOrganization` digitallynext.com;
  - `CreativeWork` per case study, with each chapter as `hasPart`;
  - `BreadcrumbList`;
  - `Person` for each team member.
- `sitemap.xml`, `robots.txt`, `llms.txt`, canonical URLs.
- SEO work is logged in `SEO/documentation/document.md` under the standing instruction.

---

## 15. Award submission kit (Phase 6)

**What we prepare:**

- **Images:**
  - a cover image (e.g. 1600×1200);
  - 4–6 desktop screenshots;
  - 3–4 mobile screenshots;
  - a 30–60 s screen recording of the site.
- **Text:**
  - a short description of the concept;
  - the technologies, fonts and colours used;
  - credits for every team member, with roles.
- **Profile:** a Digitally Next profile on Awwwards and CSSDA.

**Timing:** submit after **1–2 weeks of live polish**. Juries review the live site, so we fix whatever real visitors hit first.

**Where we submit:**

1. Awwwards: Site of the Day, plus the Developer and Mobile Excellence reviews.
2. CSS Design Awards.
3. FWA and CSS Winner.

**Before submitting:** run a self-score checklist mapped to §2.

---

## 16. Phases (Karan + Claude)

| Phase                        | Weeks | Work                                                                                                                                                                                                                                                                                  | Karan's review gate                                                                                                    |
| ---------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **0. Foundations**           | 1     | **style frames as coded prototypes**: hero (desktop + mobile), a case-study chapter, a hurdle card, a Liquid pop-up · **spikes:** water on an Intel laptop, a mid-range Android and an iPhone; LiquidSurface in Chrome, Safari and Firefox; direction-aware transitions; tilt-to-pour | Approve the look, feel and motion                                                                                      |
| **1. Content & assets**      | 1–3   | Hurdle mining from code, git and DNMS for all 10 projects · drafted testimonials · team data · asset gathering · walking-X SVG · Playwright captures · rough cut of the reel                                                                                                          | Approve hurdle drafts and testimonial wording                                                                          |
| **2. Engine & shell**        | 2–5   | Scaffold · tokens and fonts · water engine (surface + forms + shading + tiers + tilt) · LiquidSurface · stage and transitions · header and bottom menu pill · content schema and testimonial gate · PWA basics · CI with budgets                                                      | **Milestone M2:** preview where the water forms the X and morphs to the skull, Liquid pop-ups and tilt work on a phone |
| **3. Home**                  | 5–7   | All 9 home sections, desktop and mobile · copy deck                                                                                                                                                                                                                                   | **Milestone M3:** home page approved on desktop and phone                                                              |
| **4. Work & case studies**   | 6–11  | Work index · chapter shell, hurdle card, before/after · **4 flagships × 6 chapters** (SKELMET first, then KYG, H2S, DNMS) · **6 standard × 4** · archive · share images                                                                                                               | **Milestone M4:** each case study approved as it lands                                                                 |
| **5. Services, About, Reel** | 10–11 | Services · About (team, principles, process, recognition, studio) · reel page · 404 · offline page                                                                                                                                                                                    | All pages approved                                                                                                     |
| **6. Hardening & launch**    | 12–13 | Device testing · performance and accessibility passes · SEO · design.digitallynext.com DNS · links from digitallynext.com · launch · SEO log entry · award kit                                                                                                                        | **Milestone M5:** launched; award submission 1–2 weeks after                                                           |

**Critical path:** hurdle and testimonial content (approved by week 3) → flagship chapters (weeks 6–9).

---

## 17. Risks

| Risk                                                   | Likelihood | Impact | Mitigation                                                                                                                        |
| ------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Liquid shading too slow on older phones                | Medium     | High   | Phase 0 spikes on real phones · tiers decided by benchmark · T0 posters                                                           |
| Liquid pop-ups feel slow                               | Medium     | Medium | Interruptible · 350 ms close · Karan tests them in Phase 0                                                                        |
| 48 chapter pages is a lot of content for two people    | High       | High   | Claude drafts from the sources; Karan reviews in batches · standard case studies can ship with 2–3 hurdles · flagships come first |
| Hurdles inferred from code are inaccurate              | Medium     | Medium | Every hurdle traced to a commit, a code path or a DNMS task · Karan confirms                                                      |
| A testimonial is published without the person agreeing | Low        | High   | The production build gate (§9)                                                                                                    |
| Award jury marks down usability for spectacle          | Medium     | High   | The UX test · flow rules · usability checks with 3–5 people before submitting                                                     |
| Scope creep                                            | High       | High   | v1 is capped at 4 × 6 + 6 × 4 chapters; anything else goes to v1.1                                                                |
| Private data in screenshots                            | Low        | High   | Demo data only · manual review · never copy `.env`, `.mcp.json` or client CSVs                                                    |

---

## 18. Version 1.1 and later

- A new mascot or character (Karan: "something new afterwards").
- Cue as a studio product.
- Deepak Goel promoted from archive to case study once his site is live.
- WebGPU water with higher particle counts.
- Sanity as the content source for archive entries.
- A Hindi version.
