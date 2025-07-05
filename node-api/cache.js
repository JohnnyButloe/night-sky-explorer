import Redis from 'ioredis';

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = new Redis(redisUrl);

export default {
  /**
   * Retrieve a value from Redis by key.
   * Keys should be namespaced (e.g., 'celestial:lat:lon:time:zone').
   */
  async get(key) {
    return await redisClient.get(key);
  },

  /**
   * Store a value in Redis with TTL and ±10% jitter to prevent cache stampedes.
   * @param {string} key - Namespaced cache key.
   * @param {string} value - JSON-stringified payload.
   * @param {number} ttlSeconds - Base TTL in seconds (default 3600s = 1h).
   */
  async set(key, value, ttlSeconds = 3600) {
    // Calculate ±10% jitter
    const jitter = Math.round(ttlSeconds * 0.1 * (Math.random() * 2 - 1));
    const effectiveTTL = ttlSeconds + jitter;
    await redisClient.set(key, value, 'EX', effectiveTTL);
  },
};
