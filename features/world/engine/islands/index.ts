// Builds every island: a dock and prompt for each, then each island's own structures, then the
// shared trees and rocks in a few instanced draw calls, then everything static merged by material.
import { ISLANDS, LANDMASSES } from "../../layout";
import type { Body } from "../physics";
import { groundHeight, scatter } from "../terrain";
import { Batch, createFlora, createMaterials, disposables, disposeAll, dock, plant, sign, type IslandCtx, type Part } from "./common";
import { buildExtras } from "./extras";
import { buildDnms, buildH2s, buildKyg, buildSkelmet } from "./flagships";
import { buildHub } from "./hub";
import { buildChetan, buildHappyGanga, buildKygNetwork, buildLeocym, buildRealty, buildTalentifix } from "./islets";
import { buildLab } from "./lab";
import { createProps } from "./props";
import { buildStudio } from "./studio";

const VERB: Record<string, (label: string) => string> = {
  study: (label) => `Explore ${label}`,
  making: () => "How we built this world",
  studio: () => "Meet the studio",
  lab: () => "What's in the Lab",
};

// Islets get a generic sign by the dock; flagships, the hub, the studio and the Lab sign themselves.
const SELF_SIGNED = new Set(["hub", "skelmet", "know-your-genes", "hard2soft", "dnms", "studio", "lab"]);

const ACCENT: Record<string, string> = {
  "happy-ganga": "#0896ac",
  leocym: "#f07814",
  "kyg-network": "#0f766e",
  talentifix: "#0000ff",
  "chetan-mangalwedhe": "#4ecca3",
  "realty-canvas": "#feb711",
};

export async function createIslands(base: Omit<IslandCtx, "props">) {
  const props = createProps(base.shared);
  const ctx: IslandCtx = { ...base, props };
  const mats = createMaterials(ctx.shared, ctx.textures, ctx.rich);
  const batch = new Batch();
  const d = disposables();
  const flora = createFlora(ctx);
  const parts: Part[] = [];

  for (const island of ISLANDS) {
    const verb = (VERB[island.kind] ?? ((l: string) => l))(island.label);
    const info = dock(ctx, batch, mats, island, verb);
    if (!SELF_SIGNED.has(island.id)) {
      const sx = island.x - info.side.x * 4.2 + info.dir.x * (island.r * 0.62);
      const sz = island.z - info.side.z * 4.2 + info.dir.z * (island.r * 0.62);
      const land = LANDMASSES.find((l) => l.id === island.id)!;
      sign(ctx, batch, mats, d, { x: sx, y: Math.max(0.4, groundHeight(land, sx, sz)) + 0.15, z: sz }, island.label, island.sub, ACCENT[island.id] ?? "#0ec8c5", 5.6);
    }
  }

  parts.push(buildHub(ctx, batch, mats, d, flora));
  parts.push(buildSkelmet(ctx, batch, mats, d, flora));
  parts.push(buildKyg(ctx, batch, mats, d, flora));
  parts.push(buildH2s(ctx, batch, mats, d, flora));
  parts.push(buildDnms(ctx, batch, mats, d, flora));
  parts.push(buildHappyGanga(ctx, batch, mats, d, flora));
  parts.push(buildLeocym(ctx, batch, mats, d, flora));
  parts.push(buildKygNetwork(ctx, batch, mats, d, flora));
  parts.push(buildTalentifix(ctx, batch, mats, d, flora));
  parts.push(buildChetan(ctx, batch, mats, d, flora));
  parts.push(buildRealty(ctx, batch, mats, d, flora));
  parts.push(buildStudio(ctx, batch, mats, d, flora));
  parts.push(buildLab(ctx, batch, mats, d, flora));
  parts.push(buildExtras(ctx, batch, mats, d));

  // Shore rocks everywhere; extra trees on the small rocks are skipped.
  for (const land of LANDMASSES) {
    if (land.r < 5) continue;
    plant(flora, land, 0, (n) => scatter(land, n, {}));
  }
  flora.build();
  batch.build(ctx.scene, ctx.tier >= 2);

  return {
    step(dt: number) {
      for (const p of parts) p.step?.(dt);
    },
    update(dt: number, t: number, night: number, boat: Body) {
      for (const p of parts) p.update?.(dt, t, night, boat);
    },
    dispose() {
      for (const p of parts) p.dispose?.();
      flora.dispose();
      batch.dispose();
      disposeAll(d);
      mats.dispose();
      props.dispose();
    },
  };
}
