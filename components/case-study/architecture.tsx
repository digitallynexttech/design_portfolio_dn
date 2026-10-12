import type { Block } from "@/content/types";

type Arch = Extract<Block, { kind: "architecture" }>;

const LANE_W = 250;
const LANE_GAP = 70;
const NODE_W = 200;
const NODE_H = 66;
const ROW_GAP = 26;
const PAD = 24;
const BEND = 45;

/**
 * Server-rendered system diagram. Desktop gets an SVG laid out in lanes with links that draw
 * themselves on scroll; phones get the same information as a stacked list that keeps the
 * connections and their labels.
 */
export function Architecture({ block, level = 2 }: { block: Arch; level?: 2 | 3 }) {
  const H = `h${level}` as const;
  const lanes = Math.max(...block.nodes.map((n) => n.lane)) + 1;
  const rowsPerLane = new Map<number, number>();
  const pos = new Map<string, { x: number; y: number }>();
  for (const node of block.nodes) {
    const row = rowsPerLane.get(node.lane) ?? 0;
    rowsPerLane.set(node.lane, row + 1);
    pos.set(node.id, { x: PAD + node.lane * (LANE_W + LANE_GAP), y: PAD + row * (NODE_H + ROW_GAP) });
  }
  const maxRows = Math.max(...rowsPerLane.values());
  const width = PAD * 2 + lanes * LANE_W + (lanes - 1) * LANE_GAP;
  const height = PAD * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP;
  const marker = `arch-${block.nodes.map((n) => n.id).join("-")}`.replace(/[^a-zA-Z0-9-]/g, "");

  const paths = block.links.flatMap((link) => {
    const a = pos.get(link.from);
    const b = pos.get(link.to);
    if (!a || !b) return [];
    let d: string;
    let x1: number, y1: number, x2: number, y2: number;
    if (a.x === b.x) {
      // Same lane: leave from the edge that faces the target (down or up).
      const down = b.y > a.y;
      x1 = x2 = a.x + NODE_W / 2;
      y1 = down ? a.y + NODE_H : a.y;
      y2 = down ? b.y : b.y + NODE_H;
      d = `M${x1},${y1} L${x2},${y2}`;
    } else {
      // Across lanes: right edge to left edge going forward, left edge to right edge going back.
      const forward = b.x > a.x;
      x1 = forward ? a.x + NODE_W : a.x;
      x2 = forward ? b.x : b.x + NODE_W;
      y1 = a.y + NODE_H / 2;
      y2 = b.y + NODE_H / 2;
      const bend = forward ? BEND : -BEND;
      d = `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`;
    }
    return [{ d, label: link.label, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, key: `${link.from}-${link.to}` }];
  });

  const label = (id: string) => block.nodes.find((n) => n.id === id)?.label ?? id;
  const byLane = Array.from({ length: lanes }, (_, lane) => block.nodes.filter((n) => n.lane === lane));

  return (
    <figure className="my-16">
      {block.heading ? <H className="study-h3 mb-8">{block.heading}</H> : null}

      <div className="hidden overflow-x-auto md:block">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="arch h-auto w-full min-w-[44rem]"
          role="img"
          aria-label={`${block.heading ?? "System diagram"}: ${block.nodes.map((n) => n.label).join(", ")}`}
        >
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9 z" className="arch__arrow" />
            </marker>
          </defs>
          {paths.map((p) => (
            <g key={p.key}>
              <path d={p.d} className="arch__link" pathLength={1} markerEnd={`url(#${marker})`} />
              {p.label ? (
                <text x={p.mx} y={p.my - 8} textAnchor="middle" className="arch__link-label">
                  {p.label}
                </text>
              ) : null}
            </g>
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
        </svg>
      </div>

      <ol className="grid md:hidden">
        {byLane.map((nodes, lane) => (
          <li key={lane}>
            {lane > 0 ? <span aria-hidden className="arch-stack__join" /> : null}
            <div className="grid gap-2">
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
