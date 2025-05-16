import LRU from 'lru-cache';
export const localCache = new LRU({ max: 500, ttl: 60 * 60 * 1000 }); // 1h

// usage inside a route
export function handleRequest(req, res, lat, lon, data) {
  const key = `lp:${lat}:${lon}`;
  if (localCache.has(key)) {
    return res.json(localCache.get(key));
  }
  // otherwise fetch external service...
  localCache.set(key, data);
}
