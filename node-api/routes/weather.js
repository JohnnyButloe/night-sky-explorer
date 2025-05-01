import express from 'express';
import fetch from 'node-fetch';
import cache from '../cache.js';
import { mockWeatherData } from '../mockData.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: 'Missing lat/lon query parameters.' });
    }

    const cacheKey = `weather:${lat}:${lon}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving weather data from cache');
      return res.json(JSON.parse(cachedData));
    }

    if (process.env.USE_MOCKS === 'true') {
      console.log('Serving mock weather data');
      await cache.set(cacheKey, JSON.stringify(mockWeatherData), 1800); // cache for 30 minutes
      return res.json(mockWeatherData);
    } else {
      console.log('Fetching real weather data');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloudcover,visibility&current_weather=true`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const realWeather = await response.json();
      await cache.set(cacheKey, JSON.stringify(realWeather), 1800);
      return res.json(realWeather);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
