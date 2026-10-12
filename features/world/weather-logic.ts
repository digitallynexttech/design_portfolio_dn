// Weather, season and time of day: what the visitor's own sky is doing, and what each state means
// for the world. Pure logic, shared by the server route, the engine and the options panel.

export type WeatherState = "clear" | "cloudy" | "rain" | "storm" | "mist" | "snow";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type DayPhase = "dawn" | "day" | "dusk" | "night";

export type WeatherPick = {
  weather: "live" | Exclude<WeatherState, "cloudy">;
  season: "live" | Season;
  time: "live" | DayPhase;
};

export const LIVE_PICK: WeatherPick = { weather: "live", season: "live", time: "live" };

/** What /api/weather answers. Nothing about the visitor is stored; the city is approximate. */
export type LiveWeather = {
  state: WeatherState;
  tempC: number | null;
  windMs: number | null;
  /** Approximate city, or the studio's city when the visitor's isn't known. */
  place: string;
  /** False when we fell back to the studio's own weather. */
  located: boolean;
  /** Rounded to one decimal; only used to pick the hemisphere for seasons. */
  lat: number;
  source: "met" | "fallback";
};

export const STUDIO_PLACE = { name: "New Delhi", lat: 28.6, lon: 77.2 };

export const WEATHER_LABEL: Record<WeatherState, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  rain: "Rain",
  storm: "Storm",
  mist: "Mist",
  snow: "Snow",
};

export const SEASON_LABEL: Record<Season, string> = { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" };
export const PHASE_LABEL: Record<DayPhase, string> = { dawn: "Dawn", day: "Day", dusk: "Dusk", night: "Night" };

/** Meteorological seasons, flipped for the southern hemisphere. */
export function seasonFor(date: Date, lat: number): Season {
  const north: Season[] = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  const s = north[date.getMonth()];
  if (lat >= 0) return s;
  return ({ winter: "summer", summer: "winter", spring: "autumn", autumn: "spring" } as const)[s];
}

/** Map MET Norway's symbol codes (e.g. "lightrainshowers_day") onto our six states. */
export function stateFromSymbol(symbol: string, windMs: number | null): WeatherState {
  const s = symbol.toLowerCase();
  if (s.includes("thunder")) return "storm";
  if (s.includes("snow") || s.includes("sleet")) return "snow";
  if (s.includes("rain")) return (windMs ?? 0) > 11 || s.startsWith("heavy") ? "storm" : "rain";
  if (s.startsWith("fog")) return "mist";
  if ((windMs ?? 0) > 15) return "storm";
  if (s.startsWith("cloudy")) return "cloudy";
  return "clear";
}

/** Hour of day used when a phase is picked by hand. */
export function hourFor(phase: DayPhase): number {
  return { dawn: 6.4, day: 13, dusk: 18.4, night: 23.2 }[phase];
}

export function phaseFor(hour: number): DayPhase {
  if (hour >= 5.5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17.5) return "day";
  if (hour >= 17.5 && hour < 20) return "dusk";
  return "night";
}

/** Numeric targets for each state. The engine eases toward them, so changes take about a minute. */
export type WeatherTargets = {
  /** Sky cover, 0–1. */
  cloud: number;
  rain: number;
  snow: number;
  /** Wind strength 0–1: sways trees, drives wind lines, tilts rain. */
  wind: number;
  /** Wave height multiplier. */
  waves: number;
  /** Fog: 0 = long views, 1 = thick mist (capped so islands stay readable). */
  mist: number;
  /** Lightning on/off (soft brightening, never strobing). */
  lightning: number;
  /** Surfaces darken and shine. */
  wet: number;
  /** Snow settles on islands and trees. */
  cover: number;
  /** Shore ice. */
  ice: number;
};

export function targetsFor(state: WeatherState, season: Season, tempC: number | null): WeatherTargets {
  const cold = season === "winter" || (tempC !== null && tempC <= 1);
  const base: WeatherTargets = { cloud: 0.12, rain: 0, snow: 0, wind: 0.2, waves: 0.75, mist: 0, lightning: 0, wet: 0, cover: 0, ice: 0 };
  switch (state) {
    case "clear":
      return { ...base, ice: cold && season === "winter" ? 0.35 : 0 };
    case "cloudy":
      return { ...base, cloud: 0.65, wind: 0.35, waves: 0.95 };
    case "rain":
      return { ...base, cloud: 0.85, rain: 0.75, wind: 0.45, waves: 1.15, mist: 0.18, wet: 1 };
    case "storm":
      return { ...base, cloud: 1, rain: 1, wind: 1, waves: 2.3, mist: 0.28, lightning: 1, wet: 1 };
    case "mist":
      return { ...base, cloud: 0.5, wind: 0.08, waves: 0.55, mist: 1, wet: 0.35 };
    case "snow":
      return { ...base, cloud: 0.8, snow: 1, wind: 0.35, waves: 0.6, mist: 0.3, cover: 1, ice: 1 };
  }
}
