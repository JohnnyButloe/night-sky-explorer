import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sun, Sunrise, Eye, Cloud } from 'lucide-react';
import type { CelestialData } from '../types';

interface SkyConditionsProps {
  data: CelestialData;
  currentTime: Date;
}

function HourlyForecastGraph({
  forecast,
}: {
  forecast: CelestialData['weather']['hourlyForecast'];
}) {
  const maxCloudCover = Math.max(...forecast.map((f) => f.cloudCover));
  const maxRainProbability = Math.max(
    ...forecast.map((f) => f.rainProbability),
  );

  const getSummary = () => {
    const clearHours = forecast.filter(
      (f) => f.cloudCover < 30 && f.rainProbability < 30,
    );
    if (clearHours.length === forecast.length) {
      return 'Clear skies all night';
    } else if (clearHours.length > 0) {
      const lastClearHour = new Date(clearHours[clearHours.length - 1].time);
      return `Clear skies until ${lastClearHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return 'Unfavorable conditions for stargazing tonight';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end h-24 space-x-1">
        {forecast.map((f, index) => (
          <div key={index} className="flex flex-col items-center w-6">
            <div className="w-full h-full flex flex-col-reverse">
              <div
                className="w-full bg-blue-500 opacity-50"
                style={{ height: `${(f.cloudCover / maxCloudCover) * 100}%` }}
                title={`Cloud cover: ${f.cloudCover}%`}
              ></div>
              <div
                className="w-full bg-blue-700"
                style={{
                  height: `${(f.rainProbability / maxRainProbability) * 100}%`,
                }}
                title={`Rain probability: ${f.rainProbability}%`}
              ></div>
            </div>
            <span className="text-[10px] mt-1">{f.time.split(' ')[1]}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-600">{getSummary()}</div>
    </div>
  );
}

export default function SkyConditions({
  data,
  currentTime,
}: SkyConditionsProps) {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-primary">Sky Conditions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-12 gap-3 pt-0">
        <div className="col-span-12 space-y-1">
          <h3 className="font-semibold text-sm">Location</h3>
          <div className="grid grid-cols-2 text-sm">
            <p>Lat: {data.location.latitude.toFixed(4)}°</p>
            <p>Long: {data.location.longitude.toFixed(4)}°</p>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="flex items-center">
              <Sun className="w-4 h-4 mr-1" />
              <span>Sunset: {data.sunset}</span>
            </div>
            <div className="flex items-center">
              <Sunrise className="w-4 h-4 mr-1" />
              <span>Sunrise: {data.sunrise}</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-1">
          <h3 className="font-semibold text-sm">Weather</h3>
          <div className="grid grid-cols-2 text-sm">
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>
                Visibility: {(data.weather.currentVisibility / 1000).toFixed(1)}{' '}
                km
              </span>
            </div>
            <div className="flex items-center">
              <Cloud className="w-4 h-4 mr-1" />
              <span>Cloud Cover: {data.weather.currentCloudCover}%</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-1">
          <h3 className="font-semibold text-sm">Hourly Forecast</h3>
          <div className="text-[10px] flex items-center">
            <span className="inline-block w-2 h-2 bg-blue-700 mr-1"></span>
            Rain Probability
            <span className="inline-block w-2 h-2 bg-blue-500 opacity-50 ml-2 mr-1"></span>
            Cloud Cover
          </div>
          <HourlyForecastGraph forecast={data.weather.hourlyForecast} />
        </div>

        <p className="col-span-12 text-xs text-gray-600">
          Selected Time: {currentTime.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
