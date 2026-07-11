/**
 * Simple in-memory rate limiter (per serverless instance).
 *
 * NOTE: On serverless platforms (Vercel) each instance keeps its own Map,
 * so this is a best-effort protection against abuse, not a hard guarantee.
 * For strict limits, back this with Upstash Redis / Vercel KV.
 */

const DEFAULT_WINDOW_MS = 60_000;

export interface RateLimitOptions {
  /** Time window in milliseconds. */
  windowMs?: number;
  /** Max requests allowed within the window. */
  maxRequests: number;
}

export interface RateLimitResult {
  limited: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
}

/**
 * Returns a keyed rate-limit checker. Each call creates an isolated bucket
 * so different endpoints can have independent limits.
 */
export function createRateLimiter(opts: RateLimitOptions) {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const max = opts.maxRequests;
  const hits = new Map<string, number[]>();

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const windowHits = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (windowHits.length >= max) {
      hits.set(key, windowHits);
      return { limited: true, remaining: 0 };
    }

    windowHits.push(now);
    hits.set(key, windowHits);
    return { limited: false, remaining: Math.max(0, max - windowHits.length) };
  };
}

/** Extract a best-effort client identifier from a NextRequest. */
export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}
