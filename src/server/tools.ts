import { prisma } from "@/server/db";
import { allTools, toolsByCategory as staticToolsByCategory } from "@/tools/registry";
import { getEffectiveCategories } from "@/server/categories";
import type { ToolConfig, CategorySlug } from "@/types/tools";

export async function getAllToolsWithConfig(): Promise<ToolConfig[]> {
  const toolConfigs = await prisma.toolConfig?.findMany() ?? [];
  const configMap = new Map(toolConfigs.map((c) => [c.toolSlug, c]));

  return allTools.map((tool) => {
    const override = configMap.get(tool.slug);
    return {
      ...tool,
      status: override ? override.status : true,
      priority: override?.priority ?? tool.priority ?? 999,
      displayOrder: override?.displayOrder ?? 0,
    };
  }).sort((a, b) => {
    if ((a as any).displayOrder !== (b as any).displayOrder) {
      return (a as any).displayOrder - (b as any).displayOrder;
    }
    if ((a as any).priority !== (b as any).priority) {
      return (a as any).priority - (b as any).priority;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Returns all tools that are enabled based on MongoDB ToolConfig overrides.
 * Also ensures that the tool's category is enabled.
 */
export async function getEffectiveTools(): Promise<ToolConfig[]> {
  const [allToolsWithConfig, effectiveCategories] = await Promise.all([
    getAllToolsWithConfig(),
    getEffectiveCategories(),
  ]);

  const enabledCategorySlugs = new Set(effectiveCategories.map((c) => c.slug));

  return allToolsWithConfig
    // A tool is visible if BOTH the tool is enabled AND its category is enabled
    .filter((tool) => (tool as any).status === true && enabledCategorySlugs.has(tool.category));
}

export async function getEffectiveTool(slug: string): Promise<ToolConfig | undefined> {
  const tools = await getEffectiveTools();
  return tools.find((t) => t.slug === slug);
}

export async function getEffectiveToolsByCategory(): Promise<Record<CategorySlug, ToolConfig[]>> {
  const tools = await getEffectiveTools();
  const byCategory: Record<string, ToolConfig[]> = {};
  
  for (const tool of tools) {
    if (!byCategory[tool.category]) {
      byCategory[tool.category] = [];
    }
    byCategory[tool.category].push(tool);
  }
  
  return byCategory as Record<CategorySlug, ToolConfig[]>;
}
