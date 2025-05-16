import express from 'express';
import fetch from 'node-fetch';
import cache from '../cache.js';
import { mockWeatherData } from '../mockData.js';

const router = express.Router();

/**
 * GET /api/weather
 * Query params: lat (degrees), lon (degrees)
 * Returns hourly cloud cover, visibility, and current weather.
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    // Validate inputs
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: 'Missing required query parameters: lat, lon' });
    }

    // Build namespaced cache key for weather data
    const cacheKey = ['weather', lat, lon].join(':');

    // Try Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`[cache HIT] ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }
    console.log(`[cache MISS] ${cacheKey}`);

    let data;
    // Serve mock data if enabled
    if (process.env.USE_MOCKS === 'true') {
      console.log('Serving mock weather data');
      data = mockWeatherData;
    } else {
      console.log('Fetching real weather data');
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&hourly=cloudcover,visibility&current_weather=true`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.statusText}`);
      }
      data = await response.json();
    }

    // Cache and return
    await cache.set(cacheKey, JSON.stringify(data), 1800); // TTL: 30 minutes
    return res.json(data);
  } catch (err) {
    console.error('[Weather Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
