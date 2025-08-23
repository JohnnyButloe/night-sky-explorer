// routes/locations.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import cache from '../cache.js';
import {
  geocodeAddress,
  geocodeStructured,
  reverseGeocode,
} from '../utils/nominatimClient.js';

export const router = express.Router();

/* ----------------------------- Helpers & filters ---------------------------- */

// Broadened to avoid false negatives for large admin cities/prefectures.
const CITY_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'locality',
  'county',
  'municipality',
  'administrative',
  'borough',
  'state_district',
  'district',
  'province',
  'prefecture',
]);

const sanitize = (r) => ({
  name: r?.display_name || r?.name || '',
  lat: r?.lat != null ? parseFloat(r.lat) : undefined,
  lon: r?.lon != null ? parseFloat(r.lon) : undefined,
  class: r?.class,
  type: r?.type || r?.addresstype,
});

/* -------------------------------- Rate limit --------------------------------
   60 req/min per IP for geocoding endpoints
----------------------------------------------------------------------------- */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ---------------------------------- Routes --------------------------------- */

// GET /api/locations/search?q=tokyo&limit=5&citiesOnly=true&minimal=true
router.get('/search', limiter, async (req, res) => {
  const { q } = req.query;
  const limitParam = Number(req.query.limit ?? 5);
  const limitNum = Number.isFinite(limitParam)
    ? Math.min(10, Math.max(1, limitParam))
    : 5;
  const citiesOnly = String(req.query.citiesOnly ?? 'false') === 'true';
  const minimal = String(req.query.minimal ?? 'false') === 'true';

  // Optional hard country filter (CSV of ISO 3166-1 alpha-2), e.g. "us,ca,jp"
  const countrycodes = process.env.GEOCODE_COUNTRYCODES || undefined;

  if (!q) {
    return res
      .status(400)
      .json({ error: 'Missing search query parameter "q"' });
  }

  const qStr = String(q);
  const cacheKey = `locations:search:${qStr}:${limitNum}:${citiesOnly}:${minimal}:${countrycodes || '-'}`;

  try {
    /* 1) Cache */
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    /* 2) Mock mode */
    if (process.env.USE_MOCKS === 'true') {
      const { mockLocationData } = await import('../mockData.js');
      let results = mockLocationData
        .filter((loc) =>
          (loc.display_name || '').toLowerCase().includes(qStr.toLowerCase()),
        )
        .slice(0, limitNum);

      if (citiesOnly) {
        results = results.filter((r) =>
          CITY_TYPES.has(r.type ?? r.addresstype),
        );
        // Friendlier: no 404s for “no suggestions”
        if (results.length === 0) {
          await cache.set(cacheKey, JSON.stringify([]), 86400);
          return res.json([]);
        }
      }

      const payload = minimal ? results.map(sanitize) : results;
      await cache.set(cacheKey, JSON.stringify(payload), 86400); // 1 day TTL
      return res.json(payload);
    }

    /* 3) Real API */

    // Heuristic: treat short alphanumeric strings with at least one digit as potential postal codes
    const isPostal =
      /^[A-Za-z0-9][A-Za-z0-9 \-]{1,9}$/.test(qStr) && /\d/.test(qStr);

    let data = [];

    if (citiesOnly) {
      if (isPostal) {
        // Structured postal-code search: city-level first, then any settlement
        data = await geocodeStructured({ postalcode: qStr }, limitNum, {
          featureType: 'city',
          countrycodes,
        });
        if (!data || data.length === 0) {
          data = await geocodeStructured({ postalcode: qStr }, limitNum, {
            featureType: 'settlement',
            countrycodes,
          });
        }
        // Fallback to free-form if structured yields nothing
        if (!data || data.length === 0) {
          data = await geocodeAddress(qStr, limitNum, {
            featureType: 'city',
            countrycodes,
          });
          if (!data || data.length === 0) {
            data = await geocodeAddress(qStr, limitNum, {
              featureType: 'settlement',
              countrycodes,
            });
          }
        }
      } else {
        // Free-form, restricted to address layer: city first, then settlement
        data = await geocodeAddress(qStr, limitNum, {
          featureType: 'city',
          countrycodes,
        });
        if (!data || data.length === 0) {
          data = await geocodeAddress(qStr, limitNum, {
            featureType: 'settlement',
            countrycodes,
          });
        }
      }
    } else {
      // Not city-restricted: free-form without address-layer constraint
      data = await geocodeAddress(qStr, limitNum, { countrycodes });
    }

    // If nothing matched, treat as "no suggestions" (200 + [])
    if (!data || data.length === 0) {
      await cache.set(cacheKey, JSON.stringify([]), 86400);
      return res.json([]);
    }

    // Optional secondary filter to de-noise admin variants
    if (citiesOnly) {
      data = data.filter((r) => CITY_TYPES.has(r.type ?? r.addresstype));
      if (data.length === 0) {
        await cache.set(cacheKey, JSON.stringify([]), 86400);
        return res.json([]);
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

// GET /api/locations/reverse?lat=35.68&lon=139.69&minimal=true
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
