import type {
  LocationSuggestion,
  WeatherData,
  CelestialData,
} from '@/app/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Helper for logging API calls
function logApiCall(endpoint: string, params: Record<string, any>) {
  console.log(`API Call to: ${endpoint}`, params);
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
      let errorText = response.statusText;
      try {
        const errJson = await response.json();
        errorText = errJson.error || errorText;
      } catch {
        /* ignore JSON parse errors */
      }
      throw new Error(errorText);
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
      let errorText = response.statusText;
      try {
        const errJson = await response.json();
        errorText = errJson.error || errorText;
      } catch {
        /* swallow */
      }
      throw new Error(errorText);
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
  const endpoint = `/celestial?lat=${latitude}&lon=${longitude}&date=${date}`;
  const url = `${BASE_URL}${endpoint}`;
  logApiCall(endpoint, { latitude, longitude, date });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorText = response.statusText;
      try {
        const errJson = await response.json();
        errorText = errJson.error || errorText;
      } catch {
        /* ignore */
      }
      throw new Error(errorText);
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
    const response = await fetch(url);

    if (!response.ok) {
      let errorText = response.statusText;
      try {
        const errJson = await response.json();
        errorText = errJson.error || errorText;
      } catch {
        /* swallow */
      }
      throw new Error(errorText);
    }

    return await response.json();
  } catch (err: any) {
    return handleApiError(endpoint, err, err.status);
  }
}
