import type { CelestialData, WeatherData, CelestialObject } from '../types';

async function getMockCelestialData(
  latitude: number,
  longitude: number,
  time: string,
): Promise<CelestialData> {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

  const weatherData: WeatherData = {
    currentCloudCover: 28,
    currentVisibility: 6600, // 6.6 km visibility
    lightPollution: 9,
    hourlyForecast: [],
  };

  const currentTime = new Date();
  const sunset = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);
  const sunrise = new Date(currentTime.getTime() + 10 * 60 * 60 * 1000);
  const nightStart = new Date(sunset.getTime() + 30 * 60 * 1000);
  const nightEnd = new Date(sunrise.getTime() - 30 * 60 * 1000);

  const generateHourlyData = (baseAltitude: number, baseAzimuth: number) => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: new Date(nightStart.getTime() + i * 60 * 60 * 1000),
      altitude: baseAltitude + Math.sin((i * Math.PI) / 12) * 20,
      azimuth: (baseAzimuth + i * 15) % 360,
      visible: baseAltitude > 0,
    }));
  };

  const mockObjects: CelestialObject[] = [
    {
      name: 'Moon',
      type: 'Satellite',
      rightAscension: '22h 34m 11s',
      declination: '-08° 15\' 22"',
      hourlyData: generateHourlyData(30.2, 95.7),
      additionalInfo: {
        phase: 'Waxing Gibbous',
        illumination: 75,
        riseTime: '6:01 PM',
        setTime: '4:31 AM',
        riseDirection: 'East',
        maxAltitude: 65.3,
        bestViewingTime: new Date(nightStart.getTime() + 3 * 60 * 60 * 1000),
      },
    },
    {
      name: 'Orion’s Belt',
      type: 'Constellation',
      rightAscension: '05h 35m 16s',
      declination: '-05° 23′ 23"',
      hourlyData: generateHourlyData(45, 110), // Orion’s Belt is visible high in the night sky
      additionalInfo: {
        riseDirection: 'Southeast',
        maxAltitude: 75,
        bestViewingTime: new Date(nightStart.getTime() + 4 * 60 * 60 * 1000),
      },
    },
    {
      name: 'Venus',
      type: 'Planet',
      rightAscension: '03h 12m 43s',
      declination: '+18° 35\' 10"',
      hourlyData: generateHourlyData(15.8, 270.1),
      additionalInfo: {
        riseDirection: 'Southeast',
        maxAltitude: 45.2,
        bestViewingTime: new Date(nightStart.getTime() + 2 * 60 * 60 * 1000),
      },
    },
    {
      name: 'Mars',
      type: 'Planet',
      rightAscension: '11h 25m 18s',
      declination: '+04° 41\' 33"',
      hourlyData: generateHourlyData(55.6, 180.5),
      additionalInfo: {
        riseDirection: 'East',
        maxAltitude: 72.1,
        bestViewingTime: new Date(nightStart.getTime() + 1 * 60 * 60 * 1000),
      },
    },
    {
      name: 'Jupiter',
      type: 'Planet',
      rightAscension: '01h 48m 55s',
      declination: '+11° 57\' 28"',
      hourlyData: generateHourlyData(5.2, 310.8),
      additionalInfo: {
        riseDirection: 'Northeast',
        maxAltitude: 38.7,
        bestViewingTime: new Date(nightStart.getTime() + 4 * 60 * 60 * 1000),
      },
    },
    {
      name: 'Sirius',
      type: 'Star',
      rightAscension: '06h 45m 08s',
      declination: '-16° 42\' 58"',
      hourlyData: generateHourlyData(60.3, 135.9),
      additionalInfo: {
        riseDirection: 'Southeast',
        maxAltitude: 68.5,
        bestViewingTime: new Date(nightStart.getTime() + 5 * 60 * 60 * 1000),
      },
    },
  ];

  return {
    objects: mockObjects,
    location: { latitude, longitude },
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
}

export const mockLocationData = [
  {
    display_name: 'New York, USA',
    lat: '40.7128',
    lon: '-74.0060',
  },
  {
    display_name: 'London, UK',
    lat: '51.5074',
    lon: '-0.1278',
  },
  {
    display_name: 'Tokyo, Japan',
    lat: '35.6895',
    lon: '139.6917',
  },
];

export { getMockCelestialData };
