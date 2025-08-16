'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DatePicker from '@/app/components/ui/DatePicker';
import LocationAutocomplete from './components/LocationAutocomplete';
import Highlights from './components/Highlights';
import MoonCard from './components/MoonCard';
import CelestialObjectsList from './components/CelestialObjectsList';
import SkyConditions from './components/SkyConditions';
import TimeSlider from './components/TimeSlider';
import { useDashboardData } from '@/hooks/useDashboardData';

// Minimal types for local use
type Loc = { name: string; lat: number; lon: number } | null;
type CelestialResp = {
  _source?: string;
  timestamp?: string;
  observer?: { lat: number; lon: number; elev?: number };
  sun?: {
    rise_iso?: string | null;
    set_iso?: string | null;
    altitude_degrees?: number;
    azimuth_degrees?: number;
  };
  moon?: {
    phase_degrees?: number;
    rise_iso?: string | null;
    set_iso?: string | null;
    altitude_degrees?: number;
    azimuth_degrees?: number;
  };
  planets?: Record<
    string,
    { altitude_degrees?: number; azimuth_degrees?: number }
  >;
} | null;

type WeatherResp = {
  temperature?: number; // legacy compat (if you kept it)
  current?: { temperature_2m?: number; weather_code?: number };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    weather_code?: number[]; // sometimes weathercode
    weathercode?: number[];
  } | null;
} | null;

export default function Home() {
  // === Location chosen by the user (via LocationAutocomplete) ===
  const [location, setLocation] = useState<Loc>(null);

  // === Date/Time controls ===
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [celestialTime, setCelestialTime] = useState<Date>(new Date());
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  // === Hook that fetches from backend whenever location changes ===
  const { celestial, weather, loading, error } = useDashboardData(location);

  // --- Handlers ---

  const handleLocationSelect = (
    latitude: number,
    longitude: number,
    displayName: string,
  ) => {
    // Save + collapse search
    setLocation({ name: displayName, lat: latitude, lon: longitude });
    setIsSearchCollapsed(true);

    // Reset date/time to now
    const now = new Date();
    setSelectedDate(now);
    setCelestialTime(now);
  };

  const handleDateChange = (date: Date | null) => {
    // (Future) You can extend useDashboardData to accept a date/iso param.
    if (date) setSelectedDate(date);
  };

  const handleTimeChange = (time: Date) => setCelestialTime(time);

  const handleChangeLocation = () => {
    setIsSearchCollapsed(false);
    setLocation(null);
  };

  // --- Adapter: compose a legacy-ish object for components that expect "celestialData" ---
  const legacyCelestialData = useMemo(() => {
    if (!location || !celestial) return null;

    const objects: any[] = [];

    // Planets
    const planetEntries = Object.entries(celestial?.planets ?? {});
    for (const [name, pos] of planetEntries) {
      objects.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        type: 'Planet',
        altitude: (pos as any)?.altitude_degrees ?? null,
        azimuth: (pos as any)?.azimuth_degrees ?? null,
        hourlyData: [] as any[], // leave empty for now; prevents crashes where .some() is used
      });
    }

    // Sun + Moon as "objects" for existing UIs that read an array
    if (celestial?.sun) {
      objects.push({
        name: 'Sun',
        type: 'Star',
        altitude: celestial.sun.altitude_degrees ?? null,
        azimuth: celestial.sun.azimuth_degrees ?? null,
        hourlyData: [],
      });
    }
    if (celestial?.moon) {
      objects.push({
        name: 'Moon',
        type: 'Moon',
        altitude: celestial.moon.altitude_degrees ?? null,
        azimuth: celestial.moon.azimuth_degrees ?? null,
        hourlyData: [],
        additionalInfo: { phaseDegrees: celestial.moon.phase_degrees },
      });
    }

    // Night bounds (approx) — use sunset→sunrise if available
    const nightStart = celestial?.sun?.set_iso ?? null;
    const nightEnd = celestial?.sun?.rise_iso ?? null;

    return {
      location: { latitude: location.lat, longitude: location.lon },
      sunrise: celestial?.sun?.rise_iso ?? null,
      sunset: celestial?.sun?.set_iso ?? null,
      objects,
      nightStart,
      nightEnd,
      // keep optional weather placeholder so legacy components don't crash if they touch it
      weather: {},
    } as any;
  }, [celestial, location]);

  const moonObject = useMemo(() => {
    return (
      (legacyCelestialData?.objects ?? []).find(
        (o: any) => o?.name === 'Moon',
      ) ?? null
    );
  }, [legacyCelestialData]);

  const filteredCelestialData = useMemo(() => {
    if (!legacyCelestialData) return null;
    return {
      ...legacyCelestialData,
      objects: (legacyCelestialData.objects ?? []).filter(
        (o: any) => o?.name !== 'Moon',
      ),
    };
  }, [legacyCelestialData]);

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
          {/* Date & Time */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-1/3 min-w-[200px]">
              <DatePicker selected={selectedDate} onChange={handleDateChange} />
            </div>
            <div className="flex-1">
              <TimeSlider
                startTime={legacyCelestialData?.nightStart ?? null}
                endTime={legacyCelestialData?.nightEnd ?? null}
                currentTime={celestialTime}
                onTimeChange={handleTimeChange}
                selectedObject={null}
                celestialObjects={legacyCelestialData?.objects ?? []}
              />
            </div>
          </div>

          {/* Highlights & Moon */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Highlights
                location={location}
                celestial={celestial as CelestialResp}
                weather={weather as WeatherResp}
                currentTime={celestialTime}
              />
            </div>
            <div className="col-span-4">
              <MoonCard object={moonObject} currentTime={celestialTime} />
            </div>
          </div>

          {/* Objects List & Sky Conditions */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              {filteredCelestialData && (
                <CelestialObjectsList
                  data={filteredCelestialData}
                  currentTime={celestialTime}
                  onTimeChange={setCelestialTime}
                  onObjectSelect={() => {}}
                />
              )}
            </div>
            <div className="col-span-4">
              <SkyConditions
                location={location}
                celestial={celestial as CelestialResp}
                weather={weather as WeatherResp}
                currentTime={celestialTime}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
