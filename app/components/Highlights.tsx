import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { isWithinMinutes, formatZoned } from '@/lib/time';
import { useTime } from '@/hooks/useTime';

type Loc = { name: string; lat: number; lon: number } | null;

type Celestial = {
  sun?: { rise_iso?: string | null; set_iso?: string | null };
  moon?: { phase_degrees?: number; altitude_degrees?: number };
  planets?: Record<string, { altitude_degrees?: number }>;
} | null;

type Weather = {
  current?: { temperature_2m?: number; weather_code?: number };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    weathercode?: number[];
  } | null;
} | null;

interface HighlightsProps {
  location: Loc;
  celestial: Celestial;
  weather: Weather;
  currentTime: Date | string;
}

export default function Highlights({
  location,
  celestial,
  weather,
  currentTime,
}: HighlightsProps) {
  const when =
    typeof currentTime === 'string' ? new Date(currentTime) : currentTime;
  // NEW: Determine if the selected time is near sunrise/sunset (±30 min)
  const sunrise = celestial?.sun?.rise_iso
    ? new Date(celestial.sun.rise_iso)
    : null;
  const sunset = celestial?.sun?.set_iso
    ? new Date(celestial.sun.set_iso)
    : null;
  const nearSunrise = sunrise ? isWithinMinutes(when, sunrise, 30) : false;
  const nearSunset = sunset ? isWithinMinutes(when, sunset, 30) : false;
  // Visible planets = altitude > 0 now (simple, robust)
  const visiblePlanets = Object.entries(celestial?.planets ?? {})
    .filter(([, pos]) => (pos?.altitude_degrees ?? -90) > 0)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

  const totalVisible =
    visiblePlanets.length +
    (celestial?.moon && (celestial.moon.altitude_degrees ?? -90) > 0 ? 1 : 0);
  const { timeZone } = useTime();
  const updatedLabel = timeZone
    ? formatZoned(when, timeZone, 'M/d/yyyy, h:mm:ss a')
    : when.toLocaleString();

  // Night Sky Score (simple placeholder): penalize clouds (unknown => 100), light pollution (assume 5), reward visibility (unknown => 0)
  const cloudCover = 100; // until your weather endpoint exposes it
  const visibility = 0;
  const lightPollution = 5;
  const nightSkyScore = Math.max(
    1,
    Math.min(10, 10 - (cloudCover / 10 + lightPollution - visibility)),
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm p-3 w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-md text-primary">
          Tonight’s Highlights {location?.name ? `— ${location.name}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs">
        <p>
          <strong>Night Sky Score:</strong> {nightSkyScore.toFixed(1)} / 10
        </p>
        <p>
          <strong>Total Visible Objects:</strong> {totalVisible}
        </p>
        {(nearSunrise || nearSunset) && (
          <p className="mt-1">
            <strong>Now:</strong>
            {nearSunrise ? 'Around sunrise' : 'Around sunset'}
          </p>
        )}
        {visiblePlanets.length > 0 && (
          <div className="mt-2">
            <strong>Visible Planets:</strong>
            <ul className="list-disc list-inside text-sm mt-1">
              {visiblePlanets.map((p) => (
                <li key={p}>⭐ {p}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Updated: {updatedLabel}
        </p>
      </CardContent>
    </Card>
  );
}
