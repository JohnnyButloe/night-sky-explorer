// app/components/TimeSlider.tsx
'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import type { CelestialObject } from '../types';
import { parseDate } from '@/app/utils/dateUtils';

interface TimeSliderProps {
  startTime: Date | string;
  endTime: Date | string;
  currentTime: Date | string;
  onTimeChange: (newTime: Date) => void;
  selectedObject: CelestialObject | null;
  celestialObjects?: CelestialObject[];
}

export default function TimeSlider({
  startTime,
  endTime,
  currentTime,
  onTimeChange,
  selectedObject,
  celestialObjects = [],
}: TimeSliderProps) {
  // Convert incoming date props using parseDate.
  const startDate = parseDate(startTime);
  const endDate = parseDate(endTime);
  const currentDate = parseDate(currentTime);

  const totalMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
  const currentMinutes =
    (currentDate.getTime() - startDate.getTime()) / (60 * 1000);

  const handleSliderChange = (value: number[]) => {
    const newMinutes = value[0];
    const newTime = new Date(startDate.getTime() + newMinutes * 60 * 1000);
    onTimeChange(newTime);
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-2">
        <Slider
          min={0}
          max={totalMinutes}
          step={15}
          value={[currentMinutes]}
          onValueChange={handleSliderChange}
          className="w-full h-2 bg-gray-800 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            {startDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            {currentDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            {endDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
