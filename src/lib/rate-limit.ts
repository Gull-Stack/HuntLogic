// =============================================================================
// In-Memory Rate Limiter — per-IP sliding window
// =============================================================================

import { NextRequest } from "next/server";
import { config } from "@/lib/config";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

interface RateLimitOptions {
  /** Window duration in milliseconds (default: 60_000 = 60s) */
  interval?: number;
  /** Maximum requests allowed per window (default: 100) */
  maxRequests?: number;
}

/**
 * Create a rate limiter instance with configurable window and max requests.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, maxRequests: 60 });
 *   // In API handler:
 *   const result = limiter.check(request);
 *   if (!result.success) {
 *     return NextResponse.json({ error: "Too many requests" }, {
 *       status: 429,
 *       headers: {
 *         "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
 *         "X-RateLimit-Remaining": String(result.remaining),
 *         "X-RateLimit-Reset": String(result.reset),
 *       },
 *     });
 *   }
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const { interval = 60_000, maxRequests = 100 } = options;
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 120_000);

  // Allow cleanup timer to not block process shutdown
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  function getIP(request: NextRequest): string {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  }

  function check(request: NextRequest): RateLimitResult;
  function check(key: string): RateLimitResult;
  function check(requestOrKey: NextRequest | string): RateLimitResult {
    const key =
      typeof requestOrKey === "string"
        ? requestOrKey
        : getIP(requestOrKey);

    const now = Date.now();
    const entry = store.get(key);

    // No existing entry or window expired — start fresh
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + interval;
      store.set(key, { count: 1, resetAt });
      return { success: true, remaining: maxRequests - 1, reset: resetAt };
    }

    // Within window — increment
    entry.count += 1;

    if (entry.count > maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    return {
      success: true,
      remaining: maxRequests - entry.count,
      reset: entry.resetAt,
    };
  }

  return { check };
}

// =============================================================================
// Default limiter — configurable requests per window per IP
// =============================================================================
export const defaultLimiter = rateLimit({
  interval: config.rateLimit.windowMs,
  maxRequests: config.rateLimit.maxRequests,
});
