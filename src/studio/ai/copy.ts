import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * Marketing copy generation (spec 22 §5).
 *
 * Follows the same prompt-registry pattern as `src/server/ai-prompts.ts` in the
 * free-tools engine: prompts live server-side and are selected by kind, never
 * supplied by the client.
 */

const MODEL = process.env.STUDIO_AI_MODEL ?? "claude-opus-5";

export type CopyKind = "social-post" | "ad-headline" | "tagline" | "announcement";

export interface CopyRequest {
  kind: CopyKind;
  brandName: string;
  industry: string;
  /** What the post or ad is about. */
  topic: string;
  tone?: string;
}

export interface CopyOption {
  headline: string;
  subhead?: string;
  cta?: string;
}

const optionSchema = z.object({
  headline: z.string().min(1).max(120),
  subhead: z.string().max(200).optional(),
  cta: z.string().max(40).optional(),
});

const responseSchema = z.object({ options: z.array(optionSchema).min(1).max(6) });

const jsonSchema = {
  type: "object",
  properties: {
    options: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headline: { type: "string" },
          subhead: { type: "string" },
          cta: { type: "string" },
        },
        required: ["headline", "subhead", "cta"],
        additionalProperties: false,
      },
    },
  },
  required: ["options"],
  additionalProperties: false,
} as const;

const GUIDANCE: Record<CopyKind, string> = {
  "social-post":
    "Write social post copy. Headline under 10 words, subhead one sentence, CTA two or three words.",
  "ad-headline":
    "Write paid-ad copy. Headline under 8 words and specific about the offer. Subhead states the benefit concretely. CTA is an imperative.",
  tagline:
    "Write brand taglines. Headline is the tagline, under 6 words. Leave subhead and CTA short or empty-ish.",
  announcement:
    "Write an announcement. Headline states the news plainly. Subhead adds the one detail that matters. CTA points to the next step.",
};

const SYSTEM = `You write marketing copy for Indian small businesses and startups.

Write plainly. Say what the business actually does and who it is for. Never use: empowering, revolutionary, seamless, cutting-edge, game-changing, unlock, elevate, solutions, synergy, or exclamation marks.

Do not use the brand name as a pun. Do not write in title case. Indian English spelling and number formats (lakh, crore) are fine where they fit naturally.

Produce four distinct options — different angles, not rewordings of one line.`;

export function copyAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Deterministic fallback so the editor is never blocked on the API. */
export function fallbackCopy(request: CopyRequest): CopyOption[] {
  const { brandName, topic, industry } = request;
  return [
    { headline: topic, subhead: `${brandName} — ${industry}`, cta: "Learn more" },
    { headline: `${topic}`, subhead: `Now available from ${brandName}.`, cta: "Get started" },
    { headline: `${brandName}: ${topic}`, subhead: "", cta: "Contact us" },
    { headline: topic, subhead: `Built for ${industry} businesses in India.`, cta: "Talk to us" },
  ];
}

export async function generateCopy(
  request: CopyRequest,
): Promise<{ options: CopyOption[]; source: "ai" | "fallback" }> {
  if (!copyAiEnabled()) {
    return { options: fallbackCopy(request), source: "fallback" };
  }

  try {
    const client = new Anthropic();
    const prompt = [
      GUIDANCE[request.kind],
      "",
      `Brand: ${request.brandName}`,
      `Industry: ${request.industry}`,
      `Subject: ${request.topic}`,
      request.tone ? `Tone: ${request.tone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM,
      output_config: {
        format: { type: "json_schema", schema: jsonSchema },
        effort: "low",
      },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return { options: fallbackCopy(request), source: "fallback" };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = responseSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return { options: fallbackCopy(request), source: "fallback" };
    }

    // Empty strings are the model's way of declining an optional field; drop
    // them so the layout treats them as absent rather than rendering blanks.
    const options = parsed.data.options.map((o) => ({
      headline: o.headline,
      subhead: o.subhead?.trim() || undefined,
      cta: o.cta?.trim() || undefined,
    }));

    return { options, source: "ai" };
  } catch {
    return { options: fallbackCopy(request), source: "fallback" };
  }
}
