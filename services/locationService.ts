// services/locationService.ts
import type { LocationSuggestion } from '@/app/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/locations';

export async function fetchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch location suggestions');
  }
  return response.json();
}

export async function fetchReverseGeocode(lat: number, lon: number): Promise<any> {
  const response = await fetch(`${API_BASE}/reverse?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reverse geocode data');
  }
  return response.json();
}
