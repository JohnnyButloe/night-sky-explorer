export const mockLocationData = [
  { display_name: 'New York, USA', lat: '40.7128', lon: '-74.0060' },
  { display_name: 'Los Angeles, USA', lat: '34.0522', lon: '-118.2437' },
  { display_name: 'Chicago, USA', lat: '41.8781', lon: '-87.6298' },
];

export const mockCelestialData = {
  objects: [
    {
      name: 'Mars',
      hourlyData: [
        { time: new Date().toISOString(), altitude: 45, azimuth: 180 },
        // more data points…
      ],
      additionalInfo: {
        bestViewingTime: new Date().toISOString(),
        riseTime: new Date().toISOString(),
        setTime: new Date().toISOString(),
      },
      type: 'Planet',
    },
    // More objects…
  ],
  nightStart: new Date().toISOString(),
  nightEnd: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString(),
  weather: {
    currentCloudCover: 20,
    lightPollution: 4,
    hourlyForecast: [
      { time: new Date().toISOString(), cloudCover: 20 },
      // more forecast data…
    ],
  },
  location: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  sunrise: new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(),
  sunset: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
};

export const mockWeatherData = {
  currentCloudCover: 20,
  lightPollution: 4,
  hourlyForecast: [{ time: new Date().toISOString(), cloudCover: 20 }],
};
