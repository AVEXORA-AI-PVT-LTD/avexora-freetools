"use server";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { logAdminAction } from "@/server/audit";
import { revalidatePath } from "next/cache";
import { tools as aiWritersList } from "@/tools/configs/ai-writers";
import { getEffectiveAiConfig, extractTemplateVariables, buildUserPrompt, calculateEstimatedCost, MODEL_PRICING } from "@/server/ai-service";
import Anthropic from "@anthropic-ai/sdk";

export async function getAiToolsAction() {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.view")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  // Fetch configs & usage stats from DB with optional chaining fallbacks
  const configs = (await prisma.aiToolConfig?.findMany().catch(() => [])) ?? [];
  const configMap = new Map(configs.map((c) => [c.toolSlug, c]));

  // Aggregate usage stats by tool
  const usageStats = (await prisma.aiUsageLog?.groupBy({
    by: ["toolSlug"],
    _count: { id: true },
    _sum: { totalTokens: true, estimatedCost: true },
  }).catch(() => [])) ?? [];

  const usageMap = new Map(
    usageStats.map((u) => [
      u.toolSlug,
      {
        totalExecutions: u._count.id,
        totalTokens: u._sum.totalTokens || 0,
        totalCost: u._sum.estimatedCost || 0,
      },
    ])
  );

  // Fetch category config status for parent category ai-writers
  const categoryConfig = await prisma.categoryConfig?.findUnique({ where: { slug: "ai-writers" } }).catch(() => null);
  const isCategoryEnabled = categoryConfig ? categoryConfig.status : true;

  const tools = aiWritersList.map((tool) => {
    const dbConfig = configMap.get(tool.slug);
    const usage = usageMap.get(tool.slug) || { totalExecutions: 0, totalTokens: 0, totalCost: 0 };

    return {
      slug: tool.slug,
      name: tool.name,
      category: tool.category,
      tagline: tool.tagline,
      fieldsCount: "fields" in tool && Array.isArray(tool.fields) ? tool.fields.length : 0,
      enabled: dbConfig?.enabled ?? true,
      provider: dbConfig?.provider ?? "anthropic",
      model: dbConfig?.model ?? (process.env.AI_MODEL || "claude-opus-4-8"),
      temperature: dbConfig?.temperature ?? 0.7,
      maxTokens: dbConfig?.maxTokens ?? 2048,
      activePromptVersion: dbConfig?.activePromptVersion ?? 1,
      totalExecutions: usage.totalExecutions,
      totalTokens: usage.totalTokens,
      totalCost: Number(usage.totalCost.toFixed(4)),
    };
  });

  return {
    isCategoryEnabled,
    tools,
  };
}

export async function getAiToolDetailAction(slug: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.view")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const toolMeta = aiWritersList.find((t) => t.slug === slug);
  if (!toolMeta) {
    throw new Error("AI Tool not found.");
  }

  const effectiveConfig = await getEffectiveAiConfig(slug);

  const revisions = (await prisma.aiPromptRevision?.findMany({
    where: { toolSlug: slug },
    orderBy: { version: "desc" },
  }).catch(() => [])) ?? [];

  const usageStats = (await prisma.aiUsageLog?.aggregate({
    where: { toolSlug: slug },
    _count: { id: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true, estimatedCost: true },
  }).catch(() => null)) || {
    _count: { id: 0 },
    _sum: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
  };

  const categoryConfig = await prisma.categoryConfig?.findUnique({ where: { slug: "ai-writers" } }).catch(() => null);
  const isCategoryEnabled = categoryConfig ? categoryConfig.status : true;

  return {
    toolMeta,
    effectiveConfig,
    isCategoryEnabled,
    revisions,
    stats: {
      totalExecutions: usageStats._count.id,
      promptTokens: usageStats._sum.promptTokens || 0,
      completionTokens: usageStats._sum.completionTokens || 0,
      totalTokens: usageStats._sum.totalTokens || 0,
      totalCost: Number((usageStats._sum.estimatedCost || 0).toFixed(4)),
    },
  };
}

export async function updateAiToolConfigAction(
  slug: string,
  data: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    inputLimitChars?: number;
    dailyLimitPerUser?: number;
    monthlyLimitPerUser?: number;
    maintenanceMessage?: string | null;
  }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.edit")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  // Specific permission checks
  if (data.enabled !== undefined) {
    const requiredPerm = data.enabled ? "ai.enable" : "ai.disable";
    if (!hasPermission(session.user?.role, requiredPerm)) {
      throw new Error(`Unauthorized: Requires ${requiredPerm} permission.`);
    }
  }

  if (data.model !== undefined && !hasPermission(session.user?.role, "ai.manage_models")) {
    throw new Error("Unauthorized: Requires ai.manage_models permission.");
  }

  if (
    (data.dailyLimitPerUser !== undefined || data.monthlyLimitPerUser !== undefined || data.inputLimitChars !== undefined) &&
    !hasPermission(session.user?.role, "ai.manage_limits")
  ) {
    throw new Error("Unauthorized: Requires ai.manage_limits permission.");
  }

  const updatedConfig = await prisma.aiToolConfig.upsert({
    where: { toolSlug: slug },
    update: {
      ...data,
      updatedBy: session.user.id,
    },
    create: {
      toolSlug: slug,
      enabled: data.enabled ?? true,
      provider: data.provider ?? "anthropic",
      model: data.model ?? (process.env.AI_MODEL || "claude-opus-4-8"),
      temperature: data.temperature ?? 0.7,
      maxTokens: data.maxTokens ?? 2048,
      inputLimitChars: data.inputLimitChars ?? 5000,
      dailyLimitPerUser: data.dailyLimitPerUser ?? 50,
      monthlyLimitPerUser: data.monthlyLimitPerUser ?? 500,
      maintenanceMessage: data.maintenanceMessage,
      updatedBy: session.user.id,
    },
  });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: slug,
    metadata: { changeType: "AI_CONFIG_UPDATED", fields: Object.keys(data) },
  });

  revalidatePath("/admin/ai-writer");
  revalidatePath(`/admin/ai-writer/${slug}`);

  return updatedConfig;
}

export async function savePromptRevisionAction(
  slug: string,
  systemPrompt: string,
  userPromptTemplate: string,
  changeReason: string
) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.manage_prompts")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  if (!changeReason || !changeReason.trim()) {
    throw new Error("A change reason is required when modifying prompt templates.");
  }

  const latestRevision = await prisma.aiPromptRevision.findFirst({
    where: { toolSlug: slug },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latestRevision?.version || 0) + 1;
  const variables = extractTemplateVariables(userPromptTemplate);

  // Archive previous revisions
  await prisma.aiPromptRevision.updateMany({
    where: { toolSlug: slug, status: "active" },
    data: { status: "archived" },
  });

  // Create new active revision
  const newRevision = await prisma.aiPromptRevision.create({
    data: {
      toolSlug: slug,
      version: nextVersion,
      systemPrompt,
      userPromptTemplate,
      variables,
      status: "active",
      changeReason: changeReason.trim(),
      createdBy: session.user.id,
    },
  });

  // Update config to point to new active version
  await prisma.aiToolConfig.upsert({
    where: { toolSlug: slug },
    update: {
      activePromptVersion: nextVersion,
      updatedBy: session.user.id,
    },
    create: {
      toolSlug: slug,
      activePromptVersion: nextVersion,
      updatedBy: session.user.id,
    },
  });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: slug,
    metadata: {
      changeType: "AI_PROMPT_REVISION_SAVED",
      version: nextVersion,
      changeReason: changeReason.trim(),
      variablesCount: variables.length,
    },
  });

  revalidatePath("/admin/ai-writer");
  revalidatePath(`/admin/ai-writer/${slug}`);

  return newRevision;
}

export async function restorePromptRevisionAction(
  slug: string,
  targetVersion: number,
  reason?: string
) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.restore_prompts")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const targetRevision = await prisma.aiPromptRevision.findFirst({
    where: { toolSlug: slug, version: targetVersion },
  });

  if (!targetRevision) {
    throw new Error(`Revision v${targetVersion} not found.`);
  }

  const latestRevision = await prisma.aiPromptRevision.findFirst({
    where: { toolSlug: slug },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latestRevision?.version || 0) + 1;
  const changeReason = reason?.trim() || `Restored from version v${targetVersion}`;

  // Archive active versions
  await prisma.aiPromptRevision.updateMany({
    where: { toolSlug: slug, status: "active" },
    data: { status: "archived" },
  });

  // Create new active revision based on target
  const restoredRevision = await prisma.aiPromptRevision.create({
    data: {
      toolSlug: slug,
      version: nextVersion,
      systemPrompt: targetRevision.systemPrompt,
      userPromptTemplate: targetRevision.userPromptTemplate,
      variables: targetRevision.variables,
      status: "active",
      changeReason,
      createdBy: session.user.id,
    },
  });

  await prisma.aiToolConfig.upsert({
    where: { toolSlug: slug },
    update: {
      activePromptVersion: nextVersion,
      updatedBy: session.user.id,
    },
    create: {
      toolSlug: slug,
      activePromptVersion: nextVersion,
      updatedBy: session.user.id,
    },
  });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: slug,
    metadata: {
      changeType: "AI_PROMPT_RESTORED",
      restoredFromVersion: targetVersion,
      newVersion: nextVersion,
      reason: changeReason,
    },
  });

  revalidatePath("/admin/ai-writer");
  revalidatePath(`/admin/ai-writer/${slug}`);

  return restoredRevision;
}

export async function testAiToolAction(slug: string, inputValues: Record<string, any>) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.test")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is missing.");
  }

  const config = await getEffectiveAiConfig(slug);
  const userPrompt = buildUserPrompt(config.userPromptTemplate, inputValues);

  const client = new Anthropic();
  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: config.systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const durationMs = Date.now() - startTime;
    const resultText = response.content[0]?.type === "text" ? response.content[0].text : "";
    const promptTokens = response.usage?.input_tokens || 0;
    const completionTokens = response.usage?.output_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = calculateEstimatedCost(config.model, promptTokens, completionTokens);

    // Record test run in AiUsageLog
    await prisma.aiUsageLog.create({
      data: {
        toolSlug: slug,
        userId: session.user.id,
        provider: config.provider,
        model: config.model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        success: true,
      },
    });

    return {
      success: true,
      result: resultText,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      durationMs,
      systemPromptUsed: config.systemPrompt,
      userPromptUsed: userPrompt,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    await prisma.aiUsageLog.create({
      data: {
        toolSlug: slug,
        userId: session.user.id,
        provider: config.provider,
        model: config.model,
        success: false,
        errorMessage: err?.message || String(err),
      },
    });

    throw new Error(`AI Test Failed: ${err?.message || "Unknown error"}`);
  }
}

export async function getAiUsageAnalyticsAction() {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "ai.view_usage")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const totalAggregate = (await prisma.aiUsageLog?.aggregate({
    _count: { id: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true, estimatedCost: true },
  }).catch(() => null)) || {
    _count: { id: 0 },
    _sum: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
  };

  const byTool = (await prisma.aiUsageLog?.groupBy({
    by: ["toolSlug"],
    _count: { id: true },
    _sum: { totalTokens: true, estimatedCost: true },
    orderBy: { _count: { id: "desc" } },
  }).catch(() => [])) ?? [];

  const byModel = (await prisma.aiUsageLog?.groupBy({
    by: ["model"],
    _count: { id: true },
    _sum: { totalTokens: true, estimatedCost: true },
    orderBy: { _count: { id: "desc" } },
  }).catch(() => [])) ?? [];

  const recentLogs = (await prisma.aiUsageLog?.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => [])) ?? [];

  return {
    totalCalls: totalAggregate._count.id,
    promptTokens: totalAggregate._sum.promptTokens || 0,
    completionTokens: totalAggregate._sum.completionTokens || 0,
    totalTokens: totalAggregate._sum.totalTokens || 0,
    totalCost: Number((totalAggregate._sum.estimatedCost || 0).toFixed(4)),
    byTool: byTool.map((b) => ({
      toolSlug: b.toolSlug,
      calls: b._count.id,
      tokens: b._sum.totalTokens || 0,
      cost: Number((b._sum.estimatedCost || 0).toFixed(4)),
    })),
    byModel: byModel.map((b) => ({
      model: b.model,
      calls: b._count.id,
      tokens: b._sum.totalTokens || 0,
      cost: Number((b._sum.estimatedCost || 0).toFixed(4)),
    })),
    recentLogs,
    modelPricing: MODEL_PRICING,
  };
}
