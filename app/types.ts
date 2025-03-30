/**
 * Represents a suggestion returned by the location API.
 */
export interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  // Additional properties can be added if your API provides them.
}

/**
 * Represents an hourly forecast for weather data.
 */
export interface HourlyForecast {
  time: string; // e.g., ISO date string or other formatted time
  cloudCover: number;
  rainProbability: number;
}

/**
 * Represents weather information used in the application.
 */
export interface WeatherData {
  currentCloudCover: number;
  currentVisibility: number; // in meters
  hourlyForecast: HourlyForecast[];
  // Optional fields for extended weather details
  temperature?: number;
  conditions?: string;
  lightPollution?: number;
}

/**
 * Represents the hourly data for a celestial object.
 */
export interface CelestialObjectHourlyData {
  time: Date;
  altitude: number;
  azimuth: number;
}

/**
 * Represents additional information for a celestial object,
 * such as details specific to the Moon.
 */
export interface CelestialAdditionalInfo {
  bestViewingTime?: Date;
  phase?: string;
  illumination?: number;
  riseDirection?: string;
  maxAltitude?: number;
  riseTime?: string | null;
  setTime?: string | null;
  // Add other properties as needed.
}

/**
 * Represents a celestial object (e.g., a star, planet, or the Moon).
 */
export interface CelestialObject {
  name: string;
  type: string;
  hourlyData: CelestialObjectHourlyData[];
  additionalInfo: CelestialAdditionalInfo;
}

/**
 * Represents the overall celestial data structure fetched from the API.
 */
export interface CelestialData {
  objects: CelestialObject[];
  weather: WeatherData;
  nightStart: Date;
  nightEnd: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  sunset: string;
  sunrise: string;
}
