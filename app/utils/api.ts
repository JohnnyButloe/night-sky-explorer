import type {
  LocationSuggestion,
  WeatherData,
  CelestialData,
  MoonData,
} from '@/app/types';
import { toUTCISO } from '@/lib/time'; // convert location-zoned time to UTC ISO

// Default to '/api' so the frontend correctly proxies requests to the backend
// when no explicit API base URL is configured via environment variables.
const BASE_URL =
  typeof window === 'undefined' ? process.env.API_BASE_URL || '/api' : '/api';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Helper for logging API calls
function logApiCall(endpoint: string, params: Record<string, any>) {
  console.log(`API Call to: ${endpoint}`, params);
}
/**
 * Normalize non-OK responses by reading text/JSON for a clearer error.
 */
async function throwDetailedApiError(
  response: Response,
  endpoint: string,
): Promise<never> {
  let errorText = response.statusText;
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        errorText = json?.error || json?.message || errorText;
        if (!errorText) errorText = text;
      } catch {
        errorText = text;
      }
    }
  } catch {
    /* ignore */
  }
  console.error(`API Error from ${endpoint}:`, errorText);
  throw new Error(
    `API ${response.status} ${response.statusText} at ${endpoint}: ${errorText}`,
  );
}

// Helper for handling API errors with more detail
function handleApiError(endpoint: string, error: any, status?: number): never {
  console.error(`API Error from ${endpoint}:`, {
    status,
    message: error.message,
    error,
  });
  throw new Error(
    `Failed to fetch from ${endpoint}: ${
      status ? `Status ${status}` : ''
    } ${error.message}`,
  );
}
/**
 * mapMoon
 * Accepts various moon payload shapes and returns a stable MoonData VM for the UI.
 * Handles snake_case and camelCase so upstream changes don't ripple into components.
 */
export function mapMoon(raw: any): MoonData | null {
  if (!raw) return null;

  return {
    // phase
    phaseDeg:
      raw.phaseDeg ??
      raw.phase_degrees ??
      raw.moonPhaseDeg ??
      raw.moon_phase_deg ??
      null,

    // position
    altitudeDeg:
      raw.altitudeDeg ?? raw.altitude_degrees ?? raw.altitude ?? null,

    azimuthDeg: raw.azimuthDeg ?? raw.azimuth_degrees ?? raw.azimuth ?? null,

    // rise/set
    riseIso: raw.riseIso ?? raw.rise_iso ?? raw.moonrise ?? null,

    setIso: raw.setIso ?? raw.set_iso ?? raw.moonset ?? null,
  };
}
/**
 * Fetch location search suggestions.
 */
export async function fetchLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  const endpoint = `/locations/search?q=${encodeURIComponent(query)}&limit=5`;
  const url = `${BASE_URL}${endpoint}`;
  logApiCall(endpoint, { query });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      await throwDetailedApiError(response, endpoint);
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    return handleApiError(endpoint, err, err.status);
  }
}

/**
 * Reverse‑geocode a pair of coordinates into a place name.
 */
export async function fetchReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<LocationSuggestion> {
  const endpoint = `/locations/reverse?lat=${latitude}&lon=${longitude}`;
  const url = `${BASE_URL}${endpoint}`;
  logApiCall(endpoint, { latitude, longitude });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      await throwDetailedApiError(response, endpoint);
    }

    return await response.json();
  } catch (err: any) {
    return handleApiError(endpoint, err, err.status);
  }
}

/**
 * Fetch celestial positions & times for a given date.
 */
export type CelestialHourly = {
  time: string;
  altitude: number;
  azimuth: number;
};
export type CelestialObject = {
  id: string;
  name: string;
  type: 'Star' | 'Moon' | 'Planet' | 'Other';
  hourlyData: CelestialHourly[]; // UI expects at least one entry
  additionalInfo: {
    riseTime?: string | null;
    setTime?: string | null;
    bestViewingTime?: string | null;
    moonPhaseDeg?: number | null;
  };
};

export type CelestialData = {
  location: { latitude: number; longitude: number; displayName?: string };
  nightStart: string | null; // sunset ISO
  nightEnd: string | null; // sunrise ISO (next or same)
  objects: CelestialObject[];
  // UI also sets .weather later in page.tsx
};

export async function fetchCelestialData(
  lat: number,
  lon: number,
  zonedDate: Date | null,
  tz: string | null,
): Promise<CelestialData> {
  const qs = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    iso: isoDate,
  });
  const res = await fetch(`/api/celestial?${qs.toString()}`, {
    headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Celestial fetch failed: ${res.status}`);
  }
  const raw = await res.json();

  // Build minimal objects[] so the list has data to render.
  const iso = raw?.request?.iso ?? isoDate;
  const sun: CelestialObject = {
    id: 'sun',
    name: 'Sun',
    type: 'Star',
    hourlyData: [
      {
        time: iso,
        altitude: raw?.sun?.altitude ?? -90,
        azimuth: raw?.sun?.azimuth ?? 0,
      },
    ],
    additionalInfo: {
      riseTime: raw?.sun?.sunrise ?? null,
      setTime: raw?.sun?.sunset ?? null,
      bestViewingTime: null,
    },
  };

  const moon: CelestialObject = {
    id: 'moon',
    name: 'Moon',
    type: 'Moon',
    hourlyData: [
      {
        time: iso,
        altitude: raw?.moon?.altitude ?? -90,
        azimuth: raw?.moon?.azimuth ?? 0,
      },
    ],
    additionalInfo: {
      riseTime: raw?.moon?.moonrise ?? null,
      setTime: raw?.moon?.moonset ?? null,
      moonPhaseDeg: raw?.moon?.moonPhaseDeg ?? null,
      bestViewingTime: null,
    },
  };

  return {
    location: { latitude: lat, longitude: lon },
    nightStart: raw?.sun?.sunset ?? null,
    nightEnd: raw?.sun?.sunrise ?? null,
    objects: [sun, moon],
  };
}

export async function fetchWeatherData(lat: number, lon: number) {
  const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const res = await fetch(`/api/weather?${qs.toString()}`, {
    headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const data = await res.json();

  // Normalize to what your components read today
  return {
    temperature: data?.current?.temperature_2m ?? data?.temperature ?? null,
    conditions: data?.weathercode ?? null,
    currentCloudCover: data?.current?.cloudcover ?? 100, // fallback
    currentVisibility: data?.current?.visibility ?? 0, // meters (fallback)
    lightPollution: 5, // placeholder
    hourlyForecast: Array.isArray(data?.hourly?.time)
      ? data.hourly.time.map((t: string, i: number) => ({
          time: t,
          cloudCover: data?.hourly?.cloudcover?.[i] ?? null,
          rainProbability: data?.hourly?.precipitation_probability?.[i] ?? null,
        }))
      : [],
  };
}
