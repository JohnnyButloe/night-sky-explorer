'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CelestialObject } from '../types';

interface TimeSliderProps {
  startTime: Date;
  endTime: Date;
  currentTime: Date;
  onTimeChange: (newTime: Date) => void;
  selectedObject: CelestialObject | null;
  celestialObjects?: CelestialObject[]; // Optional to handle undefined
}

export default function TimeSlider({
  startTime,
  endTime,
  currentTime,
  onTimeChange,
  selectedObject,
  celestialObjects = [], // Default to empty array if undefined
}: TimeSliderProps) {
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (60 * 1000);
  const currentMinutes =
    (currentTime.getTime() - startTime.getTime()) / (60 * 1000);

  const handleSliderChange = (value: number[]) => {
    const newMinutes = value[0];
    const newTime = new Date(startTime.getTime() + newMinutes * 60 * 1000);
    onTimeChange(newTime);
  };

  const getTimePercentage = (time: Date) => {
    const minutes = (time.getTime() - startTime.getTime()) / (60 * 1000);
    return (minutes / totalMinutes) * 100;
  };

  // Handle case where celestialObjects is undefined or empty
  if (!celestialObjects || celestialObjects.length === 0) {
    return (
      <div className="w-full space-y-2 text-center text-gray-400">
        <div className="relative">
          <Slider
            min={0}
            max={totalMinutes}
            step={15}
            value={[currentMinutes]}
            onValueChange={handleSliderChange}
            className="w-full h-2 bg-gray-800 rounded-full cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            {startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' PM'}
          </span>
          <span>
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' PM'}
          </span>
          <span>
            {endTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' AM'}
          </span>
        </div>
        <p>No celestial objects available.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-2">
        <div className="relative">
          {/* Slider with dark theme and custom styling for thumb via className */}
          <Slider
            min={0}
            max={totalMinutes}
            step={15}
            value={[currentMinutes]}
            onValueChange={handleSliderChange}
            className="w-full h-2 bg-gray-800 rounded-full cursor-pointer [&_[data-radix-slider-thumb]]:w-4 [&_[data-radix-slider-thumb]]:h-4 [&_[data-radix-slider-thumb]]:bg-blue-500 [&_[data-radix-slider-thumb]]:rounded-full [&_[data-radix-slider-thumb]]:shadow-md [&_[data-radix-slider-thumb]]:hover:bg-blue-600 [&_[data-radix-slider-thumb]]:focus:outline-none [&_[data-radix-slider-thumb]]:focus:ring-2 [&_[data-radix-slider-thumb]]:focus:ring-blue-400 [&_[data-radix-slider-thumb]]:transition-all"
          />

          {/* Best Viewing Time Markers for All Objects */}
          {celestialObjects.map((object) => (
            <React.Fragment key={object.name}>
              {object.additionalInfo &&
                object.additionalInfo.bestViewingTime && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute top-1/2 -mt-2 w-3 h-3 bg-green-400 rounded-full shadow-lg animate-pulse-slow"
                        style={{
                          left: `calc(${getTimePercentage(object.additionalInfo.bestViewingTime)}% - 6px)`,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-gray-900 text-white border-gray-700 shadow-lg p-2 rounded-md"
                    >
                      <p className="text-xs">
                        Best Time for {object.name}:{' '}
                        {object.additionalInfo.bestViewingTime.toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              {/* Visibility Period Shaded Region */}
              {object.hourlyData.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-0 h-2 bg-blue-300 opacity-50"
                      style={{
                        left: `${getTimePercentage(object.hourlyData[0].time)}%`,
                        width: `${getTimePercentage(object.hourlyData[object.hourlyData.length - 1].time) - getTimePercentage(object.hourlyData[0].time)}%`,
                        bottom: '2px',
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-900 text-white border-gray-700 shadow-lg p-2 rounded-md"
                  >
                    <p className="text-xs">
                      Visibility for {object.name}:{' '}
                      {object.hourlyData[0].time.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {object.hourlyData[
                        object.hourlyData.length - 1
                      ].time.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </React.Fragment>
          ))}

          {/* Selected Object Highlight (Yellow Marker) */}
          {selectedObject &&
            selectedObject.additionalInfo &&
            selectedObject.additionalInfo.bestViewingTime && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute top-1/2 -mt-2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg animate-pulse-slow"
                    style={{
                      left: `calc(${getTimePercentage(selectedObject.additionalInfo.bestViewingTime)}% - 6px)`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-gray-900 text-white border-gray-700 shadow-lg p-2 rounded-md"
                >
                  <p className="text-xs">
                    Best Time for {selectedObject.name}:{' '}
                    {selectedObject.additionalInfo.bestViewingTime.toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            {startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' PM'}
          </span>
          <span>
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' PM'}
          </span>
          <span>
            {endTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' AM'}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
