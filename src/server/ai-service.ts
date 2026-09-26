import { prisma } from "@/server/db";
import { aiPrompts } from "@/app/api/ai/prompts";

export interface EffectiveAiConfig {
  slug: string;
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  inputLimitChars: number;
  dailyLimitPerUser: number;
  monthlyLimitPerUser: number;
  maintenanceMessage: string | null;
  activeVersion: number;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
}

export function extractTemplateVariables(templateStr: string): string[] {
  if (!templateStr) return [];
  const matches = templateStr.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (!matches) return [];
  const vars = matches.map(m => m.replace(/[\{\}]/g, "").trim());
  return Array.from(new Set(vars));
}

export function buildUserPrompt(templateStr: string, values: Record<string, any>): string {
  if (!templateStr) return "";
  return templateStr.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => {
    const val = values[key];
    if (val === undefined || val === null) return "";
    return String(val);
  });
}

/**
 * Model pricing per 1 million tokens (USD)
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 15.0, output: 75.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 }
};

export function calculateEstimatedCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 3.0, output: 15.0 };
  const cost = (promptTokens / 1000000) * pricing.input + (completionTokens / 1000000) * pricing.output;
  return Number(cost.toFixed(6));
}

export async function getEffectiveAiConfig(slug: string): Promise<EffectiveAiConfig> {
  const fallback = aiPrompts[slug];
  
  try {
    let config = await prisma.aiToolConfig?.findUnique({ where: { toolSlug: slug } });
    let activeRevision = null;

    if (config) {
      activeRevision = await prisma.aiPromptRevision?.findFirst({
        where: { toolSlug: slug, version: config.activePromptVersion }
      });
    }

    // Auto-seed if not present in DB
    if (!config || !activeRevision) {
      const defaultSystem = fallback?.system || "You are an expert assistant. Output clear, concise markdown.";
      const defaultTemplate = fallback ? "Perform action based on inputs." : "";

      if (!config) {
        config = await prisma.aiToolConfig.create({
          data: {
            toolSlug: slug,
            enabled: true,
            provider: "anthropic",
            model: process.env.AI_MODEL || "claude-opus-4-8",
            temperature: 0.7,
            maxTokens: fallback?.maxTokens || 2048,
            inputLimitChars: 5000,
            activePromptVersion: 1
          }
        });
      }

      if (!activeRevision) {
        activeRevision = await prisma.aiPromptRevision.create({
          data: {
            toolSlug: slug,
            version: 1,
            systemPrompt: defaultSystem,
            userPromptTemplate: defaultTemplate,
            variables: extractTemplateVariables(defaultTemplate),
            status: "active",
            changeReason: "Initial prompt setup"
          }
        });
      }
    }

    // Check parent category status
    const categoryConfig = await prisma.categoryConfig?.findUnique({ where: { slug: "ai-writers" } }).catch(() => null);
    const isCategoryEnabled = categoryConfig ? categoryConfig.status : true;

    return {
      slug,
      enabled: isCategoryEnabled && config.enabled,
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      inputLimitChars: config.inputLimitChars,
      dailyLimitPerUser: config.dailyLimitPerUser,
      monthlyLimitPerUser: config.monthlyLimitPerUser,
      maintenanceMessage: !isCategoryEnabled
        ? "The AI Writers category is currently disabled by administrators."
        : config.maintenanceMessage,
      activeVersion: config.activePromptVersion,
      systemPrompt: activeRevision.systemPrompt,
      userPromptTemplate: activeRevision.userPromptTemplate,
      variables: activeRevision.variables || extractTemplateVariables(activeRevision.userPromptTemplate)
    };
  } catch (err) {
    console.error("AI Config DB error, using fallback:", err);
    return {
      slug,
      enabled: true,
      provider: "anthropic",
      model: process.env.AI_MODEL || "claude-opus-4-8",
      temperature: 0.7,
      maxTokens: fallback?.maxTokens || 2048,
      inputLimitChars: 5000,
      dailyLimitPerUser: 50,
      monthlyLimitPerUser: 500,
      maintenanceMessage: null,
      activeVersion: 1,
      systemPrompt: fallback?.system || "You are an expert assistant.",
      userPromptTemplate: "",
      variables: []
    };
  }
}
