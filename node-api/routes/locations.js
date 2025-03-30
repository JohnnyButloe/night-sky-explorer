import express from 'express';
import fetch from 'node-fetch';
import { mockLocationData } from '../mockData.js';
import cache from '../cache.js'; // When cache is being used

const router = express.Router();

// GET /api/locations/search?q=...
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter "q".' });
    }

    // If using mock mode
    if (process.env.USE_MOCKS === 'true') {
      const filtered = mockLocationData.filter((loc) =>
        loc.display_name.toLowerCase().includes(q.toLowerCase()),
      );
      return res.json(filtered);
    }

    // Otherwise call real location API (Nominatim)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

    if (process.env.USE_MOCKS === 'true') {
      return res.json({
        display_name: 'Mock City, Mock State, Mock Country',
        lat,
        lon,
      });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch reverse geocode data');
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
