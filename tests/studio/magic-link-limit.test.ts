import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Magic-link sign-in server-side rate limiting (spec 22 §8 hardening).
 *
 * The behaviour under test is the pure, DB-backed limiter shared by
 * `POST /api/auth/magic-link` (which turns failures into genuine HTTP 429) and
 * the sign-in server action (which redirects with a generic `error`). The
 * in-memory Prisma double faithfully reproduces the atomic `upsert`
 * (`create` hits=1 / `update` hits+1) that `rateLimitPersistent` relies on, so
 * the counter stays exact even under concurrent calls — exactly what makes the
 * fix correct across serverless invocations.
 */

// --- in-memory MagicLinkRateLimit double ------------------------------------

const rateLimitRows = new Map<string, { key: string; hits: number; windowStart: Date }>();

vi.mock("@/server/db", () => ({
  prisma: {
    magicLinkRateLimit: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { key: string };
        create: { key: string; hits: number; windowStart: Date };
        update: { hits: unknown };
      }) => {
        const existing = rateLimitRows.get(where.key);
        if (!existing) {
          const row = { ...create };
          rateLimitRows.set(where.key, row);
          return row;
        }
        const increment = (update.hits as { increment?: number }).increment ?? 0;
        const row = { ...existing, hits: existing.hits + increment };
        rateLimitRows.set(where.key, row);
        return row;
      },
    },
  },
}));

const { enforceMagicLinkLimit, EMAIL_LIMIT, IP_LIMIT, EMAIL_WINDOW_MS, IP_WINDOW_MS } =
  await import("@/server/magic-link-limit");

function mockHeaders(ip: string): Headers {
  return new Headers({ "x-forwarded-for": ip });
}

beforeEach(() => {
  rateLimitRows.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("magic-link rate limiting", () => {
  it("Test 1 — first request for an email is allowed", async () => {
    const res = await enforceMagicLinkLimit("user@example.com", mockHeaders("203.0.113.1"));
    expect(res.status).toBe("allowed");
    expect(res.email).toBe("user@example.com");
  });

  it("Test 2 — immediate repeated request for the same email is limited", async () => {
    const first = await enforceMagicLinkLimit("user@example.com", mockHeaders("203.0.113.1"));
    expect(first.status).toBe("allowed");

    const second = await enforceMagicLinkLimit(
      "USER@example.com", // case/whitespace-normalised to the same bucket
      mockHeaders("203.0.113.1"),
    );
    expect(second.status).toBe("email_limited");
    expect(second.retryAfterMs).toBeGreaterThan(0);
  });

  it("Test 3 — many different emails from one IP are bounded by the IP limit", async () => {
    const ips = new Headers({ "x-forwarded-for": "198.51.100.7" });
    // IP limit is generous, but still finite: sending more than IP_LIMIT from one
    // source must eventually stop.
    let limited = 0;
    for (let i = 0; i < IP_LIMIT + 5; i++) {
      const res = await enforceMagicLinkLimit(`user${i}@example.com`, ips);
      if (res.status === "ip_limited") limited += 1; // also never email_limited
      expect(res.status).not.toBe("email_limited"); // distinct emails never trip email limit
    }
    expect(limited).toBe(5); // exactly the excess over the IP limit is blocked
  });

  it("Test 4 — after the cooldown window a request is allowed again", async () => {
    await enforceMagicLinkLimit("user@example.com", mockHeaders("203.0.113.1"));

    vi.advanceTimersByTime(EMAIL_WINDOW_MS + 1000);

    const after = await enforceMagicLinkLimit("user@example.com", mockHeaders("203.0.113.1"));
    expect(after.status).toBe("allowed");
    expect(after.email).toBe("user@example.com");
  });

  it("Test 5 — invalid/empty/malformed email is rejected without sending", async () => {
    for (const bad of ["", "   ", "nope", "missing@at", "@nohost.", "a b@c.com", "x@y"]) {
      const res = await enforceMagicLinkLimit(bad, mockHeaders("203.0.113.1"));
      expect(res.status).toBe("invalid_email");
      expect(res.email).toBeNull();
    }
  });

  it("Test 6 — concurrent requests cannot blow past the per-email limit", async () => {
    const ip = new Headers({ "x-forwarded-for": "192.0.2.9" });
    const requests = Array.from({ length: 8 }, () =>
      enforceMagicLinkLimit("race@example.com", ip),
    );
    const results = await Promise.all(requests);

    // With EMAIL_LIMIT=1 exactly one of the concurrent requests may be allowed;
    // the rest must be email_limited. No request may bypass the window.
    const allowed = results.filter((r) => r.status === "allowed").length;
    const limited = results.filter((r) => r.status === "email_limited").length;
    expect(allowed).toBe(1);
    expect(limited).toBe(7);
  });

  it("config exports the expected constants", () => {
    expect(EMAIL_WINDOW_MS).toBe(60_000);
    expect(EMAIL_LIMIT).toBe(1);
    expect(IP_WINDOW_MS).toBe(60_000);
    expect(IP_LIMIT).toBe(20);
  });
});
