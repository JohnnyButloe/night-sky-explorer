// services/locationService.ts

import type { LocationSuggestion } from '@/app/types';
import { mockLocationData } from '@/app/utils/mockData'; // your mock file with sample data

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export async function fetchLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  if (useMocks) {
    // Return mock data (simulate a network request with a Promise)
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLocationData), 300);
    });
  } else {
    // Fetch real data from your Next.js API route
    const response = await fetch(
      `/api/location-search?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }
    return response.json();
  }
}

export async function fetchReverseGeocode(
  lat: number,
  lon: number,
): Promise<any> {
  if (useMocks) {
    // If needed, provide mock reverse geocode data here
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            display_name: 'Mock City, Mock State, Mock Country',
          }),
        300,
      );
    });
  } else {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error('Failed to fetch location name');
    }
    return response.json();
  }
}
