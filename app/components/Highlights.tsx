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
  const totalVisible = visibleObjects.length;
  const bestViewingCount = bestViewingObjects.length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm p-3 w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-md text-primary">
          Tonight’s Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs">
        <p>
          <strong>Total Visible Objects:</strong> {totalVisible}
        </p>
        <p>
          <strong>Best Viewing Opportunities:</strong> {bestViewingCount}
        </p>
        {bestViewingObjects.length > 0 && (
          <ul className="mt-2">
            {bestViewingObjects.map((obj) => (
              <li key={obj.name} className="text-sm">
                ⭐ {obj.name} at{' '}
                {obj.additionalInfo.bestViewingTime?.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default Highlights;
