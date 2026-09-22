import { isDatabaseConfigured, prisma } from "@/server/db";
import { allTools, toolsByCategory as staticToolsByCategory } from "@/tools/registry";
import { getEffectiveCategories } from "@/server/categories";
import { memoize } from "@/server/cache";
import type { ToolConfig, CategorySlug } from "@/types/tools";

export async function getAllToolsWithConfig(): Promise<ToolConfig[]> {
  // Skip the DB during tests or when no usable connection string is set.
  if (process.env.NODE_ENV === "test" || !isDatabaseConfigured()) {
    return allTools.map((tool) => ({ ...tool, status: true }));
  }

  const [toolConfigs, dynamicTools] = await Promise.all([
    prisma.toolConfig?.findMany().catch(() => []) ?? [],
    prisma.dynamicTool?.findMany().catch(() => []) ?? [],
  ]);

  const configMap = new Map(toolConfigs.map((c) => [c.toolSlug, c]));

  // Create fallback renderer configs for dynamic tools
  const dynamicToolConfigs: ToolConfig[] = dynamicTools.map((dt) => {
    const base = {
      slug: dt.slug,
      category: dt.categorySlug as CategorySlug,
      name: dt.name,
      tagline: "This tool is currently under configuration.",
      seoDescription: `A ${dt.type} tool for ${dt.name}.`,
      about: ["This tool was registered by an administrator and is awaiting full configuration."],
      faq: [],
      related: [],
      priority: 999,
      isDynamic: true, // Internal flag
    };

    if (dt.type === "calculator") {
      return { ...base, kind: "calculator", fields: [], compute: () => ({ error: "Not configured yet." }) } as ToolConfig;
    } else if (dt.type === "ai-writer") {
      return { ...base, kind: "ai-writer", fields: [] } as ToolConfig;
    } else if (dt.type === "file-tool") {
      // Fake a component type for type safety, though it shouldn't actually be rendered without proper UI
      return { ...base, kind: "file-tool", component: () => null } as ToolConfig;
    } else {
      // Generator
      return { ...base, kind: "generator", fields: [], generate: () => ({ error: "Not configured yet." }) } as ToolConfig;
    }
  });

  const mergedTools = [...allTools, ...dynamicToolConfigs];

  return mergedTools.map((tool): ToolConfig => {
    const override = configMap.get(tool.slug);
    return {
      ...tool,
      status: override ? override.status : true,
      priority: override?.priority ?? tool.priority ?? 999,
      displayOrder: override?.displayOrder ?? 0,
    };
  }).sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    }
    if (a.priority !== b.priority) {
      return (a.priority ?? 999) - (b.priority ?? 999);
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
    .filter((tool) => tool.status === true && enabledCategorySlugs.has(tool.category));
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
