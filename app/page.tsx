'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CelestialObjectsList from '@/app/components/CelestialObjectsList';
import LocationAutocomplete from './components/LocationAutocomplete';
import Highlights from './components/Highlights';
import SkyConditions from './components/SkyConditions';
import MoonCard from './components/MoonCard';
import { getCelestialData } from './utils/api';
import type { CelestialData, CelestialObject } from './types';

export default function Home() {
  const [celestialData, setCelestialData] = useState<CelestialData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(
    null,
  );

  const handleLocationSelect = async (
    latitude: number,
    longitude: number,
    time: string,
  ) => {
    setLoading(true);
    try {
      const data = await getCelestialData(latitude, longitude, time);
      setCelestialData(data);
      setCurrentTime(data.nightStart);
    } catch (error) {
      console.error('Error fetching celestial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (newTime: Date) => {
    setCurrentTime(newTime);
  };

  const handleEditLocation = () => {
    setCelestialData(null);
    setCurrentTime(null);
    setSelectedObject(null);
  };

  const moonObject = celestialData?.objects.find((obj) => obj.name === 'Moon');
  const filteredCelestialData = celestialData && {
    ...celestialData,
    objects: celestialData.objects.filter((obj) => obj.name !== 'Moon'),
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4 text-primary">
        Night Sky Explorer
      </h1>
      <div className="w-full max-w-7xl grid grid-cols-12 gap-4">
        {!celestialData && (
          <Card className="col-span-12 mb-4 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">
                Enter Your Location and Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationAutocomplete onLocationSelect={handleLocationSelect} />
            </CardContent>
          </Card>
        )}

        {loading && (
          <p className="col-span-12 text-center text-primary">
            Loading celestial data...
          </p>
        )}

        {celestialData && currentTime && (
          <>
            <div className="col-span-8">
              <Highlights data={celestialData} currentTime={currentTime} />
            </div>

            <div className="col-span-4">
              {moonObject && (
                <MoonCard object={moonObject} currentTime={currentTime} />
              )}
            </div>

            <div className="col-span-8">
              {filteredCelestialData && (
                <CelestialObjectsList
                  data={filteredCelestialData}
                  currentTime={currentTime}
                  onTimeChange={handleTimeChange} // ✅ Passed function to update time
                  onObjectSelect={setSelectedObject}
                />
              )}
            </div>

            <div className="col-span-4">
              <SkyConditions data={celestialData} currentTime={currentTime} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
