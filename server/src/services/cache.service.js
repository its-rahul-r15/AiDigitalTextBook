// ─── cache.service.js ────────────────────────────────────────────────────────
// Redis cache helpers used by cacheControl middleware and controllers.
// Pattern: cache-aside (read first, write to DB on miss, then update cache)
//
// Usage in a controller:
//   const cached = await cache.get(`course:${id}`);
//   if (cached) return res.json(cached);
//   const data = await Course.findById(id);
//   await cache.set(`course:${id}`, data, 60); // cache for 60 seconds
//   return res.json(data);

import { redis as redisClient } from "../config/redis.js";
import logger from "../utils/logger.util.js";

const DEFAULT_TTL = parseInt(process.env.REDIS_CACHE_TTL, 10) || 60; // seconds

/**
 * Get a value from Redis cache.
 * Returns null if key does not exist or Redis is unavailable.
 */
export async function get(key) {
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        // If Redis is down, fail silently — the controller will fetch from MongoDB instead
        logger.warn("Redis GET failed", { key, error: err.message });
        return null;
    }
}

/**
 * Store a value in Redis with an optional TTL (in seconds).
 */
export async function set(key, value, ttl = DEFAULT_TTL) {
    try {
        await redisClient.set(key, JSON.stringify(value), "EX", ttl);
    } catch (err) {
        logger.warn("Redis SET failed", { key, error: err.message });
    }
}

/**
 * Delete a specific cache key (call this when the underlying data changes).
 */
export async function invalidate(key) {
    try {
        await redisClient.del(key);
    } catch (err) {
        logger.warn("Redis DEL failed", { key, error: err.message });
    }
}

/**
 * Delete all keys matching a pattern (e.g. "course:*" to flush all course caches).
 * Use carefully — can be slow on a large Redis instance.
 */
export async function invalidatePattern(pattern) {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (err) {
        logger.warn("Redis pattern DEL failed", { pattern, error: err.message });
    }
}
