import { prisma } from "@/server/db";

/**
 * Minimal in-memory sliding-window rate limiter, per spec §4.
 * Good enough for a single-instance deployment; swap for Redis if scaled out.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

/** Best-effort client IP from an incoming request's Headers. */
export function requestIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : "unknown") || "unknown";
}

/** Normalise and validate an email address for magic-link; returns null if invalid. */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export interface RateLimitOutcome {
  allowed: boolean;
  /** How long to wait (ms) before the current window resets. */
  retryAfterMs: number;
}

/**
 * Persistent, shared rate limiter backed by the database (see the
 * `MagicLinkRateLimit` model). Unlike the in-memory `rateLimit` above, this is
 * correct across serverless invocations and multiple server instances, which is
 * the appropriate mechanism for the magic-link sign-in.
 *
 * Fixed-window semantics: each `windowMs` bucket is its own document keyed
 * `baseKey:<windowStart>`, and the counter is moved forward with an atomic
 * `upsert` (create hits=1 / update hits+1). Concurrent requests therefore
 * observe an exact count with no read-modify-write race.
 */
export async function rateLimitPersistent(
  baseKey: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitOutcome> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${baseKey}:${windowStart}`;

  const row = await prisma.magicLinkRateLimit.upsert({
    where: { key: bucketKey },
    create: { key: bucketKey, hits: 1, windowStart: new Date(windowStart) },
    update: { hits: { increment: 1 } },
  });

  const retryAfterMs = windowStart + windowMs - now;
  return { allowed: row.hits <= limit, retryAfterMs: Math.max(0, retryAfterMs) };
}
