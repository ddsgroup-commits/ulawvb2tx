/**
 * In-memory token-bucket rate limiter.
 *
 * Suitable for a single-instance VPS deployment. If we move to multi-replica
 * or serverless, swap this for Upstash/Redis with the same interface.
 *
 * Usage:
 *   const limit = rateLimit({ windowMs: 60_000, max: 30 });
 *   const result = await limit.check(`login:${ip}`);
 *   if (!result.ok) return err("Too many requests", 429);
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so long-lived processes don't leak. Node only — guarded
// so this file is safe to import from edge runtime contexts (no-op there).
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000).unref?.();
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(opts: RateLimitOptions) {
  return {
    check(key: string) {
      const now = Date.now();
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { ok: true, remaining: opts.max - 1, resetAt: now + opts.windowMs };
      }
      if (bucket.count >= opts.max) {
        return { ok: false, remaining: 0, resetAt: bucket.resetAt };
      }
      bucket.count += 1;
      return { ok: true, remaining: opts.max - bucket.count, resetAt: bucket.resetAt };
    },
  };
}

/** Extract IP from a NextRequest in a Vercel/standard-proxy-aware way. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Pre-baked limiters for common endpoints.
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
export const aiChatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
export const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
