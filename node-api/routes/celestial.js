// node-api/routes/celestial.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import cache from '../cache.js';
import * as Astronomy from 'astronomy-engine';

export const router = express.Router();

/**
 * Optional API key middleware (kept for parity / future use).
 * Disabled by default to keep current behavior unchanged.
 */
// const apiKeyMiddleware = (req, res, next) => {
//   if (process.env.USE_MOCKS === 'true' || process.env.NODE_ENV === 'test') return next();
//   const apiKey = req.headers['x-api-key'] || req.query.api_key;
//   const validApiKey = process.env.API_KEY || process.env.WEATHER_API_KEY;
//   if (!validApiKey || !apiKey || apiKey !== validApiKey) {
//     return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
//   }
//   next();
// };
// router.use(apiKeyMiddleware);

// ---- Rate Limiter: 60 req/min per IP for celestial endpoint ----
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/celestial?lat=36.85&lon=-75.98&iso=2025-08-24T15:00:00Z
 *
 * Returns Sun/Moon alt-az at the requested time/location,
 * plus sunrise/sunset and moonrise/moonset within ~1 day,
 * and current moon phase.
 *
 * Uses Astronomy Engine functions:
 * - Observer, Equator, Horizon, SearchRiseSet, MoonPhase, AstroTime.
 */
router.get('/', limiter, async (req, res) => {
  try {
    const { lat, lon, iso } = req.query;

    if (lat == null || lon == null) {
      return res
        .status(400)
        .json({ error: 'Missing latitude or longitude parameters' });
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    // Use provided ISO or "now". Astronomy Engine accepts JS Date directly.
    const when =
      typeof iso === 'string' && iso.trim() ? new Date(iso) : new Date();
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ error: 'Invalid iso datetime' });
    }

    // 5-minute cache keyed by minute-precision time and location.
    const minuteIso = new Date(
      when.getFullYear(),
      when.getMonth(),
      when.getDate(),
      when.getHours(),
      when.getMinutes(),
    ).toISOString();

    const cacheKey = `celestial:${latNum}:${lonNum}:${minuteIso}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const observer = new Astronomy.Observer(latNum, lonNum, 0); // elevation 0m; extend later if needed

    // Current topocentric positions -> horizontal (azimuth/altitude)
    const sunEq = Astronomy.Equator(
      Astronomy.Body.Sun,
      when,
      observer,
      true,
      true,
    );
    const sunHor = Astronomy.Horizon(
      when,
      observer,
      sunEq.ra,
      sunEq.dec,
      'normal',
    );

    const moonEq = Astronomy.Equator(
      Astronomy.Body.Moon,
      when,
      observer,
      true,
      true,
    );
    const moonHor = Astronomy.Horizon(
      when,
      observer,
      moonEq.ra,
      moonEq.dec,
      'normal',
    );

    // Rise/Set searches: next events within ~1 day.
    const tStart = new Astronomy.AstroTime(when);
    const riseSun = Astronomy.SearchRiseSet(
      Astronomy.Body.Sun,
      observer,
      +1,
      tStart,
      1,
    );
    const setSun = Astronomy.SearchRiseSet(
      Astronomy.Body.Sun,
      observer,
      -1,
      tStart,
      1,
    );
    const riseMoon = Astronomy.SearchRiseSet(
      Astronomy.Body.Moon,
      observer,
      +1,
      tStart,
      1,
    );
    const setMoon = Astronomy.SearchRiseSet(
      Astronomy.Body.Moon,
      observer,
      -1,
      tStart,
      1,
    );

    // Moon phase at the requested time (0=new, 180=full).
    const moonPhaseDeg = Astronomy.MoonPhase(when);

    const payload = {
      request: {
        lat: latNum,
        lon: lonNum,
        iso: when.toISOString(),
      },
      sun: {
        altitude: sunHor.altitude, // degrees
        azimuth: sunHor.azimuth, // degrees
        sunrise: riseSun?.date?.toISOString() ?? null,
        sunset: setSun?.date?.toISOString() ?? null,
      },
      moon: {
        altitude: moonHor.altitude, // degrees
        azimuth: moonHor.azimuth, // degrees
        moonPhaseDeg, // 0=new, 90=first quarter, 180=full, 270=last quarter
        moonrise: riseMoon?.date?.toISOString() ?? null,
        moonset: setMoon?.date?.toISOString() ?? null,
      },
      // future: add planets, twilight times, etc.
    };

    await cache.set(cacheKey, JSON.stringify(payload), 300); // 5 min TTL
    return res.json(payload);
  } catch (err) {
    console.error('[Celestial Error]', err);
    return res.status(500).json({ error: 'Celestial computation failed.' });
  }
});

export default router;
