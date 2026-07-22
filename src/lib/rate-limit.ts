import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase-admin';

const DEFAULT_WINDOW_MS = 60_000;

export interface RateLimitOptions {
  endpoint: string;
  windowMs?: number;
  maxRequests: number;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
}

const developmentHits = new Map<string, number[]>();

function checkDevelopmentFallback(
  key: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const bucketKey = `${endpoint}:${key}`;
  const now = Date.now();
  const windowHits = (developmentHits.get(bucketKey) || []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (windowHits.length >= maxRequests) {
    developmentHits.set(bucketKey, windowHits);
    return { limited: true, remaining: 0 };
  }

  windowHits.push(now);
  developmentHits.set(bucketKey, windowHits);
  return { limited: false, remaining: maxRequests - windowHits.length };
}

export function createRateLimiter(options: RateLimitOptions) {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;

  return async function check(clientKey: string): Promise<RateLimitResult> {
    const rateKey = crypto
      .createHash('sha256')
      .update(clientKey)
      .digest('hex');

    try {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc('check_rate_limit', {
        p_rate_key: rateKey,
        p_endpoint: options.endpoint,
        p_limit: options.maxRequests,
        p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
      });

      if (error) throw error;
      return {
        limited: data === true,
        remaining: data === true ? 0 : Math.max(0, options.maxRequests - 1),
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[rate-limit] Distributed limiter unavailable:', error);
        throw new Error('RATE_LIMIT_UNAVAILABLE');
      }
      return checkDevelopmentFallback(
        rateKey,
        options.endpoint,
        options.maxRequests,
        windowMs,
      );
    }
  };
}

export function getClientIp(req: {
  headers: { get: (name: string) => string | null };
}): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}