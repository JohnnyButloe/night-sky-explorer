'use client';

import Highlights from './Highlights';
import SkyConditions from './SkyConditions';
import MoonCard from './MoonCard';
import CelestialObjectsList from './CelestialObjectsList';
import type { CelestialData, CelestialObject } from '@/app/types';

interface DashboardProps {
  celestialData: CelestialData;
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  selectedObject: CelestialObject | null;
  onObjectSelect: (obj: CelestialObject) => void;
}

export default function Dashboard({
  celestialData,
  currentTime,
  onTimeChange,
  selectedObject,
  onObjectSelect,
}: DashboardProps) {
  const moonObject = celestialData.objects.find((obj) => obj.name === 'Moon');
  const filteredCelestialData = {
    ...celestialData,
    objects: celestialData.objects.filter((obj) => obj.name !== 'Moon'),
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left column */}
      <div className="col-span-8 space-y-4">
        <Highlights data={celestialData} currentTime={currentTime} />
        {filteredCelestialData && (
          <CelestialObjectsList
            data={filteredCelestialData}
            currentTime={currentTime}
            onTimeChange={onTimeChange}
            onObjectSelect={onObjectSelect}
          />
        )}
      </div>

      {/* Right column */}
      <div className="col-span-4 space-y-4">
        {moonObject && (
          <MoonCard object={moonObject} currentTime={currentTime} />
        )}
        <SkyConditions data={celestialData} currentTime={currentTime} />
      </div>
    </div>
  );
}
