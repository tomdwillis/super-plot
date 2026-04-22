import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting utility.
 *
 * Uses @upstash/ratelimit + @upstash/redis when KV_REST_API_URL and
 * KV_REST_API_TOKEN are set (Vercel KV / Upstash Redis).
 * Falls back to a simple in-memory sliding window for local dev / environments
 * without Redis. Note: the in-memory store is per-process and will not enforce
 * limits across multiple serverless function instances.
 */

interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  limit: number;
  /** Window duration in seconds */
  windowSecs: number;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ── In-memory sliding window fallback ────────────────────────────────────────

/** key → sorted list of request timestamps (ms) */
const memStore = new Map<string, number[]>();
let warnedProdFallback = false;

function inMemoryCheck(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now();
  const windowMs = config.windowSecs * 1000;
  const timestamps = (memStore.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );

  if (timestamps.length >= config.limit) {
    const oldest = timestamps[0];
    const retryAfterSecs = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    memStore.set(key, timestamps);
    return { allowed: false, retryAfterSecs };
  }

  timestamps.push(now);
  memStore.set(key, timestamps);
  return { allowed: true, retryAfterSecs: 0 };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check whether the request is within rate limits.
 *
 * Returns `null` when the request is allowed.
 * Returns a `NextResponse` (429) when the limit is exceeded — the caller
 * should return that response immediately.
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const key = `rl:${req.nextUrl.pathname}:${ip}`;

  // ── Try Upstash/Vercel KV ─────────────────────────────────────────────────
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const { Ratelimit } = require("@upstash/ratelimit") as any;
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const { Redis } = require("@upstash/redis") as any;

      const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });

      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSecs} s`),
        prefix: "rl",
      });

      const { success, limit, remaining, reset } = await limiter.limit(key);

      if (!success) {
        const retryAfterSecs = Math.max(
          1,
          Math.ceil((reset - Date.now()) / 1000)
        );
        return tooManyRequests(retryAfterSecs, limit, remaining);
      }
      return null;
    } catch {
      // Package not installed or Redis unavailable — fall through to in-memory.
    }
  }

  if (process.env.NODE_ENV === "production" && !warnedProdFallback) {
    warnedProdFallback = true;
    console.warn(
      "[ratelimit] KV_REST_API_URL/KV_REST_API_TOKEN are not set; using per-instance in-memory fallback"
    );
  }

  // ── In-memory fallback ────────────────────────────────────────────────────
  const { allowed, retryAfterSecs } = inMemoryCheck(key, config);
  if (!allowed) {
    return tooManyRequests(retryAfterSecs, config.limit, 0);
  }
  return null;
}

function tooManyRequests(
  retryAfterSecs: number,
  limit: number,
  remaining: number
): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}
