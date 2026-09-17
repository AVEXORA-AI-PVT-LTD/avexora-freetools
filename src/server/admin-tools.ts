import { prisma } from "@/server/db";
import { allTools } from "@/tools/registry";
import type { CategorySlug } from "@/types/tools";
import type { Prisma } from "@prisma/client";

export type AdminTool = {
  name: string;
  slug: string;
  category: CategorySlug;
  type: string;
  status: boolean;
  featured: boolean;
  pricing: string;
  usage: number;
  views: number;
  priority: number;
  displayOrder: number;
  updatedAt: Date;
  updatedBy: string | null;
  seoDescription: string;
  isDynamic: boolean;
};

export async function getAdminToolsData(): Promise<AdminTool[]> {
  const [toolConfigs, dynamicTools, usageCounts] = await Promise.all([
    prisma.toolConfig.findMany().catch(() => []),
    prisma.dynamicTool.findMany().catch(() => []),
    prisma.toolUsage.groupBy({
      by: ['toolSlug'],
      _count: { toolSlug: true },
    }).catch(() => [])
  ]);

  const configMap = new Map(toolConfigs.map((c) => [c.toolSlug, c]));
  const usageMap = new Map(usageCounts.map((u) => [u.toolSlug, u._count.toolSlug]));

  const dynamicToolConfigs = dynamicTools.map((dt) => ({
    name: dt.name,
    slug: dt.slug,
    category: dt.categorySlug as CategorySlug,
    type: dt.type,
    seoDescription: `A ${dt.type} tool for ${dt.name}.`,
    isDynamic: true,
  }));

  const mergedTools = [
    ...allTools.map(t => ({
      name: t.name,
      slug: t.slug,
      category: t.category,
      type: t.kind,
      seoDescription: t.seoDescription || "",
      isDynamic: false,
    })),
    ...dynamicToolConfigs
  ];

  const fallbackDate = new Date(); // Or maybe get the earliest from DB

  return mergedTools.map((tool) => {
    const override = configMap.get(tool.slug);
    const usage = usageMap.get(tool.slug) || 0;

    return {
      ...tool,
      status: override ? override.status : true,
      featured: override?.featured ?? false,
      pricing: override?.pricing ?? "Free",
      priority: override?.priority ?? 999,
      displayOrder: override?.displayOrder ?? 0,
      views: override?.views ?? 0,
      usage,
      updatedAt: override?.updatedAt ?? fallbackDate,
      updatedBy: override?.updatedBy ?? null,
    };
  });
}
