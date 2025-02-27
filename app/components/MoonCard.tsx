import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CelestialObject } from '../types';

interface MoonCardProps {
  object: CelestialObject;
  currentTime: Date;
}

const MoonCard: React.FC<MoonCardProps> = ({ object, currentTime }) => {
  // Extract moon-specific data from additionalInfo
  const { phase, illumination, riseDirection, maxAltitude, bestViewingTime } =
    object.additionalInfo;

  // Find current hour data based on currentTime (fallback to first entry if not found)
  const currentHourData =
    object.hourlyData.find(
      (data) => data.time.getTime() === currentTime.getTime(),
    ) || object.hourlyData[0];

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-primary">{object.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p>
          <strong>Phase:</strong> {phase}
        </p>
        <p>
          <strong>Illumination:</strong> {illumination}%
        </p>
        <p>
          <strong>Altitude:</strong> {currentHourData?.altitude.toFixed(1)}°
        </p>
        <p>
          <strong>Azimuth:</strong> {currentHourData?.azimuth.toFixed(1)}°
        </p>
        <p>
          <strong>Rise Direction:</strong> {riseDirection}
        </p>
        <p>
          <strong>Max Altitude:</strong> {maxAltitude.toFixed(1)}°
        </p>
        {bestViewingTime && (
          <p>
            <strong>Best Viewing Time:</strong>{' '}
            {bestViewingTime.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MoonCard;
