import express from 'express';
import fetch from 'node-fetch';
import cache from '../cache.js';

const router = express.Router();

// --- API Key middleware (still required for local/internal security, but not for Open-Meteo) ---
const apiKeyMiddleware = (req, res, next) => {
  if (process.env.USE_MOCKS === 'true') return next(); // Skip check in mock mode

  // If you want to disable internal API key security altogether, you can comment out below:
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

// --- Main weather endpoint ---
router.get('/', async (req, res) => {
  const { lat, lon, days } = req.query;

  // Parameter validation
  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: 'Missing required query parameters: lat, lon' });
  }
  if (isNaN(Number(lat)) || isNaN(Number(lon))) {
    return res.status(400).json({ error: 'lat/lon must be numbers' });
  }

  // --- Mock mode for test/dev ---
  if (process.env.USE_MOCKS === 'true') {
    if (days && Number(days) === 7) {
      return res.json({ forecast: Array(7).fill({ temp: 20 }) });
    }
    return res.json({ temperature: 20, humidity: 50 });
  }

  // --- Open-Meteo real API integration ---
  try {
    if (days && Number(days) === 7) {
      // 7-day forecast
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&timezone=auto`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Open-Meteo weather API error');
      const data = await response.json();
      // Convert daily arrays to an array of daily summaries:
      const forecast = Array.from({ length: 7 }).map((_, i) => ({
        date: data.daily.time[i],
        temp_max: data.daily.temperature_2m_max[i],
        temp_min: data.daily.temperature_2m_min[i],
        precipitation: data.daily.precipitation_sum[i],
      }));
      return res.json({ forecast });
    } else {
      // Current weather + hourly (unified clean JSON) - backend-campatible
      const apiUrl =
        `https:api.open-meteo.com/v1/forecast` +
        `?latitude=$[lat]` +
        `&longitude=${lon}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,precipitation,weathercode` +
        `&timezone=auto`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Open-Meteo weather API error');
      const data = await response.json();
      if (!data.current_weather)
        throw new Error('No current weather data found');

      // Normalized "current" block
      const current = {
        temperature_2m: data.current_weather.temperature,
        windspeed_10m: data.current_weather.windspeed,
        weathercode: data.current_weather.weathercode,
        time: data.current_weather.time,
      };

      // Hourly arrays (may be null if upstream omits)
      const hourly = data.hourly
        ? {
            time: data.hourly.time,
            temperature_2m: data.hourly.temperature_2m,
            relative_humidity_2m: data.hourly.relative_humidity_2m,
            // Some models return "weathercode" instead of "weathercode"
            weathercode: data.hourly.weathercode || data.hourly.weathercode,
          }
        : null;

      return res.json({
        // Backwards-compat keys (keep exisiting clients working)
        temperature: current.temperature_2m,
        windspeed: current.windspeed_10m,
        weathercode: current.weathercode,
        // new structured payload
        current,
        hourly,
      });
    }
  } catch (err) {
    console.error('[Weather Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
