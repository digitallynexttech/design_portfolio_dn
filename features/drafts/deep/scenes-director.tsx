"use client";

import { useEffect } from "react";

/**
 * Runs the projector for Selected work. Only the scene that fills most of the screen plays: its loop
 * is fetched the first time it is shown (nothing loads before), and every other loop is paused. With
 * reduced motion nothing plays and each scene keeps its still. While the scenes are pinned and pan
 * sideways, keyboard focus on a scene's link scrolls the page to where that scene rests in view.
 */
export function ScenesDirector() {
  useEffect(() => {
    const section = document.getElementById("work");
    if (!section) return;
    const pin = section.querySelector<HTMLElement>(".dd-work__pin");
    const track = section.querySelector<HTMLElement>(".dd-work__track");
    const scenes = Array.from(section.querySelectorAll<HTMLElement>("[data-dd-scene]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ratios = new Map<HTMLElement, number>();
    let playing: HTMLElement | null = null;

    const stop = (scene: HTMLElement) => {
      scene.removeAttribute("data-playing");
      scene.querySelector("video")?.pause();
    };
    const start = (scene: HTMLElement) => {
      scene.setAttribute("data-playing", "");
      const video = scene.querySelector("video");
      if (!video || reduced.matches) return;
      if (!video.src && video.dataset.src) {
        video.muted = true;
        video.src = video.dataset.src;
        video.addEventListener("playing", () => video.setAttribute("data-live", ""), { once: true });
      }
      void video.play().catch(() => undefined);
    };
    const choose = () => {
      let best: HTMLElement | null = null;
      let bestRatio = 0.55;
      for (const [scene, ratio] of ratios) {
        if (ratio > bestRatio) {
          best = scene;
          bestRatio = ratio;
        }
      }
      if (best === playing) return;
      if (playing) stop(playing);
      playing = best;
      if (best) start(best);
    };
    // How much of the screen a scene fills (a tall phone scene never shows all of itself at once).
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const r = entry.intersectionRect;
          const w = entry.rootBounds?.width || window.innerWidth;
          const h = entry.rootBounds?.height || window.innerHeight;
          ratios.set(entry.target as HTMLElement, (r.width * r.height) / Math.max(1, w * h));
        }
        choose();
      },
      { threshold: Array.from({ length: 21 }, (_, k) => k / 20) },
    );
    for (const scene of scenes) io.observe(scene);
    const onMotion = () => {
      if (playing) {
        stop(playing);
        playing = null;
      }
      choose();
    };
    reduced.addEventListener("change", onMotion);

    // Pinned: the track pans on the scroll timeline. Focus inside a scene that is off to the side
    // brings the page to the scroll position where that scene holds the frame.
    const onFocus = (event: FocusEvent) => {
      if (!pin || !track || getComputedStyle(track).animationName === "none") return;
      const scene = (event.target as Element).closest<HTMLElement>("[data-dd-scene]");
      if (!scene) return;
      const panel = scenes.indexOf(scene) + 1;
      const moves = Math.max(1, scenes.length);
      const top = pin.getBoundingClientRect().top + window.scrollY;
      const travel = pin.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (panel / moves) * travel, behavior: "instant" });
    };
    section.addEventListener("focusin", onFocus);

    return () => {
      io.disconnect();
      reduced.removeEventListener("change", onMotion);
      section.removeEventListener("focusin", onFocus);
      for (const scene of scenes) stop(scene);
    };
  }, []);
  return null;
}
