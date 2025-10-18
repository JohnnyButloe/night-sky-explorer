// hooks/useDashboardData.ts
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTime } from '@/hooks/useTime';
import { toPlanetRow } from '../lib/astroFormat';

type Location = { name?: string; lat: number; lon: number } | null;

// Loosely typed to avoid coupling; replace with your actual API types if available
type Celestial = {
  sun?: any;
  moon?: any;
  planets?: any[];
  [k: string]: any;
};
type Weather = Record<string, any>;

export function useDashboardData(location: Location) {
  const { selectedIso } = useTime(); // confirmed time in ISO (set on Submit)

  const lat = location?.lat;
  const lon = location?.lon;

  const enabled =
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    !!selectedIso;

  // QueryFn helpers (inline to keep the file self-contained)
  const fetchCelestial = React.useCallback(async (): Promise<Celestial> => {
    if (!enabled) return {} as Celestial;
    const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (selectedIso) qs.set('iso', selectedIso);
    const res = await fetch(`/api/celestial?${qs.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Celestial fetch failed: ${res.status}`);
    return res.json();
  }, [enabled, lat, lon, selectedIso]);

  const fetchWeather = React.useCallback(async (): Promise<Weather> => {
    if (!enabled) return {};
    const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (selectedIso) qs.set('iso', selectedIso);
    const res = await fetch(`/api/weather?${qs.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    return res.json();
  }, [enabled, lat, lon, selectedIso]);

  // React Query: include selectedIso in the key so Submit (which updates it) refetches all subscribers
  const celestialQuery = useQuery<Celestial>({
    queryKey: ['celestial', lat, lon, selectedIso],
    queryFn: fetchCelestial,
    enabled,
    // keep the previous successful payload while fetching the next timestamp to avoid flicker
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const weatherQuery = useQuery<Weather>({
    queryKey: ['weather', lat, lon, selectedIso],
    queryFn: fetchWeather,
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Derived UI data (preserve your existing transformation)
  const planets = React.useMemo(() => {
    const list = (celestialQuery.data?.planets ?? []) as any[];
    return list.map((p) => toPlanetRow(p));
  }, [celestialQuery.data?.planets]);

  return {
    // raw query objects (handy for status flags in components)
    celestialQuery,
    weatherQuery,

    // convenient slices
    celestial: celestialQuery.data,
    weather: weatherQuery.data,
    planets,

    // unified status
    isLoading: celestialQuery.isLoading || weatherQuery.isLoading,
    error:
      (celestialQuery.error as Error | null) ??
      (weatherQuery.error as Error | null) ??
      null,
  };
}
