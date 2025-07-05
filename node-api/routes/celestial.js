import express from 'express';
import { DateTime } from 'luxon';
import cache from '../cache.js';
import { mockCelestialData } from '../mockData.js';
import * as astro from '../lib/astro.js';

const router = express.Router();

// API Key middleware that skips when mocking
const apiKeyMiddleware = (req, res, next) => {
  if (process.env.USE_MOCKS === 'true') return next();

  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.API_KEY || process.env.WEATHER_API_KEY;

  if (!validApiKey || !apiKey || apiKey !== validApiKey) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
};

router.use(apiKeyMiddleware);

/**
 * GET /api/celestial
 * Query params: lat (degrees), lon (degrees), time (ISO string), zone (IANA timezone, optional)
 * Returns: objects with altitude, azimuth, rise/set times, and lunar phase angle.
 */
router.get('/', async (req, res) => {
  let { lat, lon, time, zone } = req.query;

  // 1) Basic presence check
  if (!lat || !lon || !time) {
    return res
      .status(400)
      .json({ error: 'Missing required query parameters: lat, lon, time' });
  }

  // 2) Validate numeric latitude/longitude
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return res
      .status(400)
      .json({ error: 'Latitude and longitude must be valid numbers' });
  }
  if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
    return res.status(400).json({
      error:
        'Latitude must be between -90 and 90; longitude between -180 and 180',
    });
  }

  // 3) Parse & normalize time with Luxon
  const tz = zone || 'utc';
  const dt = DateTime.fromISO(time, { zone: tz });
  if (!dt.isValid) {
    return res
      .status(400)
      .json({ error: 'Invalid time format; expected ISO string' });
  }
  const iso = dt.setZone('utc').toISO();

  // 4) Build cache key (we omit tz since output is UTC)
  const cacheKey = ['celestial', latNum, lonNum, iso].join(':');

  let cached;
  try {
    cached = await cache.get(cacheKey);
  } catch (err) {
    console.error('[Cache Error] get:', err);
  }
  if (cached) {
    console.log(`[cache HIT] ${cacheKey}`);
    return res.json(JSON.parse(cached));
  }
  console.log(`[cache MISS] ${cacheKey}`);

  // 5) Mock mode
  if (process.env.USE_MOCKS === 'true') {
    console.log('Serving mock celestial data');
    try {
      await cache.set(cacheKey, JSON.stringify(mockCelestialData), 3600);
    } catch (err) {
      console.error('[Cache Error] set:', err);
    }
    return res.json(mockCelestialData);
  }

  try {
    // 6) Compute for each body
    const bodies = [
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
    ];

    // Pre-parse date & observer once if needed internally
    const objects = bodies.map((name) => {
      const { altitude, azimuth } = astro.computeAltAz(
        name,
        iso,
        latNum,
        lonNum,
      );
      const { riseTime, setTime } = astro.computeRiseSet(
        name,
        iso,
        latNum,
        lonNum,
      );
      return { name, altitude, azimuth, riseTime, setTime };
    });

    // 7) Moon phase
    const moonPhaseAngle = astro.computeMoonPhase(iso);

    const result = { objects, moonPhaseAngle };

    // 8) Cache with jittered TTL (1h ± up to 5m)
    const baseTTL = 3600;
    const ttl = baseTTL + Math.floor(Math.random() * 300);
    try {
      await cache.set(cacheKey, JSON.stringify(result), ttl);
    } catch (err) {
      console.error('[Cache Error] set:', err);
    }

    return res.json(result);
  } catch (err) {
    console.error('[Celestial Error]', err);
    return res.status(500).json({ error: 'Failed to compute celestial data.' });
  }
});

export default router;
