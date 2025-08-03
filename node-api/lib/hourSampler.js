// lib/hourSampler.js
import {
  Observer,
  Body,
  AstroTime,
  EquatorialCoordinates,
} from 'astronomy-engine';

export function sampleHourly(observer, body, startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const samples = [];

  for (let t = new Date(start); t <= end; t.setHours(t.getHours() + 1)) {
    const astroTime = new AstroTime(t);
    const eq = Body[body].equatorial(astroTime, observer);
    const hor = eq.horizon(observer, astroTime); // altitude / azimuth

    samples.push({
      time: t.toISOString(),
      altitude: hor.altitude,
      azimuth: hor.azimuth,
    });
  }
  return samples;
}
