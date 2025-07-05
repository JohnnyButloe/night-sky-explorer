import express from 'express';
import rateLimit from 'express-rate-limit';
import cache from '../cache.js'; // <-- Import your cache module!
import { geocodeAddress, reverseGeocode } from '../utils/nominatimClient.js';

export const router = express.Router();

// --- Rate Limiter ---
// Limit: 60 requests per minute per IP for geocoding endpoints
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- ROUTES ---

// Matches: /locations/search?q=...&limit=5
router.get('/search', limiter, async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ error: 'Missing search query parameter "q"' });
  }

  const cacheKey = `locations:search:${q}:${limit}`;
  try {
    // 1. Try Redis cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2. Mock Mode
    if (process.env.USE_MOCKS === 'true') {
      const { mockLocationData } = await import('../mockData.js');
      const results = mockLocationData.filter((loc) =>
        loc.display_name.toLowerCase().includes(q.toLowerCase()),
      );
      await cache.set(cacheKey, JSON.stringify(results.slice(0, limit)), 86400); // 1 day TTL
      return res.json(results.slice(0, limit));
    }

    // 3. Real API
    const data = await geocodeAddress(q, limit);

    // -- IMPROVEMENT: Handle no results from the API --
    // If the external service returns an empty array, treat it as "Not Found".
    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ error: 'No locations found for the given query.' });
    }

    await cache.set(cacheKey, JSON.stringify(data), 86400); // 1 day TTL
    return res.json(data);
  } catch (err) {
    console.error('[Geocoding Search Error]', err);

    // -- IMPROVEMENT: Propagate status codes from the external API --
    // If the error from the client (e.g., axios) includes a response status, use it.
    // Otherwise, default to a 500 Internal Server Error.
    const statusCode = err.response?.status || 500;
    const message = err.response?.data?.error || err.message;

    return res
      .status(statusCode)
      .json({ error: `Geocoding search failed: ${message}` });
  }
});

// Matches: /locations/reverse?lat=...&lon=...
router.get('/reverse', limiter, async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: 'Missing latitude or longitude parameters' });
  }

  const cacheKey = `locations:reverse:${lat}:${lon}`;
  try {
    // 1. Try Redis cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 2. Mock Mode
    if (process.env.USE_MOCKS === 'true') {
      const { mockLocationData } = await import('../mockData.js');
      const mockResult = {
        display_name: 'Mock City, Mock State, Mock Country',
        lat,
        lon,
      };
      await cache.set(cacheKey, JSON.stringify(mockResult), 86400);
      return res.json(mockResult);
    }

    // 3. Real API
    const data = await reverseGeocode(lat, lon);
    await cache.set(cacheKey, JSON.stringify(data), 86400);
    return res.json(data);
  } catch (err) {
    console.error('[Reverse Geocoding Error]', err);

    // -- IMPROVEMENT: Propagate status codes from the external API --
    const statusCode = err.response?.status || 500;
    const message = err.response?.data?.error || err.message;

    return res
      .status(statusCode)
      .json({ error: `Reverse geocoding failed: ${message}` });
  }
});

export default router;
