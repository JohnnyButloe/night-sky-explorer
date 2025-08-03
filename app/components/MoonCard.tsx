'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CelestialObject } from '../types';
import { parseDate } from '@/app/utils/dateUtils';

interface MoonCardProps {
  object: CelestialObject | null; // Allow the object to be null
  currentTime: Date | string;
}

export default function MoonCard({ object, currentTime }: MoonCardProps) {
  const currentDate = parseDate(currentTime);

  // If moon data is not available, show a placeholder state
  if (!object) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm p-3 w-full h-full">
        <CardHeader className="pb-1">
          <CardTitle className="text-md text-primary">The Moon</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs space-y-1 text-gray-400">
          <p>Moon data not available for the selected date.</p>
          <p>The Moon may be below the horizon all night.</p>
        </CardContent>
      </Card>
    );
  }

  // Original logic when the object exists
  const {
    bestViewingTime = null,
    riseTime = null,
    setTime = null,
    phase = null,
    illumination = null,
  } = object.additionalInfo ?? {};

  const currentHourData = object.hourlyData.find(
    (entry) => parseDate(entry.time).getTime() === currentDate.getTime(),
  ) || { time: '', altitude: 0, azimuth: 0 };

  const maxAltitude = object.hourlyData.reduce(
    (max, entry) => Math.max(max, entry.altitude),
    0,
  );

  const formatOpt = (iso?: string | null) => {
    if (!iso) return null;
    const dt = parseDate(iso);
    return isNaN(dt.getTime())
      ? null
      : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const bestTimeStr = formatOpt(bestViewingTime);
  const riseTimeStr = formatOpt(riseTime);
  const setTimeStr = formatOpt(setTime);

  return (
    <Card className="bg-card/50 backdrop-blur-sm p-3 w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-md text-primary">{object.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs space-y-1">
        {'phase' in object.additionalInfo && (
          <p>
            <strong>Phase:</strong> {object.additionalInfo.phase}
          </p>
        )}
        {'illumination' in object.additionalInfo && (
          <p>
            <strong>Illumination:</strong> {object.additionalInfo.illumination}%
          </p>
        )}
        <p>
          <strong>Altitude:</strong> {currentHourData.altitude.toFixed(1)}°
        </p>
        <p>
          <strong>Azimuth:</strong> {currentHourData.azimuth.toFixed(1)}°
        </p>
        <p>
          <strong>Max Altitude:</strong> {maxAltitude.toFixed(1)}°
        </p>
        {bestTimeStr && (
          <p>
            <strong>Best Viewing:</strong> {bestTimeStr}
          </p>
        )}
        {riseTimeStr ? (
          <p>
            <strong>Rise Time:</strong> {riseTimeStr}
          </p>
        ) : (
          <p className="text-gray-400">Rise Time: N/A</p>
        )}
        {setTimeStr ? (
          <p>
            <strong>Set Time:</strong> {setTimeStr}
          </p>
        ) : (
          <p className="text-gray-400">Set Time: N/A</p>
        )}
      </CardContent>
    </Card>
  );
}
