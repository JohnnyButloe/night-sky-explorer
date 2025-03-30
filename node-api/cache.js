// node-api/cache.js
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = new Redis(redisUrl);

export default {
  async get(key) {
    return await redisClient.get(key);
  },

  async set(key, value, ttlSeconds = 3600) {
    await redisClient.set(key, value, 'EX', ttlSeconds);
  },
};
