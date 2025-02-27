import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CelestialData } from '../types';

interface HighlightsProps {
  data: CelestialData;
  currentTime: Date;
}

const Highlights: React.FC<HighlightsProps> = ({ data, currentTime }) => {
  const visibleObjects = data.objects.filter((obj) =>
    obj.hourlyData.some(
      (hour) =>
        hour.time.getTime() === currentTime.getTime() && hour.altitude > 0,
    ),
  );

  const bestViewingObjects = visibleObjects.filter(
    (obj) =>
      obj.additionalInfo.bestViewingTime &&
      Math.abs(
        obj.additionalInfo.bestViewingTime.getTime() - currentTime.getTime(),
      ) <
        30 * 60 * 1000,
  );

  const visiblePlanets = visibleObjects
    .filter((obj) => obj.type === 'Planet')
    .map((obj) => obj.name);
  const totalVisible = visibleObjects.length;
  const bestViewingCount = bestViewingObjects.length;

  // Night Sky Score Calculation
  const cloudCover = data.weather.currentCloudCover;
  const visibility = data.weather.currentVisibility / 10; // Normalize 1-10 scale
  const lightPollution = data.weather.lightPollution || 5; // Default to mid-range if unavailable
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
