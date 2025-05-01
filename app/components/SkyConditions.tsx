import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sun, Sunrise, Eye, Cloud } from 'lucide-react';

interface SkyConditionsProps {
  data: {
    location: {
      latitude: number;
      longitude: number;
    };
    sunset: string;
    sunrise: string;
    weather: {
      lightPollution?: number;
      currentVisibility: number;
      currentCloudCover: number;
    };
  };
  currentTime: Date;
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
          <div className="text-sm mt-2">
            <p>
              <strong>Light Pollution:</strong>{' '}
              {data.weather.lightPollution ?? 'N/A'} / 10
            </p>
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

        <p className="col-span-12 text-xs text-gray-600">
          Selected Time: {currentTime.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
