'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { parsedate } from '@/app/utils/dateUtils';
import type { MoonData } from '@/app/types';

interface MoonCardProps {
  moon: MoonData | null;
  currentTime: Date | string;
}

function phaseName(phaseDeg?: number): string | null {
  if (typeof phaseDeg !== 'number') return null;
  const p = ((phaseDeg % 360) + 360) % 360;
  if (p < 22.5) return 'New Moon';
  if (p < 67.5) return 'Waxing Crescent';
  if (p < 112.5) return 'First Quarter';
  if (p < 157.5) return 'Waxing Gibbous';
  if (p < 202.5) return 'Full Moon';
  if (p < 247.5) return 'Waning Gibbous';
  if (p < 292.5) return 'Last Quarter';
  if (p < 337.5) return 'Waning Crescent';
  return 'New Moon';
}
export default function MoonCard({ moon, currentTime }: MoonCardProps) {
  const now = parseDate(currentTime);

  if (!moon) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm p-3 w-full h-full">
        <CardHeader className="pb-1">
          <CardTitle className="text-md text-primary">The Moon</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs space-y-1 text-gray-400">
          <p>Moon data not available for the selected time.</p>
          <p>It may be below the horizon.</p>
        </CardContent>
      </Card>
    );
  }

  const altitude =
    typeof moon.altitudeDeg === 'number' ? moon.altitudeDeg.toFixed(1) : '—';
  const azimuth =
    typeof moon.azimuthDeg === 'number' ? moon.azimuthDeg.toFixed(1) : '—';
  const rise = moon.riseIso
    ? new Date(moon.rise_iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';
  const set = moon.setiso
    ? new Date(moon.set_iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';
  const phase = phaseName(moon.phasedegrees);

  return (
    <Card className="bg-card/50 backdrop-blur-sm p-3 w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-md text-primary">The Moon</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs space-y-1">
        {phase && (
          <p>
            <strong>Phase:</strong> {phase}
          </p>
        )}
        <p>
          <strong>Altitude:</strong> {altitude}°
        </p>
        <p>
          <strong>Azimuth:</strong> {azimuth}°
        </p>
        <p>
          <strong>Rise Time:</strong> {rise}
        </p>
        <p>
          <strong>Set Time:</strong> {set}
        </p>
        <p className="text-gray-500">
          <em>Updated:</em> {now.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
