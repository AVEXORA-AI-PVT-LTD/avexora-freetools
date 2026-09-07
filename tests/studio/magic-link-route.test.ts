import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Route-level tests for `POST /api/auth/magic-link` (spec 22 §8 hardening).
 *
 * These drive the real route handler and assert the *transport* behaviour a
 * browser/AI client actually receives: a genuine HTTP 429 on rate-limit, 400 on
 * invalid input, and 200 only when the email send is finally attempted. The
 * Prisma double mirrors the atomic upsert exactly like the unit test, and
 * `signIn` is stubbed so we can assert the email send is invoked at most once
 * per window and never after a rejection.
 */

const rateLimitRows = new Map<string, { key: string; hits: number; windowStart: Date }>();
let signInCalls: string[] = [];

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

vi.mock("@/server/auth", () => ({
  signIn: async (provider: string, opts: { email?: string }) => {
    signInCalls.push(provider);
    return JSON.stringify({ email: opts.email });
  },
}));

const { POST } = await import("@/app/api/auth/magic-link/route");

function post(body: unknown, ip = "203.0.113.5"): Promise<Response> {
  return POST(
    new Request("http://localhost/api/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  rateLimitRows.clear();
  signInCalls = [];
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/auth/magic-link", () => {
  it("Test 1 — first valid request returns 200 and sends the email exactly once", async () => {
    const res = await post({ email: "user@example.com", redirectTo: "/studio/app" });
    expect(res.status).toBe(200);
    expect(signInCalls).toEqual(["resend"]);
  });

  it("Test 2 — immediate repeat for the same email returns 429 and sends no email", async () => {
    await post({ email: "user@example.com" });
    const res = await post({ email: "user@example.com" });
    expect(res.status).toBe(429);
    expect(signInCalls).toEqual(["resend"]); // still only the first one
  });

  it("Test 3 — many different emails from one IP are bounded by IP limit (429)", async () => {
    const ip = "198.51.100.9";
    let statuses: number[] = [];
    for (let i = 0; i < 26; i++) {
      const res = await post({ email: `user${i}@example.com` }, ip);
      statuses = [...statuses, res.status];
    }
    expect(statuses.filter((s) => s === 200).length).toBe(20); // IP_LIMIT allowed
    expect(statuses.filter((s) => s === 429).length).toBe(6); // the excess blocked
  });

  it("Test 4 — after the cooldown window a request returns 200 again", async () => {
    await post({ email: "user@example.com" });
    vi.advanceTimersByTime(60_001);
    const res = await post({ email: "user@example.com" });
    expect(res.status).toBe(200);
    expect(signInCalls.filter((p) => p === "resend").length).toBe(2);
  });

  it("Test 5 — invalid/empty email returns 400 and sends no email", async () => {
    for (const email of ["", "   ", "nope", "x@y", "a b@c.com"]) {
      const res = await post({ email });
      expect(res.status).toBe(400);
    }
    expect(signInCalls).toEqual([]);
  });

  it("Test 5b — malformed JSON body returns 400 and sends no email", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ not json",
      }),
    );
    expect(res.status).toBe(400);
    expect(signInCalls).toEqual([]);
  });

  it("Test 6 — concurrent requests return only one 200 for the same email", async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => post({ email: "race@example.com" }, "192.0.2.9")),
    );
    expect(responses.filter((r) => r.status === 200).length).toBe(1);
    expect(responses.filter((r) => r.status === 429).length).toBe(5);
    expect(signInCalls.length).toBe(1); // email sent at most once
  });
});
