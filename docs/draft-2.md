# Draft 2: a world you can explore (research and concept)

9 Oct 2026. Brief from Karan: "for the second draft, we will make something like bruno-simon.com".

## Build status (9 Oct 2026): built, awaiting Karan's review

Everything in Part 2 is built: the hub, 4 flagship islands, 6 islets, the studio, the Lab, the reef, the reel screen, the bottle, the trophy rock, toys and ramps, the map with fast travel, the logbook, options, weather, seasons and time of day, and the making-of case study (`/work/making-of`, 7 chapters).

**Where the build departs from this plan, and why:**

| Plan | Built | Why |
|---|---|---|
| Rapier physics | Our own floating-body physics (`features/world/engine/physics.ts`) | Rapier is 1.66 MB gzipped, more than the whole renderer. Ours is 2.6 KB and does what the world needs: buoyancy, keel, shore and pier contacts, spin. |
| Islands modelled in Blender via MCP | Generated in code (terrain, docks, buildings, trees) | The Blender connection wasn't available. Code generation keeps every island in one draw-call-friendly pipeline. Since the realism pass (below), surfaces and small props use free CC0 scans. |
| 3D project panels | Liquid HTML panels that flow in from the side | Karan's rule that every pop-up flows in like liquid; HTML panels are also readable by screen readers and keyboard. |
| Howler + recorded sound | Every sound synthesised with Web Audio | No files to download, nothing to license. |
| Camera at a fixed height | Camera drops toward the horizon when zoomed in and rises to a map view when zoomed out; it aims a little ahead of the boat | Tall landmarks (the lighthouse) were cut off at the top of the frame. |

**Verified (9 Oct 2026):**
- Type-check, lint and production build clean (100 prerendered routes; 64 addresses in the sitemap).
- Home Lighthouse: desktop 100 / 100 / 100 / 100; mobile performance 94, the rest 100. No 3D code loads until the visitor moves.
- axe (WCAG 2.2 AA): 0 violations on home, `/work` and all 7 making-of chapters, and inside the world (HUD, map, project panel, logbook, options).
- Full flow on desktop and on an emulated Pixel 7: Set sail → sail → map → fast travel → dock → panel → case study → Back (boat still at the dock) → Classic site. No console errors.
- WebGPU path in installed Chrome and Edge (NVIDIA GPU) and the WebGL 2 path in headless Chromium: same picture, no shader errors.

**Not yet verified:** real phones (only emulation and a desktop GPU so far), Safari and Firefox, and frame rates on a mid-range Android. These are the first things to check on a staging deploy.

## Realism pass (10 Oct 2026)

Karan's brief: "make every element high quality, specially the boat… the water is not real looking with clear transparent… make the whole more real."

**What changed:**
- **Water.** It is transparent now: you see the shelf and rocks through it near shore, and it darkens with depth, using real absorption (red goes first, then green). The full tier mirrors the islands in it. The sky's reflection comes from an environment map, which the waves break up. A Fresnel term makes it more mirror-like the flatter you look across it. Foam gathers wherever the water touches something, plus the wake and storm crests. Three layers of ripples run at different scales, and there are sun glints and light through the crests. The night glow is now a faint teal, not neon.
- **Sky and light.** The physical sky has clouds. The environment map is re-rendered as the sun moves. ACES tone mapping with the night exposure adapted, multisampled antialiasing, soft bloom and a vignette.
- **The boat.** A new hull lofted from 52 sections, in navy and white gel coat with a red sheer. It has a teak deck with caulked seams, a console with lit gauges and a wheel, a curved windscreen, rails and cleats, nav lights, and an outboard with a spinning prop.
- **Ground and nature.** Islands use photo-scanned sand, grass, rock and dark rock, blended by height and slope, with snow, wet and seasonal tint. Trees use leaf-card canopies: broadleaf, palm and fir (firs rebuilt from drooping branch sprigs). Lawns have grass blades, and there are ferns under the trees.
- **Props.** These are photo-scanned CC0 models: navigation buoys, channel markers, lifebuoys, crates, street lamps and boulders.
- **Buildings.** The towers (DNMS, Realty Canvas) are curtain walls with mullions, floor spandrels, per-pane variation and windows lit at night. Low buildings have reflective glazing that glows warm after dark. The hub has a proper lantern room and a modern boathouse.
- **Weather details.** Ice breaks into floes. Rain no longer streaks across the lens. Falling leaves are lit by the sky, so they no longer glow at night, and they stay over land.

**Ramps and boost (Karan's review, 10 Oct):**
- **Ramps.** The ramps are solid now. The boat could sail into them through a side, because only the back edge had collision. Now the sides and back block anything lower than the ramp at that point, and the low front edge is the only way on. A boat on the slope rides its surface and loses speed to gravity: fast boats launch off the lip, slow ones slide back into the water.
- **Boost.** Shift (or the Boost pad on phones) was already there but too subtle. It now takes top speed from about 11.5 to 18.5 m/s; the view widens and pulls back slightly (skipped with reduced motion), the bow throws spray and the engine note rises.

**The map (Karan's review, 10 Oct):** rebuilt as a chart (`features/world/ui/map.tsx`).
- **Fits the screen:** the chart is sized to the screen, so it's always fully in view. On desktop the heading and list sit beside it.
- **Islands drawn from the world's real shapes:** shallow shelf, beach and ground colour, docks, the Hard2Soft channel, the buoys, and a pin in each client's colour.
- **Labels never collide:** they're placed around their islands, sized by importance, and wrap onto two lines when long. Minor ones hide only when there is truly no room.
- **Map and list are linked:** hovering or focusing a place, on the chart or in the list, highlights it in both. The chart then draws a dashed course from the boat with the distance, and a card names the place.
- **The list:** grouped (start here, flagship work, more work, the studio, around the sea), with each place's distance. It's the keyboard and screen-reader path.
- **Map furniture:** compass, 50 m scale, a key, and a pulsing marker for your boat (still with reduced motion).
- **Phones:** on phones the card sits under the chart and labels are set smaller.
- **Checked:** axe found 0 violations; clicking the chart and pressing Enter in the list both travel.

**Assets:** everything new is CC0 from Poly Haven, fetched and compressed by `scripts/world-assets.py` into `public/world/tex` (3.3 MB) and `public/world/models` (1.2 MB). A full-quality visit downloads about 3 MB of textures and 1.2 MB of models; the lighter tiers about 1.9 MB of textures. Nothing was bought or generated.

**Performance (dev laptop, NVIDIA Ampere GPU, headless Chrome, 1440×900, production build):**
- Full quality runs at a steady 67–73 fps under normal display pacing (CPU about 9 ms a frame, about 610 draw calls across the main, shadow and mirror passes), from the very first frame.
- From "Set sail" to sailing takes about 10.5 s. It was 27 s after the first version of this pass, because every surface compiled its own shader. Surfaces that differ only in colour now share one shader, which cut the GPU pipelines from 491 to 316. The opening view's shaders build in parallel behind the loader, and the engine waits for the GPU to finish them, so the first frames don't stall. The rest of the world (other islands, rain, snow, mist, night lights) builds in the background in the first seconds of sailing. Fast-travelling to a far island afterwards costs at most one 30–75 ms frame.
- SKELMET's skull and the six KYG mascots load with the world. They were lazy-loaded before, but both islands are within range of the spawn, so that only pushed their shader builds into the first visible seconds. The mascots are culled like everything else and grounded by soft contact shadows instead of skinned shadow maps.
- Small detail (props, grass, particles, signs) stays out of the sea's mirror. The sea and sky are never drawn into it.
- Auto quality now waits 6 s and needs two slow windows in a row before stepping down. If it does step down, it also drops the mirror and the multisampling.
- World creation can now be cancelled. In development, React's double mount used to load two worlds at once.

**Verified (10 Oct 2026, production build):** type check, lint and build clean. axe 0 violations on home, `/work`, all making-of chapters and inside the world. Lighthouse home: desktop 100 / 100 / 100 / 100; mobile performance 90–91, the rest 100. The mobile LCP is the hero's intro text repainting when the web font arrives, not the world or its poster. Desktop and Pixel 7 flows pass with no console errors (the desktop flow runs on SwiftShader and once timed out clicking a button between frames; the re-run passed). The WebGL 2 path renders at tiers 1 and 2 with no errors. New hero posters and making-of images were captured from the new world.

---

## Part 1: What bruno-simon.com is

### The experience
- **Two versions.**
  - **2019:** a red car driving around a Three.js world, made in Blender. It used cannon.js for physics. It won Awwwards Site of the Year 2019, and the press reported 400,000+ visits.
  - **2025 (live now):** rebuilt with the same idea but much more ambitious. It took him "a little over a year".
- **The game.** You drive a small vehicle around a stylised island world. The camera is a 3/4 view that follows you. You crash into, push and knock over things: bowling pins, bricks, crates, fences. You reach parts of the world called **areas**, which hold the content.
  - The areas in the code are Landing, Projects, Lab, Career, Social, Achievements, Circuit, Bowling, Behind the Scene, Cookie, Altar, Time Machine, Toilet and Easter.
- **How projects are shown.** In 3D, not as web pages: *"actual 3D models for the interface and recreating standard interactions entirely in 3D, including clicks, scroll, keyboard input, and touch gestures"*. Each project has a title, role, collaborators, awards, an image carousel and a link.
- **Controls.**
  - Keyboard: WASD or arrows, Shift to boost, Space to jump, Enter to interact.
  - Phones: a virtual joystick plus buttons.
  - Gamepads are supported, and the mouse wheel zooms.
  - An Options menu covers audio, quality, respawn, and WebGPU vs WebGL.
- **Things to come back for.**
  - **Achievements**, some of them cryptic, which unlock vehicle skins.
  - **A race circuit** with a daily top-10 leaderboard.
  - **"Whispers":** 30 visitor messages at a time, moderated by OpenAI's free moderation model.
  - **Shared counters:** a cookie stand and an altar that everyone adds to.
  - **Hidden extras:** a Konami code, and events like Easter and Black Friday.
- **Living world.** The world changes on its own:
  - day and night cycles, and the seasons;
  - wind, with visible wind lines and swaying grass;
  - weather: rain with splashes, snow that settles, frozen water, falling leaves, lightning, a tornado.
- **Audio.** Three music tracks by Kounine, released CC0. Spatial sounds come from the world (birds, waves, the anvil, the oven, a campfire) and from the vehicle (springs, engine, tyres, boost, horn). The interface has a single click sound whose pitch shifts when panels close.

### How it's built (from the source, github.com/brunosimon/folio-2025)

| Area | What he uses |
|---|---|
| Rendering | three r183 using `three/webgpu` and **TSL** (shaders written in JavaScript). WebGPU when available, otherwise WebGL. |
| Physics | **Rapier** (`@dimforge/rapier3d` 0.17). The vehicle uses Rapier's **ray-cast vehicle controller**: a chassis made of three box colliders with a lowered centre of mass and four ray-cast wheels. Settings include engine force 300, boost ×2, brake 35 and steering 0.5 rad, plus three suspension heights (low, mid, high). |
| Game loop | One `Game` object and a ticker with 15 ordered stages: inputs, physics, vehicle, world, view, render, audio. |
| Camera | A follow camera with a smoothed focus point. It "magnets" toward interactive points as you approach, zooms, and has a free mode for debugging. |
| World authoring | **Blender, with naming conventions.** An object named `refLandingPhysicalFixed` automatically becomes a fixed physics body. Empties mark collision shapes, respawn points and area boundaries. |
| Content triggers | Zones (spheres or cylinders the vehicle enters) and interactive points showing an "Enter" key icon, which open an area. |
| Colour | **A palette texture.** Every model takes its colour from one small texture via UVs, so the world stays consistent and draw calls stay low. |
| Nature | **Grass:** about 78,400 blades, each a single triangle, looped seamlessly around the camera. **Trees:** camera-facing leaf cards shaded by SDF textures, which shrink when the car is near so it stays visible. **Water:** painted in Blender, and that mask produces ripples at the shoreline. |
| Performance | Instancing for trees, benches, lanterns, pins and bricks. Frustum culling. Hidden faces removed and meshes merged. Textures in KTX2 (ETC1S/UASTC). Geometry quantised. Two quality levels picked from the user agent; the mobile level drops water blur and depth of field and lowers shadow resolution. |
| Tooling | Vite, Howler, camera-controls, gltf-transform, Tweakpane for debugging, and a compress script that runs on export. |
| HTML | Mostly the overlays: menus, modals, tabs, an About-the-tech panel. **No h1, no proper title, no fallback without WebGL, almost no SEO.** |
| Licence | **The code is MIT.** The repo says nothing about the models, music or textures, so **we use none of his assets and none of his car.** We learn the techniques and build our own world. |

### What people say
- **Praise:** "consistent art style", "high completion level", and "worked surprisingly well on mobile".
- **Complaints:**
  - browser tabs crashing, and an M1 MacBook running hot;
  - the progress circle fills, then "takes several more seconds";
  - needing to refresh to load;
  - iOS long-press menus breaking immersion;
  - wanting to zoom out further.
- **The key criticism:** "3D website UX is poor". One visitor stayed "about 30 seconds".

**Lessons for us:**
- Show the work within 30 seconds.
- Load fast and never crash.
- Always offer a normal website path.
- Handle iOS touch properly.

---

## Part 2: Our draft 2, "The Archipelago"

### Concept
**We are water — so you sail.** Bruno drives a car across land. We put the visitor in **a small red boat on our own water**, in an archipelago where **every island is a client's world**, built in that client's colours and with its real assets. The hub is Digitally Next's own island. The water is the medium that connects everything, exactly as on draft 1. Here it simply becomes a place you can be.

The format is the same as Bruno's (drive, push things, discover areas, open projects), but the identity, world, vehicle and story are entirely ours. Several clients are about water (H2S, Happy Ganga, Leocym), so the theme lands naturally.

### The test (agreed with Karan, 9 Oct)
**Every element must show at least one of three things: our work, how we work, or who does it.** If it shows none, it's cut.
- **Cut from the Bruno model:** races, leaderboards, visitor messages, achievements, vehicle skins, shared counters and easter eggs. They sell a personal brand, not an agency's work.
- **Kept:** the sailing itself, which is the proof of craft, and a few physics toys.
- **Added on Karan's call:** weather and seasons. They pass the test because rain, snow, ice and mist are all water: the hero line made visible.

### Decisions (made)

| Decision | Choice | Why |
|---|---|---|
| Vessel | A small **red motorboat** (brand `#E21F26`) with the walking-X on its flag, leaving a teal wake | A boat on water steers as intuitively as Bruno's car, and the wake and buoyancy show off water |
| Home page | `/` is the world. The draft-1 pages stay as they are: Work, the 10 multi-chapter case studies, Services, About. | Awards and SEO need real pages. Bruno's site has none, and that is its weakness. |
| Website path | Always available: a "Classic view" toggle, plus a "Logbook" menu listing every project in HTML | It fixes "3D UX is poor". Reduced-motion and no-WebGL visitors get the classic home automatically. |
| Rendering | three r186 `three/webgpu` + **TSL**, falling back to WebGL2 automatically. Vanilla three, not React Three Fiber. | Like Bruno's: game loops suit a plain engine, and TSL means one shader codebase for both renderers |
| Physics | **Rapier** (`@dimforge/rapier3d-compat`, WASM): the boat as a dynamic body with **custom buoyancy** (wave height sampled at 4 hull points) | Rapier has no water; four-point buoyancy is the standard, reliable approach |
| Water | A TSL shader with layered waves, shore foam from a painted mask, and **our draft-1 ripple simulation reused as the boat's wake** | The water is the brand; it must be the best thing on screen |
| World authoring | Blender through the MCP connection. Naming conventions (`phys_fixed_*`, `zone_*`, `dock_*`, `spawn_*`) become physics bodies and triggers. One palette texture for colour. | Bruno's proven workflow, in our own scenes |
| Assets | Modelled by us in Blender, CC0 libraries (Poly Haven, Kenney, Poly Pizza CC0), **plus the real client models: SKELMET's skull and KYG's six mascots** | Real client 3D placed in the world is something Bruno's site can't do. Paid 3D generation only if Karan asks. |
| Games | **None.** No races, scores, leaderboards, visitor messages, achievements or skins. | They don't show our work, and the server features need moderation |
| Weather and seasons | **In.** They follow the visitor's own time, weather and season, and a weather dial lets anyone switch. See "Weather, seasons and time of day". | Water in every state is the concept. Adapting to the visitor is the brand promise. |
| New content | **The Lab** island and **a case study of this site** (the same chapters, including hurdles) | The Lab shows how far our people can go, kept off the main path. The making-of suits the Developer award. |
| Sound | Off until the visitor chooses "Set sail with sound" | Respectful, and avoids blocked autoplay |

### The world map
**Hub — Digitally Next.**
- A lighthouse shaped like the **walking-X**, with the lantern on top, and the "We are water." sign.
- The spawn point.
- Signposts pointing to every island. **The work is visible within 30 seconds:** you can see the four flagship islands from the spawn point.

**Flagship islands (each opens a 3D project panel, with a link to the full case study).**
- **SKELMET Cove:** a night garage glowing blaze orange, with **the real print-file skull** on a plinth that you can ram so it spins. Embers rise.
- **Know Your Genes Isle:** a calm linen-and-teal lab with a DNA-helix tower. **GENEe and the five crew mascots are on the dock**, and they wave or do their signature move as you arrive.
- **Hard2Soft Reservoir:** a water tower. Sail through its channel and the water turns from chalky to clear (the conditioning idea, shown honestly as an illustration).
- **DNMS Tower:** an office tower whose windows are real DNMS screens. Its beacon replays the AI connector.

**Islets (the standard case studies, each with a dock, sign and panel).**
- Happy Ganga: a river mouth with flowing river particles.
- Leocym: a jetty with odour particles.
- KYG network: thirteen small lighthouses, one per identity.
- TalentiFi-X: a signal tower with gauges.
- Chetan: a constellation rock.
- RealtyCanvas: a skyline pier.

**Studio and extras.**
- **Studio Harbour:** the team's names on the boats moored there, office photos on billboards, a services channel of six buoys, and a trophy rock for recognition.
- **The reef:** the archive. Older sites appear on floating screens you sail past.
- **Message in a bottle:** it floats near the hub and opens digitallynext.com/contact.
- **Drive-in screen:** the reel plays on a floating cinema screen.
- **The Lab:** an island for work made for no client: the water simulation itself, the particle forms, prototypes. The weather dial is here as well as in Options.
- **Making of this site:** a dock at the hub that opens the site's own case study.
- **Toys:** buoys and crates near the hub to push, and wave ramps to jump. No scores.

### Weather, seasons and time of day
**Why it belongs:** water already takes every shape — liquid, rain, snow, ice, mist. And the world adapts to the visitor, which is the brand promise.

**It follows the visitor:**
- **Time of day** follows their own clock.
- **Weather** follows their real local weather:
  - The server reads the approximate city that the host derives from the IP address.
  - It gets current conditions from MET Norway's free API, whose licence allows commercial use with a credit.
  - Nothing is stored or logged.
  - If the city isn't known, the world shows the studio's own weather.
- **Season** follows their calendar and hemisphere.
- **A weather dial**, in Options and at the Lab, lets anyone switch state, so judges can see every one. The choice is remembered on that device.

**The states of water:**

| State | When | What you see | Effect on sailing |
|---|---|---|---|
| Clear | Fine weather | Caustics in the shallows, bright palette | Calm, best handling |
| Rain | Rain | Every drop lands in the ripple simulation, the surface roughens, and wet islands shine | Choppier |
| Storm | Thunder, strong wind | Bigger swell, wind lines, soft lightning, the lighthouse beam sweeping | The boat rocks more but can always reach the docks |
| Mist | Fog | Low mist over the water, with islands still readable | None |
| Snow and ice | Winter, snow | Snow settles on islands, ice forms at the shores, and floes you can push drift in the water | Open channels always stay clear |

**Seasons:**
- **Spring:** petals float on the water.
- **Summer:** the strongest sun, caustics and heat shimmer.
- **Autumn:** leaves drift on the surface and ride your wake.
- **Winter:** low sun, with snow and ice possible.

**Night:**
- The wake glows brand teal (`#0EC8C5`), like bioluminescence.
- Island windows light up.
- The walking-X lighthouse beam sweeps the water and helps you find your way.

**How it's built:**
- **Seasons cost almost nothing** thanks to the palette texture. Each season is another row of the same small texture, so the whole world recolours with no new models.
- **Rain and snow** are GPU particles: compute shaders on WebGPU, animated vertices on WebGL2. Raindrops write into the ripple simulation from draft 1.
- **Ice and settled snow** are masks in the water and island shaders. The floes are physics bodies that exist only in winter.
- **Light:** one time-of-day value drives the sky, sun, fog and lighting.
- **Transitions** take about a minute, so nothing jumps.

**Guardrails:**
- **Weather never hides the work.**
  - Mist and rain are capped so islands, signs and dock prompts stay readable.
  - Project panels are never affected.
  - Signs stay lit at night.
- **Lightning:**
  - It is a soft, slow brightening, at most once every few seconds, well under the WCAG 2.3.1 limit of three flashes per second.
  - It is off for anyone who asks for less motion.
- **Quality tiers:** weather is the first thing they reduce: fewer particles, no volumetric mist, simpler ice.
- **Sound:** rain, wind and thunder play only when sound is on.

### The interaction model
1. **The intro screen appears instantly**, as HTML over a real first frame. It offers: Set sail (with or without sound), Classic view, and the controls.
2. **Sail:**
   - keyboard: WASD or arrows, Shift to boost, Space to jump a wave;
   - phones: a joystick plus a boost button;
   - gamepads supported.
3. **Approach a dock.** The camera magnets toward it and an **"Enter: Explore SKELMET"** prompt appears (tap on phones).
4. **The 3D project panel** shows the client, the headline, an image carousel from the real screenshots, two numbers, and **Read the case study**. That last button runs a liquid transition into the existing case-study chapters.
5. **Navigation shortcuts:**
   - **Map / fast travel** (M) to jump to any island, so nobody gets lost;
   - **Logbook** (L): a liquid side sheet listing every project as an HTML link;
   - **Options** (O): sound, quality, the weather dial, Classic view.

### Fixing what people criticised
- **No long loader.** The text and the first frame show at once, and islands stream in as you approach.
- **Strict budgets:**
  - JavaScript before the world loads: under 400 KB;
  - first island: under 3 MB;
  - frame rate capped at 60;
  - device pixel ratio capped by quality tier;
  - rendering stops in hidden tabs.
- **Quality tiers** use the draft-1 detection plus a measured frame rate. They drop shadows and post-processing, and reduce the number of wave layers.
- **iOS long-press:** `-webkit-touch-callout: none`, `user-select: none`, and touch events intercepted on the canvas.
- **Zoom out:** scroll or pinch to zoom, within limits.
- **Fallbacks:** reduced motion, no WebGL, or low memory sends visitors to the classic home.

### Architecture (inside the existing Next.js app)

```
features/world/
  game.ts            Game + ordered ticker (inputs → physics → boat → world → camera → render → audio)
  renderer.ts        WebGPURenderer (auto WebGL2), quality tiers, DPR caps, pause when hidden
  physics.ts         Rapier world, fixed timestep, naming-convention loader for Blender scenes
  boat/              buoyancy (4 hull samples), engine/steer/boost/jump, visual boat, wake → ripple sim
  water/             TSL water: waves, shore foam mask, wake texture, depth tint
  camera.ts          3/4 follow camera, focus smoothing, dock magnets, zoom limits
  inputs/            keyboard, gamepad, touch joystick (+ iOS long-press guard)
  islands/           one module per island: GLB, zones, docks, toys, client assets
  weather/           time of day, season (palette row), rain/snow particles, ice and mist masks, lightning
  ui/                interactive points (Enter prompts), 3D project panel, map, options + weather dial
  audio.ts           Howler: ambience, boat, weather, UI click; off until opted in
app/page.tsx         world entry (client, dynamic) + server-rendered classic home underneath (SEO)
app/api/weather/     approximate city from the host → MET Norway → one weather state; cached per area, nothing logged
public/world/        islands GLB (meshopt + KTX2), palette texture, sounds
```

### Phases (Karan + Claude)

| Phase | Time | Output |
|---|---|---|
| **0. Spike** | 3–4 days | WebGPU/TSL water plus Rapier boat buoyancy plus follow camera, running in Next. Tested on the Intel laptop, a mid-range Android phone and an iPhone. Blender pipeline proven on the hub island. |
| **1. World and flow** | ~1 week | Hub, 4 flagship islands and islets blocked out. Docks, Enter prompts, 3D project panels, links into the case studies. Map and fast travel, Logbook, Classic view. |
| **2. Art and life** | ~1 week | Client identities on each island, the real client models, foliage and props, the palette pass, shore foam and wake polish, physics toys, the Lab, audio. |
| **3. Weather and seasons** | ~1 week | Time of day, the four season palettes, rain, storm, mist, snow and ice, the night wake, the weather API, the weather dial |
| **4. Hardening** | 4–5 days | Phone controls, quality tiers, budgets, accessibility and SEO checks, the making-of case study, real-device QA, award submission kit |

About **5 weeks** in total.

### Risks
- **Buoyancy feels floaty:** prototype first in Phase 0, with tunable forces; fall back to a simplified planar boat controller.
- **WebGPU instability on some devices:** WebGL2 fallback forced by an allow-list.
- **Too much scope:** v1 is fixed: the hub, 4 flagship islands, 6 islets, the studio, the Lab, and weather and seasons. Nothing else goes in.
- **Weather costs frame rate:** weather is the first thing the quality tiers reduce. Each state is tested on the phone before it ships.
- **No real weather available:** the world falls back to the studio's own weather. The dial always works.
- **Phone heat:** the low tier halves the wave layers, turns off shadows, and caps the frame rate at 30 on battery.

---

Sources:
- [bruno-simon.com](https://bruno-simon.com/)
- [Awwwards: Bruno's portfolio case study](https://www.awwwards.com/brunos-portfolio-case-study.html)
- [github.com/brunosimon/folio-2025](https://github.com/brunosimon/folio-2025)
- [Creative Bloq on the 2019 car portfolio](https://www.creativebloq.com/news/3d-car-portfolio)
- [Pastel: how a design portfolio got 400,000 visitors](https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors)
- [GeekNews discussion of the 2025 launch](https://news.hada.io/topic?id=24963)
