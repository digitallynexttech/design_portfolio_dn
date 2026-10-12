"use client";

import Image from "next/image";
import { useState } from "react";
import { FlowLink } from "@/components/ui/flow-link";
import { CONTACT_URL } from "@/lib/site";
import type { WorldData, WorldStudy } from "../data";
import type { Panel } from "../store";
import { world } from "../store";

const MAKING_OF = "making-of";

function leave() {
  // Navigating away: the world pauses behind the next page and remembers the boat.
  world.set({ panel: null, overlay: null });
}

function Gallery({ study }: { study: WorldStudy }) {
  const [index, setIndex] = useState(0);
  const images = study.gallery;
  const image = images[index];
  return (
    <figure className="mt-8">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-paper/5">
        <Image key={image.src} src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 34rem, 92vw" className="object-cover object-top" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-paper/60" aria-live="polite">
            {index + 1} / {images.length}
          </p>
          <div className="flex gap-2">
            <button type="button" className="world-chip" onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label="Previous image">
              ←
            </button>
            <button type="button" className="world-chip" onClick={() => setIndex((index + 1) % images.length)} aria-label="Next image">
              →
            </button>
          </div>
        </div>
      ) : null}
    </figure>
  );
}

function StudyPanel({ study }: { study: WorldStudy }) {
  return (
    <article>
      <p className="flex items-center gap-2 font-mono text-sm text-paper/70">
        <span className="size-2 rounded-full" style={{ background: study.accent }} aria-hidden />
        {study.industry} · {study.year}
      </p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        {study.client}
        <span className="stop">.</span>
      </h2>
      <p className="mt-4 text-xl leading-snug text-paper/85">{study.headline}</p>
      <Gallery study={study} />
      {study.metrics.length ? (
        <dl className="mt-8 grid grid-cols-2 gap-5">
          {study.metrics.slice(0, 2).map((m) => (
            <div key={m.label} className="border-t border-paper/15 pt-3">
              <dt className="sr-only">{m.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-semibold tracking-tight">{m.value}</span>
                <span className="mt-1 block text-sm text-paper/60">{m.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-6 text-paper/70">{study.summary}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <FlowLink
          href={`/work/${study.slug}`}
          direction="deeper"
          onClick={leave}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium"
          style={{ background: study.accent, color: study.onAccent }}
        >
          Read the case study · {study.chapters} chapters <span aria-hidden>→</span>
        </FlowLink>
        {study.liveUrl ? (
          <a href={study.liveUrl} target="_blank" rel="noreferrer" className="world-chip">
            Visit the live site <span aria-hidden>↗</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

function MakingOfPanel({ data }: { data: WorldData }) {
  const study = data.studies.find((s) => s.slug === MAKING_OF);
  return (
    <article>
      <p className="label">The hub · Digitally Next</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        How we built this world<span className="stop">.</span>
      </h2>
      <p className="mt-4 text-xl leading-snug text-paper/85">
        The sea, the islands, the weather and the boat are made in code by our own team, finished with free public-domain scans of rock, sand, timber
        and a few props. No game engine, nothing bought, no recorded sound.
      </p>
      <ul className="mt-6 grid gap-3 text-paper/75">
        <li>One wave model, read by the GPU to draw the sea and by the CPU to float the boat.</li>
        <li>WebGPU where the browser has it, WebGL 2 where it doesn&apos;t, from one set of shaders.</li>
        <li>The weather follows yours. Every sound is synthesised live.</li>
      </ul>
      {study ? (
        <FlowLink href={`/work/${study.slug}`} direction="deeper" onClick={leave} className="mt-8 inline-flex items-center gap-2 rounded-full bg-red px-5 py-3 font-medium text-paper">
          Read the full story · {study.chapters} chapters <span aria-hidden>→</span>
        </FlowLink>
      ) : null}
    </article>
  );
}

function StudioPanel({ data }: { data: WorldData }) {
  const groups: { title: string; key: string }[] = [
    { title: "Web", key: "WEM" },
    { title: "Design, video and motion", key: "VIM" },
    { title: "Studio", key: "Studio" },
  ];
  const photo = data.studioPhotos[0];
  return (
    <article>
      <p className="label">The studio</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Who poured it<span className="stop">.</span>
      </h2>
      <p className="mt-4 text-xl leading-snug text-paper/85">
        {data.facts.years} years, {data.facts.brands} brands, one team in {data.facts.city}. Every boat in the marina carries one of our names.
      </p>
      {photo ? (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 34rem, 92vw" className="object-cover" />
        </div>
      ) : null}
      <div className="mt-8 grid gap-6">
        {groups.map((g) => {
          const people = data.team.filter((p) => p.group === g.key);
          return people.length ? (
            <section key={g.key}>
              <h3 className="label">{g.title}</h3>
              <ul className="mt-3 grid gap-1">
                {people.map((p) => (
                  <li key={p.name}>
                    {p.name} <span className="text-paper/60">· {p.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null;
        })}
      </div>
      <FlowLink href="/about" onClick={leave} className="world-chip mt-8">
        Meet the studio <span aria-hidden>→</span>
      </FlowLink>
    </article>
  );
}

function LabPanel() {
  return (
    <article>
      <p className="label">The Lab</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Made for no client<span className="stop">.</span>
      </h2>
      <p className="mt-4 text-xl leading-snug text-paper/85">The pieces we build to find out how far a browser can go. Nothing here was asked for.</p>
      <dl className="mt-8 grid gap-6">
        <div>
          <dt className="font-semibold">The tank</dt>
          <dd className="mt-1 text-paper/70">Your wake, as the simulation sees it: a wave equation solved on the GPU every frame, in a window that travels with your boat.</dd>
        </div>
        <div>
          <dt className="font-semibold">The sculpture</dt>
          <dd className="mt-1 text-paper/70">Thousands of particles pouring into the shapes from our home page: the walking X, a DNA helix, a drop, a wall of screens.</dd>
        </div>
        <div>
          <dt className="font-semibold">The weather buoys</dt>
          <dd className="mt-1 text-paper/70">Sail up to one to change the sky. The world normally follows your own weather, so the buoy marked &ldquo;Your weather&rdquo; puts it back.</dd>
        </div>
      </dl>
    </article>
  );
}

function ServicePanel({ data, id }: { data: WorldData; id: string }) {
  const index = data.services.findIndex((s) => s.id === id);
  const service = data.services[index];
  if (!service) return null;
  return (
    <article>
      <p className="font-mono text-sm text-teal">{String(index + 1).padStart(2, "0")} · How we adapt</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">{service.title}</h2>
      <p className="mt-4 text-xl leading-snug text-paper/85">{service.line}</p>
      {service.proof.length ? (
        <>
          <h3 className="label mt-8">Proof</h3>
          <ul className="mt-3 grid gap-2">
            {service.proof.map((p) => (
              <li key={p.slug}>
                <FlowLink href={`/work/${p.slug}`} direction="deeper" onClick={leave} className="underline decoration-paper/30 underline-offset-4 hover:decoration-teal">
                  {p.client}
                </FlowLink>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <FlowLink href={`/services#${service.id}`} onClick={leave} className="world-chip mt-8">
        All six services <span aria-hidden>→</span>
      </FlowLink>
    </article>
  );
}

function ArchivePanel({ data, index }: { data: WorldData; index: number }) {
  const entry = data.archive[index];
  if (!entry) return null;
  return (
    <article>
      <p className="label">The reef · earlier work</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">{entry.client}</h2>
      <p className="mt-2 text-paper/70">
        {entry.sector} · {entry.platform}
        {entry.year ? ` · ${entry.year}` : ""}
      </p>
      <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl">
        <Image src={entry.image.src} alt={entry.image.alt} fill sizes="(min-width: 768px) 34rem, 92vw" className="object-cover object-top" />
      </div>
      <p className="mt-6 text-lg text-paper/85">{entry.note}</p>
      <a href={entry.url} target="_blank" rel="noreferrer" className="world-chip mt-8">
        Visit the site <span aria-hidden>↗</span>
      </a>
    </article>
  );
}

function ReelPanel() {
  return (
    <article>
      <p className="label">The drive-in</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        The reel<span className="stop">.</span>
      </h2>
      <video className="mt-6 w-full rounded-2xl" src="/video/reel.mp4" poster="/video/reel-poster.webp" controls playsInline preload="metadata" />
      <FlowLink href="/reel" onClick={leave} className="world-chip mt-6">
        Open the reel page <span aria-hidden>→</span>
      </FlowLink>
    </article>
  );
}

function BottlePanel() {
  return (
    <article>
      <p className="label">A message in a bottle</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Something that needs a shape?
      </h2>
      <p className="mt-4 text-xl leading-snug text-paper/85">Pour it in. Tell us what you&apos;re making and we&apos;ll take the shape of it.</p>
      <a href={CONTACT_URL} className="mt-8 inline-flex items-center gap-2 rounded-full bg-red px-5 py-3 font-medium text-paper">
        Start a conversation <span aria-hidden>↗</span>
      </a>
      <p className="mt-4 text-sm text-paper/60">Opens the contact page on digitallynext.com.</p>
    </article>
  );
}

function RecognitionPanel({ data }: { data: WorldData }) {
  return (
    <article>
      <p className="label">The trophy rock</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Recognition<span className="stop">.</span>
      </h2>
      <ul className="mt-8 grid gap-5">
        {data.recognition.map((r) => (
          <li key={r.title} className="border-t border-paper/15 pt-4">
            <p className="font-semibold">{r.title}</p>
            <p className="mt-1 text-paper/70">{r.detail}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function panelLabel(panel: Panel, data: WorldData): string {
  switch (panel.kind) {
    case "study":
      return data.studies.find((s) => s.slug === panel.ref)?.client ?? "Project";
    case "making":
      return "How we built this world";
    case "studio":
      return "The studio";
    case "lab":
      return "The Lab";
    case "service":
      return data.services.find((s) => s.id === panel.ref)?.title ?? "Service";
    case "archive":
      return data.archive[Number(panel.ref)]?.client ?? "Earlier work";
    case "reel":
      return "The reel";
    case "bottle":
      return "A message in a bottle";
    case "recognition":
      return "Recognition";
    default:
      return "Details";
  }
}

export function PanelContent({ panel, data }: { panel: Panel; data: WorldData }) {
  switch (panel.kind) {
    case "study": {
      const study = data.studies.find((s) => s.slug === panel.ref);
      return study ? <StudyPanel study={study} /> : null;
    }
    case "making":
      return <MakingOfPanel data={data} />;
    case "studio":
      return <StudioPanel data={data} />;
    case "lab":
      return <LabPanel />;
    case "service":
      return <ServicePanel data={data} id={panel.ref} />;
    case "archive":
      return <ArchivePanel data={data} index={Number(panel.ref)} />;
    case "reel":
      return <ReelPanel />;
    case "bottle":
      return <BottlePanel />;
    case "recognition":
      return <RecognitionPanel data={data} />;
    default:
      return null;
  }
}
