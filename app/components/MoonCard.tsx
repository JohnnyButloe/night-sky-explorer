'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTime } from '@/hooks/useTime';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatZoned } from '@/lib/time';

type AnyMoon =
  | {
      // per-object shape
      name?: string;
      altitude?: number | null;
      azimuth?: number | null;
      rise?: string | null;
      set?: string | null;
      // top-level moon shape
      moonrise?: string | null;
      moonset?: string | null;
      moonPhaseDeg?: number | null;
      // legacy/snake shapes we saw in repo
      altitude_degrees?: number | null;
      azimuth_degrees?: number | null;
      rise_iso?: string | null;
      set_iso?: string | null;
      phase_degrees?: number | null;
    }
  | null
  | undefined;

interface MoonCardProps {
  /** Dashboard location (lat/lon). If you have a location context, you can remove this prop and read from that hook instead. */
  location: { lat: number; lon: number; name?: string } | null;
}

function phaseName(phaseDeg?: number | null): string | null {
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

const firstDefined = <T,>(...vals: (T | null | undefined)[]) =>
  vals.find((v) => v !== undefined && v !== null);

export default function MoonCard({ location }: MoonCardProps) {
  const { timeZone, selectedDateTime, now: nowCtx } = useTime();
  const wall = selectedDateTime ?? nowCtx ?? new Date();

  // Fetch dashboard data keyed by location and selectedIso (inside the hook)
  const { celestial, isLoading, error } = useDashboardData(location);

  // Handle no location
  if (!location) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm p-3 w-full h-full">
        <CardHeader className="pb-1">
          <CardTitle className="text-md text-primary">The Moon</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-gray-400">
          <p>Please select a location to view moon data.</p>
        </CardContent>
      </Card>
    );
  }

  // Loading / error states from React Query
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm p-3 w-full h-full">
        <CardHeader className="pb-1">
          <CardTitle className="text-md text-primary">The Moon</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-gray-400">
          <p>Loading moon data…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm p-3 w-full h-full">
        <CardHeader className="pb-1">
          <CardTitle className="text-md text-primary">The Moon</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-red-400">
          <p>Failed to load moon data: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  // Prefer top-level moon; fall back to any object that looks like the moon
  const mFromTop: AnyMoon = (celestial as any)?.moon ?? null;
  const mFromObjects: AnyMoon =
    (celestial as any)?.objects?.find?.(
      (o: any) => String(o?.name ?? '').toLowerCase() === 'moon',
    ) ?? null;

  const m = mFromTop ?? mFromObjects;

  if (!m) {
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

  const altitude = firstDefined(m.altitude, m.altitude_degrees) as
    | number
    | undefined;
  const azimuth = firstDefined(m.azimuth, m.azimuth_degrees) as
    | number
    | undefined;

  const riseIso = firstDefined(m.rise, m.moonrise, m.rise_iso) as
    | string
    | undefined;
  const setIso = firstDefined(m.set, m.moonset, m.set_iso) as
    | string
    | undefined;

  const rise = riseIso
    ? timeZone
      ? formatZoned(new Date(riseIso), timeZone, 'h:mm a')
      : new Date(riseIso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
    : 'N/A';

  const set = setIso
    ? timeZone
      ? formatZoned(new Date(setIso), timeZone, 'h:mm a')
      : new Date(setIso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
    : 'N/A';

  const phaseDeg = firstDefined(m.moonPhaseDeg, m.phase_degrees) as
    | number
    | undefined;
  const phase = phaseName(phaseDeg ?? undefined);

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
          <strong>Altitude:</strong>{' '}
          {typeof altitude === 'number' ? altitude.toFixed(1) : '—'}°
        </p>
        <p>
          <strong>Azimuth:</strong>{' '}
          {typeof azimuth === 'number' ? azimuth.toFixed(1) : '—'}°
        </p>
        <p>
          <strong>Rise Time:</strong> {rise}
        </p>
        <p>
          <strong>Set Time:</strong> {set}
        </p>
        <p className="text-gray-500">
          <em>Updated:</em>{' '}
          {timeZone
            ? formatZoned(wall, timeZone, 'M/d/yyyy, h:mm:ss a')
            : wall.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
