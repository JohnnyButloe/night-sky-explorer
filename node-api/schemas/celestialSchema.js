import { z } from 'zod';

const HourlyPoint = z.object({
  time: z.string().datetime(),
  altitude: z.number(),
  azimuth: z.number(),
});
const CelestialObject = z.object({
  name: z.string(),
  type: z.string().optional(), // can add later
  hourlyData: z.array(HourlyPoint), // <-- never undefined
  riseTime: z.string().nullable(),
  setTime: z.string().nullable(),
});

export const CelestialPayload = z.object({
  objects: z.array(CelestialObject),
  moonPhaseAngle: z.number(),
});
