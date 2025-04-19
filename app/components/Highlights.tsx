// app/components/Highlights.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CelestialData } from '../types';
import { parseDate } from '@/app/utils/dateUtils';

interface HighlightsProps {
  data: CelestialData;
  currentTime: Date | string;
}

const Highlights: React.FC<HighlightsProps> = ({ data, currentTime }) => {
  // Use parseDate to ensure we have a Date object.
  const currentDate = parseDate(currentTime);

  // Filter objects that are visible at the current time
  const visibleObjects = data.objects.filter((obj) =>
    obj.hourlyData.some((hour) => {
      const hourTime = parseDate(hour.time).getTime();
      const currentTimeMs = currentDate.getTime();
      return hourTime === currentTimeMs && hour.altitude > 0;
    }),
  );

  const bestViewingObjects = visibleObjects.filter((obj) => {
    if (!obj.additionalInfo.bestViewingTime) return false;
    const bestViewingTime = parseDate(obj.additionalInfo.bestViewingTime);
    if (isNaN(bestViewingTime.getTime())) return false;
    return (
      Math.abs(bestViewingTime.getTime() - currentDate.getTime()) <
      30 * 60 * 1000
    );
  });

  const visiblePlanets = visibleObjects
    .filter((obj) => obj.type === 'Planet')
    .map((obj) => obj.name);
  const totalVisible = visibleObjects.length;
  const bestViewingCount = bestViewingObjects.length;

  // Night Sky Score Calculation
  const cloudCover = data.weather.currentCloudCover;
  const visibility = data.weather.currentVisibility / 10;
  const lightPollution = data.weather.lightPollution ?? 5;
  const nightSkyScore = Math.max(
    1,
    Math.min(10, 10 - (cloudCover / 10 + lightPollution - visibility)),
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm p-3 w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-md text-primary">
          Tonight’s Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs">
        <p>
          <strong>Night Sky Score:</strong> {nightSkyScore.toFixed(1)} / 10
        </p>
        <p>
          <strong>Total Visible Objects:</strong> {totalVisible}
        </p>
        <p>
          <strong>Best Viewing Opportunities:</strong> {bestViewingCount}
        </p>
        {visiblePlanets.length > 0 && (
          <div className="mt-2">
            <strong>Visible Planets:</strong>
            <ul className="list-disc list-inside text-sm mt-1">
              {visiblePlanets.map((planet) => (
                <li key={planet}>⭐ {planet}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Highlights;
