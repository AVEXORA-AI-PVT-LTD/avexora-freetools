import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { generateDirections, heuristicDirections } from "@/studio/ai/brand-brief";
import { PALETTE_IDS } from "@/studio/engine/palettes";
import { FONT_PAIR_IDS } from "@/studio/engine/fonts";
import { MARK_STYLES, seedFrom } from "@/studio/engine/marks";
import { resolveTokens } from "@/studio/engine/tokens";
import { composeLogo } from "@/studio/engine/logo";

/**
 * Anthropic integration contract (spec 22 §5, runbook §4).
 *
 * The real SDK client runs here — real HTTP, real request serialisation, real
 * response parsing — against a local stand-in for the Messages API. What this
 * proves that a unit test cannot: the request we actually put on the wire
 * carries the structured-output schema built from our registries, and a
 * response is only trusted after it survives zod.
 *
 * It does not prove the live API returns good taste. It proves that whatever it
 * returns, we handle correctly.
 */

interface Captured {
  path: string;
  auth: string | undefined;
  body: Record<string, unknown>;
}

let server: http.Server;
let baseUrl = "";
let captured: Captured[] = [];
/** What the stand-in should reply with for the next call. */
let reply: { status: number; body: unknown } = { status: 200, body: {} };

function messageResponse(text: string, stopReason = "end_turn") {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

const direction = (over: Record<string, unknown> = {}) => ({
  label: "Quiet Authority",
  paletteId: PALETTE_IDS[1],
  fontPairId: FONT_PAIR_IDS[1],
  markStyle: MARK_STYLES[1],
  taglines: ["Warehouse software that ships", "Built for Indian retail"],
  rationale: "Reads as credible on a letterhead a banker will open. Restrained enough for a registrar.",
  ...over,
});

const BRIEF = {
  name: "Northwind Labs",
  industry: "technology",
  tone: ["modern", "trustworthy"],
  audience: "Operations heads at retail chains",
};

let previousKey: string | undefined;
let previousBase: string | undefined;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      captured.push({
        path: req.url ?? "",
        auth: req.headers["x-api-key"] as string | undefined,
        body: raw ? JSON.parse(raw) : {},
      });
      res.writeHead(reply.status, { "content-type": "application/json" });
      res.end(JSON.stringify(reply.body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  previousKey = process.env.ANTHROPIC_API_KEY;
  previousBase = process.env.ANTHROPIC_BASE_URL;
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-contract";
  process.env.ANTHROPIC_BASE_URL = baseUrl;
});

afterAll(async () => {
  if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = previousKey;
  if (previousBase === undefined) delete process.env.ANTHROPIC_BASE_URL;
  else process.env.ANTHROPIC_BASE_URL = previousBase;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function expectSingleCall(): Captured {
  expect(captured).toHaveLength(1);
  return captured[0];
}

beforeEach(() => {
  captured = [];
});

describe("the request we put on the wire", () => {
  it("constrains the model to ids from our own registries", async () => {
    reply = { status: 200, body: messageResponse(JSON.stringify({ directions: [direction()] })) };
    await generateDirections(BRIEF);

    const call = expectSingleCall();
    expect(call.path).toContain("/v1/messages");
    expect(call.auth).toBe("sk-ant-test-contract");

    const config = call.body.output_config as {
      format: { type: string; schema: Record<string, never> };
    };
    expect(config.format.type).toBe("json_schema");

    const props = (config.format.schema as unknown as {
      properties: { directions: { items: { properties: Record<string, { enum?: string[] }> } } };
    }).properties.directions.items.properties;

    // The enums are generated from the registries, so they can never drift.
    expect(props.paletteId.enum).toEqual(PALETTE_IDS);
    expect(props.fontPairId.enum).toEqual(FONT_PAIR_IDS);
    expect(props.markStyle.enum).toEqual(MARK_STYLES);
  });

  it("sends the brief as context rather than as instructions", async () => {
    reply = { status: 200, body: messageResponse(JSON.stringify({ directions: [direction()] })) };
    await generateDirections({ ...BRIEF, description: "Warehouse automation" });

    const call = expectSingleCall();
    const messages = call.body.messages as { role: string; content: string }[];
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain("Northwind Labs");
    expect(messages[0].content).toContain("Warehouse automation");
    expect(String(call.body.system)).toContain("never invent colours");
  });
});

describe("how we treat the response", () => {
  it("accepts a valid response and keeps our own seed", async () => {
    reply = {
      status: 200,
      body: messageResponse(
        JSON.stringify({ directions: [direction(), direction({ label: "Second" }), direction({ label: "Third" })] }),
      ),
    };

    const result = await generateDirections(BRIEF);
    expect(result.source).toBe("ai");
    expect(result.directions).toHaveLength(3);
    expect(result.directions[0].label).toBe("Quiet Authority");

    // The model chooses style and palette; the seed stays ours, so the same
    // brand always renders the same mark.
    const seed = seedFrom(BRIEF.name);
    expect(result.directions.map((d) => d.markSeed)).toEqual([seed, seed + 1, seed + 2]);

    // And the result is renderable, which is the whole point of constraining it.
    for (const d of result.directions) {
      const logo = composeLogo(resolveTokens({ name: BRIEF.name }, d), { variant: "full" });
      expect(logo.content.length).toBeGreaterThan(0);
    }
  });

  it("tops up to three when the model returns fewer", async () => {
    reply = { status: 200, body: messageResponse(JSON.stringify({ directions: [direction()] })) };

    const result = await generateDirections(BRIEF);
    expect(result.source).toBe("ai");
    expect(result.directions).toHaveLength(3);
    expect(result.directions[0].label).toBe("Quiet Authority");
    // The filler comes from the deterministic path.
    expect(result.directions[1].paletteId).toBe(heuristicDirections(BRIEF)[1].paletteId);
  });

  it("rejects a palette the model invented and falls back", async () => {
    reply = {
      status: 200,
      body: messageResponse(
        JSON.stringify({ directions: [direction({ paletteId: "midnight-tangerine" })] }),
      ),
    };

    const result = await generateDirections(BRIEF);
    expect(result.source).toBe("heuristic");
    for (const d of result.directions) expect(PALETTE_IDS).toContain(d.paletteId);
  });

  it("rejects an unlicensed font id and falls back", async () => {
    reply = {
      status: 200,
      body: messageResponse(JSON.stringify({ directions: [direction({ fontPairId: "helvetica-neue" })] })),
    };
    expect((await generateDirections(BRIEF)).source).toBe("heuristic");
  });

  it("falls back when the model declines", async () => {
    reply = {
      status: 200,
      body: messageResponse(JSON.stringify({ directions: [direction()] }), "refusal"),
    };
    const result = await generateDirections(BRIEF);
    expect(result.source).toBe("heuristic");
    expect(result.directions).toHaveLength(3);
  });

  it("falls back on non-JSON content rather than throwing", async () => {
    reply = { status: 200, body: messageResponse("I'd be happy to help with that!") };
    expect((await generateDirections(BRIEF)).source).toBe("heuristic");
  });

  it("falls back on an empty directions array", async () => {
    reply = { status: 200, body: messageResponse(JSON.stringify({ directions: [] })) };
    expect((await generateDirections(BRIEF)).source).toBe("heuristic");
  });

  it("falls back on a server error, and onboarding still completes", async () => {
    reply = { status: 500, body: { type: "error", error: { type: "api_error", message: "boom" } } };
    const result = await generateDirections(BRIEF);
    expect(result.source).toBe("heuristic");
    expect(result.directions).toHaveLength(3);
  }, 30_000);

  it("falls back on a rate limit", async () => {
    reply = { status: 429, body: { type: "error", error: { type: "rate_limit_error", message: "slow down" } } };
    expect((await generateDirections(BRIEF)).source).toBe("heuristic");
  }, 30_000);
});
