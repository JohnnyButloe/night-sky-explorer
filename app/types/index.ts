export interface CelestialObjectHourlyData {
  time: Date
  altitude: number
  azimuth: number
  visible: boolean
}

export interface CelestialObject {
  name: string
  type: string
  rightAscension: string
  declination: string
  hourlyData: CelestialObjectHourlyData[]
  additionalInfo: {
    phase?: string
    riseDirection?: string
    maxAltitude: number
    bestViewingTime?: Date
    [key: string]: any
  }
}

export interface HourlyForecast {
  time: string
  cloudCover: number
  rainProbability: number
}

export interface WeatherData {
  currentCloudCover: number
  currentVisibility: number
  hourlyForecast: HourlyForecast[]
}

export interface CelestialData {
  objects: CelestialObject[]
  location: {
    latitude: number
    longitude: number
  }
  searchTime: string
  selectedTime: string
  weather: WeatherData
  sunset: string
  sunrise: string
  nightStart: Date
  nightEnd: Date
}

export interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}