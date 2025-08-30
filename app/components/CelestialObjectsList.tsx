// components/CelestialObjectsList.tsx
'use client';

import * as React from 'react';

type CelestialObject = {
  name: string;
  type: 'Planet' | 'Moon' | 'Other';
  altitude: number | null;
  azimuth: number | null;
  rise: string | null;
  set: string | null;
  isVisible?: boolean | null;
};

export function CelestialObjectsList({
  objects,
  title = 'Celestial Objects',
}: {
  objects?: CelestialObject[] | null;
  title?: string;
}) {
  // Fallback to the major targets so the card is never empty.
  const defaults: CelestialObject[] = React.useMemo(
    () =>
      [
        'Mercury',
        'Venus',
        'Mars',
        'Jupiter',
        'Saturn',
        'Uranus',
        'Neptune',
        'Moon',
      ].map((n) => ({
        name: n,
        type: n === 'Moon' ? 'Moon' : 'Planet',
        altitude: null,
        azimuth: null,
        rise: null,
        set: null,
        isVisible: false,
      })),
    [],
  );

  const list = (objects?.length ? objects : defaults)
    .map((o) => ({
      ...o,
      // If backend didn’t compute isVisible, infer from altitude.
      isVisible:
        typeof o.isVisible === 'boolean'
          ? o.isVisible
          : (o.altitude ?? -90) > 0,
    }))
    .sort((a, b) => {
      const av = Number(!!a.isVisible);
      const bv = Number(!!b.isVisible);
      if (av !== bv) return bv - av; // visible first
      const aa = a.altitude ?? -90;
      const ba = b.altitude ?? -90;
      return ba - aa; // higher altitude next
    });

  const fmtTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const azToCompass = (deg: number | null) => {
    if (deg == null || Number.isNaN(deg)) return '—';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <section className="rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      <ul className="divide-y">
        {list.map((o) => {
          const visible = !!o.isVisible;
          const alt = o.altitude ?? null;
          const dir = azToCompass(o.azimuth);
          const rise = fmtTime(o.rise);
          const set = fmtTime(o.set);

          return (
            <li
              key={o.name}
              className={`px-4 py-3 flex items-center justify-between ${
                visible ? '' : 'opacity-60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{o.name}</span>
                  <span className="rounded-full border px-2 py-0.5 text-[11px]">
                    {o.type}
                  </span>
                  {visible && (
                    <span className="rounded-full bg-green-600/10 text-green-700 px-2 py-0.5 text-[11px]">
                      Up now
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span>Dir: {dir}</span>
                  <span className="mx-2">•</span>
                  <span>Alt: {alt == null ? '—' : `${alt.toFixed(0)}°`}</span>
                  <span className="mx-2">•</span>
                  <span>Rise: {rise}</span>
                  <span className="mx-2">•</span>
                  <span>Set: {set}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CelestialObjectsList;
