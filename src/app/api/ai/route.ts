import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { aiPrompts } from "./prompts";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const AI_MODEL = process.env.AI_MODEL ?? "claude-opus-4-8";

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  values: z.record(z.string(), z.union([z.string().max(5000), z.number(), z.boolean()])),
});

type ProviderStream = ReturnType<Anthropic["messages"]["stream"]>;

/**
 * Waits for the provider's HTTP response headers before the streaming Response
 * is committed to the client. `client.messages.stream()` starts the upstream
 * request immediately; `stream.withResponse()` resolves once the headers arrive
 * (or rejects). Without this probe an upstream failure — e.g. a 401 "API key is
 * invalid" — would surface mid-stream as an unhandled "failed to pipe response"
 * error on an already committed 200 response.
 *
 * Returns `{ kind: "error", response }` with a ready-made Response on any
 * provider failure, or `{ kind: "stream" }` when the connection is healthy.
 */
async function probeProvider(stream: ProviderStream) {
  try {
    await stream.withResponse();
    return { kind: "stream" } as const;
  } catch (err) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status?: unknown }).status
        : undefined;
    console.error(
      `[ai] provider error (status: ${status ?? "unknown"}):`,
      err instanceof Error ? err.message : err,
    );
    if (status === 401 || status === 403) {
      return {
        kind: "error",
        response: Response.json(
          { error: "AI service authentication is not configured correctly." },
          { status: 503 },
        ),
      } as const;
    }
    return {
      kind: "error",
      response: Response.json(
        { error: "AI service is temporarily unavailable." },
        { status: 503 },
      ),
    } as const;
  }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "AI tools are temporarily unavailable." },
      { status: 503 },
    );
  }
  if (!rateLimit(`ai:${clientIp(req)}`, 10)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const template = aiPrompts[parsed.data.slug];
  if (!template) {
    return Response.json({ error: "Unknown tool." }, { status: 404 });
  }
  const invalid = template.validate?.(parsed.data.values);
  if (invalid) {
    return Response.json({ error: invalid }, { status: 400 });
  }

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: AI_MODEL,
    max_tokens: template.maxTokens ?? 2048,
    system: template.system,
    messages: [{ role: "user", content: template.build(parsed.data.values) }],
  });

  const probe = await probeProvider(stream);
  if (probe.kind === "error") return probe.response;

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[ai] streaming error:", err instanceof Error ? err.message : err);
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
