"use client";

import { useEffect, useRef, useState } from "react";
import type { WorldData } from "@/features/world/data";
import { world } from "@/features/world/store";

export function Harness({ data }: { data: WorldData }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    let disposed = false;
    const abort = new AbortController();
    let handle: { dispose(): void } | null = null;
    const params = new URLSearchParams(window.location.search);
    const quality = params.get("quality");
    if (quality) world.set({ quality: quality === "auto" ? "auto" : (Number(quality) as 1 | 2 | 3) });
    const pick = params.get("weather");
    const time = params.get("time");
    const season = params.get("season");
    if (pick || time || season) world.set({ pick: { weather: (pick ?? "live") as never, time: (time ?? "live") as never, season: (season ?? "live") as never } });
    world.set({ visible: true });
    const unsub = world.subscribe(() => setStatus(`${world.get().status} ${world.get().message} ${world.get().backend ?? ""} near=${world.get().near?.id ?? "-"}`));
    // Each mount gets its own canvas: a canvas keeps its first context forever, so a disposed
    // (lost) context would poison a second engine on the same element.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    host.current!.appendChild(canvas);
    void import("@/features/world/engine").then(async ({ createWorld }) => {
      try {
        const h = await createWorld(canvas, data, { tier: (Number(params.get("tier")) || 3) as 1 | 2 | 3, forceWebGL: params.has("webgl"), sound: false, reduced: false, signal: abort.signal });
        if (disposed) h.dispose();
        else {
          handle = h;
          (window as unknown as { __world: unknown }).__world = h;
          const at = params.get("at");
          if (at) h.travelTo(at);
          const zoom = Number(params.get("zoom"));
          if (zoom) h.zoom(zoom);
        }
      } catch (e) {
        if (disposed) return;
        console.error(e);
        setStatus("error " + String(e));
      }
    });
    return () => {
      disposed = true;
      abort.abort();
      unsub();
      handle?.dispose();
      canvas.remove();
    };
  }, [data]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000" }}>
      <div ref={host} style={{ position: "absolute", inset: 0 }} />
      <p id="status" style={{ position: "absolute", left: 8, bottom: 8, color: "#fff", font: "12px monospace", opacity: 0.001 }}>{status}</p>
    </div>
  );
}
