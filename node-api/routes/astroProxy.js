import express from 'express';
import fetch from 'node-fetch';

export const router = express.Router();

/**
 * Proxy to Astronomy API using server-only secret.
 * GET /api/astro/positions?target=Mars&iso=2025-08-16T00:00:00Z
 */
router.get('/positions', async (req, res) => {
  try {
    const secret = process.env.ASTRONOMY_API_SECRET; // server-only
    if (!secret)
      return res.status(500).json({ error: 'Server secret missing' });

    const target = String(req.query.target || 'Sun');
    const iso = String(req.query.iso || new Date().toISOString());

    // Example: call provider using secret (adapt to your provider’s auth)
    const out = await fetch(
      `https://api.astronomyapi.com/api/v2/positions?target=${encodeURIComponent(target)}&iso=${encodeURIComponent(iso)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          Accept: 'application/json',
        },
      },
    );

    if (!out.ok)
      return res
        .status(out.status)
        .json({ error: `Upstream error ${out.status}` });
    const json = await out.json();
    return res.json(json);
  } catch (err) {
    console.error('[astroProxy]', err);
    return res.status(500).json({ error: 'Proxy failed' });
  }
});

export default router;
