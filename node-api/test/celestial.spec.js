import request from 'supertest';
import app from '../server.js'; // Express app exported from server.js

describe('Celestial Endpoint', () => {
  it('should return 200 and a list of objects for valid params', async () => {
    const res = await request(app)
      .get('/api/celestial')
      .query({ lat: 36.85, lon: 75.97, time: '2025-05-10T18:00:00Z' })
      .expect(200);

    expect(Array.isArray(res.body.objects)).toBe(true);
    expect(res.body.objects[0]).toHaveProperty('name');
    expect(res.body.objects[0]).toHaveProperty('altitude');
  });

  it('should return 400 for missing parameters', async () => {
    await request(app).get('/api/celestial').expect(400);
  });

  it('should cache identical requests (optional check)', async () => {
    const first = await request(app)
      .get('/api/celestial')
      .query({ lat: 36.85, lon: 75.97, time: '2025-05-10T18:00:00Z' });
    const second = await request(app)
      .get('/api/celestial')
      .query({ lat: 36.85, lon: 75.97, time: '2025-05-10T18:00:00Z' });
    expect(second.body).toEqual(first.body);
  });
});
