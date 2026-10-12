// The weather state: resolves "what should it be" (the visitor's live sky, or the dial) into
// numbers, and eases every number toward its target. Live changes drift over about a minute; a
// choice on the dial settles in a few seconds so it feels like an answer.
import * as THREE from "three/webgpu";
import { world } from "../store";
import {
  hourFor,
  LIVE_PICK,
  phaseFor,
  seasonFor,
  STUDIO_PLACE,
  targetsFor,
  type LiveWeather,
  type Season,
  type WeatherPick,
  type WeatherState,
  type WeatherTargets,
} from "../weather-logic";
import type { Audio } from "./audio";
import type { Physics } from "./physics";
import { SEASON_ROW, type Shared } from "./shared";

export type WeatherView = { hour: number; mist: number };

// Grass and leaf tints per season row (spring, summer, autumn, winter), multiplied onto the textures.
const GRASS_TINT = [new THREE.Color(1.05, 1.12, 0.95), new THREE.Color(1, 1, 1), new THREE.Color(1.5, 1.05, 0.55), new THREE.Color(0.95, 0.95, 0.88)];
const LEAF_TINT = [new THREE.Color(1.1, 1.18, 0.9), new THREE.Color(1, 1, 1), new THREE.Color(2.2, 1.0, 0.32), new THREE.Color(0.8, 0.85, 0.8)];

export function createWeather(shared: Shared, physics: Physics, audio: Audio, reduced: boolean) {
  const { u } = shared;
  let pick: WeatherPick = world.get().pick ?? LIVE_PICK;
  let live: LiveWeather | null = world.get().live;
  let fastUntil = 0;
  let clock = 0;

  const resolve = () => {
    const now = new Date();
    const lat = live?.lat ?? STUDIO_PLACE.lat;
    const state: WeatherState = pick.weather === "live" ? (live?.state ?? "clear") : pick.weather;
    const season: Season = pick.season === "live" ? seasonFor(now, lat) : pick.season;
    const hour = pick.time === "live" ? now.getHours() + now.getMinutes() / 60 : hourFor(pick.time);
    return { state, season, hour };
  };

  let target = resolve();
  const cur: WeatherTargets = { ...targetsFor(target.state, target.season, live?.tempC ?? null) };
  let hour = target.hour;
  let season = target.season;
  let seasonBlend = 1;
  let fromRow: number = SEASON_ROW[season];
  let windAngle = 0.6;

  // Lightning: a soft, slow brightening at most every few seconds; never a strobe.
  let nextBolt = 4;
  let bolt = -1;

  function publish() {
    const showing = { weather: target.state, season: target.season, phase: phaseFor(hour), hour: Math.round(hour * 10) / 10 };
    const prev = world.get().showing;
    if (prev.weather !== showing.weather || prev.season !== showing.season || prev.phase !== showing.phase) world.set({ showing });
  }

  return {
    setPick(next: WeatherPick) {
      pick = next;
      fastUntil = clock + 8;
    },
    setLive(next: LiveWeather) {
      live = next;
    },
    update(dt: number, instant: boolean): WeatherView {
      clock += dt;
      target = resolve();
      const goal = targetsFor(target.state, target.season, live?.tempC ?? null);
      const fast = instant || clock < fastUntil;
      const k = instant ? 1 : 1 - Math.exp(-dt / (fast ? 2.2 : 18));
      for (const key of Object.keys(cur) as (keyof WeatherTargets)[]) {
        if (key === "cover") continue;
        cur[key] += (goal[key] - cur[key]) * k;
      }
      // Snow settles and melts slowly, whatever the dial says.
      const coverRate = instant ? 1 : 1 - Math.exp(-dt / (goal.cover > cur.cover ? (fast ? 5 : 14) : fast ? 4 : 24));
      cur.cover += (goal.cover - cur.cover) * coverRate;

      // Hour: move along the shorter way round the clock.
      let dh = target.hour - hour;
      if (dh > 12) dh -= 24;
      if (dh < -12) dh += 24;
      hour = (hour + dh * (instant ? 1 : 1 - Math.exp(-dt / (fast ? 1.6 : 30))) + 24) % 24;

      // Season: blend between palette rows.
      if (target.season !== season) {
        fromRow = SEASON_ROW[season];
        season = target.season;
        seasonBlend = instant ? 1 : 0;
      }
      seasonBlend = Math.min(1, seasonBlend + dt / (fast ? 2.5 : 8));
      // Grass and leaf tints per season, blended like the palette rows.
      u.grassTint.value.copy(GRASS_TINT[fromRow]).lerp(GRASS_TINT[SEASON_ROW[season]], seasonBlend);
      u.leafTint.value.copy(LEAF_TINT[fromRow]).lerp(LEAF_TINT[SEASON_ROW[season]], seasonBlend);
      u.seasonA.value = fromRow;
      u.seasonB.value = SEASON_ROW[season];
      u.seasonT.value = seasonBlend;
      if (seasonBlend >= 1) fromRow = SEASON_ROW[season];

      windAngle += dt * 0.01;
      u.windDir.value.set(Math.cos(windAngle), Math.sin(windAngle));
      u.wind.value = cur.wind;
      u.rain.value = Math.max(0, cur.rain);
      u.cover.value = Math.max(0, cur.cover);
      u.wet.value = Math.max(0, cur.wet);
      u.waveAmp.value = cur.waves;
      u.ice.value = Math.max(0, cur.ice);
      u.cloud.value = Math.max(0, cur.cloud);
      physics.waveAmp = cur.waves;
      physics.ice = Math.max(0, cur.ice);
      physics.wind.x = Math.cos(windAngle) * cur.wind * 0.5;
      physics.wind.z = Math.sin(windAngle) * cur.wind * 0.5;

      // Lightning envelope.
      let flash = 0;
      if (cur.lightning > 0.5 && !reduced) {
        nextBolt -= dt;
        if (nextBolt <= 0) {
          bolt = 0;
          nextBolt = 6 + Math.random() * 9;
          audio.thunder(0.6 + Math.random() * 1.8);
        }
      }
      if (bolt >= 0) {
        bolt += dt;
        flash = bolt < 0.18 ? bolt / 0.18 : Math.exp(-(bolt - 0.18) * 3.2);
        if (bolt > 2) bolt = -1;
      }
      u.flash.value = flash * 0.45;

      publish();
      return { hour, mist: Math.max(0, cur.mist) };
    },
    /** Snow, petals and leaves need the current numbers. */
    get current() {
      return { ...cur, season };
    },
  };
}
