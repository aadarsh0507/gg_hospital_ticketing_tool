/**
 * Simple in-memory cache for frequently accessed data
 * TTL (Time To Live) based expiration
 */

const cache = new Map();

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if expired/not found
 */
export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // Check if expired
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Set cache value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 60)
 */
export function setCache(key, value, ttlSeconds = 60) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Clear cache entry
 * @param {string} key - Cache key (supports prefix matching with wildcard)
 */
export function clearCache(key) {
  if (key.endsWith('_')) {
    // Prefix match - clear all keys starting with this prefix
    for (const cacheKey of cache.keys()) {
      if (cacheKey.startsWith(key)) {
        cache.delete(cacheKey);
      }
    }
  } else {
    // Exact match
    cache.delete(key);
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Clean expired entries (should be called periodically)
 */
export function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}

// Clean expired cache every 5 minutes
setInterval(cleanExpiredCache, 5 * 60 * 1000);

