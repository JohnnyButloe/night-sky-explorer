import express from 'express';
import fetch from 'node-fetch';
import cache from '../cache.js';
import { mockCelestialData } from '../mockData.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: 'Missing lat/lon query parameters.' });
    }

    // Build a unique cache key
    const cacheKey = `celestial:${lat}:${lon}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving celestial data from cache');
      return res.json(JSON.parse(cachedData));
    }

    // Use mock data if enabled
    if (process.env.USE_MOCKS === 'true') {
      console.log('Serving mock celestial data');
      await cache.set(cacheKey, JSON.stringify(mockCelestialData), 3600); // cache for 1 hour
      return res.json(mockCelestialData);
    } else {
      console.log('Calling Python microservice for real data');
      const pythonUrl = `http://localhost:8000/calculate?lat=${lat}&lon=${lon}&time=${new Date().toISOString()}`;
      const response = await fetch(pythonUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch celestial data from Python service.');
      }
      const realData = await response.json();
      await cache.set(cacheKey, JSON.stringify(realData), 3600);
      return res.json(realData);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
