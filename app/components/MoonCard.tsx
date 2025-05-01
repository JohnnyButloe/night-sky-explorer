// app/components/MoonCard.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CelestialObject } from '../types';
import { parseDate } from '@/app/utils/dateUtils';

interface MoonCardProps {
  object: CelestialObject;
  currentTime: Date | string;
}

export default function MoonCard({ object, currentTime }: MoonCardProps) {
  // 1) Normalize currentTime to a real Date
  const currentDate = parseDate(currentTime);

  // 2) Destructure only the fields your API actually provides
  const { bestViewingTime, riseTime, setTime } = object.additionalInfo;

  // 3) Find the hourly entry matching the slider’s time, or fallback
  const currentHourData = object.hourlyData.find(
    (entry) => parseDate(entry.time).getTime() === currentDate.getTime(),
  ) || { time: '', altitude: 0, azimuth: 0 };

  // 4) Compute the moon’s maximum altitude from hourlyData
  const maxAltitude = object.hourlyData.reduce(
    (max, entry) => Math.max(max, entry.altitude),
    0,
  );

  // 5) Helper to format optional ISO strings
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
        {/* Phase & Illumination appear only if your API provides them */}
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

        {/* Current altitude/azimuth */}
        <p>
          <strong>Altitude:</strong> {currentHourData.altitude.toFixed(1)}°
        </p>
        <p>
          <strong>Azimuth:</strong> {currentHourData.azimuth.toFixed(1)}°
        </p>

        {/* Computed maximum altitude */}
        <p>
          <strong>Max Altitude:</strong> {maxAltitude.toFixed(1)}°
        </p>

        {/* Best viewing time */}
        {bestTimeStr && (
          <p>
            <strong>Best Viewing:</strong> {bestTimeStr}
          </p>
        )}

        {/* Rise/set times */}
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
