// app/components/CelestialObjectsList.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, Star } from 'lucide-react';
import type { CelestialData, CelestialObject } from '../types';
import CelestialGraph from '@/app/components/CelestialGraph';
import { parseDate } from '@/app/utils/dateUtils';

interface CelestialObjectsListProps {
  data: CelestialData;
  currentTime: Date | string;
  onTimeChange: (newTime: Date) => void;
  onObjectSelect: (object: CelestialObject | null) => void;
}

function getVisibilityInfo(altitude: number, azimuth: number) {
  const visible = altitude > 0;
  let direction = '';
  if (azimuth >= 315 || azimuth < 45) direction = 'North';
  else if (azimuth >= 45 && azimuth < 135) direction = 'East';
  else if (azimuth >= 135 && azimuth < 225) direction = 'South';
  else if (azimuth >= 225 && azimuth < 315) direction = 'West';
  return { visible, direction };
}

export default function CelestialObjectsList({
  data,
  currentTime,
}: CelestialObjectsListProps) {
  // 1) Ensure currentTime is a Date
  const currentDate = parseDate(currentTime);

  // 2) Default hourlyForecast to an array if missing
  const hourlyForecast = data.weather.hourlyForecast ?? [];

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Exclude the Moon
  const objectsExcludingMoon = useMemo(
    () => data.objects.filter((obj) => obj.name !== 'Moon'),
    [data.objects],
  );

  // Sort favorites first
  const sortedObjects = useMemo(() => {
    const list = [...objectsExcludingMoon];
    list.sort((a, b) => {
      const aFav = favorites.has(a.name);
      const bFav = favorites.has(b.name);
      if (aFav && !bFav) return -1;
      if (bFav && !aFav) return 1;
      return 0;
    });
    return list;
  }, [objectsExcludingMoon, favorites]);

  const toggleFavorite = (name: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  if (sortedObjects.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-primary">
            Visible Celestial Objects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">
            No celestial objects data available.
          </p>
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
        <CardContent className="pt-0">
          <div className="space-y-2">
            {sortedObjects.map((object) => {
              // 3) Current-hour data
              const currentHourData = object.hourlyData.find(
                (d) => parseDate(d.time).getTime() === currentDate.getTime(),
              ) || { altitude: 0, azimuth: 0 };

              // 4) Visibility info
              const { visible, direction } = getVisibilityInfo(
                currentHourData.altitude,
                currentHourData.azimuth,
              );

              // 5) Best-viewing flag
              let isBestViewing = false;
              if (object.additionalInfo.bestViewingTime) {
                const bestDate = parseDate(
                  object.additionalInfo.bestViewingTime,
                );
                isBestViewing =
                  Math.abs(bestDate.getTime() - currentDate.getTime()) <
                  30 * 60 * 1000;
              }

              // 6) Cloud cover at this time
              const cloudCoverAtTime =
                hourlyForecast.find(
                  (f) => parseDate(f.time).getTime() === currentDate.getTime(),
                )?.cloudCover ??
                data.weather.currentCloudCover ??
                50;

              const lightPollution = data.weather.lightPollution ?? 5;
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
                    <div className="flex items-start space-x-4">
                      {/* Left Column */}
                      <div className="w-1/3 space-y-1">
                        <h3 className="font-semibold text-sm flex items-center text-gray-200">
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
                        <p className="text-xs text-gray-400">
                          Alt: {currentHourData.altitude.toFixed(1)}°, Az:{' '}
                          {currentHourData.azimuth.toFixed(1)}°
                        </p>
                        <p className="text-xs text-gray-400">
                          LP: {lightPollution} / 10
                        </p>
                        {isGoodViewing && (
                          <p className="mt-1 text-xs text-green-500">
                            Good viewing conditions
                          </p>
                        )}
                        <button className="flex items-center text-xs text-blue-400 hover:text-blue-600 mt-2">
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Show Details
                        </button>
                      </div>

                      {/* Center: Graph */}
                      <div className="w-1/3 flex items-center justify-center">
                        <CelestialGraph
                          hourlyData={object.hourlyData}
                          currentTime={currentDate}
                        />
                      </div>

                      {/* Right Column */}
                      <div className="w-1/3 text-right text-xs space-y-1">
                        {visible ? (
                          <p className="text-green-500 font-medium">Visible</p>
                        ) : (
                          <p className="text-red-500 font-medium">
                            Not visible
                          </p>
                        )}
                        {visible && (
                          <p className="text-gray-300">{direction}</p>
                        )}
                        <p className="text-blue-400">
                          Best Time:{' '}
                          {object.additionalInfo.bestViewingTime
                            ? parseDate(
                                object.additionalInfo.bestViewingTime,
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </p>
                      </div>
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
