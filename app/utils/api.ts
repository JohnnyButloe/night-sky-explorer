import type {
  LocationSuggestion,
  WeatherData,
  CelestialData,
} from '@/app/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  const response = await fetch(
    `${BASE_URL}/locations?q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch location suggestions');
  }
  return response.json();
}

export async function fetchReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<LocationSuggestion> {
  const response = await fetch(
    `${BASE_URL}/locations/reverse?lat=${latitude}&lon=${longitude}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch reverse geocode data');
  }
  return response.json();
}

export async function fetchCelestialData(
  latitude: number,
  longitude: number,
  date: string,
): Promise<CelestialData> {
  const response = await fetch(
    `${BASE_URL}/celestial?lat=${latitude}&lon=${longitude}&date=${date}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch celestial data');
  }
  return response.json();
}

export async function fetchWeatherData(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  const response = await fetch(
    `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
}
