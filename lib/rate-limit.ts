/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance deployments. Migrate to Redis for multi-instance.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  store.forEach((record, key) => {
    // Remove entries older than 1 hour
    record.timestamps = record.timestamps.filter((t) => now - t < 3600_000);
    if (record.timestamps.length === 0) store.delete(key);
  });
}, 300_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfter?: number; // seconds
}

/**
 * Check rate limit for a given key.
 * @param key     Unique identifier (e.g. "ip:1.2.3.4" or "user:MBR001")
 * @param limit   Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!store.has(key)) {
    store.set(key, { timestamps: [] });
  }

  const record = store.get(key)!;
  // Slide window: remove timestamps older than window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  const count = record.timestamps.length;
  const allowed = count < limit;

  if (allowed) {
    record.timestamps.push(now);
  }

  const oldest = record.timestamps[0] || now;
  const resetAt = oldest + windowMs;
  const remaining = Math.max(0, limit - record.timestamps.length);

  return {
    allowed,
    remaining,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
  };
}

// Preset helpers
export const apiRateLimit = (ip: string) =>
  checkRateLimit(`api:${ip}`, 100, 60_000); // 100 req/min per IP

export const userRateLimit = (memberId: string) =>
  checkRateLimit(`user:${memberId}`, 50, 60_000); // 50 req/min per user

export const loginRateLimit = (ip: string) =>
  checkRateLimit(`login:${ip}`, 5, 900_000); // 5 login attempts per 15 min per IP

export const heavyApiRateLimit = (ip: string) =>
  checkRateLimit(`heavy:${ip}`, 10, 60_000); // 10 req/min for expensive endpoints
