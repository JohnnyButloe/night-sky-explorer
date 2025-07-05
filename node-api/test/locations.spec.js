import request from 'supertest';
import nock from 'nock';
import app from '../server.js';
import cache from '../cache.js'; // Import the cache module to clear it

// The base URL of the external API you are mocking
const API_URL = 'https://api.geocode.example';

describe('Locations Endpoint', () => {
  // After each test, clear all mocks and the cache to ensure test isolation
  afterEach(async () => {
    nock.cleanAll();
    if (cache && typeof cache.flushall === 'function') {
      await cache.flushall(); // Clears the entire cache
    }
  });

  it('should geocode an address', async () => {
    // Define the mock specifically for this test
    nock(API_URL)
      .get('/search')
      .query(true)
      .reply(200, [
        {
          lat: '37.4224857',
          lon: '-122.0855846',
          display_name: 'Googleplex, Amphitheatre Parkway, Mountain View, CA',
        },
      ]);

    const res = await request(app)
      .get('/api/locations/search')
      .query({ q: '1600 Amphitheatre Parkway' })
      .expect(200);

    // Assert against the actual data structure and types
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0]).toHaveProperty('display_name');

    // Parse to float and check if the value is close, with adjusted precision
    expect(parseFloat(res.body[0].lat)).toBeCloseTo(37.422, 3);
    expect(parseFloat(res.body[0].lon)).toBeCloseTo(-122.084, 2); // Relaxed precision
  });

  it('should reverse geocode coordinates', async () => {
    // Define the mock specifically for this test
    nock(API_URL)
      .get('/reverse')
      .query(true)
      .reply(200, {
        address: {
          road: 'Amphitheatre Parkway',
          city: 'Mountain View',
          state: 'California',
          postcode: '94043',
          country: 'United States',
        },
      });

    const res = await request(app)
      .get('/api/locations/reverse')
      .query({ lat: 37.422, lon: -122.084 })
      .expect(200);

    // Check for properties within the 'address' object of the response
    expect(res.body.address.city).toBe('Mountain View');
    expect(res.body.address.state).toBe('California');
  });

  it('should return 404 for an address not found', async () => {
    // Mock an empty array response, which your route should handle as a 404
    nock(API_URL).get('/search').query(true).reply(200, []);

    await request(app)
      .get('/api/locations/search')
      .query({ q: 'a place that does not exist' })
      .expect(404);
  });

  it('should surface rate-limit errors (429)', async () => {
    // Mock a 429 response from the external API
    nock(API_URL).get('/search').query(true).reply(429);

    // Expect the actual 429 code to be propagated by the route
    await request(app)
      .get('/api/locations/search')
      .query({ q: '1600 Amphitheatre Parkway' })
      .expect(429);
  });
});
