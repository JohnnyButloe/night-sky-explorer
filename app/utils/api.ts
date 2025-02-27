import type {
  CelestialData,
  LocationSuggestion,
  WeatherData,
  HourlyForecast,
} from '../types';

// Toggle this to switch between mock and real API
const USE_MOCK_API = true;

const OPENWEATHERMAP_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

export async function getCelestialData(
  latitude: number,
  longitude: number,
  time: string,
): Promise<CelestialData> {
  if (USE_MOCK_API) {
    return getMockCelestialData(latitude, longitude, time);
  } else {
    return getRealCelestialData(latitude, longitude, time);
  }
}

interface CelestialObjectHourlyData {
  time: Date;
  altitude: number;
  azimuth: number;
  visible: boolean;
}

interface CelestialObject {
  name: string;
  type: string;
  rightAscension: string;
  declination: string;
  hourlyData: CelestialObjectHourlyData[];
  additionalInfo: {
    phase?: string;
    riseDirection: string;
    maxAltitude: number;
    bestViewingTime?: Date;
  };
}

function generateHourlyData(
  startTime: Date,
  endTime: Date,
  baseAltitude: number,
  baseAzimuth: number,
): CelestialObjectHourlyData[] {
  const hourlyData: CelestialObjectHourlyData[] = [];
  let currentTime = new Date(startTime);

  while (currentTime <= endTime) {
    const hoursSinceStart =
      (currentTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
    const altitude =
      baseAltitude + Math.sin((hoursSinceStart * Math.PI) / 12) * 20; // Simulates rising and setting
    const azimuth = (baseAzimuth + hoursSinceStart * 15) % 360; // 15 degrees per hour

    hourlyData.push({
      time: new Date(currentTime),
      altitude,
      azimuth,
      visible: altitude > 0,
    });

    currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15-minute intervals
  }

  return hourlyData;
}

async function getMockCelestialData(
  latitude: number,
  longitude: number,
  time: string,
): Promise<CelestialData> {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const weatherData = await getWeatherData(latitude, longitude);

  // Calculate mock sunset and sunrise times
  const currentTime = new Date();
  const sunset = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // Mock sunset 2 hours from now
  const sunrise = new Date(currentTime.getTime() + 10 * 60 * 60 * 1000); // Mock sunrise 10 hours from now

  const nightStart = new Date(sunset.getTime() + 30 * 60 * 1000); // 30 minutes after sunset
  const nightEnd = new Date(sunrise.getTime() - 30 * 60 * 1000); // 30 minutes before sunrise

  // Placeholder data with more varied altitudes and azimuths
  const placeholderData: CelestialData = {
    objects: [
      {
        name: 'Moon',
        type: 'Satellite',
        rightAscension: '22h 34m 11s',
        declination: '-08° 15\' 22"',
        hourlyData: generateHourlyData(nightStart, nightEnd, 30.2, 95.7),
        additionalInfo: {
          phase: 'Waxing Gibbous',
          riseDirection: 'East',
          maxAltitude: 65.3,
        },
      },
      {
        name: 'Venus',
        type: 'Planet',
        rightAscension: '03h 12m 43s',
        declination: '+18° 35\' 10"',
        hourlyData: generateHourlyData(nightStart, nightEnd, 15.8, 270.1),
        additionalInfo: {
          riseDirection: 'Southeast',
          maxAltitude: 45.2,
        },
      },
      {
        name: 'Mars',
        type: 'Planet',
        rightAscension: '11h 25m 18s',
        declination: '+04° 41\' 33"',
        hourlyData: generateHourlyData(nightStart, nightEnd, 55.6, 180.5),
        additionalInfo: {
          riseDirection: 'East',
          maxAltitude: 72.1,
        },
      },
      {
        name: 'Jupiter',
        type: 'Planet',
        rightAscension: '01h 48m 55s',
        declination: '+11° 57\' 28"',
        hourlyData: generateHourlyData(nightStart, nightEnd, 5.2, 310.8),
        additionalInfo: {
          riseDirection: 'Northeast',
          maxAltitude: 38.7,
        },
      },
      {
        name: 'Sirius',
        type: 'Star',
        rightAscension: '06h 45m 08s',
        declination: '-16° 42\' 58"',
        hourlyData: generateHourlyData(nightStart, nightEnd, 60.3, 135.9),
        additionalInfo: {
          riseDirection: 'Southeast',
          maxAltitude: 68.5,
        },
      },
    ],
    location: {
      latitude: latitude,
      longitude: longitude,
    },
    searchTime: new Date().toLocaleString(),
    selectedTime: time,
    weather: weatherData,
    sunset: sunset.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    sunrise: sunrise.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    nightStart,
    nightEnd,
  };

  // Calculate best viewing times
  placeholderData.objects.forEach((object) => {
    const bestViewingData = object.hourlyData.reduce((best, current) => {
      return current.altitude > best.altitude ? current : best;
    });
    object.additionalInfo.bestViewingTime = bestViewingData.time;
  });

  return placeholderData;
}

async function getRealCelestialData(
  latitude: number,
  longitude: number,
  time: string,
): Promise<CelestialData> {
  const response = await fetch(
    `/api/astronomy?latitude=${latitude}&longitude=${longitude}&time=${time}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch celestial data: ${response.statusText}`);
  }

  const data = await response.json();
  const weatherData = await getWeatherData(latitude, longitude);

  // Process the real API data here
  // This is a placeholder implementation and should be updated with actual data processing
  const celestialData: CelestialData = {
    objects: data.data.table.rows
      .filter((row: any) => row.entry.name !== 'Sun')
      .map((row: any) => ({
        name: row.entry.name,
        type: row.entry.type,
        rightAscension: row.cells[0].position.equatorial.rightAscension.hours,
        declination: row.cells[0].position.equatorial.declination.degrees,
        altitude: Number.parseFloat(
          row.cells[0].position.horizontal.altitude.degrees,
        ),
        azimuth: Number.parseFloat(
          row.cells[0].position.horizontal.azimuth.degrees,
        ),
        additionalInfo: {
          // This is placeholder data and should be replaced with actual data from the API
          riseDirection: ['East', 'Southeast', 'Northeast'][
            Math.floor(Math.random() * 3)
          ],
          maxAltitude: Math.random() * 90,
          ...(row.entry.name === 'Moon' ? { phase: 'Waxing Gibbous' } : {}),
        },
      })),
    location: {
      latitude,
      longitude,
    },
    searchTime: new Date().toLocaleString(),
    selectedTime: time,
    weather: weatherData,
    sunset: new Date(data.data.observer.sunset).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    sunrise: new Date(data.data.observer.sunrise).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return celestialData;
}

async function getWeatherData(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  if (USE_MOCK_API) {
    // Mock weather data
    const currentTime = new Date();
    const sunset = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // Mock sunset 2 hours from now
    const sunrise = new Date(currentTime.getTime() + 10 * 60 * 60 * 1000); // Mock sunrise 10 hours from now

    const hourlyForecast: HourlyForecast[] = [];
    for (let i = 0; i < 8; i++) {
      const forecastTime = new Date(sunset.getTime() + i * 60 * 60 * 1000);
      hourlyForecast.push({
        time: forecastTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        cloudCover: Math.floor(Math.random() * 100),
        rainProbability: Math.floor(Math.random() * 100),
      });
    }

    return {
      currentCloudCover: Math.floor(Math.random() * 100),
      currentVisibility: Math.floor(Math.random() * 10000),
      hourlyForecast,
    };
  } else {
    const currentWeatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}`,
    );
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}`,
    );

    if (!currentWeatherResponse.ok || !forecastResponse.ok) {
      throw new Error(`Failed to fetch weather data`);
    }

    const currentWeatherData = await currentWeatherResponse.json();
    const forecastData = await forecastResponse.json();

    const sunset = new Date(currentWeatherData.sys.sunset * 1000);
    const sunrise = new Date(currentWeatherData.sys.sunrise * 1000);

    const hourlyForecast: HourlyForecast[] = forecastData.list
      .filter((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate >= sunset && itemDate <= sunrise;
      })
      .map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        cloudCover: item.clouds.all,
        rainProbability: item.pop * 100,
      }));

    return {
      currentCloudCover: currentWeatherData.clouds.all,
      currentVisibility: currentWeatherData.visibility,
      hourlyForecast,
    };
  }
}

export async function getLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  if (USE_MOCK_API) {
    return getMockLocationSuggestions(query);
  } else {
    return getRealLocationSuggestions(query);
  }
}

async function getMockLocationSuggestions(
  query: string,
): Promise<LocationSuggestion[]> {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Placeholder suggestions
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
