import React from 'react';
import type { CelestialObject } from '../types';

interface SnapToBestTimesProps {
  celestialObjects: CelestialObject[];
  onSnapTimeChange: (time: Date) => void;
}

const SnapToBestTimes: React.FC<SnapToBestTimesProps> = ({
  celestialObjects,
  onSnapTimeChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {celestialObjects.map((object) => {
        const bestTime = object.additionalInfo?.bestViewingTime;
        if (!bestTime) return null;

        return (
          <button
            key={object.name}
            onClick={() => onSnapTimeChange(bestTime)}
            className="bg-blue-600 text-white rounded-md px-3 py-1"
          >
            {object.name}:{' '}
            {bestTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </button>
        );
      })}
    </div>
  );
};

export default SnapToBestTimes;
