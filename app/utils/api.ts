// Uncomment and adjust the following line if you have defined these types in your project
// import type { LocationSuggestion, CelestialData, WeatherData } from '@/app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function fetchLocationSuggestions(query: string): Promise<any> {
  try {
    // First attempt: full query
    const response = await fetch(
      `${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}&limit=5`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch location suggestions: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();

    // Fallback: if no results and query contains multiple words, try using just the first word
    if (Array.isArray(data) && data.length === 0 && query.includes(' ')) {
      const fallbackQuery = query.split(' ')[0];
      const fallbackResponse = await fetch(
        `${API_BASE_URL}/locations/search?q=${encodeURIComponent(fallbackQuery)}&limit=5`,
      );
      if (!fallbackResponse.ok) {
        throw new Error(
          `Failed to fetch fallback location suggestions: ${fallbackResponse.status} ${fallbackResponse.statusText}`,
        );
      }
      return await fallbackResponse.json();
    }
    return data;
  } catch (error) {
    console.error('Error in fetchLocationSuggestions:', error);
    throw error;
  }
}

export async function fetchReverseGeocode(
  lat: number,
  lon: number,
): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/locations/reverse?lat=${lat}&lon=${lon}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch reverse geocode data: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error in fetchReverseGeocode:', error);
    throw error;
  }
}

export async function fetchCelestialData(
  lat: number,
  lon: number,
  date: string,
): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/celestial?lat=${lat}&lon=${lon}&date=${date}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch celestial data: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error in fetchCelestialData:', error);
    throw error;
  }
}

export async function fetchWeatherData(lat: number, lon: number): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch weather data: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error in fetchWeatherData:', error);
    throw error;
  }
}
