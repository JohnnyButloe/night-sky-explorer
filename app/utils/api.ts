// app/utils/api.ts

// Small helper: fetch JSON and throw a useful error on non-2xx.
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init }); // avoid stale caches for time-based queries
  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {
      /* ignore body parse error */
    }
    const message =
      (detail && (detail.message || detail.error)) ||
      `Request failed (${res.status}) for ${url}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Build a URL with query params safely. */
function buildUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  const qs = new URLSearchParams(); // URLSearchParams properly encodes values
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  return `${path}?${qs.toString()}`;
}

/* =========================
 *  Types (adjust as needed)
 * ========================= */

export type CelestialResponse = {
  sun?: any;
  moon?: any;
  planets?: any[];
  [k: string]: any;
};

export type WeatherResponse = Record<string, any>;

export type LocationSuggestion = {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
};

export type ReverseGeocodeResult = {
  name: string;
  lat: number;
  lon: number;
  timeZone?: string;
  country?: string;
  state?: string;
};

/* =========================
 *  Celestial / Weather
 * ========================= */

/**
 * Fetch celestial data for a given lat/lon and optional ISO-8601 time.
 * When `iso` is provided, the backend should compute positions for that exact instant.
 */
export async function fetchCelestial(params: {
  lat: number;
  lon: number;
  iso?: string | null;
}) {
  const { lat, lon, iso } = params;
  const url = buildUrl('/api/celestial', {
    lat,
    lon,
    iso: iso ?? undefined,
  });
  return fetchJSON<CelestialResponse>(url);
}

/**
 * Fetch weather data for a given lat/lon and optional ISO-8601 time.
 * Mirrors the celestial pattern so the dashboard stays in sync.
 */
export async function fetchWeather(params: {
  lat: number;
  lon: number;
  iso?: string | null;
}) {
  const { lat, lon, iso } = params;
  const url = buildUrl('/api/weather', {
    lat,
    lon,
    iso: iso ?? undefined,
  });
  return fetchJSON<WeatherResponse>(url);
}

/* =========================
 *  Location Search / Reverse Geocode
 *  (These match your LocationAutocomplete usage)
 * ========================= */

/**
 * Return location suggestions for a free-text query.
 * Example: /locations/search?q=23454&limit=5
 */
export async function fetchLocationSuggestions(params: {
  q: string;
  limit?: number;
}) {
  const { q, limit = 5 } = params;
  const url = buildUrl('/locations/search', { q, limit });
  return fetchJSON<LocationSuggestion[]>(url);
}

/**
 * Reverse-geocode coordinates to a place record (and often a time zone).
 * Example: /locations/reverse?lat=36.85&lon=-75.98
 */
export async function fetchReverseGeocode(params: {
  lat: number;
  lon: number;
}) {
  const { lat, lon } = params;
  const url = buildUrl('/locations/reverse', { lat, lon });
  return fetchJSON<ReverseGeocodeResult>(url);
}

/* =========================
 *  Notes
 * =========================
 * - We use URLSearchParams to safely encode query strings (recommended practice).
 * - `cache: 'no-store'` avoids stale data for time-based endpoints.
 * - The optional `iso` param lets React Query re-fetch using the confirmed time.
 */
