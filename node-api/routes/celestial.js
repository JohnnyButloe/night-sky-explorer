import express from 'express';
import rateLimit from 'express-rate-limit';
import cache from '../cache.js';
import { geocodeAddress, reverseGeocode } from '../utils/nominatimClient.js';

export const router = express.Router();

/**
 * Optional API key middleware (mirrors celestial.js style).
 * Disabled by default to keep current behavior unchanged.
 */
const apiKeyMiddleware = (req, res, next) => {
  if (process.env.USE_MOCKS === 'true' || process.env.NODE_ENV === 'test') {
    return next();
  }
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.API_KEY || process.env.WEATHER_API_KEY;
  if (!validApiKey || !apiKey || apiKey !== validApiKey) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
};
// router.use(apiKeyMiddleware);

// --- Helpers & filters ---
const CITY_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'locality',
  'county',
]);

const sanitize = (r) => ({
  name: r?.display_name || r?.name || '',
  lat: r?.lat != null ? parseFloat(r.lat) : undefined,
  lon: r?.lon != null ? parseFloat(r.lon) : undefined,
  class: r?.class,
  type: r?.type || r?.addresstype,
});

// --- Rate Limiter ---
// 60 req/min per IP for geocoding endpoints
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- ROUTES ---

/**
 * GET /api/locations/search?q=tokyo&limit=5&citiesOnly=true&minimal=true
 * Returns an array of Nominatim search results (optionally filtered/sanitized).
 */
router.get('/search', limiter, async (req, res) => {
  const { q } = req.query;
  const limitParam = Number(req.query.limit ?? 5);
  const limitNum = Number.isFinite(limitParam)
    ? Math.min(10, Math.max(1, limitParam))
    : 5;
  const citiesOnly = String(req.query.citiesOnly ?? 'false') === 'true';
  const minimal = String(req.query.minimal ?? 'false') === 'true';

  if (!q) {
    return res
      .status(400)
      .json({ error: 'Missing search query parameter "q"' });
  }

  const cacheKey = `locations:search:${q}:${limitNum}:${citiesOnly}:${minimal}`;

  try {
    // 1) Cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2) Mock mode
    if (process.env.USE_MOCKS === 'true') {
      const { mockLocationData } = await import('../mockData.js');
      let results = mockLocationData
        .filter((loc) =>
          (loc.display_name || '').toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, limitNum);

      if (citiesOnly) {
        results = results.filter((r) =>
          CITY_TYPES.has(r.type ?? r.addresstype),
        );
        if (results.length === 0) {
          return res.status(404).json({
            error: 'No city-like locations found for the given query.',
          });
        }
      }

      const payload = minimal ? results.map(sanitize) : results;
      await cache.set(cacheKey, JSON.stringify(payload), 86400); // 1 day TTL
      return res.json(payload);
    }

    // 3) Real API
    let data = await geocodeAddress(q, limitNum);

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ error: 'No locations found for the given query.' });
    }

    if (citiesOnly) {
      data = data.filter((r) => CITY_TYPES.has(r.type ?? r.addresstype));
      if (data.length === 0) {
        return res
          .status(404)
          .json({ error: 'No city-like locations found for the given query.' });
      }
    }

    const payload = minimal ? data.map(sanitize) : data;
    await cache.set(cacheKey, JSON.stringify(payload), 86400); // 1 day TTL
    return res.json(payload);
  } catch (err) {
    console.error('[Geocoding Search Error]', err);
    const statusCode = err.response?.status || 500;
    const message = err.response?.data?.error || err.message || 'Unknown error';
    return res
      .status(statusCode)
      .json({ error: `Geocoding search failed: ${message}` });
  }
});

/**
 * GET /api/locations/reverse?lat=35.68&lon=139.69&minimal=true
 * Reverse geocodes a coordinate to a place.
 */
router.get('/reverse', limiter, async (req, res) => {
  const { lat, lon } = req.query;
  const minimal = String(req.query.minimal ?? 'false') === 'true';

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

  const cacheKey = `locations:reverse:${latNum}:${lonNum}:${minimal}`;

  try {
    // 1) Cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2) Mock mode
    if (process.env.USE_MOCKS === 'true') {
      const mockResult = {
        display_name: 'Mock City, Mock State, Mock Country',
        lat: latNum,
        lon: lonNum,
      };
      const payload = minimal ? sanitize(mockResult) : mockResult;
      await cache.set(cacheKey, JSON.stringify(payload), 86400);
      return res.json(payload);
    }

    // 3) Real API
    const data = await reverseGeocode(latNum, lonNum);
    const payload = minimal
      ? sanitize({ ...data, lat: latNum, lon: lonNum })
      : data;
    await cache.set(cacheKey, JSON.stringify(payload), 86400);
    return res.json(payload);
  } catch (err) {
    console.error('[Reverse Geocoding Error]', err);
    const statusCode = err.response?.status || 500;
    const message = err.response?.data?.error || err.message || 'Unknown error';
    return res
      .status(statusCode)
      .json({ error: `Reverse geocoding failed: ${message}` });
  }
});

export default router;
