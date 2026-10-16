import type { Block } from "@/content/types";

type Arch = Extract<Block, { kind: "architecture" }>;
type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
type Curve = [Pt, Pt, Pt, Pt];
type Label = { lines: string[]; box: Box; anchor: "start" | "middle" | "end"; ax: number; inline?: boolean };

// A lane is one node wide. Four lanes come to 1258 units, which the 1280px layout draws at 0.94:
// 13px link labels and notes stay above 12px. The node fits a 13px note of about 28 characters.
const NODE_W = 220;
const LANE_GAP = 110;
const NODE_H = 66;
const ROW_GAP = 26;
const PAD = 24;
const BEND = 45;

// Link labels (13px, .arch__link-label), measured generously so a label never runs into a box.
const CHAR_W = 7.3;
const LINE_H = 15;
/** Longer labels break over two lines, so they fit the gap between two lanes. */
const MAX_CHARS = 13;

const point = ([p0, p1, p2, p3]: Curve, t: number): Pt => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: k[0] * p0.x + k[1] * p1.x + k[2] * p2.x + k[3] * p3.x, y: k[0] * p0.y + k[1] * p1.y + k[2] * p2.y + k[3] * p3.y };
};
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const holds = (b: Box, p: Pt) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;

/** Two lines at the space that keeps the longer line shortest. */
function wrap(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  let best = [text];
  for (let i = text.indexOf(" "); i !== -1; i = text.indexOf(" ", i + 1)) {
    const pair = [text.slice(0, i), text.slice(i + 1)];
    if (Math.max(...pair.map((s) => s.length)) < Math.max(...best.map((s) => s.length))) best = pair;
  }
  return best;
}

/**
 * Each label takes the first free spot from a short list (beside a vertical link; otherwise near
 * the target, near the source or mid-way, on the side the curve leaves clear): free means clear of
 * every box, every label already placed and every link. Where nothing is free (a fan of links
 * sharing one gap) the label goes inline: on its own link, over a knockout that other links pass
 * under, so it can't be read as naming a neighbour.
 */
function placeLabels(links: { curve: Curve; label?: string }[], boxes: Box[], width: number, height: number): (Label | null)[] {
  const samples = links.map(({ curve }) => Array.from({ length: 41 }, (_, i) => point(curve, i / 40)));
  const placed: Box[] = [];
  const cost = (box: Box, skip?: number) => {
    const pad = { x: box.x - 3, y: box.y - 2, w: box.w + 6, h: box.h + 4 };
    const outside = box.x < 0 || box.y < 0 || box.x + box.w > width || box.y + box.h > height;
    return (
      (outside ? 100 : 0) +
      10 * boxes.filter((n) => overlaps(pad, n)).length +
      10 * placed.filter((p) => overlaps(pad, p)).length +
      samples.reduce((sum, pts, i) => (i === skip ? sum : sum + pts.filter((p) => holds(pad, p)).length), 0)
    );
  };
  return links.map(({ curve, label }, index) => {
    if (!label) return null;
    const [a, , , b] = curve;
    const vertical = a.x === b.x;
    const lines = vertical ? [label] : wrap(label);
    const w = Math.max(...lines.map((line) => line.length)) * CHAR_W;
    const h = lines.length * LINE_H;
    const above = (y: number) => y - 6 - h;
    const below = (y: number) => y + 6;
    const at = (x: number, y: number, anchor: Label["anchor"]): Omit<Label, "lines"> => ({
      box: { x: anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2, y, w, h },
      anchor,
      ax: x,
    });

    let spots: Omit<Label, "lines">[];
    if (vertical) {
      const mid = (a.y + b.y) / 2 - h / 2;
      spots = [at(a.x + 8, mid, "start"), at(a.x - 8, mid, "end")];
    } else {
      const dir = Math.sign(b.x - a.x);
      const m = point(curve, 0.5);
      const near = (p: Pt, out: number) => p.x + dir * out;
      // Near the target the link is level at b.y, arriving from above or below; near the source it
      // leaves level at a.y, heading up or down. A label sits on the side the curve doesn't use.
      const down = b.y > a.y;
      const tx = near(b, -12);
      const sx = near(a, 12);
      const tAnchor = dir > 0 ? "end" : "start";
      const sAnchor = dir > 0 ? "start" : "end";
      spots =
        a.y === b.y
          ? [at(m.x, above(m.y), "middle"), at(m.x, below(m.y), "middle"), at(tx, above(b.y), tAnchor), at(sx, above(a.y), sAnchor)]
          : [
              at(tx, down ? below(b.y) : above(b.y), tAnchor),
              at(sx, down ? above(a.y) : below(a.y), sAnchor),
              at(m.x, above(m.y), "middle"),
              at(m.x, below(m.y), "middle"),
              at(tx, down ? above(b.y) : below(b.y), tAnchor),
              at(sx, down ? below(a.y) : above(a.y), sAnchor),
            ];
    }

    let best: Omit<Label, "lines"> | undefined = spots.find((spot) => cost(spot.box) === 0);
    if (!best) {
      // Inline: centred on its own link where the fewest others pass under it.
      let least = Infinity;
      for (const t of [0.5, 0.4, 0.6, 0.3, 0.7]) {
        const p = point(curve, t);
        const spot = { ...at(p.x, p.y - h / 2, "middle"), inline: true };
        const c = cost(spot.box, index);
        if (c < least) [best, least] = [spot, c];
      }
    }
    placed.push(best!.box);
    return { lines, ...best! };
  });
}

/**
 * Server-rendered system diagram. From 1280px an SVG laid out in lanes, wide of the reading column,
 * with links that draw themselves on scroll; narrower screens, where four lanes would shrink the
 * text below 12px, get the same information as a stacked list that keeps the connections and
 * their labels.
 */
export function Architecture({ block, level = 2 }: { block: Arch; level?: 2 | 3 }) {
  const H = `h${level}` as const;
  const lanes = Math.max(...block.nodes.map((n) => n.lane)) + 1;
  const rowsPerLane = new Map<number, number>();
  const pos = new Map<string, { x: number; y: number }>();
  for (const node of block.nodes) {
    const row = rowsPerLane.get(node.lane) ?? 0;
    rowsPerLane.set(node.lane, row + 1);
    pos.set(node.id, { x: PAD + node.lane * (NODE_W + LANE_GAP), y: PAD + row * (NODE_H + ROW_GAP) });
  }
  const maxRows = Math.max(...rowsPerLane.values());
  const width = PAD * 2 + lanes * NODE_W + (lanes - 1) * LANE_GAP;
  const height = PAD * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP;
  const marker = `arch-${block.nodes.map((n) => n.id).join("-")}`.replace(/[^a-zA-Z0-9-]/g, "");

  const paths = block.links.flatMap((link) => {
    const a = pos.get(link.from);
    const b = pos.get(link.to);
    if (!a || !b) return [];
    let curve: Curve;
    if (a.x === b.x) {
      // Same lane: leave from the edge that faces the target (down or up).
      const down = b.y > a.y;
      const x = a.x + NODE_W / 2;
      const from = { x, y: down ? a.y + NODE_H : a.y };
      const to = { x, y: down ? b.y : b.y + NODE_H };
      curve = [from, from, to, to];
    } else {
      // Across lanes: right edge to left edge going forward, left edge to right edge going back.
      const forward = b.x > a.x;
      const bend = forward ? BEND : -BEND;
      const from = { x: forward ? a.x + NODE_W : a.x, y: a.y + NODE_H / 2 };
      const to = { x: forward ? b.x : b.x + NODE_W, y: b.y + NODE_H / 2 };
      curve = [from, { x: from.x + bend, y: from.y }, { x: to.x - bend, y: to.y }, to];
    }
    const [p0, p1, p2, p3] = curve;
    const d = p0.x === p3.x ? `M${p0.x},${p0.y} L${p3.x},${p3.y}` : `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
    return [{ d, curve, label: link.label, key: `${link.from}-${link.to}` }];
  });
  const boxes = [...pos.values()].map(({ x, y }) => ({ x, y, w: NODE_W, h: NODE_H }));
  const labels = placeLabels(paths, boxes, width, height);

  const label = (id: string) => block.nodes.find((n) => n.id === id)?.label ?? id;
  const byLane = Array.from({ length: lanes }, (_, lane) => block.nodes.filter((n) => n.lane === lane));

  return (
    <figure className="my-16">
      {block.heading ? <H className="study-h3 mb-8">{block.heading}</H> : null}

      <div className="study-wide hidden xl:block">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="arch h-auto w-full"
          role="img"
          aria-label={`${block.heading ?? "System diagram"}: ${block.nodes.map((n) => n.label).join(", ")}`}
        >
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9 z" className="arch__arrow" />
            </marker>
          </defs>
          {paths.map((p) => (
            <path key={p.key} d={p.d} className="arch__link" pathLength={1} markerEnd={`url(#${marker})`} />
          ))}
          {block.nodes.map((node) => {
            const { x, y } = pos.get(node.id)!;
            return (
              <g key={node.id} transform={`translate(${x} ${y})`}>
                <rect width={NODE_W} height={NODE_H} rx={14} className="arch__node" />
                <text x={18} y={node.note ? 28 : 38} className="arch__label">
                  {node.label}
                </text>
                {node.note ? (
                  <text x={18} y={48} className="arch__note">
                    {node.note}
                  </text>
                ) : null}
              </g>
            );
          })}
          {labels.map((l, i) =>
            l ? (
              <g key={paths[i].key}>
                {l.inline ? <rect x={l.box.x - 4} y={l.box.y - 2} width={l.box.w + 8} height={l.box.h + 4} rx={4} className="arch__knockout" /> : null}
                <text textAnchor={l.anchor} className={`arch__link-label ${l.inline ? "arch__link-label--inline" : ""}`}>
                  {l.lines.map((line, j) => (
                    // 11 of the 15px line sit above the baseline.
                    <tspan key={line} x={l.ax} y={l.box.y + 11 + j * LINE_H}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            ) : null,
          )}
        </svg>
      </div>

      <ol className="grid xl:hidden">
        {byLane.map((nodes, lane) => (
          <li key={lane}>
            {lane > 0 ? <span aria-hidden className="arch-stack__join" /> : null}
            {/* Tablets: a lane's parts sit side by side, so each lane reads as one stage of the flow. */}
            <div className="grid gap-2 md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
              {nodes.map((node) => {
                const out = block.links.filter((l) => l.from === node.id);
                return (
                  <div key={node.id} className="rounded-xl border border-(--c-line) bg-(--c-surface) px-4 py-3">
                    <p className="font-medium">{node.label}</p>
                    {node.note ? <p className="text-sm text-(--c-muted)">{node.note}</p> : null}
                    {out.length ? (
                      <ul className="mt-2 grid gap-0.5 text-sm text-(--c-muted)" aria-label={`${node.label} connects to`}>
                        {out.map((l) => (
                          <li key={l.to}>
                            <span aria-hidden className="text-(--c-accent-ink)">
                              →{" "}
                            </span>
                            {label(l.to)}
                            {l.label ? <span className="italic"> · {l.label}</span> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {block.caption ? <figcaption className="mt-5 text-sm text-(--c-muted)">{block.caption}</figcaption> : null}
    </figure>
  );
}
