import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CelestialObject } from '../types';

interface MoonCardProps {
  object: CelestialObject;
  currentTime: Date;
}

const MoonCard: React.FC<MoonCardProps> = ({ object, currentTime }) => {
  const {
    phase,
    illumination,
    riseDirection,
    maxAltitude,
    bestViewingTime,
    riseTime,
    setTime,
  } = object.additionalInfo;

  console.log('Moon Data:', { riseTime, setTime }); // Debugging output

  const currentHourData =
    object.hourlyData.find(
      (data) => data.time.getTime() === currentTime.getTime(),
    ) || object.hourlyData[0];

  return (
    <Card className="bg-card/50 backdrop-blur-sm p-3 w-64">
      <CardHeader className="pb-1">
        <CardTitle className="text-md text-primary">{object.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs">
        <p>
          <strong>Phase:</strong> {phase}
        </p>
        <p>
          <strong>Illumination:</strong> {illumination}%
        </p>
        <p>
          <strong>Altitude:</strong> {currentHourData?.altitude.toFixed(1)}°
        </p>
        <p>
          <strong>Azimuth:</strong> {currentHourData?.azimuth.toFixed(1)}°
        </p>
        <p>
          <strong>Max Altitude:</strong> {maxAltitude.toFixed(1)}°
        </p>
        {bestViewingTime && (
          <p>
            <strong>Best Viewing:</strong>{' '}
            {bestViewingTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {riseTime ? (
          <p>
            <strong>Rise Time:</strong>{' '}
            {new Date(riseTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        ) : (
          <p className="text-gray-400">Rise Time: N/A</p>
        )}
        {setTime ? (
          <p>
            <strong>Set Time:</strong>{' '}
            {new Date(setTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        ) : (
          <p className="text-gray-400">Set Time: N/A</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MoonCard;
