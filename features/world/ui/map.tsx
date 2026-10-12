"use client";

// The map and fast travel. The chart is drawn from the same layout the world is built from: each
// island's real shore, its shallow shelf, beach and ground, its dock, plus the channel and buoys.
// Labels are placed around their islands so they never collide, sized by importance. Hovering or
// focusing a place, on the chart or in the list, highlights it in both and plots a course from
// the boat. The list is the keyboard and screen-reader path; the chart is the same choices for a
// pointer.
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldData } from "../data";
import {
  BOTTLE_HOME,
  ISLANDS,
  LANDMASSES,
  RECOGNITION_ROCK,
  REEL_SCREEN,
  SERVICE_BUOYS,
  WEATHER_BUOYS,
  WORLD_RADIUS,
  dockEnd,
  radiusAt,
  shoreTable,
  type Ground,
  type Landmass,
} from "../layout";
import { world } from "../store";

type Kind = "hub" | "flagship" | "study" | "studio" | "poi";
type Group = "Start here" | "Flagship work" | "More work" | "The studio" | "Around the sea";
type Place = { id: string; label: string; sub: string; x: number; z: number; r: number; kind: Kind; group: Group; accent: string };

const GROUPS: Group[] = ["Start here", "Flagship work", "More work", "The studio", "Around the sea"];
const HALF = WORLD_RADIUS + 10;
const VIEW = `${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`;

/** Label size on screen, in pixels, by importance. */
const PX: Record<Kind, number> = { hub: 15, flagship: 15, studio: 14, study: 13, poi: 12 };
const BOLD: Record<Kind, number> = { hub: 700, flagship: 700, studio: 600, study: 500, poi: 500 };
const PRIORITY: Record<Kind, number> = { hub: 0, flagship: 1, studio: 2, study: 3, poi: 4 };

const GROUND: Record<Ground, string> = { green: "#7f9c62", rock: "#4d4f54", linen: "#ece4d2", sand: "#ddcc9f", stone: "#a8a296" };
const BEACH = "#e9dcbc";
const TEAL = "#0ec8c5";

function shore(land: { id: string; x: number; z: number; r: number; seed: number }, scale = 1): string {
  const table = shoreTable(land);
  const n = 56;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    const r = radiusAt(table, th) * scale;
    d += `${i ? "L" : "M"}${(land.x + Math.cos(th) * r).toFixed(1)},${(land.z + Math.sin(th) * r).toFixed(1)}`;
  }
  return d + "Z";
}

/** Long names wrap onto two lines at the space nearest the middle. */
function lines(label: string): string[] {
  if (label.length <= 14 || !label.includes(" ")) return [label];
  let best = -1;
  for (let i = 0; i < label.length; i++) if (label[i] === " " && (best < 0 || Math.abs(i - label.length / 2) < Math.abs(best - label.length / 2))) best = i;
  return [label.slice(0, best), label.slice(best + 1)];
}

type Box = { x0: number; y0: number; x1: number; y1: number };
type Placed = { lines: string[]; x: number; y: number; anchor: "start" | "middle" | "end"; size: number; shown: boolean };

const hits = (a: Box, b: Box, pad: number) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;
const hitsDisc = (a: Box, x: number, z: number, r: number) => {
  const cx = Math.max(a.x0, Math.min(x, a.x1));
  const cz = Math.max(a.y0, Math.min(z, a.y1));
  return (cx - x) ** 2 + (cz - z) ** 2 < r * r;
};

/**
 * Greedy placement, most important first: below, above, right, then left of each place; the first
 * spot that clears every island, every placed label and the edge of the chart wins. Minor labels
 * that fit nowhere stay hidden until their place is highlighted.
 */
function layoutLabels(places: Place[], unit: number, boat: { x: number; z: number }): Map<string, Placed> {
  const out = new Map<string, Placed>();
  const boxes: Box[] = [];
  // Islands, their docks and the points of interest are kept clear; the small rocks are not.
  const discs: { x: number; z: number; r: number }[] = [];
  for (const i of ISLANDS) {
    discs.push({ x: i.x, z: i.z, r: i.r * 1.05 });
    const end = dockEnd(i);
    for (const t of [0.35, 0.7, 1]) {
      const d = end.shore + (Math.hypot(end.x - i.x, end.z - i.z) - end.shore) * t;
      discs.push({ x: i.x + Math.cos(i.dock) * d, z: i.z + Math.sin(i.dock) * d, r: 2.5 });
    }
  }
  for (const p of places) if (p.kind === "poi") discs.push({ x: p.x, z: p.z, r: p.r + 2 });
  discs.push({ x: boat.x, z: boat.z, r: unit * 12 });
  const sorted = [...places].sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind]);
  // A small chart (a phone) gets smaller type, so more of it fits.
  const k = (HALF * 2) / unit < 560 ? 0.8 : 1;
  for (const p of sorted) {
    const size = PX[p.kind] * unit * k;
    const ls = lines(p.label);
    const w = Math.max(...ls.map((l) => l.length)) * size * (BOLD[p.kind] >= 600 ? 0.6 : 0.56);
    const h = ls.length * size * 1.12;
    const gap = 5 * unit;
    const r = p.r;
    const candidates: { box: Box; x: number; y: number; anchor: Placed["anchor"] }[] = [
      { box: { x0: p.x - w / 2, y0: p.z + r + gap, x1: p.x + w / 2, y1: p.z + r + gap + h }, x: p.x, y: p.z + r + gap + size * 0.85, anchor: "middle" },
      { box: { x0: p.x - w / 2, y0: p.z - r - gap - h, x1: p.x + w / 2, y1: p.z - r - gap }, x: p.x, y: p.z - r - gap - h + size * 0.85, anchor: "middle" },
      { box: { x0: p.x + r + gap, y0: p.z - h / 2, x1: p.x + r + gap + w, y1: p.z + h / 2 }, x: p.x + r + gap, y: p.z - h / 2 + size * 0.85, anchor: "start" },
      { box: { x0: p.x - r - gap - w, y0: p.z - h / 2, x1: p.x - r - gap, y1: p.z + h / 2 }, x: p.x - r - gap, y: p.z - h / 2 + size * 0.85, anchor: "end" },
    ];
    const clashes = (c: (typeof candidates)[number]) =>
      (c.box.x0 > -HALF + 2 && c.box.x1 < HALF - 2 && c.box.y0 > -HALF + 2 && c.box.y1 < HALF - 2 ? 0 : 10) +
      boxes.filter((b) => hits(c.box, b, 2 * unit)).length +
      discs.filter((d) => hitsDisc(c.box, d.x, d.z, d.r)).length;
    const free = candidates.find((c) => clashes(c) === 0);
    const major = p.kind === "hub" || p.kind === "flagship" || p.kind === "studio";
    // A major label that fits nowhere takes the spot it clashes with least.
    const pick = free ?? candidates.reduce((best, c) => (clashes(c) < clashes(best) ? c : best));
    if (free || major) boxes.push(pick.box);
    out.set(p.id, { lines: ls, x: pick.x, y: pick.y, anchor: pick.anchor, size, shown: !!free || major });
  }
  return out;
}

function metres(d: number) {
  return d < 1000 ? `${Math.max(5, Math.round(d / 5) * 5)} m` : `${(d / 1000).toFixed(1)} km`;
}

export function MapContent({ data, onTravel }: { data: WorldData; onTravel: (id: string) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const [unit, setUnit] = useState((HALF * 2) / 760);
  const [boat, setBoat] = useState({ x: 0, z: 42, heading: 0 });
  const [active, setActive] = useState<string | null>(null);

  // Labels are sized in screen pixels, so the layout follows the chart's rendered size.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setUnit(Math.round(((HALF * 2) / w) * 100) / 100);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The world is paused under the map, but read the boat now and then in case it moves.
  useEffect(() => {
    const read = () => {
      const b = world.engine()?.boat();
      if (b) setBoat((prev) => (Math.abs(prev.x - b.x) + Math.abs(prev.z - b.z) + Math.abs(prev.heading - b.heading) > 0.05 ? b : prev));
    };
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);

  const places = useMemo<Place[]>(() => {
    const study = (slug: string) => data.studies.find((s) => s.slug === slug);
    const list: Place[] = ISLANDS.map((i) => {
      const s = i.kind === "study" ? study(i.ref) : undefined;
      const kind: Kind = i.id === "hub" ? "hub" : i.flagship ? "flagship" : i.kind === "study" ? "study" : "studio";
      const group: Group = kind === "hub" ? "Start here" : kind === "flagship" ? "Flagship work" : kind === "study" ? "More work" : "The studio";
      return { id: i.id, label: s?.client ?? i.label, sub: i.sub, x: i.x, z: i.z, r: i.r, kind, group, accent: s?.accent ?? (kind === "hub" ? "#e21f26" : TEAL) };
    });
    list.push(
      { id: "reel", label: "The reel", sub: "Our work in motion, on the drive-in screen", x: REEL_SCREEN.x, z: REEL_SCREEN.z, r: 5, kind: "poi", group: "Around the sea", accent: "#fafaf8" },
      { id: "bottle", label: "Message in a bottle", sub: "Get in touch", x: BOTTLE_HOME.x, z: BOTTLE_HOME.z, r: 3, kind: "poi", group: "Around the sea", accent: "#fafaf8" },
      { id: "recognition", label: "Recognition", sub: "The trophy rock", x: RECOGNITION_ROCK.x, z: RECOGNITION_ROCK.z, r: RECOGNITION_ROCK.r, kind: "poi", group: "Around the sea", accent: "#fafaf8" },
      { id: "archive-0", label: "The reef", sub: "Earlier work, on screens along the reef", x: 0, z: -192, r: 4, kind: "poi", group: "Around the sea", accent: "#fafaf8" },
    );
    return list;
  }, [data]);

  const labels = useMemo(() => layoutLabels(places, unit, boat), [places, unit, boat]);
  const shapes = useMemo(
    () =>
      LANDMASSES.map((l: Landmass) => ({
        id: l.id,
        island: !!l.island,
        ground: l.ground,
        shelf: shore(l, 1.45),
        beach: shore(l),
        land: shore(l, l.island ? 0.74 : 1),
        dock: l.island ? { from: { x: l.x + Math.cos(l.island.dock) * dockEnd(l.island).shore, z: l.z + Math.sin(l.island.dock) * dockEnd(l.island).shore }, to: dockEnd(l.island) } : null,
      })),
    [],
  );

  const dist = (p: { x: number; z: number }) => Math.hypot(p.x - boat.x, p.z - boat.z);
  const focus = places.find((p) => p.id === active) ?? null;
  const nearest = useMemo(() => [...places].sort((a, b) => Math.hypot(a.x - boat.x, a.z - boat.z) - Math.hypot(b.x - boat.x, b.z - boat.z))[0], [places, boat]);
  const u = unit;
  const header = (
    <>
      <p className="label">The archipelago</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Where to<span className="stop">?</span>
      </h2>
      <p className="mt-2 text-paper/70">Pick a place on the chart or in the list, and you&apos;re there.</p>
    </>
  );

  return (
    <div className="world-map lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-10">
      <div className="lg:hidden">{header}</div>
      <section className="mt-5 min-w-0 lg:mt-0">
        <div className="world-map__frame relative mx-auto">
          <svg
            ref={svg}
            viewBox={VIEW}
            className="block aspect-square w-full"
            role="img"
            aria-label={`Chart of the archipelago. Your boat is near ${nearest?.label ?? "the hub"}.`}
            onMouseLeave={() => setActive(null)}
          >
            <defs>
              <radialGradient id="map-sea" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#14506a" />
                <stop offset="70%" stopColor="#0d3a50" />
                <stop offset="100%" stopColor="#0a2c3d" />
              </radialGradient>
              <linearGradient id="map-channel" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#d9dbd5" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#1257c7" stopOpacity={0.6} />
              </linearGradient>
            </defs>

            {/* The sea, a faint chart grid, and the edge of the world. */}
            <circle r={WORLD_RADIUS} fill="url(#map-sea)" />
            <g stroke="#fafaf8" strokeOpacity={0.05} strokeWidth={u * 0.8}>
              {[-200, -150, -100, -50, 0, 50, 100, 150, 200].map((v) => (
                <g key={v}>
                  <line x1={v} y1={-WORLD_RADIUS} x2={v} y2={WORLD_RADIUS} />
                  <line x1={-WORLD_RADIUS} y1={v} x2={WORLD_RADIUS} y2={v} />
                </g>
              ))}
            </g>
            <circle r={WORLD_RADIUS} fill="none" stroke="#fafaf8" strokeOpacity={0.25} strokeWidth={u * 1.2} strokeDasharray={`${u * 4} ${u * 5}`} />

            {/* Hard2Soft's channel, chalky to clear, and its markers. */}
            <rect x={-122} y={52} width={30} height={8} rx={4} fill="url(#map-channel)" opacity={0.75} />

            {/* Land: shelf, beach, ground; docks. */}
            {shapes.map((s) => (
              <g key={s.id} aria-hidden>
                {s.island ? <path d={s.shelf} fill={TEAL} fillOpacity={0.13} /> : null}
                {s.island ? <path d={s.beach} fill={BEACH} /> : null}
                <path d={s.land} fill={s.island ? GROUND[s.ground] : "#6d6b67"} />
                {s.dock ? <line x1={s.dock.from.x} y1={s.dock.from.z} x2={s.dock.to.x} y2={s.dock.to.z} stroke="#a0805a" strokeWidth={2.2} strokeLinecap="round" /> : null}
              </g>
            ))}

            {/* Buoys: the service channel and the weather buoys by the Lab. */}
            <g aria-hidden>
              {SERVICE_BUOYS.map((b, i) => (
                <circle key={`s${i}`} cx={b.x} cy={b.z} r={1.6} fill={TEAL} />
              ))}
              {WEATHER_BUOYS.map((b) => (
                <circle key={b.state} cx={b.x} cy={b.z} r={1.4} fill="#fafaf8" fillOpacity={0.8} />
              ))}
              <rect x={REEL_SCREEN.x - 11} y={REEL_SCREEN.z - 1.2} width={22} height={2.4} rx={1} fill="#fafaf8" fillOpacity={0.85} />
            </g>

            {/* The course from the boat to whatever is highlighted. */}
            {focus ? (
              <g aria-hidden>
                <line x1={boat.x} y1={boat.z} x2={focus.x} y2={focus.z} stroke={TEAL} strokeWidth={u * 2} strokeDasharray={`${u * 6} ${u * 5}`} strokeLinecap="round" />
                <text
                  x={(boat.x + focus.x) / 2}
                  y={(boat.z + focus.z) / 2}
                  dy={-u * 6}
                  textAnchor="middle"
                  fontSize={u * 12}
                  fontWeight={600}
                  className="world-map__halo"
                  fill={TEAL}
                  strokeWidth={u * 4}
                >
                  {metres(dist(focus))}
                </text>
              </g>
            ) : null}

            {/* Places: a pin each (the client's colour), with a generous hit area. */}
            {places.map((p) => {
              const on = p.id === active;
              const poi = p.kind === "poi";
              return (
                <g
                  key={p.id}
                  aria-hidden
                  className="cursor-pointer"
                  onMouseEnter={() => setActive(p.id)}
                  onClick={() => onTravel(p.id)}
                >
                  <circle cx={p.x} cy={p.z} r={Math.max(p.r + 4, u * 16)} fill="transparent" />
                  {on ? <circle cx={p.x} cy={p.z} r={p.r + (poi ? 5 : 6)} fill="none" stroke={TEAL} strokeWidth={u * 2.5} /> : null}
                  {poi ? (
                    <circle cx={p.x} cy={p.z} r={u * 5} fill="#0a2c3d" stroke="#fafaf8" strokeWidth={u * 2} />
                  ) : (
                    <circle cx={p.x} cy={p.z} r={u * (on ? 7 : 5.5)} fill={p.accent} stroke="#fafaf8" strokeWidth={u * 1.8} />
                  )}
                </g>
              );
            })}

            {/* Labels, placed so none collide. */}
            {places.map((p) => {
              const l = labels.get(p.id);
              const on = p.id === active;
              if (!l || (!l.shown && !on)) return null;
              const dim = p.kind === "poi" || p.kind === "study";
              return (
                <text
                  key={p.id}
                  aria-hidden
                  x={l.x}
                  y={l.y}
                  textAnchor={l.anchor}
                  fontSize={l.size}
                  fontWeight={BOLD[p.kind]}
                  fill={on ? "#ffffff" : dim ? "rgb(250 250 248 / 0.82)" : "#fafaf8"}
                  className="world-map__halo world-map__label pointer-events-none"
                  strokeWidth={l.size * 0.32}
                >
                  {l.lines.map((line, i) => (
                    <tspan key={i} x={l.x} dy={i ? l.size * 1.12 : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}

            {/* You. */}
            <g aria-hidden transform={`translate(${boat.x.toFixed(1)} ${boat.z.toFixed(1)})`}>
              <circle r={u * 7} fill="#e21f26" fillOpacity={0.35} className="world-map__pulse" />
              <g transform={`rotate(${((-boat.heading * 180) / Math.PI).toFixed(1)})`}>
                <path d={`M0,${-u * 10} L${u * 6.5},${u * 7} L0,${u * 3.5} L${-u * 6.5},${u * 7} Z`} fill="#e21f26" stroke="#ffffff" strokeWidth={u * 1.6} strokeLinejoin="round" />
              </g>
            </g>

            {/* Compass and scale. */}
            <g aria-hidden transform={`translate(${HALF - u * 34} ${-HALF + u * 34})`}>
              <circle r={u * 18} fill="#0a2c3d" fillOpacity={0.8} stroke="#fafaf8" strokeOpacity={0.3} strokeWidth={u} />
              <path d={`M0,${-u * 13} L${u * 4},0 L0,${u * 3} L${-u * 4},0 Z`} fill="#e21f26" />
              <text y={u * 13} textAnchor="middle" fontSize={u * 10} fontWeight={700} fill="#fafaf8">
                N
              </text>
            </g>
            <g aria-hidden transform={`translate(${HALF - u * 22 - 50} ${HALF - u * 22})`}>
              <line x1={0} y1={0} x2={50} y2={0} stroke="#fafaf8" strokeOpacity={0.7} strokeWidth={u * 1.5} />
              <line x1={0} y1={-u * 4} x2={0} y2={u * 4} stroke="#fafaf8" strokeOpacity={0.7} strokeWidth={u * 1.5} />
              <line x1={50} y1={-u * 4} x2={50} y2={u * 4} stroke="#fafaf8" strokeOpacity={0.7} strokeWidth={u * 1.5} />
              <text x={25} y={-u * 7} textAnchor="middle" fontSize={u * 10} fill="#fafaf8" fillOpacity={0.75}>
                50 m
              </text>
            </g>
          </svg>

          {/* What's under the pointer, or where you are. */}
          <div className="world-map__card" aria-hidden>
            {focus ? (
              <>
                <span className="flex items-center gap-2 font-semibold">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: focus.accent }} />
                  {focus.label}
                </span>
                <span className="text-paper/70">{focus.sub}</span>
                <span className="text-teal">{metres(dist(focus))} away · click to sail there</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2 font-semibold">
                  <span className="size-2.5 shrink-0 rounded-full bg-red" />
                  You are here
                </span>
                {nearest ? <span className="text-paper/70">Nearest: {nearest.label}, {metres(dist(nearest))}</span> : null}
              </>
            )}
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-paper/70" aria-label="Chart key">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border border-paper bg-[#ab63f2]" aria-hidden />
            Client work, in its colour
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border border-paper bg-[#0a2c3d]" aria-hidden />
            Around the sea
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-teal" aria-hidden />
            Service buoys
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red" aria-hidden>
              ▲
            </span>
            You
          </li>
        </ul>
      </section>

      <aside className="world-map__side mt-8 lg:mt-0">
        <div className="hidden lg:block">{header}</div>
        <nav aria-label="Fast travel" className="world-map__list">
          <p className="label mt-6 lg:mt-8">Fast travel</p>
          {GROUPS.map((g) => {
            const items = places.filter((p) => p.group === g);
            if (!items.length) return null;
            return (
              <div key={g} className="mt-5">
                <p className="px-3 text-xs font-medium uppercase tracking-[0.14em] text-paper/50">{g}</p>
                <ul className="mt-1.5 grid gap-0.5">
                  {items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-paper/10 focus-visible:bg-paper/10 ${p.id === active ? "bg-paper/10" : ""}`}
                        onMouseEnter={() => setActive(p.id)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(p.id)}
                        onBlur={() => setActive(null)}
                        onClick={() => onTravel(p.id)}
                        aria-label={`${p.label}, ${p.sub}, ${metres(dist(p))} away`}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full border"
                          style={{ background: p.kind === "poi" ? "transparent" : p.accent, borderColor: p.kind === "poi" ? "rgb(250 250 248 / 0.7)" : "transparent" }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{p.label}</span>
                          <span className="block truncate text-sm text-paper/60">{p.sub}</span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-paper/50" aria-hidden>
                          {metres(dist(p))}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
