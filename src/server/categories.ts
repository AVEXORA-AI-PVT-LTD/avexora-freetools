import { prisma } from "@/server/db";
import { categories as staticCategories } from "@/tools/categories";

export async function getAllCategoriesWithConfig() {
  const configs = await prisma.categoryConfig?.findMany() ?? [];
  const configMap = new Map(configs.map((c) => [c.slug, c]));

  return staticCategories
    .map((cat) => {
      const override = configMap.get(cat.slug);
      return {
        ...cat,
        status: override ? override.status : true,
        priority: override?.priority ?? 999,
        displayOrder: override?.displayOrder ?? 0,
      };
    })
    .sort((a, b) => {
      if ((a as any).displayOrder !== (b as any).displayOrder) {
        return (a as any).displayOrder - (b as any).displayOrder;
      }
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Returns categories that are enabled based on MongoDB CategoryConfig overrides.
 * Fallbacks to the static registry if no override exists.
 */
export async function getEffectiveCategories() {
  const all = await getAllCategoriesWithConfig();
  return all.filter((cat) => cat.status);
}

export async function getEffectiveCategory(slug: string) {
  const all = await getEffectiveCategories();
  return all.find((c) => c.slug === slug);
}
