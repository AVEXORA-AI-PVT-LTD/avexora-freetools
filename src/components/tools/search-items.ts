import type { CategoryDef, CategorySlug, ToolConfig } from "@/types/tools";

export interface SearchItem {
  name: string;
  slug: string;
  category: string;
  categoryName: string;
}

export function buildSearchItems(
  categories: CategoryDef[],
  toolsByCategory: Record<CategorySlug, ToolConfig[]>,
): SearchItem[] {
  return categories.flatMap((c) =>
    toolsByCategory[c.slug].map((t) => ({
      name: t.name,
      slug: t.slug,
      category: c.slug,
      categoryName: c.shortName,
    })),
  );
}