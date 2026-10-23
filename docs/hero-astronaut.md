# Hero astronaut: plan (21 Oct 2026)

Karan's brief: the Depth hero must look exactly like his reference frame. That means a very realistic astronaut bust built in Blender, a gold visor that shows a sunlit landscape, Earth's limb behind, the X sitting on the shoulder, and the same type and layout. The red "Start a project" button becomes **Set sail**.

## 1. What the reference shows

- **Composition.** The copy sits top left: the label, "Building your / tomorrow." at about 5.7vw, a three-line lead, then two buttons. The astronaut fills the right two-thirds as a bust seen slightly from below, turned toward the copy, cropped by the bottom edge. The helmet's left edge stops just short of the headline.
- **Helmet.** A white hard shell with a dark inner rim and a lamp on each side. The gold visor is a mirror: a hot sun upper right, a rocky landscape, and the suit's own shoulder at the bottom.
- **Neck and torso.** A chrome neck ring with ridges over a dark collar. Black harness straps with silver buckles. A chest box with a dark screen, knobs and a red light. The left arm reaches toward the camera at bottom right, with a wide red band.
- **The X.** Big, sitting on the astronaut's left shoulder (the viewer's right), waving with its far arm, the other hand resting on the helmet ring.
- **Light.** A warm sun from the right rims the helmet, the X and the arm. Cool fill. A thin blue atmosphere glow along Earth's limb. Sparse, dim stars.
- **Chrome.** The header (logo, Work / Services / About, an outlined "Start a project ↗"), the depth gauge numbered from 01, and "Scroll to descend" at bottom right.

## 2. Research findings

| Question | Finding | Decision |
|---|---|---|
| A ready realistic astronaut? | No free model is photoreal for a close-up **and** licensed for commercial use. NASA's EMU (public domain) is dated: 343k triangles, flat materials, a flag stretched over whole panels. The Smithsonian Apollo scans are non-commercial. The best Sketchfab models are game quality, CC-BY or BY-NC, and one has doubtful provenance. | **Model it ourselves in Blender.** NASA's EMU is used only for scale. No NASA logos, patches or name tags anywhere. |
| What makes a suit read as real? | Off-white matte fabric with a soft sheen, puffy rather than thin. A smooth hard upper torso against wrinkled limbs. Bellows folds at the joints. Seams and bound edges. A gold mirror visor over a clear bubble. Lamp housings on the helmet. A metal neck ring with latches. | Every one of these is modelled or baked in (section 3). |
| Scenery in the visor | Poly Haven `rogland_sunset` (CC0): a rocky arid desert with a hot sun 12.7° up. Fallbacks: `kiara_8_sunset`, `the_lost_city`. | The visor gets its **own** environment, rotated so the sun sits upper right. The suit's own reflection is added by baking a probe from the visor's centre in Blender, so the shoulder shows at the bottom of the visor as in the reference. |
| Earth | NASA Blue Marble NG, Black Marble and cloud maps (public domain; credit NASA, no implied endorsement). A sphere mesh shows facets at the limb when it fills half the screen. | **Ray-traced Earth:** one quad, sphere-intersected per pixel. An exact limb, a desert-region crop of Blue Marble, clouds, a terminator and a Fresnel/Rayleigh atmosphere rim. |
| Realism in three.js | Neutral tone mapping keeps the white white and the gold gold. Sheen for fabric. Baked normal and AO. Clearcoat plus a little iridescence on the visor. A sprite for the sun glint instead of a bloom pass. | All adopted. |
| Fabric texture | ambientCG Fabric019, Fabric082A and Fabric036; Poly Haven terlenka (all CC0). | Fine weave as a tiling detail normal map in the shader. Macro folds baked. |

## 3. The asset (Blender, `Blender/DigitallyNext/astronaut/hero/`)

Everything is built by scripts so it can be rebuilt, the same way as the X and the first astronaut.

1. **Base forms.**
   - Modelled to the EMU's proportions as signed distance fields, then voxel-remeshed to clean quads. This is a more accurate pass than the first astronaut.
   - **Parts:** the hard upper torso; soft arms with bellows; the helmet assembly (shell, visor opening rim, a lamp housing on each side with lens and bezel, ear fittings); a separate gold visor; an inner clear bubble; the neck ring (three chrome ridges, four latch blocks, a dark collar); the chest box (body, recessed dark screen, three knobs, purge valve, red light); shoulder bearings; gloves; backpack; legs and boots for the descent.
2. **Harness, as in the reference.** Black nylon webbing, 32 mm, swept along curves over the shoulders and across the chest, with box-X stitching and brushed steel buckles. The wide red band on the upper arm. A small red DN patch.
3. **Surface detail, high poly.**
   - Subdivision.
   - Large soft fabric puffs (low-frequency noise).
   - Bellows at the shoulders, elbows and knees.
   - Tension folds where fabric meets hard parts.
   - Seams: grooves along panel lines.
   - Stitch lines beside each seam.
4. **Bake to the web mesh.**
   - The web mesh is about 60–80k triangles.
   - Tangent-space normal, AO, base colour (subtle grime, tone variation, printed markings) and roughness, baked with Cycles high-to-low with a cage.
   - Atlases: suit 4096 on desktop and 2048 on phones. Hard parts 2048. Visor smudge roughness 1024.
5. **Rig.** The same bones as today (pelvis, spine, chest, head, arms, legs, perch). The perch moves to the **left** shoulder (the viewer's right) and gains a sitting seat for the X. The pose table gains a `hero` pose: the left arm reaching toward the camera, the head turned to the copy.
6. **Export.**
   - GLB with tangents, materials and WebP textures.
   - Desktop and phone variants.
   - Meshopt/Draco geometry.
   - KTX2 later, if KTX-Software is installed.
7. **Stills, rendered in Cycles from the same scene.** The hero poster for desktop (2880×1800) and phones (1170×2532), with the X, Earth and visor scenery. These are the first paint (good LCP), the reduced-motion hero, and the frame the live scene must match.

## 4. The live scene (`features/drafts/depth/`)

- **Hero framing.** A slot can now anchor the **helmet** instead of the whole figure. CSS places the helmet, and the scene scales the astronaut so the bust fills the frame as in the reference: low angle, turned to the copy, cropped by the bottom edge. As you scroll, the same path the corridor uses carries it back down to its figure-sized slots. It reads as the camera pulling back while the astronaut falls away into the corridor.
- **Visor.**
  - Material: MeshPhysical, gold metal, roughness 0.03 with a smudge map, clearcoat 1, iridescence 0.3.
  - Its own environment: the baked probe (desert, sun and its own shoulder).
  - A starburst sprite at the sun's mirror point, so the glint is computed rather than painted.
- **Suit lighting.**
  - Environment: a small space scene in PMREM, black, with an Earth-blue bounce from below and a warm sun disc.
  - The sun is a real directional light with a tight shadow, so the X casts a shadow on the shoulder.
  - Neutral tone mapping.
- **Earth.**
  - A ray-traced quad behind everything.
  - Blue Marble crop with clouds and night lights at the terminator, atmosphere rim, ocean glint.
  - Fully visible at the hero. It sinks below the frame as the descent starts and returns as the glow at the bottom of the well.
- **The X.**
  - Sitting: its leg bones are bent over the shoulder edge on top of its clips.
  - It waves on arrival with the far arm, while the near hand rests on the neck ring.
  - Its eyes follow the pointer.
- **Phones.**
  - The same scene, recomposed: the bust in the upper half (helmet right of centre, the X on the shoulder), the copy below over the Earth.
  - The smaller atlas, DPR 1.5, no shadow map.
- **Reduced motion / no WebGL.** The Cycles stills, nothing moving.

## 5. The hero copy (as in the reference)

- The label, a two-line headline at about 5.7vw with the red stop, and a three-line lead.
- **Set sail →** (red), which opens the 3D sailing world. On the draft route it goes to `/#sail`, because the world only opens on the home page. Next to it, **See the work ↓**.
- The "Or sail through our work in 3D" link goes; Set sail replaces it.
- The gauge's stops are numbered from 01, and "Scroll to descend" stays bottom right.

## 6. Budgets

| | Desktop | Phone |
|---|---|---|
| Astronaut GLB (geometry) | ≤ 300 KB | ≤ 220 KB |
| Astronaut textures | ≤ 1.6 MB WebP | ≤ 600 KB |
| Visor probe (HDR) | ≤ 350 KB (1k RGBE) | same |
| Earth textures | ≤ 700 KB | ≤ 300 KB |
| Hero poster | ≤ 220 KB WebP | ≤ 160 KB |
| Frame time | 60 fps; at 4× CPU, at least as good as today's 50 fps | 60 fps emulated |

Everything 3D loads after the visitor engages, as today. The poster is the first paint.

## 7. Verification

- The overlap test at seven sizes (the helmet slot included): the astronaut never sits on the words.
- Real-GPU screenshots compared side by side with the reference at 1672×941.
- Performance on production builds against today's figures (frame timing, long tasks, CLS and LCP).
- Reduced motion, keyboard, and no console errors.

## 8. Phases

1. Assets: environment, visor probe and Earth textures fetched and prepared.
2. Model v2: base forms, harness, details.
3. High-poly detail, UVs and bake, then export.
4. Cycles hero stills (desktop and phone).
5. Scene: helmet anchor, visor, lighting and shadow, Earth quad, the X sitting.
6. Hero layout and Set sail.
7. Phone composition, reduced motion.
8. Tests, performance, side-by-side review, fixes.

## 9. Status (22 Oct 2026)

All eight phases are done. Nothing is committed yet.

**Built.** The v2 astronaut (Blender, baked, rigged), the gold visor with its own desert world, a ray-traced Earth, the X seated and waving on the left shoulder, and Set sail. The home page uses the new model at every station.

**The stills.** The wide screen gets one frame. Phones get two images: a sky, and the astronaut cut out, standing in the slot the live figure uses. The stills' Earth is captured from the live renderer (`?sky-only`), and only the astronaut comes from Cycles. Fading from still to live moves nothing but the pose. The wide helmet was framed against the live visor's measured position (`--measure`, `visor.mjs`).

**Fixed along the way.** The live Earth was mirrored east to west (its longitude ran clockwise seen from the north pole). Far planes faded to black over Earth, which drew dark boxes behind the phone hero; they now fade to transparent.

**Tests** (real GPU, production build):
- The overlap test passes at all seven sizes.
- Reduced motion and keyboard pass, with no console errors.
- Desktop: 60 fps, p95 16.7 ms, LCP 0.3 s, CLS 0.001.
- Desktop at 4× CPU: 53 fps against the 50 fps baseline. Shadows cost about 1 fps there; the rest is the page's own render and text work.
- Phone: 60 fps at 1× and 59 at 4×, with CLS 0.

**Over budget.**

| Asset | Size | Budget |
|---|---|---|
| Desktop astronaut | 2.6 MB | 1.9 MB |
| Phone astronaut | 1.2 MB | 0.82 MB |
| Visor probe (EXR DWAA) | 393 KB | 350 KB |
| Desktop Earth | 1.0 MB | 0.7 MB |
| Phone Earth | 0.54 MB | 0.3 MB |

The stills are under budget: 98 KB wide, and 24 KB + 43 KB on phones.

All of the 3D loads only after the visitor engages, so none of it affects first paint.
