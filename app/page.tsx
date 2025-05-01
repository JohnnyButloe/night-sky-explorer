'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DatePicker from '@/app/components/ui/DatePicker';
import LocationAutocomplete from './components/LocationAutocomplete';
import Highlights from './components/Highlights';
import MoonCard from './components/MoonCard';
import CelestialObjectsList from './components/CelestialObjectsList';
import SkyConditions from './components/SkyConditions';
import TimeSlider from './components/TimeSlider';
import { fetchCelestialData, fetchWeatherData } from './utils/api';
import type { CelestialData, CelestialObject } from './types';

export default function Home() {
  // --- State ---
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    displayName: string;
  } | null>(null);

  const [celestialData, setCelestialData] = useState<CelestialData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Unified date & time state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [celestialTime, setCelestialTime] = useState<Date>(new Date());

  // Collapse/expand the location search UI
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  // --- Data fetching helper ---
  const fetchData = async (
    lat: number,
    lon: number,
    date: Date,
    initialTime?: Date,
  ) => {
    setLoading(true);
    try {
      // Format date for the celestial API (YYYY-MM-DD)
      const isoDate = date.toISOString().split('T')[0];
      const data = await fetchCelestialData(lat, lon, isoDate);
      const weather = await fetchWeatherData(lat, lon);

      data.weather = {
        temperature: weather.temperature,
        conditions: weather.conditions,
        currentCloudCover: weather.currentCloudCover,
        currentVisibility: weather.currentVisibility,
        lightPollution: weather.lightPollution,
        hourlyForecast: weather.hourlyForecast,
      };

      setCelestialData(data);

      // Default the slider time to the passed-in initialTime (or now)
      setCelestialTime(initialTime ?? new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleLocationSelect = (
    latitude: number,
    longitude: number,
    displayName: string,
  ) => {
    // 1. Save location & collapse search
    setLocation({ latitude, longitude, displayName });
    setIsSearchCollapsed(true);

    // 2. Default date/time to now
    const now = new Date();
    setSelectedDate(now);
    // fetch & default slider to now
    fetchData(latitude, longitude, now, now);
  };

  const handleDateChange = (date: Date | null) => {
    if (!date || !location) {
      date && setSelectedDate(date);
      return;
    }
    // 1. Update date
    setSelectedDate(date);

    // 2. Re-fetch data for the new date, preserve current time on the slider
    fetchData(location.latitude, location.longitude, date, celestialTime);
  };

  const handleTimeChange = (time: Date) => {
    setCelestialTime(time);
  };

  const handleChangeLocation = () => {
    setIsSearchCollapsed(false);
    setCelestialData(null);
    setLocation(null);
  };

  // --- Render helpers ---

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
    } else {
      return (
        <Card className="w-full max-w-3xl mb-4 bg-card/50 backdrop-blur-sm">
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="font-medium">{location?.displayName}</span>
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
    }
  };

  const moonObject =
    celestialData?.objects.find((obj) => obj.name === 'Moon') ?? null;

  // --- Main render ---

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">
        Night Sky Explorer
      </h1>

      {/* Location Section */}
      {renderSearchSection()}

      {/* Loading Indicator */}
      {loading && (
        <p className="text-center text-primary mb-4">
          Loading celestial data...
        </p>
      )}

      {/* Dashboard */}
      {celestialData && !loading && (
        <div className="w-full max-w-7xl space-y-6">
          {/* Unified Date & Time Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-1/3 min-w-[200px]">
              <DatePicker selected={selectedDate} onChange={handleDateChange} />
            </div>
            <div className="flex-1">
              <TimeSlider
                startTime={celestialData.nightStart}
                endTime={celestialData.nightEnd}
                currentTime={celestialTime}
                onTimeChange={handleTimeChange}
                selectedObject={null}
                celestialObjects={celestialData.objects}
              />
            </div>
          </div>

          {/* Top Section: Highlights & MoonCard */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Highlights data={celestialData} currentTime={celestialTime} />
            </div>
            <div className="col-span-4">
              {moonObject && (
                <MoonCard object={moonObject} currentTime={celestialTime} />
              )}
            </div>
          </div>

          {/* Objects List & Sky Conditions */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <CelestialObjectsList
                data={celestialData}
                currentTime={celestialTime}
                onTimeChange={setCelestialTime}
                onObjectSelect={() => {}}
              />
            </div>
            <div className="col-span-4">
              <SkyConditions data={celestialData} currentTime={celestialTime} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
