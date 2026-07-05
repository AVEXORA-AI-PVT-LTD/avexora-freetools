import type { FieldValues } from "@/tools/types";

/**
 * Server-side prompt registry for AI writer tools (spec §3.5): prompts are
 * defined here, never supplied by the client. Keyed by tool slug.
 */
interface PromptTemplate {
  system: string;
  build: (values: FieldValues) => string;
  maxTokens?: number;
}

const MARKETING_SYSTEM =
  "You are an expert marketing copywriter for small and medium businesses. " +
  "Write clear, useful, non-generic content. Output only the requested content " +
  "in plain text or simple markdown — no preamble, no closing remarks.";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const aiPrompts: Record<string, PromptTemplate> = {
  "ai-blog-outline-generator": {
    system: MARKETING_SYSTEM,
    build: (v) =>
      [
        `Create a complete SEO blog post outline for the topic: "${str(v.topic)}".`,
        str(v.audience) && `Target audience: ${str(v.audience)}.`,
        `Tone: ${str(v.tone) || "professional"}.`,
        "Structure: one H1 title, 4-8 H2 sections each with 2-4 H3 bullet points,",
        "a suggested introduction angle, and a conclusion with a call to action.",
        "Use markdown headings.",
      ]
        .filter(Boolean)
        .join("\n"),
  },
};
