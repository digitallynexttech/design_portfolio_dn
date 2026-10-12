"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useWorld, world } from "../store";

// The interface and engine load only once someone sets sail.
const WorldApp = dynamic(() => import("./world-app"), { ssr: false });

const HASH = "#sail";

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

/** Open the world: the URL becomes /#sail, so Back returns to the page. */
export function openWorld(sound: boolean) {
  world.set({ sound });
  if (window.location.pathname !== "/") return;
  if (window.location.hash !== HASH) {
    window.history.pushState({ dnWorld: true }, "", `/${HASH}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

/** Leave the world for the classic page underneath. */
export function closeWorld() {
  const state = window.history.state as { dnWorld?: boolean } | null;
  if (state?.dnWorld) window.history.back();
  else {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

/**
 * Lives in the root layout, so the world survives navigation: read a case study, press Back, and
 * the boat is where you left it. Visible only on the home page with #sail in the URL.
 */
export function WorldRoot() {
  const pathname = usePathname();
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const status = useWorld((v) => v.status);
  const hasData = useSyncExternalStore(world.subscribe, () => world.data() !== null, () => false);
  const visible = pathname === "/" && hash === HASH;

  useEffect(() => {
    world.set({ visible });
    if (visible && status === "closed" && hasData) world.set({ status: "loading", progress: 0, message: "Filling the sea", error: null });
  }, [visible, status, hasData]);

  useEffect(() => {
    document.documentElement.dataset.world = visible ? status : "off";
  }, [visible, status]);

  return status === "closed" ? null : <WorldApp />;
}
