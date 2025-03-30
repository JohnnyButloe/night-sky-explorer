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
  const [celestialData, setCelestialData] = useState<CelestialData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // This state is used for the dynamic time from the TimeSlider.
  const [celestialTime, setCelestialTime] = useState<Date | null>(null);

  const handleLocationSelect = async (latitude: number, longitude: number) => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      // Fetch celestial data using the updated function name
      const data = await fetchCelestialData(latitude, longitude, formattedDate);
      // Fetch weather data
      const weatherData = await fetchWeatherData(latitude, longitude);
      // Merge weather data into celestialData
      data.weather = {
        temperature: weatherData.temperature,
        conditions: weatherData.conditions,
        currentCloudCover: weatherData.currentCloudCover,
        // Provide defaults for missing fields expected by SkyConditions
        currentVisibility: data.weather.currentVisibility || 10000,
        lightPollution: data.weather.lightPollution || 5,
        hourlyForecast: data.weather.hourlyForecast || [],
      };
      setCelestialData(data);
      // Set the initial dynamic time to the night's start.
      setCelestialTime(data.nightStart);
    } catch (error) {
      console.error('Error fetching celestial or weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute the Moon object for MoonCard display
  const moonObject = celestialData?.objects.find((obj) => obj.name === 'Moon');

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">
        Night Sky Explorer
      </h1>

      {/* Input form if no celestial data */}
      {!celestialData && (
        <Card className="w-full max-w-3xl mb-4 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">
              Enter Your Location and Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              className="mb-4"
            />
            <LocationAutocomplete onLocationSelect={handleLocationSelect} />
          </CardContent>
        </Card>
      )}

      {loading && (
        <p className="text-center text-primary mb-4">
          Loading celestial data...
        </p>
      )}

      {/* Dashboard: Only shown if data is fetched */}
      {celestialData && celestialTime && !loading && (
        <div className="w-full max-w-7xl space-y-4">
          {/* Top Section: Highlights and MoonCard (using fixed night's start time) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Highlights
                data={celestialData}
                currentTime={celestialData.nightStart}
              />
            </div>
            <div className="col-span-4">
              {moonObject && (
                <MoonCard
                  object={moonObject}
                  currentTime={celestialData.nightStart}
                />
              )}
            </div>
          </div>

          {/* Time Slider: Affects only CelestialObjectsList and SkyConditions */}
          <TimeSlider
            startTime={celestialData.nightStart}
            endTime={celestialData.nightEnd}
            currentTime={celestialTime}
            onTimeChange={setCelestialTime}
            selectedObject={null}
            celestialObjects={celestialData.objects}
          />

          {/* Bottom Section: Celestial Objects List and Sky Conditions */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <CelestialObjectsList
                data={celestialData}
                currentTime={celestialTime}
                onTimeChange={setCelestialTime}
                onObjectSelect={(object) => {
                  // Handle object selection here (for now, just log it)
                  console.log('Selected object:', object);
                }}
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
