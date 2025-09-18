export function degToCardinal(deg?: number): string {
  if (deg == null || Number.isNaN(deg)) return '—';
  const dirs = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return dirs[idx];
}

export function pick<T = any>(...vals: (T | undefined | null)[]) {
  for (const v of vals) if (v !== undefined && v !== null) return v as T;
  return undefined;
}

export type PlanetRow = {
  name: string;
  type: 'Planet' | string;
  direction: string;
  alt: string; // e.g., "34°"
  rise: string; // local time, e.g., "6:23 PM"
  set: string; // local time
};

export function toPlanetRow(p: any, tz?: string): PlanetRow {
  const az = pick<number>(p.azimuthDeg, p.azimuth, p.horizon?.azimuth);
  const alt = pick<number>(p.altitudeDeg, p.altitude, p.horizon?.altitude);

  const riseIso = pick<string>(
    p.rise?.iso,
    p.riseISO,
    p.rise_time,
    p.rise,
    p.events?.rise?.iso,
  );
  const setIso = pick<string>(
    p.set?.iso,
    p.setISO,
    p.set_time,
    p.set,
    p.events?.set?.iso,
  );

  // formatters
  const altTxt = alt == null || Number.isNaN(alt) ? '—' : `${alt.toFixed(1)}°`;
  const dirTxt = degToCardinal(az);

  const toLocal = (iso?: string) =>
    !iso
      ? '—'
      : new Date(iso).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: tz,
        });

  return {
    name: p.name ?? p.id ?? '—',
    type: 'Planet',
    direction: dirTxt,
    alt: altTxt,
    rise: toLocal(riseIso),
    set: toLocal(setIso),
  };
}
