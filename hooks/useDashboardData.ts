import { useEffect, useMemo, useRef, useState } from 'react';

type Location = { name: string; lat: number; lon: number } | null;

type Celestial = any; // shape returned by /api/celestial
type Weather = any; // shape returned by /api/weather

export function useDashboardData(location: Location) {
  const [celestial, setCelestial] = useState<Celestial | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If you set a Next.js rewrite: use '' and call /api/... directly.
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  const headers = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_API_KEY ?? '';
    // send x-api-key if present; harmless if blank
    return key
      ? { 'x-api-key': key, Accept: 'application/json' }
      : { Accept: 'application/json' };
  }, []);

  // keep AbortController for rapid changes
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!location) return;

    // reset state for new location
    setLoading(true);
    setError(null);
    setCelestial(null);
    setWeather(null);

    // cancel any inflight
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    async function safeFetch<T>(url: string): Promise<T> {
      const r = await fetch(url, { headers, signal: controller.signal });
      if (!r.ok) {
        const detail = await r.text().catch(() => '');
        throw new Error(`HTTP ${r.status}${detail ? `: ${detail}` : ''}`);
      }
      return r.json() as Promise<T>;
    }

    const q = `lat=${encodeURIComponent(location.lat)}&lon=${encodeURIComponent(location.lon)}`;

    Promise.all([
      safeFetch<Celestial>(`${base}/api/celestial?${q}`),
      safeFetch<Weather>(`${base}/api/weather?${q}`),
    ])
      .then(([celest, wx]) => {
        setCelestial(celest);
        setWeather(wx);
      })
      .catch((e: any) => {
        if (e?.name !== 'AbortError')
          setError(e?.message || 'Failed to load data');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [location, base, headers]);

  return { celestial, weather, loading, error };
}
