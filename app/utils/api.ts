import type { CelestialData, LocationSuggestion, WeatherData } from '../types';
import { getMockCelestialData } from './mockData';
import { getRealCelestialData } from './realData';

// Toggle this to switch between mock and real API
const USE_MOCK_API = true;

export async function getCelestialData(
  latitude: number,
  longitude: number,
  time: string,
): Promise<CelestialData> {
  return USE_MOCK_API
    ? getMockCelestialData(latitude, longitude, time)
    : getRealCelestialData(latitude, longitude, time);
}

export async function getLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  return USE_MOCK_API
    ? getMockLocationSuggestions(query)
    : getRealLocationSuggestions(query);
}

async function getMockLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    { display_name: 'New York, USA', lat: '40.7128', lon: '-74.0060' },
    { display_name: 'London, UK', lat: '51.5074', lon: '-0.1278' },
    { display_name: 'Tokyo, Japan', lat: '35.6762', lon: '139.6503' },
  ];
}

async function getRealLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch location suggestions');
  }
  const data: any[] = await response.json();
  return data
    .filter((item) => item.type === 'city' || item.type === 'administrative')
    .map((item) => ({
      display_name: `${item.address.city || item.address.town || item.address.village || item.address.state || ''}, ${item.address.country}`,
      lat: item.lat,
      lon: item.lon,
    }));
}
