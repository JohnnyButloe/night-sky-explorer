// app/utils/api.ts
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
function logApiCall(endpoint: string, params: Record<string, unknown>) {
  // eslint-disable-next-line no-console
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
        errorText = json?.error || json?.message || errorText || text;
      } catch {
        errorText = text;
      }
    }
  } catch {
    /* ignore */
  }

  // eslint-disable-next-line no-console
  console.error(`API Error from ${endpoint}:`, errorText);
  throw new Error(
    `API ${response.status} ${response.statusText} at ${endpoint}: ${errorText}`,
  );
}

// Helper for handling API errors with more detail
function handleApiError(endpoint: string, error: any, status?: number): never {
  // eslint-disable-next-line no-console
  console.error(`API Error from ${endpoint}:`, {
    status,
    message: error?.message,
    error,
  });

  throw new Error(
    `Failed to fetch from ${endpoint}: ${
      status ? `Status ${status}` : ''
    } ${error?.message ?? error}`,
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
    const data = (await response.json()) as LocationSuggestion[];
    return data;
  } catch (err: any) {
    return handleApiError(endpoint, err, err?.status);
  }
}

/**
 * Reverse-geocode a pair of coordinates into a place name.
 */
export async function fetchReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<any> {
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
    return handleApiError(endpoint, err, err?.status);
  }
}

/**
 * Minimal Celestial VM types used by the current UI.
 * (Kept here to ensure the objects[] list can render even with partial data.)
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

export type CelestialResponse = {
  location: { latitude: number; longitude: number; displayName?: string };
  nightStart: string | null; // sunset ISO
  nightEnd: string | null; // sunrise ISO (next or same)
  objects: CelestialObject[]; // UI also sets .weather later in page.tsx
};

/**
 * Fetch celestial positions & times for a given date.
 * NOTE: This now correctly computes `isoDate` from the location-zoned input.
 */
export async function fetchCelestialData(
  lat: number,
  lon: number,
  zonedDate: Date | null,
  tz: string | null,
): Promise<CelestialData> {
  // --- FIX: initialize isoDate from zonedDate/tz or fallback to now ---
  const isoDate =
    zonedDate && tz ? toUTCISO(zonedDate, tz) : new Date().toISOString();

  const qs = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    iso: isoDate,
  });

  const url = `${BASE_URL}/celestial?${qs.toString()}`;

  try {
    const res = await fetch(url, {
      headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      await throwDetailedApiError(res, '/celestial');
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
          altitude: raw?.sun?.altitude ?? raw?.sun?.altitudeDeg ?? -90,
          azimuth: raw?.sun?.azimuth ?? raw?.sun?.azimuthDeg ?? 0,
        },
      ],
      additionalInfo: {
        riseTime: raw?.sun?.sunrise ?? raw?.sun?.sunriseISO ?? null,
        setTime: raw?.sun?.sunset ?? raw?.sun?.sunsetISO ?? null,
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
          altitude: raw?.moon?.altitude ?? raw?.moon?.altitudeDeg ?? -90,
          azimuth: raw?.moon?.azimuth ?? raw?.moon?.azimuthDeg ?? 0,
        },
      ],
      additionalInfo: {
        riseTime:
          raw?.moon?.moonrise ??
          raw?.moon?.riseISO ??
          raw?.moon?.riseIso ??
          null,
        setTime:
          raw?.moon?.moonset ?? raw?.moon?.setISO ?? raw?.moon?.setIso ?? null,
        moonPhaseDeg:
          raw?.moon?.moonPhaseDeg ??
          raw?.moon?.phaseDeg ??
          raw?.moon?.phase_degrees ??
          null,
        bestViewingTime: null,
      },
    };

    const payload: CelestialResponse = {
      location: { latitude: lat, longitude: lon },
      nightStart: raw?.sun?.sunset ?? raw?.sun?.sunsetISO ?? null,
      nightEnd: raw?.sun?.sunrise ?? raw?.sun?.sunriseISO ?? null,
      objects: [sun, moon],
    };

    // Cast to your project-wide CelestialData type for compatibility
    return payload as unknown as CelestialData;
  } catch (err: any) {
    return handleApiError('/celestial', err, err?.status);
  }
}

export async function fetchWeatherData(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const url = `${BASE_URL}/weather?${qs.toString()}`;

  try {
    const res = await fetch(url, {
      headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      await throwDetailedApiError(res, '/weather');
    }

    const data = await res.json();

    // Normalize to what your components read today
    const normalized = {
      temperature: data?.current?.temperature_2m ?? data?.temperature ?? null,
      conditions: data?.weathercode ?? null,
      currentCloudCover: data?.current?.cloudcover ?? 100, // fallback
      currentVisibility: data?.current?.visibility ?? 0, // meters (fallback)
      lightPollution: 5, // placeholder
      hourlyForecast: Array.isArray(data?.hourly?.time)
        ? data.hourly.time.map((t: string, i: number) => ({
            time: t,
            cloudCover: data?.hourly?.cloudcover?.[i] ?? null,
            rainProbability:
              data?.hourly?.precipitation_probability?.[i] ?? null,
          }))
        : [],
    };

    // Cast to your project-wide WeatherData type for compatibility
    return normalized as unknown as WeatherData;
  } catch (err: any) {
    return handleApiError('/weather', err, err?.status);
  }
}
