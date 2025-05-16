import {
  Body,
  Equator,
  Observer,
  Horizon as AstronomyHorizon,
  SearchRiseSet,
  MoonPhase,
} from 'astronomy-engine';

/**
 * Compute the topocentric altitude & azimuth of a solar system body.
 *
 * @param {string} bodyName  One of "Sun","Moon","Mercury","Venus","Mars",…
 * @param {string} isoTime   An ISO UTC timestamp, e.g. "2025-04-20T22:00:00.000Z"
 * @param {number} lat       Geographic latitude (°)
 * @param {number} lon       Geographic longitude (°)
 * @returns {{altitude:number, azimuth:number}}
 */
export function computeAltAz(bodyName, isoTime, lat, lon) {
  try {
    const date = new Date(isoTime);
    if (isNaN(date)) throw new Error(`Invalid ISO time: ${isoTime}`);

    const body = Body[bodyName];
    if (!body) throw new Error(`Unknown body: ${bodyName}`);

    // Create a real Observer instance (required by Equator & Horizon)
    const observer = new Observer(lat, lon, 0);

    // Get equatorial coordinates (RA, Dec)
    const equ = Equator(
      body,
      date,
      observer,
      /* ofDate */ true,
      /* aberration */ false,
    );

    // Convert RA/Dec to horizontal coords (altitude, azimuth) with refraction
    const hor = AstronomyHorizon(date, observer, equ.ra, equ.dec, 'normal');

    return { altitude: hor.altitude, azimuth: hor.azimuth };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Astro Error] computeAltAz:', msg);
    throw new Error(msg);
  }
}

/**
 * Compute the next rise and set times (within ±1 day) for a body.
 *
 * @param {string} bodyName
 * @param {string} isoTime
 * @param {number} lat
 * @param {number} lon
 * @returns {{riseTime:string|null, setTime:string|null}}
 */
export function computeRiseSet(bodyName, isoTime, lat, lon) {
  try {
    const date = new Date(isoTime);
    if (isNaN(date)) throw new Error(`Invalid ISO time: ${isoTime}`);

    const body = Body[bodyName];
    if (!body) throw new Error(`Unknown body: ${bodyName}`);

    // Use Observer for rise/set as well
    const observer = new Observer(lat, lon, 0);

    // Next rise within 1 day
    const riseAstro = SearchRiseSet(body, observer, +1, date, 1);
    // Next set within 1 day
    const setAstro = SearchRiseSet(body, observer, -1, date, 1);

    return {
      riseTime: riseAstro ? riseAstro.date.toISOString() : null,
      setTime: setAstro ? setAstro.date.toISOString() : null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Astro Error] computeRiseSet:', msg);
    throw new Error(msg);
  }
}

/**
 * Compute the Moon’s phase angle at a given time.
 *
 * @param {string} isoTime
 * @returns {number} Phase angle in degrees (0°=new,180°=full)
 */
export function computeMoonPhase(isoTime) {
  try {
    const date = new Date(isoTime);
    if (isNaN(date)) throw new Error(`Invalid ISO time: ${isoTime}`);

    const phase = MoonPhase(date);
    return phase.degrees;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Astro Error] computeMoonPhase:', msg);
    throw new Error(msg);
  }
}
