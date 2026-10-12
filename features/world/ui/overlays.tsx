"use client";

import { FlowLink } from "@/components/ui/flow-link";
import { CONTACT_URL } from "@/lib/site";
import type { WorldData } from "../data";
import { savePrefs, useWorld, world, type Quality } from "../store";
import { PHASE_LABEL, SEASON_LABEL, WEATHER_LABEL, type WeatherPick } from "../weather-logic";

function leave() {
  world.set({ panel: null, overlay: null });
}

// ---------------------------------------------------------------------------------------------
// Logbook: every project as a plain link

export function LogbookContent({ data }: { data: WorldData }) {
  const studies = data.studies.filter((s) => s.slug !== "making-of");
  return (
    <nav aria-label="Logbook">
      <p className="label">Logbook</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Every project, as a page<span className="stop">.</span>
      </h2>
      <ul className="mt-8 grid gap-1">
        {studies.map((s) => (
          <li key={s.slug}>
            <FlowLink href={`/work/${s.slug}`} direction="deeper" onClick={leave} className="flex items-baseline justify-between gap-4 rounded-xl px-3 py-2.5 hover:bg-paper/10">
              <span className="flex items-center gap-3">
                <span className="size-2 shrink-0 rounded-full" style={{ background: s.accent }} aria-hidden />
                <span className="font-medium">{s.client}</span>
              </span>
              <span className="text-right text-sm text-paper/60">{s.industry}</span>
            </FlowLink>
          </li>
        ))}
      </ul>
      <ul className="mt-8 flex flex-wrap gap-2">
        {[
          { href: "/work", label: "All work" },
          { href: "/work/making-of", label: "How we built this world" },
          { href: "/services", label: "Services" },
          { href: "/about", label: "About" },
          { href: "/reel", label: "Reel" },
        ].map((l) => (
          <li key={l.href}>
            <FlowLink href={l.href} onClick={leave} className="world-chip">
              {l.label}
            </FlowLink>
          </li>
        ))}
        <li>
          <a href={CONTACT_URL} className="world-chip">
            Contact <span aria-hidden>↗</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------------------------
// Options: sound, quality, the weather dial

function Choice<T extends string | number>({ legend, value, options, onChange }: { legend: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="mt-6">
      <legend className="label">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={String(o.value)} className="world-radio">
            <input type="radio" name={legend} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function OptionsContent({ onClassic }: { onClassic: () => void }) {
  const pick = useWorld((v) => v.pick);
  const sound = useWorld((v) => v.sound);
  const quality = useWorld((v) => v.quality);
  const live = useWorld((v) => v.live);
  const showing = useWorld((v) => v.showing);
  const backend = useWorld((v) => v.backend);
  const tier = useWorld((v) => v.tier);
  const chosen = useWorld((v) => v.chosen);
  const adapting = !chosen || quality === "auto";

  const setPick = (patch: Partial<WeatherPick>) => {
    world.set({ pick: { ...pick, ...patch } });
    savePrefs();
  };

  const place = live ? (live.located ? `near ${live.place}` : `in ${live.place}, our studio`) : "in New Delhi, our studio";
  return (
    <div>
      <p className="label">Options</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        The sky is yours<span className="stop">.</span>
      </h2>
      <p className="mt-4 text-paper/75">
        Right now: {WEATHER_LABEL[showing.weather].toLowerCase()}, {SEASON_LABEL[showing.season].toLowerCase()}, {PHASE_LABEL[showing.phase].toLowerCase()}.{" "}
        {pick.weather === "live" ? `The weather follows the sky ${place}.` : "You chose this weather."}
      </p>

      <Choice
        legend="Weather"
        value={pick.weather}
        onChange={(weather) => setPick({ weather })}
        options={[
          { value: "live", label: "Yours" },
          { value: "clear", label: "Clear" },
          { value: "rain", label: "Rain" },
          { value: "storm", label: "Storm" },
          { value: "mist", label: "Mist" },
          { value: "snow", label: "Snow" },
        ]}
      />
      <Choice
        legend="Season"
        value={pick.season}
        onChange={(season) => setPick({ season })}
        options={[
          { value: "live", label: "Yours" },
          { value: "spring", label: "Spring" },
          { value: "summer", label: "Summer" },
          { value: "autumn", label: "Autumn" },
          { value: "winter", label: "Winter" },
        ]}
      />
      <Choice
        legend="Time of day"
        value={pick.time}
        onChange={(time) => setPick({ time })}
        options={[
          { value: "live", label: "Yours" },
          { value: "dawn", label: "Dawn" },
          { value: "day", label: "Day" },
          { value: "dusk", label: "Dusk" },
          { value: "night", label: "Night" },
        ]}
      />
      <Choice
        legend="Sound"
        value={sound ? "on" : "off"}
        onChange={(v) => {
          world.set({ sound: v === "on" });
          world.engine()?.setSound(v === "on");
        }}
        options={[
          { value: "off", label: "Off" },
          { value: "on", label: "On" },
        ]}
      />
      <Choice<Quality>
        legend="Quality"
        value={quality}
        onChange={(q) => {
          // An explicit pick is kept: the world stops lightening itself (Auto keeps adapting).
          world.set({ quality: q, chosen: true });
          world.engine()?.setQuality(q);
          savePrefs();
        }}
        options={[
          { value: "auto", label: "Auto" },
          { value: 1, label: "Light" },
          { value: 2, label: "Balanced" },
          { value: 3, label: "Full" },
        ]}
      />

      <button type="button" onClick={onClassic} className="world-chip mt-8">
        Leave for the classic site
      </button>

      <div className="mt-10 grid gap-2 border-t border-paper/15 pt-6 text-sm text-paper/60">
        <p>
          Rendering with {backend === "webgpu" ? "WebGPU" : "WebGL 2"}, quality level {tier}
          {adapting ? ", lightening itself if this device needs it" : ""}. Your approximate city is used only to fetch the weather; nothing is stored.
        </p>
        <p>
          Weather data from{" "}
          <a href="https://www.met.no/en" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            MET Norway
          </a>{" "}
          (CC BY 4.0). Textures and props scanned by{" "}
          <a href="https://polyhaven.com" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            Poly Haven
          </a>{" "}
          (CC0).
        </p>
        <p>Keys: W A S D or arrows to sail, Shift to boost, Space to hop, Enter to explore, H for the horn, M map, L logbook, O options.</p>
      </div>
    </div>
  );
}
