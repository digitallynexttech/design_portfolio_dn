"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LiquidSurface } from "@/components/liquid/liquid-surface";
import { setWaterCovered } from "@/features/water/bus";
import { loadPrefs, useWorld, useWorldData, world, type EngineHandle } from "../store";
import { WEATHER_LABEL, type LiveWeather } from "../weather-logic";
import { MapContent } from "./map";
import { LogbookContent, OptionsContent } from "./overlays";
import { PanelContent, panelLabel } from "./panels";
import { TouchControls } from "./touch";
import { closeWorld } from "./world-root";

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Quality tier for the world, or null if the device can't run it at all. */
function worldTier(): 1 | 2 | 3 | null {
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2") && !("gpu" in navigator)) return null;
  } catch {
    return null;
  }
  const nav = navigator as NavigatorHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (nav.connection?.saveData || cores <= 4 || memory <= 2) return 1;
  if (coarse) return memory >= 6 && cores >= 8 ? 2 : 1;
  return cores >= 8 && memory >= 8 ? 3 : 2;
}

function useCoarse() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

function clock(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(Math.min(59, m)).padStart(2, "0")}`;
}

async function fetchLive(): Promise<LiveWeather | null> {
  try {
    const cached = sessionStorage.getItem("dn-world-weather");
    if (cached) {
      const { at, live } = JSON.parse(cached) as { at: number; live: LiveWeather };
      if (Date.now() - at < 15 * 60 * 1000) return live;
    }
  } catch {
    // Fall through to the network.
  }
  try {
    const res = await fetch("/api/weather");
    if (!res.ok) return null;
    const live = (await res.json()) as LiveWeather;
    try {
      sessionStorage.setItem("dn-world-weather", JSON.stringify({ at: Date.now(), live }));
    } catch {
      // Storage is optional.
    }
    return live;
  } catch {
    return null;
  }
}

export default function WorldApp() {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const prompt = useRef<HTMLButtonElement>(null);
  const data = useWorldData();
  const status = useWorld((v) => v.status);
  const visible = useWorld((v) => v.visible);
  const progress = useWorld((v) => v.progress);
  const message = useWorld((v) => v.message);
  const error = useWorld((v) => v.error);
  const near = useWorld((v) => v.near);
  const panel = useWorld((v) => v.panel);
  const overlay = useWorld((v) => v.overlay);
  const sound = useWorld((v) => v.sound);
  const sailed = useWorld((v) => v.sailed);
  const toast = useWorld((v) => v.toast);
  const showing = useWorld((v) => v.showing);
  const live = useWorld((v) => v.live);
  const pick = useWorld((v) => v.pick);
  const coarse = useCoarse();
  const [hintGone, setHintGone] = useState(false);
  // Announced to screen readers as the boat comes into reach of a dock.
  const announce = near ? `${near.verb}. Press Enter.` : "";
  const engineRef = useRef<EngineHandle | null>(null);

  // Create the engine once, on its own canvas.
  useEffect(() => {
    if (!data || !host.current) return;
    const prefs = loadPrefs();
    world.set(prefs);
    const tier = worldTier();
    if (!tier) {
      world.set({ status: "error", error: "This browser can't draw the 3D world. Everything in it is on the classic site." });
      return;
    }
    const quality = world.get().quality;
    const chosen = quality !== "auto" ? quality : tier;
    world.set({ tier: chosen });
    const canvas = document.createElement("canvas");
    canvas.className = "world-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.current.appendChild(canvas);
    let disposed = false;
    const abort = new AbortController();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const forceWebGL = new URLSearchParams(window.location.search).has("webgl");
    void import("../engine")
      .then(({ createWorld }) => createWorld(canvas, data, { tier: chosen, forceWebGL, sound: world.get().sound, reduced, signal: abort.signal }))
      .then((engine) => {
        if (disposed) {
          engine.dispose();
          return;
        }
        engineRef.current = engine;
        world.setEngine(engine);
        engine.setPick(world.get().pick);
        const l = world.get().live;
        if (l) engine.setLive(l);
        engine.setPromptElement(prompt.current);
      })
      .catch((e: unknown) => {
        if (disposed) return;
        console.error(e);
        world.set({ status: "error", error: "The 3D world couldn't start on this device. Everything in it is on the classic site." });
      });
    void fetchLive().then((l) => {
      if (!l) return;
      world.set({ live: l });
      engineRef.current?.setLive(l);
    });
    return () => {
      disposed = true;
      abort.abort();
      engineRef.current?.dispose();
      engineRef.current = null;
      world.setEngine(null);
      canvas.remove();
    };
  }, [data]);

  // Show or hide with the URL; pause whenever the world is covered or away.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (visible && !d.open) {
      d.showModal();
      // Keys belong to the boat, not to whichever HUD button the dialog would focus first.
      host.current?.focus({ preventScroll: true });
      document.documentElement.classList.add("world-open");
      setWaterCovered("world", true);
      engineRef.current?.resize();
    } else if (!visible && d.open) {
      d.close();
      document.documentElement.classList.remove("world-open");
      setWaterCovered("world", false);
      world.set({ panel: null, overlay: null });
    }
  }, [visible, status]);

  useEffect(() => {
    engineRef.current?.setPaused(!visible || !!panel || !!overlay);
  }, [visible, panel, overlay, status]);

  useEffect(() => {
    engineRef.current?.setPick(pick);
  }, [pick]);

  useEffect(() => {
    engineRef.current?.setSound(sound);
  }, [sound]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => world.set({ toast: null }), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sailed) return;
    const t = window.setTimeout(() => setHintGone(true), 6000);
    return () => window.clearTimeout(t);
  }, [sailed]);

  // Shortcuts: M map, L logbook, O options. Steering hands focus back from a HUD button to the
  // world, so the next Enter explores a dock instead of pressing that button again.
  useEffect(() => {
    const steering = /^(Key[WASD]|Arrow(Up|Down|Left|Right))$/;
    const onKey = (e: KeyboardEvent) => {
      if (!world.get().visible || world.get().panel || world.get().overlay || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (steering.test(e.code) && target?.closest(".world-hud")) host.current?.focus({ preventScroll: true });
      if (e.code === "KeyM") world.set({ overlay: "map" });
      else if (e.code === "KeyL") world.set({ overlay: "logbook" });
      else if (e.code === "KeyO") world.set({ overlay: "options" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const origin = coarse ? "bottom" : "right";
  const running = status === "running";
  const place = live?.place ?? "New Delhi";

  return (
    <dialog
      ref={dialog}
      className="world"
      aria-label="The archipelago: sail between our projects"
      aria-describedby="world-help"
      onCancel={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={host}
        tabIndex={-1}
        className="world-stage"
        onWheel={(e) => engineRef.current?.zoom(Math.sign(e.deltaY) * 0.12)}
        onPointerDown={(e) => {
          // Clicking the water hands keyboard focus back to the world.
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "CANVAS") (document.activeElement as HTMLElement | null)?.blur?.();
        }}
      />

      <p id="world-help" className="sr-only">
        A small sea with an island for each of our projects. Use W A S D or the arrow keys to sail, Enter at a dock to open a project, M for a map with fast travel and L
        for a plain list of every project.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* Loading: a real frame of the world, then the world itself. */}
      <div className="world-loading" data-done={running || status === "error"} aria-hidden={running}>
        <Image src="/world/poster.webp" alt="" fill sizes="100vw" className="object-cover" priority={false} />
        <div className="world-loading__veil" />
        <div className="relative z-10 grid max-w-md gap-4 px-6 text-center">
          {status === "error" ? (
            <>
              <p className="text-xl">{error}</p>
              <button type="button" className="world-chip mx-auto" onClick={closeWorld}>
                Back to the classic site
              </button>
            </>
          ) : (
            <>
              <p className="font-display text-3xl font-semibold tracking-tight">{message || "Filling the sea"}…</p>
              <div className="world-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
            </>
          )}
        </div>
      </div>

      {running ? (
        <>
          <header className="world-hud world-hud--top">
            <div className="flex items-center gap-3">
              <button type="button" className="world-chip" onClick={closeWorld}>
                <span aria-hidden>←</span> Classic site
              </button>
              <button type="button" className="world-chip max-md:hidden" onClick={() => world.set({ overlay: "options" })} aria-label={`Weather: ${WEATHER_LABEL[showing.weather]}. Open options`}>
                {WEATHER_LABEL[showing.weather]} · {pick.weather === "live" ? place : "your pick"} · {clock(showing.hour)}
              </button>
            </div>
            <nav className="flex items-center gap-2" aria-label="World">
              <button type="button" className="world-chip" onClick={() => world.set({ overlay: "map" })} aria-keyshortcuts="M">
                Map
              </button>
              <button type="button" className="world-chip" onClick={() => world.set({ overlay: "logbook" })} aria-keyshortcuts="L">
                Logbook
              </button>
              <button type="button" className="world-chip" onClick={() => world.set({ sound: !sound })} aria-pressed={sound}>
                Sound {sound ? "on" : "off"}
              </button>
              <button type="button" className="world-chip" onClick={() => world.set({ overlay: "options" })} aria-keyshortcuts="O">
                Options
              </button>
            </nav>
          </header>

          {!coarse ? (
            <p className="world-hint" data-gone={hintGone}>
              <kbd>W A S D</kbd> sail · <kbd>Shift</kbd> boost · <kbd>Space</kbd> hop · <kbd>Enter</kbd> explore · <kbd>M</kbd> map
            </p>
          ) : null}

          {coarse ? <TouchControls /> : null}

          {toast ? (
            <p className="world-toast" role="status">
              {toast}
            </p>
          ) : null}
        </>
      ) : null}

      <button ref={prompt} type="button" className="world-prompt" style={{ opacity: 0 }} tabIndex={near && running ? 0 : -1} aria-hidden={!near} onClick={() => engineRef.current?.interact()}>
        {coarse ? null : <kbd>Enter</kbd>}
        <span>{near?.verb ?? ""}</span>
      </button>

      {data ? (
        <>
          <LiquidSurface open={!!panel} onClose={() => world.set({ panel: null })} origin={origin} label={panel ? panelLabel(panel, data) : "Details"}>
            {panel ? <PanelContent panel={panel} data={data} /> : null}
          </LiquidSurface>
          <LiquidSurface open={overlay === "map"} onClose={() => world.set({ overlay: null })} origin="bottom" label="Map" size="full">
            {overlay === "map" ? (
              <MapContent
                data={data}
                onTravel={(id) => {
                  world.set({ overlay: null });
                  engineRef.current?.travelTo(id);
                }}
              />
            ) : null}
          </LiquidSurface>
          <LiquidSurface open={overlay === "logbook"} onClose={() => world.set({ overlay: null })} origin="left" label="Logbook">
            {overlay === "logbook" ? <LogbookContent data={data} /> : null}
          </LiquidSurface>
          <LiquidSurface open={overlay === "options"} onClose={() => world.set({ overlay: null })} origin="right" label="Options">
            {overlay === "options" ? (
              <OptionsContent
                onClassic={() => {
                  world.set({ overlay: null });
                  closeWorld();
                }}
              />
            ) : null}
          </LiquidSurface>
        </>
      ) : null}
    </dialog>
  );
}
