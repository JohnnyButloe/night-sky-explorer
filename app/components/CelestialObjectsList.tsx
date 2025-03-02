'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import TimeSlider from './TimeSlider';
import type { CelestialData, CelestialObject } from '../types';

interface CelestialObjectsListProps {
  data: CelestialData;
  currentTime: Date;
  onTimeChange: (newTime: Date) => void;
  onObjectSelect: (object: CelestialObject | null) => void;
}

function getVisibilityInfo(
  altitude: number,
  azimuth: number,
): { visible: boolean; direction: string } {
  const visible = altitude > 0;
  let direction = '';

  if (azimuth >= 315 || azimuth < 45) direction = 'North';
  else if (azimuth >= 45 && azimuth < 135) direction = 'East';
  else if (azimuth >= 135 && azimuth < 225) direction = 'South';
  else if (azimuth >= 225 && azimuth < 315) direction = 'West';

  return { visible, direction };
}

function CelestialObjectsList({
  data,
  currentTime,
  onTimeChange,
  onObjectSelect,
}: CelestialObjectsListProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortedObjects, setSortedObjects] = useState<CelestialObject[]>([]);

  useEffect(() => {
    const sorted = [...data.objects].sort((a, b) => {
      if (favorites.has(a.name) && !favorites.has(b.name)) return -1;
      if (!favorites.has(a.name) && favorites.has(b.name)) return 1;
      return 0;
    });
    setSortedObjects(sorted);
  }, [data.objects, favorites]);

  const toggleFavorite = (objectName: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(objectName)) {
        newFavorites.delete(objectName);
      } else {
        newFavorites.add(objectName);
      }
      return newFavorites;
    });
  };

  if (!data || !data.objects || data.objects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visible Celestial Objects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">No celestial objects data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-primary">
            Celestial Objects
          </CardTitle>
        </CardHeader>
        {/* ✅ TimeSlider Component Added Here */}
        <CardContent>
          <TimeSlider
            startTime={data.nightStart}
            endTime={data.nightEnd}
            currentTime={currentTime}
            onTimeChange={onTimeChange} // ✅ This updates the celestial object list dynamically
            selectedObject={null}
            celestialObjects={data.objects}
          />
        </CardContent>

        <CardContent className="pt-0">
          <div className="space-y-2">
            {sortedObjects.map((object) => {
              const currentHourData = object?.hourlyData?.find(
                (data) => data.time.getTime() === currentTime.getTime(),
              ) ||
                object?.hourlyData?.[0] || { altitude: 0, azimuth: 0 };

              const { visible, direction } = getVisibilityInfo(
                currentHourData.altitude,
                currentHourData.azimuth,
              );

              const isBestViewing =
                object.additionalInfo.bestViewingTime &&
                Math.abs(
                  object.additionalInfo.bestViewingTime.getTime() -
                    currentTime.getTime(),
                ) <
                  30 * 60 * 1000; // within 30 minutes

              const cloudCoverAtTime =
                data.weather.hourlyForecast.find(
                  (forecast) =>
                    new Date(forecast.time).getTime() === currentTime.getTime(),
                )?.cloudCover ??
                data.weather.currentCloudCover ??
                50;

              const lightPollution = data.weather.lightPollution ?? 5; // Default to 5 if missing

              const isGoodViewing =
                visible &&
                currentHourData.altitude > 30 &&
                cloudCoverAtTime < 50;

              return (
                <Card
                  key={object.name}
                  className={`mb-2 bg-card/50 backdrop-blur-sm ${
                    isBestViewing ? 'border border-yellow-400' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm flex items-center">
                          {object.name}{' '}
                          {object.type === 'Constellation'
                            ? '⭐'
                            : `(${object.type})`}
                          <button
                            onClick={() => toggleFavorite(object.name)}
                            className="ml-2 focus:outline-none"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                favorites.has(object.name)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>
                        </h3>
                        <p className="text-xs text-gray-600">
                          Alt: {currentHourData.altitude.toFixed(1)}°, Az:{' '}
                          {currentHourData.azimuth.toFixed(1)}°
                        </p>
                        <p className="text-xs text-gray-500">
                          Light Pollution: {lightPollution} / 10
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        {visible ? (
                          <p className="text-green-600 font-medium">Visible</p>
                        ) : (
                          <p className="text-red-600 font-medium">
                            Not visible
                          </p>
                        )}
                        {visible && <p>{direction}</p>}
                        <p className="text-blue-500">
                          Best Time:{' '}
                          {object.additionalInfo.bestViewingTime?.toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    {isGoodViewing && (
                      <p className="mt-1 text-xs text-green-600">
                        Good viewing conditions
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <button className="flex items-center text-xs text-blue-600 hover:text-blue-800">
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show Details
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CelestialObjectsList;
