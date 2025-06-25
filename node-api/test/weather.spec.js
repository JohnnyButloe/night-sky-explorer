import request from 'supertest';
import nock from 'nock';
import app from '../server.js';

describe('Weather Endpoint', () => {
  const base = 'https://api.weather.example';
  const originalUseMocks = process.env.USE_MOCKS; // Save initial value

  beforeAll(() => {
    nock(base)
      .get('/current')
      .query(true)
      .reply(200, { temperature: 20, humidity: 50 });

    nock(base)
      .get('/forecast')
      .query({ days: 7 })
      .reply(200, { forecast: Array(7).fill({ temp: 20 }) });
  });

  afterAll(() => {
    // Restore original USE_MOCKS value
    process.env.USE_MOCKS = originalUseMocks;
    nock.cleanAll();
  });

  it('returns current conditions within realistic ranges', async () => {
    process.env.USE_MOCKS = 'true';
    const res = await request(app)
      .get('/api/weather')
      .query({ lat: 36.85, lon: 75.97 })
      .expect(200);

    expect(res.body.temperature).toBeGreaterThanOrEqual(-50);
    expect(res.body.temperature).toBeLessThanOrEqual(60);
    expect(res.body.humidity).toBeGreaterThanOrEqual(0);
    expect(res.body.humidity).toBeLessThanOrEqual(100);
  });

  it('returns a 7-day forecast array of length 7', async () => {
    process.env.USE_MOCKS = 'true';
    const res = await request(app)
      .get('/api/weather')
      .query({ lat: 36.85, lon: 75.97, days: 7 })
      .expect(200);

    expect(Array.isArray(res.body.forecast)).toBe(true);
    expect(res.body.forecast).toHaveLength(7);
  });

  it('returns 401/403 when API key is missing or invalid', async () => {
    process.env.USE_MOCKS = 'false'; // Force real logic for this test!
    delete process.env.WEATHER_API_KEY;
    delete process.env.API_KEY;
    await request(app)
      .get('/api/weather')
      .query({ lat: 0, lon: 0 })
      .expect((res) => {
        if (![401, 403].includes(res.status)) {
          throw new Error('Expected 401 or 403 for missing API key');
        }
      });
    process.env.USE_MOCKS = 'true'; // Restore mocks for next tests (optional since afterAll resets)
  });

  it('returns 400 for malformed coordinates', async () => {
    process.env.USE_MOCKS = 'true';
    await request(app)
      .get('/api/weather')
      .query({ lat: 'abc', lon: 'xyz' })
      .expect(400);
  });
});
