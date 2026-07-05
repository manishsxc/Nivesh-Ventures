/**
 * Simple in-memory TTL cache with LRU-like eviction.
 * Use for admin stats, commission config, frequently-read data.
 * Not suitable for distributed deployments — use Redis in that case.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const MAX_SIZE = 500;

// Periodic cleanup every 2 minutes
setInterval(() => {
  const now = Date.now();
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) cache.delete(key);
  });
}, 120_000);

function evictIfNeeded() {
  if (cache.size >= MAX_SIZE) {
    const now = Date.now();
    // Use Array.from to copy keys to avoid iteration issue without downlevelIteration
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      const entry = cache.get(key);
      if (entry && entry.expiresAt <= now) {
        cache.delete(key);
        if (cache.size < MAX_SIZE) break;
      }
    }
    if (cache.size >= MAX_SIZE) {
      const firstKey = keys[0];
      if (firstKey) cache.delete(firstKey);
    }
  }
}

export const appCache = {
  get<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }
    return entry.value as T;
  },

  set<T>(key: string, value: T, ttlMs: number = 60_000): void {
    evictIfNeeded();
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  },

  del(key: string): void {
    cache.delete(key);
  },

  flush(prefix?: string): void {
    if (!prefix) {
      cache.clear();
      return;
    }
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  },

  has(key: string): boolean {
    const entry = cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return false;
    }
    return true;
  },

  size(): number {
    return cache.size;
  },
};

// Common TTLs
export const TTL = {
  SHORT: 30_000,    // 30 seconds
  MEDIUM: 300_000,  // 5 minutes
  LONG: 1_800_000,  // 30 minutes
  HOUR: 3_600_000,  // 1 hour
};
