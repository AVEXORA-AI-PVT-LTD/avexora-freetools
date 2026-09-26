import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { aiPrompts } from "./prompts";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { getEffectiveAiConfig, buildUserPrompt, calculateEstimatedCost } from "@/server/ai-service";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

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

  const slug = parsed.data.slug;
  const template = aiPrompts[slug];
  if (!template) {
    return Response.json({ error: "Unknown tool." }, { status: 404 });
  }

  const invalid = template.validate?.(parsed.data.values);
  if (invalid) {
    return Response.json({ error: invalid }, { status: 400 });
  }

  // Retrieve dynamic configuration from Admin DB / cache
  const config = await getEffectiveAiConfig(slug);

  if (!config.enabled) {
    return Response.json(
      { error: config.maintenanceMessage || "This AI tool is currently offline for maintenance." },
      { status: 503 },
    );
  }

  // Construct prompt dynamically
  const userPrompt = config.userPromptTemplate?.trim()
    ? buildUserPrompt(config.userPromptTemplate, parsed.data.values)
    : template.build(parsed.data.values);

  const systemPrompt = config.systemPrompt?.trim() || template.system;
  const modelToUse = config.model || process.env.AI_MODEL || "claude-opus-4-8";

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: modelToUse,
    max_tokens: config.maxTokens || template.maxTokens || 2048,
    temperature: config.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const probe = await probeProvider(stream);
  if (probe.kind === "error") return probe.response;

  // Log usage asynchronously on completion
  stream.finalMessage().then(async (msg) => {
    const promptTokens = msg.usage?.input_tokens || 0;
    const completionTokens = msg.usage?.output_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = calculateEstimatedCost(modelToUse, promptTokens, completionTokens);

    await prisma.aiUsageLog.create({
      data: {
        toolSlug: slug,
        provider: config.provider,
        model: modelToUse,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        success: true,
      },
    }).catch((err) => console.error("Failed to save AI usage log:", err));
  }).catch((err) => console.error("Failed to retrieve final AI stream message:", err));

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
