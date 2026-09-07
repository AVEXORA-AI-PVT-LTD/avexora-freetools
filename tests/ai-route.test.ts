import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Route-level tests for `POST /api/ai` (the shared AI writer pipeline).
 *
 * The behaviour under test is the request path itself: the API-key gate, the
 * rate limiter, zod body parsing, per-slug lookup, the per-template server-side
 * validation (added for the Job Description Generator), provider probing, and
 * the markdown streaming Response. The Anthropic SDK is replaced with a fake
 * whose `messages.stream()` returns a controllable double.
 */

const streamMock = vi.hoisted(() => ({ stream: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { stream: streamMock.stream };
  },
}));

vi.mock("@/server/db", () => ({ prisma: {} }));

const { POST } = await import("@/app/api/ai/route");

const hardcoded = "sk-test";

function headers(ip: string): Headers {
  return new Headers({ "x-forwarded-for": ip, "Content-Type": "application/json" });
}

function okStream(text: string) {
  return {
    withResponse: () => Promise.resolve(),
    abort: () => {},
    [Symbol.asyncIterator]: async function* () {
      yield { type: "content_block_delta", delta: { type: "text_delta", text } };
    },
  } as never;
}

function failingStream(status: number) {
  return {
    withResponse: () => Promise.reject(Object.assign(new Error("provider boom"), { status })),
    abort: () => {},
    [Symbol.asyncIterator]: async function* () {},
  } as never;
}

const validBody = {
  slug: "job-description-generator",
  values: {
    role: "Senior React Developer",
    experience: "Senior",
    skills: "React, TypeScript, Node.js",
  },
};

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = hardcoded;
  streamMock.stream.mockReset();
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe("POST /api/ai", () => {
  it("Test 1 — missing API key is rejected with 503 before any provider work", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      body: JSON.stringify(validBody),
    }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("unavailable");
    expect(streamMock.stream).not.toHaveBeenCalled();
  });

  it("Test 2 — malformed or invalid bodies are rejected with 400", async () => {
    for (const bad of [
      "not json",
      JSON.stringify({ values: {} }),
      JSON.stringify({ slug: "x".repeat(101), values: {} }),
    ]) {
      const res = await POST(new Request("http://localhost/api/ai", {
        method: "POST",
        headers: headers("1.1.1.1"),
        body: bad,
      }));
      expect(res.status, `expected 400 for ${bad.slice(0, 40)}`).toBe(400);
    }
  });

  it("Test 3 — unknown slug returns 404", async () => {
    const res = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: headers("2.2.2.2"),
      body: JSON.stringify({ slug: "no-such-tool", values: {} }),
    }));
    expect(res.status).toBe(404);
    expect(streamMock.stream).not.toHaveBeenCalled();
  });

  it("Test 4 — missing required fields are rejected server-side with a friendly message", async () => {
    for (const values of [
      { role: "", experience: "Senior", skills: "React" },
      { role: "Engineer", experience: "", skills: "React" },
      { role: "Engineer", experience: "Senior", skills: "   " },
      { role: "Engineer", experience: "Graduate Wizard", skills: "React" },
    ]) {
      const res = await POST(new Request("http://localhost/api/ai", {
        method: "POST",
        headers: headers("3.3.3.3"),
        body: JSON.stringify({ slug: "job-description-generator", values }),
      }));
      expect(res.status, `expected 400 for ${JSON.stringify(values)}`).toBe(400);
      expect(typeof (await res.json()).error).toBe("string");
    }
    expect(streamMock.stream).not.toHaveBeenCalled();
  });

  it("Test 5 — an overlong skills list is rejected without hitting the provider", async () => {
    const res = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: headers("4.4.4.4"),
      body: JSON.stringify({
        slug: "job-description-generator",
        values: { role: "Engineer", experience: "Senior", skills: "x".repeat(401) },
      }),
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("too long");
    expect(streamMock.stream).not.toHaveBeenCalled();
  });

  it("Test 6 — a valid request reaches the provider with the built prompt and streams the output", async () => {
    const text = "# Job Title\n## Key Responsibilities\n";
    streamMock.stream.mockReturnValue(okStream(text));
    const res = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: headers("5.5.5.5"),
      body: JSON.stringify(validBody),
    }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(text);
    expect(streamMock.stream).toHaveBeenCalledTimes(1);
    const [call] = streamMock.stream.mock.calls;
    const { system, messages } = call[0];
    expect(system).toContain("recruitment copywriter");
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain('"Senior React Developer"');
    expect(messages[0].content).toContain("Required skills: React, TypeScript, Node.js.");
  });

  it("Test 7 — provider auth errors surface a safe 503 and never leak the raw error", async () => {
    streamMock.stream.mockReturnValue(failingStream(401));
    const res = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: headers("6.6.6.6"),
      body: JSON.stringify(validBody),
    }));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("authentication");
    expect(body.error).not.toContain("provider boom");
  });

  it("Test 8 — provider rate-limit and generic failures become safe 503s", async () => {
    for (const status of [429, 500]) {
      streamMock.stream.mockReturnValue(failingStream(status));
      const res = await POST(new Request("http://localhost/api/ai", {
        method: "POST",
        headers: headers("7.7.7.7"),
        body: JSON.stringify(validBody),
      }));
      expect(res.status).toBe(503);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("unavailable");
      expect(body.error).not.toContain("provider boom");
    }
  });

  it("Test 9 — repeated requests from one IP beyond the limit are throttled with 429", async () => {
    streamMock.stream.mockReturnValue(okStream("ok"));
    for (let i = 0; i < 10; i++) {
      const res = await POST(new Request("http://localhost/api/ai", {
        method: "POST",
        headers: headers("198.51.100.55"),
        body: JSON.stringify(validBody),
      }));
      expect(res.status, `request ${i + 1} should be allowed`).toBe(200);
    }
    const throttled = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: headers("198.51.100.55"),
      body: JSON.stringify(validBody),
    }));
    expect(throttled.status).toBe(429);
    expect((await throttled.json()).error).toContain("Too many requests");
  });
});