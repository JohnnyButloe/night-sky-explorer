import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sun, Sunrise, Eye, Cloud, Thermometer } from 'lucide-react';
import { useTime } from '@/hooks/useTime';
import { formatZoned } from '@/lib/time';

type Loc = { name: string; lat: number; lon: number } | null;

type Celestial = {
  sun?: { rise_iso?: string | null; set_iso?: string | null };
} | null;

type Weather = {
  temperature?: number;
  current?: { temperature_2m?: number; weather_code?: number };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    weather_code?: number[];
    weathercode?: number[];
  } | null;
} | null;

interface SkyConditionsProps {
  location: Loc;
  celestial: Celestial;
  weather: Weather;
  currentTime: Date;
}

export default function SkyConditions({
  location,
  celestial,
  weather,
  currentTime,
}: SkyConditionsProps) {
  const { timeZone, selectedDateTime, now } = useTime();
  const wall = selectedDateTime ?? now ?? currentTime;
  const fmt = (iso?: string | null) =>
    iso
      ? timeZone
        ? formatZoned(new Date(iso), timeZone, 'h:mm a')
        : new Date(iso).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
      : '—';

  const lat = typeof location?.lat === 'number' ? location.lat.toFixed(4) : '—';
  const lon = typeof location?.lon === 'number' ? location.lon.toFixed(4) : '—';

  const sunset = fmt(celestial?.sun?.set_iso);
  const sunrise = fmt(celestial?.sun?.rise_iso);

  // Temperature (prefer structured "current.temperature_2m", fallback to legacy "temperature")
  const temperature =
    typeof weather?.current?.temperature_2m === 'number'
      ? `${weather!.current!.temperature_2m}°`
      : typeof weather?.temperature === 'number'
        ? `${weather!.temperature}°`
        : '—';

  // Cloud cover & visibility may not be included in your weather endpoint yet; show "—" if absent
  const cloudCover = '—';
  const visibilityKm = '—';

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-primary">Sky Conditions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-12 gap-3 pt-0">
        <div className="col-span-12 space-y-1">
          <h3 className="font-semibold text-sm">Location</h3>
          <div className="grid grid-cols-2 text-sm">
            <p>Lat: {lat}°</p>
            <p>Long: {lon}°</p>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="flex items-center">
              <Sun className="w-4 h-4 mr-1" />
              <span>Sunset: {sunset}</span>
            </div>
            <div className="flex items-center">
              <Sunrise className="w-4 h-4 mr-1" />
              <span>Sunrise: {sunrise}</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-1">
          <h3 className="font-semibold text-sm">Weather</h3>
          <div className="grid grid-cols-2 text-sm">
            <div className="flex items-center">
              <Thermometer className="w-4 h-4 mr-1" />
              <span>Temperature: {temperature}</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>Visibility: {visibilityKm}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 text-sm">
            <div className="flex items-center">
              <Cloud className="w-4 h-4 mr-1" />
              <span>Cloud Cover: {cloudCover}</span>
            </div>
          </div>
        </div>

        <p className="col-span-12 text-xs text-gray-600">
          Selected Time:{' '}
          {timeZone
            ? formatZoned(wall, timeZone, 'M/d/yyyy, h:mm:ss a')
            : wall.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
