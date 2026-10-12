import type { CaseStudy } from "../types";

// This site, told as a case study. Hurdles come from the build itself (draft 1 on 8 Oct 2026, the
// world in draft 2 on 9 Oct 2026, its realism pass on 10 Oct 2026). Numbers were measured in the
// repo; sources are never rendered.
const makingOf: CaseStudy = {
  slug: "making-of",
  client: "Digitally Next Design",
  headline: "A portfolio you can sail: the sea, the islands and the weather, all made in-house.",
  summary:
    "Our portfolio is a small sea with an island for every project. You steer a boat between them, dock, and the work opens. Nothing in it was bought: no game engine, no paid assets, no recorded sound. Underneath, every page is still a plain, fast web page.",
  year: 2026,
  industry: "Our own studio",
  disciplines: ["3D & Motion", "Brand site", "Search & AI"],
  platform: "Next.js · three.js (WebGPU)",
  liveUrl: "https://design.digitallynext.com",
  tier: "flagship",
  order: 11,
  theme: {
    scheme: "dark",
    bg: "#0A0A0A",
    surface: "#111214",
    text: "#FAFAF8",
    muted: "#A3A6AB",
    accent: "#0EC8C5",
    onAccent: "#0A0A0A",
    display: "stackHeadline",
    body: "stackText",
  },
  poster: {
    src: "/work/making-of/day.webp",
    alt: "The archipelago at midday: the walking-X lighthouse on the hub island, SKELMET's black rock to the left, Know Your Genes to the right, and the boat in front on clear water",
    width: 1600,
    height: 900,
  },
  exhibit: "making-of",
  exhibitHint: "Drag from calm to storm and watch the boat ride the same waves the world is drawn with. Tick the box to see the four waves that add up to the sea.",
  metrics: [
    { value: "1.66 MB → 2.6 KB", label: "physics, by writing our own for things that float", source: "gzip of @dimforge/rapier3d-compat 0.21 dist/rapier.mjs vs features/world/engine/physics.ts compiled, 9 Oct 2026" },
    { value: "6 · 4 · 24", label: "weather states, seasons and hours, following yours", source: "features/world/weather-logic.ts; app/api/weather/route.ts" },
    { value: "38", label: "places to stop, each opening a page", source: "13 docks + 6 service buoys + 6 weather buoys + 10 reef screens + reel + bottle + trophy rock (features/world/engine/islands)" },
  ],
  credits: [{ team: "Web", people: ["karan-joshi"] }],

  brief: [
    {
      kind: "facts",
      items: [
        { label: "Client", value: "Digitally Next Design, ourselves" },
        { label: "Job", value: "Show what our designers and developers can do" },
        { label: "Scope", value: "The site, its 3D world, eleven case studies" },
        { label: "Timeline", value: "Two drafts, October 2026" },
      ],
    },
    {
      kind: "prose",
      heading: "Not a sales site",
      paragraphs: [
        "A portfolio for a studio has one job: make the right people want to work with you. It should show range and depth, and it should show it fast. Most visitors give a studio site a minute, often while comparing a shortlist.",
        "So we set ourselves a test for every element: it must show our work, how we work, or who does it. Anything that showed none of the three was cut, however much fun it was. Races, leaderboards and achievements went. Weather stayed, because rain, snow, ice and mist are all water.",
      ],
    },
    {
      kind: "prose",
      heading: "We are water",
      paragraphs: [
        "The idea runs through everything: water takes the shape of whatever holds it, the way we take the shape of each client. The first draft told that in type and a liquid surface behind every page. The second lets you be in it.",
      ],
    },
    {
      kind: "figure",
      image: { src: "/work/making-of/day.webp", alt: "The hub island at midday with the walking-X lighthouse, the welcome sign and the dock", width: 1600, height: 900 },
      caption: "The front door. The work is visible from the first frame: SKELMET to the left, Know Your Genes to the right.",
      wide: true,
    },
  ],

  design: [
    {
      kind: "prose",
      heading: "An island for every client",
      paragraphs: [
        "Each project became an island built from the client's own identity. SKELMET is a black rock with a garage glowing blaze orange, and the real print-file skull on a pontoon you can ram. Know Your Genes is a linen island with a turning DNA helix and the six mascots on the beach, waving as you arrive. Hard2Soft has a channel where the water runs chalky at one end and clear at the other. DNMS is a tower whose windows are DNMS screens.",
        "Our own island sits in the middle with the walking-X from our logo as its lighthouse. Its beam sweeps the water at night and in mist.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/making-of/skelmet.webp", alt: "SKELMET's island at dusk: the glowing garage, embers rising, and the orange skull on its pontoon by the dock", width: 1600, height: 900 },
        { src: "/work/making-of/kyg.webp", alt: "Know Your Genes island: the white lab, the DNA helix tower and the mascots lined up on the beach", width: 1600, height: 900 },
      ],
      caption: "Two flagships, each in its own colours, each with its real 3D.",
    },
    {
      kind: "palette",
      heading: "Our colours, then everyone else's",
      colors: [
        { name: "Ink", hex: "#0A0A0A", note: "The night and the type" },
        { name: "Paper", hex: "#FAFAF8", note: "Signs and panels" },
        { name: "Red", hex: "#E21F26", note: "The boat, and the lighthouse's shoes" },
        { name: "Teal", hex: "#0EC8C5", note: "Water, and the wake that glows at night" },
      ],
    },
    {
      kind: "prose",
      heading: "Weather that follows yours",
      paragraphs: [
        "The world reads your sky. Time of day follows your clock; the season follows your calendar and hemisphere; the weather follows your city's, approximately, from the forecast. If we can't tell where you are, you get our weather in New Delhi.",
        "Every state is water in another shape: rain dimples the sea around the boat, a storm lifts the swell, mist rolls in low, and in winter ice forms at the shores and snow settles on the islands. A dial in the options, and six buoys at the Lab, let anyone change it.",
      ],
    },
    {
      kind: "pair",
      images: [
        { src: "/work/making-of/night.webp", alt: "The archipelago at night: dark water, moonlit surf, the lighthouse beams sweeping and the garage glowing orange", width: 1600, height: 900 },
        { src: "/work/making-of/snow.webp", alt: "The archipelago in snow: ice floes around every shore and snow settled on the islands and trees", width: 1600, height: 900 },
      ],
      caption: "Night and winter. After dark the wake and the surf take on a faint brand-teal glow.",
    },
    {
      kind: "pair",
      images: [
        { src: "/work/making-of/storm.webp", alt: "A storm over the archipelago: driving rain and a heavier swell breaking white across the sea", width: 1600, height: 900 },
        { src: "/work/making-of/mist.webp", alt: "Mist over the archipelago: the hub island still clear in front, the others fading into grey", width: 1600, height: 900 },
      ],
      caption: "Storm and mist. However thick it gets, the islands nearest you stay readable.",
    },
    {
      kind: "typeface",
      families: [
        { name: "Stack Sans Headline", role: "Headlines and signs in the world", font: "stackHeadline" },
        { name: "Stack Sans Text", role: "Panels and reading", font: "stackText" },
      ],
      sample: "Pour us into anything.",
    },
  ],

  build: [
    {
      kind: "figure",
      image: { src: "/work/making-of/lab.webp", alt: "The Lab island in spring: a white dome with a particle sculpture rising behind it, the wake tank, and petals drifting in the air", width: 1600, height: 900 },
      caption: "The Lab, made for no client: the wake simulation shown raw in a tank, a particle sculpture, and six buoys that change the weather.",
      wide: true,
    },
    {
      kind: "prose",
      heading: "No game engine",
      paragraphs: [
        "The world is plain three.js on its newest renderer. It uses WebGPU where the browser has it and WebGL 2 where it doesn't, from one set of shaders written in JavaScript. The islands, trees, docks and boat are generated in code. Their surfaces are photo-scanned sand, rock, grass, timber and teak, and the buoys, crates, lamps and boulders are scanned models: free, public-domain scans from Poly Haven, compressed for the web.",
        "The sea is drawn the way water behaves: you see into it near the shore, the colour deepens as it gets deeper, the sky and the islands reflect off it more as you look across it, and foam gathers wherever it meets something. The towers are curtain walls whose windows light up at night.",
        "Every sound is synthesised live with the Web Audio API: the sea and wind are shaped noise, the outboard is two detuned saws, the horn is two notes. There is nothing to download and nothing licensed.",
      ],
    },
    {
      kind: "architecture",
      heading: "How it fits together",
      caption: "The pages are the site. The world is a layer over the home page that remembers where you left the boat.",
      nodes: [
        { id: "pages", label: "Pages", note: "Next.js, prerendered", lane: 0 },
        { id: "shell", label: "World shell", note: "lives in the layout", lane: 0 },
        { id: "engine", label: "Engine", note: "three.js WebGPU + TSL", lane: 1 },
        { id: "physics", label: "Physics", note: "floating bodies, 2.6 KB", lane: 1 },
        { id: "weather", label: "Weather route", note: "approximate city → forecast", lane: 2 },
        { id: "met", label: "MET Norway", note: "open forecast data", lane: 3 },
      ],
      links: [
        { from: "pages", to: "shell", label: "Set sail" },
        { from: "shell", to: "engine" },
        { from: "engine", to: "physics", label: "same waves" },
        { from: "shell", to: "weather" },
        { from: "weather", to: "met" },
        { from: "engine", to: "pages", label: "dock → case study" },
      ],
    },
    {
      kind: "prose",
      heading: "Fast first, then the world",
      paragraphs: [
        "The home page is a normal page: headline, work, people. A real frame of the world sits behind the headline as an image. The world's code starts downloading only once you move or touch, and the engine starts only when you press Set sail, so none of it slows the page for people who never sail.",
        "Inside, the world keeps strict budgets: frame rate capped, pixel density capped by the device's quality level, rendering paused whenever a panel covers it or the tab is hidden. If the first seconds run slow, it lowers its own quality.",
        "Built by Karan Joshi, pairing with Claude, Anthropic's AI model.",
      ],
    },
    {
      kind: "stack",
      items: ["Next.js 16", "React 19", "three.js r186 (WebGPU, TSL)", "Poly Haven (CC0 scans)", "glTF Transform", "Web Audio", "MET Norway forecasts", "Playwright", "axe-core", "Lighthouse"],
    },
  ],

  hurdles: [
    {
      id: "hovering-boat",
      title: "The boat that hovered",
      group: "experience",
      hard: "The sea is drawn by the graphics card; the boat floats in ordinary code. If the two calculate the waves even slightly differently, the hull hovers above the water or sinks into it, and in a storm the error grows.",
      fix: "There is one definition of the sea. The shader is built from it, and the physics reads the same function at the bow, stern and both sides of the hull, with the same damping near shore and in ice.",
      result: "The hull sits in the water at every wave height, including storms at more than twice the calm swell.",
      solvedBy: ["karan-joshi"],
      source: "features/world/waves.ts; features/world/engine/water.ts waveNode; engine/physics.ts sea()",
    },
    {
      id: "black-islands",
      title: "Islands that came out black",
      group: "experience",
      hard: "In the first version of the world, the islands were coloured from a tiny palette image. Dark colours like SKELMET's charcoal rock rendered almost black, and every other colour came out a shade too dark.",
      tried: "It looked like a lighting problem, so we checked the normals and the shadows first. Both were fine.",
      fix: "The palette was being converted to linear colour twice: once when we wrote it, and again on the graphics card. We now write the raw colours and let the card convert them once.",
      result: "Rock reads as rock, and every island matches the colours we chose.",
      demo: {
        kind: "compare",
        before: { src: "/work/making-of/islands-before.webp", alt: "SKELMET's island rendered almost entirely black", width: 800, height: 500 },
        after: { src: "/work/making-of/islands-after.webp", alt: "The same island with charcoal rock and visible facets", width: 800, height: 500 },
        beforeLabel: "Converted twice",
        afterLabel: "Converted once",
      },
      solvedBy: ["karan-joshi"],
      source: "features/world/engine/shared.ts paletteTexture()",
    },
    {
      id: "weather-hides-work",
      title: "Weather must never hide the work",
      group: "experience",
      hard: "Real mist and heavy rain can swallow an island. A portfolio that hides its own work behind weather fails at its only job.",
      fix: "Mist is capped so islands within about 90 metres always stay readable, signs are lit at night, and panels are never affected. Lightning is a soft brightening at most once every few seconds, and it is off for anyone who asks for less motion.",
      result: "Every weather state is safe to leave on, and anyone can change it from the options or the Lab's buoys.",
      solvedBy: ["karan-joshi"],
      source: "features/world/engine/atmosphere.ts update(); engine/weather.ts lightning envelope",
    },
    {
      id: "long-press",
      title: "Phones press and hold",
      group: "experience",
      hard: "On a phone you steer with your thumb held down. Held touches open copy menus, select text and zoom the page, and every one of them breaks the spell.",
      fix: "The world turns off long-press menus, selection and page zoom inside itself only. The joystick appears wherever your thumb lands, and boost and hop sit under the other thumb.",
      result: "You can hold the joystick for as long as you like without a menu appearing.",
      solvedBy: ["karan-joshi"],
      source: "app/globals.css .world; features/world/ui/touch.tsx",
    },
    {
      id: "contrast",
      title: "204 contrast failures across ten themes",
      group: "experience",
      hard: "Every case study takes on its client's colours. Ten palettes meant ten chances for grey text to be too faint to read, and the accessibility checker found 204 such cases.",
      fix: "Muted text is now calculated from each theme's own text and background, so it always keeps enough contrast. Badges on coloured buttons pick their text colour the same way.",
      result: "No accessibility violations across every route, on desktop and phone.",
      demo: { kind: "shift", label: "Accessibility violations", before: 204, after: 0, better: "lower" },
      solvedBy: ["karan-joshi"],
      source: "app/work/[slug]/layout.tsx --c-muted; axe-core runs across 15 routes, 8 Oct 2026",
    },
    {
      id: "physics-weight",
      title: "A physics engine heavier than the renderer",
      group: "engineering",
      hard: "A general physics engine would have handled the boat and everything it bumps into, but the one we chose weighed 1.66 MB compressed: more than the whole 3D renderer, for a few floating objects.",
      fix: "Everything in this world floats, so we wrote physics for exactly that: buoyancy on the shared waves, a keel that makes the hull carve, and contacts against shores, piers and each other, with spin.",
      result: "The physics ships in 2.6 KB compressed.",
      demo: { kind: "shift", label: "Physics download", before: 1655, after: 2.6, unit: "KB", better: "lower", decimals: 1 },
      solvedBy: ["karan-joshi"],
      source: "gzip sizes measured 9 Oct 2026; features/world/engine/physics.ts",
    },
    {
      id: "one-shader-codebase",
      title: "WebGPU isn't everywhere yet",
      group: "engineering",
      hard: "WebGPU is faster and newer, but plenty of browsers and devices still don't have it. Writing every shader twice would double the work and the bugs.",
      fix: "The shaders are written once, in JavaScript, and compiled to whichever language the browser speaks. Our automated checks run on the WebGL 2 path, which is the one most likely to differ.",
      result: "One codebase for the sea, sky, weather and islands, on WebGPU and WebGL 2.",
      solvedBy: ["karan-joshi"],
      source: "features/world/engine (three/webgpu + three/tsl); scripts/world-shot.mjs",
    },
    {
      id: "shader-warmup",
      title: "Twenty-seven seconds to set sail",
      group: "engineering",
      hard: "Every surface in the world needs its own small program on the graphics card, built the first time it is seen. Built on demand, the world froze as each island came into view. Built up front, behind the loading screen, they took 27 seconds on a fast laptop.",
      tried: "Building them in parallel helped only a little: most of the time went on preparing programs that were nearly identical.",
      fix: "Surfaces that differ only in colour, like painted walls, glass and signs, now share one program and read their colour from the material. That cut the programs to build by more than a third. What the opening view needs is built behind the loading screen; the rest of the world, rain, snow and night included, builds quietly in the first seconds of sailing.",
      result: "The world is ready in about 10.5 seconds on the same laptop, and islands no longer stall as they first come into view.",
      demo: { kind: "shift", label: "Seconds from Set sail to sailing", before: 27, after: 10.5, better: "lower", decimals: 1 },
      solvedBy: ["karan-joshi"],
      source: "Production build, headless Chrome on the dev laptop, 10 Oct 2026 (.captures/prod-perf.mjs); features/world/engine/islands/common.ts createMaterials graph(); engine/index.ts warm-up; pipelines 491 → 316",
    },
    {
      id: "lost-canvas",
      title: "A canvas only gets one chance",
      group: "engineering",
      hard: "In development React mounts components twice to catch bugs. The first copy of the world shut down its graphics context; the second inherited the same, now dead, canvas and drew nothing.",
      fix: "Every engine now creates its own canvas and removes it when it closes, so no two ever share a context.",
      result: "The world starts first time, every time, including when you come back from a case study.",
      solvedBy: ["karan-joshi"],
      source: "features/world/ui/world-app.tsx engine effect",
    },
    {
      id: "phone-speed",
      title: "Phones scored 62",
      group: "engineering",
      hard: "On a phone, the first draft's home page scored in the 60s for speed. The reel video was preloading 3 MB, a button shifted the layout as it appeared, and the 3D water's code ran during load.",
      fix: "The reel loads only when you open it, the button is laid out by CSS before any script runs, and every 3D scene now waits for your first move or touch before it starts.",
      result: "Mobile speed scores of 89 to 96, and 100 on desktop.",
      demo: { kind: "shift", label: "Lighthouse mobile performance", before: 62, after: 89, better: "higher" },
      solvedBy: ["karan-joshi"],
      source: "Lighthouse mobile runs, 8 Oct 2026; features/stage/engage.ts",
    },
  ],

  outcome: [
    {
      kind: "prose",
      heading: "Two ways in, one site",
      paragraphs: [
        "You can sail it or scroll it. Every island leads to a full case study, every case study is a fast plain page, and the map and logbook list everything for anyone who would rather not steer a boat.",
        "If you have read this far, the boat is still where you left it. Press Back.",
      ],
    },
    {
      kind: "facts",
      heading: "By the numbers",
      items: [
        { label: "Islands", value: "13, plus 13 lighthouse rocks" },
        { label: "Places to stop", value: "38" },
        { label: "Weather states", value: "6, in 4 seasons" },
        { label: "Sounds recorded", value: "0" },
      ],
    },
  ],

  next: "skelmet",
};

export default makingOf;
