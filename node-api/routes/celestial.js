import express from 'express';
import fetch from 'node-fetch';
import cache from '../cache.js';
import { mockCelestialData } from '../mockData.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { lat, lon, time } = req.query;
  try {
    const pythonUrl = `${process.env.PYTHON_MS_URL}/calculate?lat=${lat}&lon=${lon}&time=${encodeURIComponent(time)}`;
    const resp = await fetch(pythonUrl, { timeout: 5000 });
    if (!resp.ok) throw new Error(`Python service error: ${resp.status}`);
    const data = await resp.json();
    return res.json(data);
  } catch (err) {
    console.error('[Celestial Proxy]', err);
    res.status(502).json({ error: 'Failed to fetch celestial data.' });
  }
});

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
