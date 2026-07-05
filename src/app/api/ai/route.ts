import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { aiPrompts } from "@/server/ai-prompts";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

const AI_MODEL = process.env.AI_MODEL ?? "claude-opus-4-8";

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  values: z.record(z.string(), z.union([z.string().max(5000), z.number(), z.boolean()])),
});

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

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: AI_MODEL,
    max_tokens: template.maxTokens ?? 2048,
    system: template.system,
    messages: [{ role: "user", content: template.build(parsed.data.values) }],
  });

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
