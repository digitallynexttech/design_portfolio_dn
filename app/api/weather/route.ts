// The visitor's weather, for the world's sky. The host supplies an approximate city from the IP
// address (Vercel's geolocation headers); we round it to a 10 km grid, ask MET Norway, and answer
// one of six states. Nothing about the visitor is stored or logged. Without a location, the world
// shows the studio's own weather in New Delhi.
import { cacheLife } from "next/cache";
import { STUDIO_PLACE, stateFromSymbol, type LiveWeather } from "@/features/world/weather-logic";

// MET answers in well under a second and the fetch gives up at 3 s; nothing should run longer.
export const maxDuration = 10;

type Forecast = Pick<LiveWeather, "state" | "tempC" | "windMs" | "source">;

type MetResponse = {
  properties?: {
    timeseries?: {
      data?: {
        instant?: { details?: { air_temperature?: number; wind_speed?: number } };
        next_1_hours?: { summary?: { symbol_code?: string } };
        next_6_hours?: { summary?: { symbol_code?: string } };
      };
    }[];
  };
};

/**
 * One MET call per 10 km cell per half hour, shared by every visitor in that cell. Kept in the
 * server's memory ("use cache"), which costs nothing; a remote cache would bill every lookup.
 * A failed call is remembered for two minutes only, so an outage doesn't stick for half an hour.
 */
async function forecast(lat: number, lon: number): Promise<Forecast> {
  "use cache";
  try {
    const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
      headers: { "User-Agent": "design.digitallynext.com https://design.digitallynext.com" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as MetResponse;
    const now = json.properties?.timeseries?.[0]?.data;
    const symbol = now?.next_1_hours?.summary?.symbol_code ?? now?.next_6_hours?.summary?.symbol_code ?? "clearsky_day";
    const windMs = now?.instant?.details?.wind_speed ?? null;
    const tempC = now?.instant?.details?.air_temperature ?? null;
    // Weather changes slowly and MET asks callers to cache: fresh for 30 minutes, then the next
    // request gets this answer while a new one is fetched; dropped after an hour unused.
    cacheLife({ revalidate: 1800, expire: 3600 });
    return { state: stateFromSymbol(symbol, windMs), tempC, windMs, source: "met" };
  } catch {
    cacheLife({ revalidate: 120, expire: 300 });
    return { state: "clear", tempC: null, windMs: null, source: "fallback" };
  }
}

const round = (n: number) => Math.round(n * 10) / 10;

export async function GET(request: Request) {
  const h = request.headers;
  const lat = Number.parseFloat(h.get("x-vercel-ip-latitude") ?? "");
  const lon = Number.parseFloat(h.get("x-vercel-ip-longitude") ?? "");
  const located = Number.isFinite(lat) && Number.isFinite(lon);
  const cityRaw = h.get("x-vercel-ip-city");
  let city: string | null = null;
  try {
    city = cityRaw ? decodeURIComponent(cityRaw) : null;
  } catch {
    city = null;
  }
  const qLat = located ? round(lat) : STUDIO_PLACE.lat;
  const qLon = located ? round(lon) : STUDIO_PLACE.lon;
  const weather = await forecast(qLat, qLon);
  const body: LiveWeather = {
    ...weather,
    place: located ? (city ?? "your area") : STUDIO_PLACE.name,
    located,
    lat: qLat,
  };
  // The answer depends on where the visitor is, so only their own browser may keep it (never the
  // CDN). It matches the server's half hour, so the world asks at most once per visit.
  const maxAge = weather.source === "met" ? 1800 : 300;
  return Response.json(body, { headers: { "Cache-Control": `private, max-age=${maxAge}` } });
}
