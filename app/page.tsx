'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import LocationAutocomplete from './components/LocationAutocomplete';
import Highlights from './components/Highlights';
import MoonCard from './components/MoonCard';
import CelestialObjectsList from './components/CelestialObjectsList';
import SkyConditions from './components/SkyConditions';
import { TimeProvider, useTime } from '@/hooks/useTime';
import { getTimeZoneForCoords } from '@/lib/time';
import DateTimePicker from '@/app/components/DateTimePicker';
import { useDashboardData } from '@/hooks/useDashboardData';

// Minimal types for local use
type Loc = { name: string; lat: number; lon: number } | null;
type UiLoc = Loc;
type UiCelestial = {
  sun?: {
    rise_iso?: string | null;
    set_iso?: string | null;
    altitude_degrees?: number | null;
    azimuth_degrees?: number | null;
  };
  moon?: {
    phase_degrees?: number | null;
    rise_iso?: string | null;
    set_iso?: string | null;
    altitude_degrees?: number | null;
    azimuth_degrees?: number | null;
  };
  planets?: Record<
    string,
    { altitude_degrees?: number | null; azimuth_degrees?: number | null }
  >;
} | null;

type UiWeather = {
  current?: {
    temperature_2m?: number | null;
    weather_code?: number | null;
  } | null;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    weathercode?: number[];
  } | null;
} | null;

type UiObject = {
  name: string;
  type: 'Planet' | 'Star' | 'Moon';
  altitude: number | null;
  azimuth: number | null;
  rise?: string | null;
  set?: string | null;
  hourlyData: any[];
  additionalInfo?: Record<string, unknown>;
};

// Normalize backend payloads to a stable UI model
function toUiModel(location: Loc, celestial: any, weather: any) {
  const loc: UiLoc = location
    ? { name: location.name, lat: location.lat, lon: location.lon }
    : null;

  const s = celestial?.sun ?? {};
  const m = celestial?.moon ?? {};

  // Normalize planets (backend returns an ARRAY of { name, azimuthDeg, altitudeDeg, ... })
  const planetsArray: any[] = Array.isArray(celestial?.planets)
    ? celestial.planets
    : [];
  // Keep a record for components that expect it
  const planets: Record<
    string,
    {
      altitude_degrees?: number | null;
      azimuth_degrees?: number | null;
      rise_iso?: string | null;
      set_iso?: string | null;
    }
  > = {};
  for (const p of planetsArray) {
    const key = (p?.name ?? '').toLowerCase();
    planets[key] = {
      altitude_degrees: p?.altitudeDeg ?? p?.altitude ?? null,
      azimuth_degrees: p?.azimuthDeg ?? p?.azimuth ?? null,
      rise_iso: p?.riseISO ?? p?.rise_iso ?? null,
      set_iso: p?.setISO ?? p?.set_iso ?? null,
    };
  }

  const uiCelestial: UiCelestial = {
    sun: {
      rise_iso: s?.rise_iso ?? s?.sunrise ?? null,
      set_iso: s?.set_iso ?? s?.sunset ?? null,
      altitude_degrees: s?.altitude_degrees ?? s?.altitude ?? null,
      azimuth_degrees: s?.azimuth_degrees ?? s?.azimuth ?? null,
    },
    moon: celestial?.moon
      ? {
          rise_iso: m?.rise_iso ?? m?.moonrise ?? null,
          set_iso: m?.set_iso ?? m?.moonset ?? null,
          altitude_degrees: m?.altitude_degrees ?? m?.altitude ?? null,
          azimuth_degrees: m?.azimuth_degrees ?? m?.azimuth ?? null,
          phase_degrees: m?.phase_degrees ?? m?.moonPhaseDeg ?? null,
        }
      : undefined,
    planets,
  };

  const uiWeather: UiWeather = weather
    ? {
        current: {
          temperature_2m:
            weather?.current?.temperature_2m ?? weather?.temperature ?? null,
          weather_code: weather?.current?.weather_code ?? null,
        },
        hourly: weather?.hourly ?? null,
      }
    : null;

  // Build one objects array for all consumers
  const objects: UiObject[] = [];

  // Planets
  for (const [name, pos] of Object.entries(planets)) {
    objects.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      type: 'Planet',
      altitude: (pos as any)?.altitude_degrees ?? null,
      azimuth: (pos as any)?.azimuth_degrees ?? null,
      rise: (pos as any)?.rise_iso ?? null,
      set: (pos as any)?.set_iso ?? null,
      hourlyData: [],
    });
  }

  // Sun
  if (uiCelestial?.sun) {
    objects.push({
      name: 'Sun',
      type: 'Star',
      altitude: uiCelestial.sun.altitude_degrees ?? null,
      azimuth: uiCelestial.sun.azimuth_degrees ?? null,
      hourlyData: [],
    });
  }

  // Moon
  if (uiCelestial?.moon) {
    objects.push({
      name: 'Moon',
      type: 'Moon',
      altitude: uiCelestial.moon.altitude_degrees ?? null,
      azimuth: uiCelestial.moon.azimuth_degrees ?? null,
      hourlyData: [],
      additionalInfo: { phaseDegrees: uiCelestial.moon.phase_degrees },
    });
  }

  // Legacy payloads (for CelestialObjectsList)
  const legacy = loc
    ? {
        location: { latitude: loc.lat, longitude: loc.lon },
        sunrise: uiCelestial?.sun?.rise_iso ?? null,
        sunset: uiCelestial?.sun?.set_iso ?? null,
        objects,
        nightStart: uiCelestial?.sun?.set_iso ?? null,
        nightEnd: uiCelestial?.sun?.rise_iso ?? null,
        weather: {},
      }
    : null;

  const legacyNoMoon =
    legacy && Array.isArray(legacy.objects)
      ? {
          ...legacy,
          objects: legacy.objects.filter((o: any) => o?.name !== 'Moon'),
        }
      : legacy;

  return {
    location: loc,
    celestial: uiCelestial,
    weather: uiWeather,
    objects,
    legacy,
    legacyNoMoon,
  };
}

function HomePage() {
  // === Location chosen by the user (via LocationAutocomplete) ===
  const [location, setLocation] = useState<Loc>(null);

  // === Date/Time controls ===
  const { setTimeZone, timeZone, selectedDateTime, now } = useTime();
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  // === Hook that fetches from backend whenever location changes ===
  const { celestial, weather, loading, error } = useDashboardData(location);

  // Compose a stable UI model for child components
  const ui = useMemo(
    () => toUiModel(location, celestial, weather),
    [location, celestial, weather],
  );

  // --- Handlers ---

  const handleLocationSelect = (
    latitude: number,
    longitude: number,
    displayName: string,
  ) => {
    // Save + collapse search
    setLocation({ name: displayName, lat: latitude, lon: longitude });
    setIsSearchCollapsed(true);

    const tz = getTimeZoneForCoords(latitude, longitude);
    setTimeZone(tz);
  };

  const handleChangeLocation = () => {
    setIsSearchCollapsed(false);
    setLocation(null);
  };

  // --- UI helpers ---

  const renderSearchSection = () => {
    if (!isSearchCollapsed) {
      return (
        <Card className="w-full max-w-3xl mb-4 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-primary">
              Enter Your Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationAutocomplete onLocationSelect={handleLocationSelect} />
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="w-full max-w-3xl mb-4 bg-card/50 backdrop-blur-sm">
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="font-medium">{location?.name}</span>
            <button
              onClick={handleChangeLocation}
              className="text-blue-500 underline text-sm"
            >
              Change Location
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">
        Night Sky Explorer
      </h1>

      {/* Location */}
      {renderSearchSection()}

      {/* States */}
      {location && loading && (
        <p className="text-center text-primary mb-4">
          Loading data for {location.name}…
        </p>
      )}
      {error && (
        <p role="alert" className="text-center text-red-500 mb-2">
          {error}
        </p>
      )}

      {/* Dashboard */}
      {location && !loading && !error && (
        <div className="w-full max-w-7xl space-y-6">
          {/* Date & Time (single control for both) */}
          <div className="flex items-center gap-4">
            <DateTimePicker />
          </div>

          {/* Highlights & Moon */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Highlights
                location={ui?.location ?? null}
                celestial={ui?.celestial ?? null}
                weather={ui?.weather ?? null}
                currentTime={(selectedDateTime ?? now)!}
              />
            </div>
            <div className="col-span-4">
              <MoonCard
                moon={ui?.celestial?.moon ?? null}
                currentTime={(selectedDateTime ?? now)!}
              />
            </div>
          </div>

          {/* Objects List & Sky Conditions */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <CelestialObjectsList
                // Option 1: show all objects (Sun/Moon/Planets)
                // objects={ui?.objects ?? []}
                // Option 2: planets only (most common)
                objects={(ui?.objects ?? []).filter((o) => o.type === 'Planet')}
              />
            </div>
            <div className="col-span-4">
              <SkyConditions
                location={ui?.location ?? null}
                celestial={{ sun: ui?.celestial?.sun }}
                weather={ui?.weather ?? null}
                currentTime={(selectedDateTime ?? now)!}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <TimeProvider>
      <HomePage />
    </TimeProvider>
  );
}
