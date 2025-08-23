import type {
  LocationSuggestion,
  WeatherData,
  CelestialData,
} from '@/app/types';

// Default to '/api' so the frontend correctly proxies requests to the backend
// when no explicit API base URL is configured via environment variables.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
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
export async function fetchCelestialData(
  latitude: number,
  longitude: number,
  date: string,
): Promise<CelestialData> {
  const endpoint = `/celestial?lat=${latitude}&lon=${longitude}&time=${date}`;
  const url = `${BASE_URL}${endpoint}`;
  logApiCall(endpoint, { latitude, longitude, date });

  try {
    const response = await fetch(url, {
      headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
    });

    if (!response.ok) {
      await throwDetailedApiError(response, endpoint);
    }

    return await response.json();
  } catch (err: any) {
    return handleApiError(endpoint, err, err.status);
  }
}

/**
 * Fetch current weather & forecast for a location.
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const endpoint = `/weather?lat=${latitude}&lon=${longitude}`;
  const url = `${BASE_URL}${endpoint}`;
  logApiCall(endpoint, { latitude, longitude });

  try {
    const response = await fetch(url, {
      headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
    });
    if (!response.ok) {
      await throwDetailedApiError(response, endpoint);
    }

    return await response.json();
  } catch (err: any) {
    return handleApiError(endpoint, err, err.status);
  }
}
