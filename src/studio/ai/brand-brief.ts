import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { PALETTES, PALETTE_IDS, rankPalettes } from "../engine/palettes";
import { FONT_PAIR_IDS, rankFontPairs } from "../engine/fonts";
import { MARK_STYLES, type MarkStyle, seedFrom } from "../engine/marks";
import type { KitSelection } from "../engine/tokens";

/**
 * AI brand curation (spec 22 §5).
 *
 * The rule that makes this safe: **Claude curates, it never draws.** It picks a
 * palette, a font pairing and a mark style *by id* from the curated registries,
 * and writes taglines. It cannot invent a hex value, name an unlicensed font,
 * or produce an unrenderable result — the output is constrained by a JSON
 * schema whose enums are generated from the registries themselves, then
 * re-validated with zod before anything reaches the engine.
 *
 * Without ANTHROPIC_API_KEY this falls back to deterministic heuristic scoring,
 * the same degradation pattern as the existing /api/ai route.
 */

const MODEL = process.env.STUDIO_AI_MODEL ?? "claude-opus-5";

export interface BrandBrief {
  name: string;
  industry: string;
  /** What the business actually does, in the founder's words. */
  description?: string;
  /** Tone words — "modern", "trustworthy", "premium". */
  tone: string[];
  audience?: string;
}

export interface BrandDirection extends KitSelection {
  /** Short name for the direction, e.g. "Quiet Authority". */
  label: string;
  taglines: string[];
  rationale: string;
}

/** Zod mirror of the JSON schema — the real gate before anything is rendered. */
const directionSchema = z.object({
  label: z.string().min(1).max(60),
  paletteId: z.enum(PALETTE_IDS as [string, ...string[]]),
  fontPairId: z.enum(FONT_PAIR_IDS as [string, ...string[]]),
  markStyle: z.enum(MARK_STYLES as [MarkStyle, ...MarkStyle[]]),
  taglines: z.array(z.string().min(1).max(80)).min(1).max(5),
  rationale: z.string().min(1).max(600),
});

const responseSchema = z.object({
  directions: z.array(directionSchema).min(1).max(3),
});

/**
 * JSON Schema for the API's structured-output constraint. Enums are derived
 * from the registries, so adding a palette automatically widens what the model
 * may choose — the two can never drift.
 *
 * Note: no minItems/maxItems — the structured-outputs schema subset does not
 * support array-length constraints, so counts are enforced by zod above.
 */
const jsonSchema = {
  type: "object",
  properties: {
    directions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          paletteId: { type: "string", enum: PALETTE_IDS },
          fontPairId: { type: "string", enum: FONT_PAIR_IDS },
          markStyle: { type: "string", enum: MARK_STYLES },
          taglines: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
        },
        required: [
          "label",
          "paletteId",
          "fontPairId",
          "markStyle",
          "taglines",
          "rationale",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["directions"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a brand identity director for Avexora Brand Studio, which generates business stationery for Indian startups.

You choose from a fixed, curated design system — you never invent colours or fonts. For each brand you produce exactly three distinct directions.

Rules:
- Pick paletteId, fontPairId and markStyle only from the allowed values.
- The three directions must be genuinely different from each other: different palettes, and at least two different mark styles between them. Do not produce three variations of the same idea.
- Taglines: 3 per direction, under 8 words each, written in plain business English. No wordplay on the company name, no "empowering", "revolutionising", "seamless", "cutting-edge", or "solutions".
- rationale: two sentences, concrete. Say what the choice signals to this specific audience — not generic colour psychology.
- label: two or three words naming the direction's character.

The audience is Indian founders, their customers, and their bankers. Prefer directions that will look credible on a letterhead a bank or a registrar will read.`;

function buildPrompt(brief: BrandBrief): string {
  const lines = [
    `Business name: ${brief.name}`,
    `Industry: ${brief.industry}`,
  ];
  if (brief.description) lines.push(`What they do: ${brief.description}`);
  if (brief.tone.length) lines.push(`Desired tone: ${brief.tone.join(", ")}`);
  if (brief.audience) lines.push(`Audience: ${brief.audience}`);
  lines.push("", "Produce three brand directions.");
  return lines.join("\n");
}

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Deterministic fallback: rank the registries against the brief and assemble
 * three directions that differ by construction. Used when the API key is
 * absent and as the recovery path if the model returns something invalid.
 */
export function heuristicDirections(brief: BrandBrief): BrandDirection[] {
  const palettes = rankPalettes(brief.industry, brief.tone);
  const fonts = rankFontPairs(brief.tone);
  const seed = seedFrom(brief.name);

  // Three different palettes, three different mark styles, spread across the
  // ranked font pairs — so the fallback still offers a real choice.
  const styles: MarkStyle[] = ["monogram", "geometric", "lettermark"];

  return [0, 1, 2].map((i) => {
    const palette = palettes[i % palettes.length];
    const font = fonts[i % fonts.length];
    return {
      label: palette.name,
      paletteId: palette.id,
      fontPairId: font.id,
      markStyle: styles[i],
      markSeed: seed + i,
      taglines: defaultTaglines(brief),
      rationale: `${palette.name} with ${font.name}. Matched to the ${brief.industry} sector and a ${brief.tone[0] ?? "professional"} tone.`,
    };
  });
}

function defaultTaglines(brief: BrandBrief): string[] {
  const industry = brief.industry.toLowerCase();
  return [
    `${capitalise(industry)}, done properly`,
    `Built for Indian business`,
    `Straightforward ${industry}`,
  ];
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Generate three brand directions. Never throws for AI reasons — any failure
 * (no key, refusal, malformed output, network) degrades to the deterministic
 * path so onboarding always completes.
 */
export async function generateDirections(
  brief: BrandBrief,
): Promise<{ directions: BrandDirection[]; source: "ai" | "heuristic" }> {
  if (!aiEnabled()) {
    return { directions: heuristicDirections(brief), source: "heuristic" };
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      output_config: {
        format: { type: "json_schema", schema: jsonSchema },
        effort: "medium",
      },
      messages: [{ role: "user", content: buildPrompt(brief) }],
    });

    // Safety classifiers can decline; check before reading content.
    if (response.stop_reason === "refusal") {
      return { directions: heuristicDirections(brief), source: "heuristic" };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = responseSchema.safeParse(JSON.parse(text));
    if (!parsed.success || parsed.data.directions.length === 0) {
      return { directions: heuristicDirections(brief), source: "heuristic" };
    }

    const seed = seedFrom(brief.name);
    const directions: BrandDirection[] = parsed.data.directions.map((d, i) => ({
      ...d,
      markStyle: d.markStyle as MarkStyle,
      // The model picks style and palette; the seed stays ours so the same
      // brand always renders the same mark.
      markSeed: seed + i,
    }));

    // Top up from the heuristic path if the model returned fewer than three.
    if (directions.length < 3) {
      const filler = heuristicDirections(brief).slice(directions.length);
      directions.push(...filler.slice(0, 3 - directions.length));
    }

    return { directions, source: "ai" };
  } catch {
    return { directions: heuristicDirections(brief), source: "heuristic" };
  }
}

/** Palette metadata for the UI, without importing the whole registry client-side. */
export function paletteSummary(id: string) {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
  return { id: p.id, name: p.name, swatches: [p.primary, p.secondary, p.accent] };
}
