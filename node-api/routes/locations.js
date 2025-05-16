import express from 'express';
import fetch from 'node-fetch';
import { mockLocationData } from '../mockData.js';
import cache from '../cache.js';

const router = express.Router();

// GET /api/locations/search?q=...&limit=...
router.get('/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter "q".' });
    }
    const lim = limit ? parseInt(limit, 10) : 5;

    // 1) Build namespaced cache key for location search
    const cacheKey = ['locations', 'search', q, lim].join(':');

    // 2) Attempt to retrieve from Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`[cache HIT] ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }
    console.log(`[cache MISS] ${cacheKey}`);

    let data;
    // 3) Serve mock data if enabled
    if (process.env.USE_MOCKS === 'true') {
      data = mockLocationData
        .filter((loc) =>
          loc.display_name.toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, lim);
    } else {
      // 4) Fetch real data from Nominatim
      const url =
        `https://nominatim.openstreetmap.org/search?format=json` +
        `&q=${encodeURIComponent(q)}` +
        `&limit=${lim}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch location data');
      data = await response.json();
    }

    // 5) Cache and return
    await cache.set(cacheKey, JSON.stringify(data), 86400); // TTL: 24h
    return res.json(data);
  } catch (err) {
    console.error('[Locations Search Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/reverse?lat=...&lon=...
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: 'Missing query parameters "lat" and/or "lon".' });
    }

    // 1) Build namespaced cache key for reverse geocoding
    const cacheKey = ['locations', 'reverse', lat, lon].join(':');

    // 2) Attempt to retrieve from Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`[cache HIT] ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }
    console.log(`[cache MISS] ${cacheKey}`);

    let data;
    // 3) Serve mock data if enabled (note: USE_MOCKS logic as originally implemented)
    if (process.env.USE_MOCKS === 'false') {
      data = {
        display_name: 'Mock City, Mock State, Mock Country',
        lat,
        lon,
      };
    } else {
      // 4) Fetch real reverse geocode data
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${lat}` +
        `&lon=${lon}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reverse geocode data');
      data = await response.json();
    }

    // 5) Cache and return
    await cache.set(cacheKey, JSON.stringify(data), 86400); // TTL: 24h
    return res.json(data);
  } catch (err) {
    console.error('[Locations Reverse Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
