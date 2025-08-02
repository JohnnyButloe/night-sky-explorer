import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

// Determine whether to use Redis or fall back to an in-memory cache.
// In test environments or when no REDIS_URL is provided, use a local LRU cache
// to avoid connection errors.
const useRedis = process.env.REDIS_URL && process.env.NODE_ENV !== 'test';

let redisClient;
let memoryCache;

if (useRedis) {
  redisClient = new Redis(process.env.REDIS_URL);
} else {
  memoryCache = new LRUCache({ max: 500 });
}
export default {
  /**
   * Retrieve a value from the cache by key.
   * Keys should be namespaced (e.g., 'celestial:lat:lon:time:zone').
   */
  async get(key) {
    if (useRedis) {
      return await redisClient.get(key);
    }
    return memoryCache.get(key) ?? null;
  },

  /**
   * Store a value in the cache with TTL and ±10% jitter to prevent cache
   * stampedes.
   * @param {string} key - Namespaced cache key.
   * @param {string} value - JSON-stringified payload.
   * @param {number} ttlSeconds - Base TTL in seconds (default 3600s = 1h).
   */
  async set(key, value, ttlSeconds = 3600) {
    // Calculate ±10% jitter
    const jitter = Math.round(ttlSeconds * 0.1 * (Math.random() * 2 - 1));
    const effectiveTTL = ttlSeconds + jitter;
    if (useRedis) {
      await redisClient.set(key, value, 'EX', effectiveTTL);
    } else {
      memoryCache.set(key, value, { ttl: effectiveTTL * 1000 });
    }
  },

  /**
   * Clear all cached values. Used only in tests.
   */
  async flushall() {
    if (useRedis) {
      await redisClient.flushall();
    } else {
      memoryCache.clear();
    }
  },
};
