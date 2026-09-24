import { prisma } from "@/server/db";
import { categories as staticCategories } from "@/tools/categories";
import type { Prisma } from "@prisma/client";
import type { CategoryDef } from "@/types/tools";

/** A category as served publicly: static definition merged with its DB override (or a DB-only category). */
export interface ActiveCategory extends Omit<CategoryDef, "slug"> {
  slug: string;
  status: boolean;
  featured: boolean;
  displayOrder: number;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  seoMetadata: Prisma.JsonValue;
  id: string | null;
}

/** A category row for the admin list: static or DB-only, with tool count. */
export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: boolean;
  featured: boolean;
  displayOrder: number;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
  toolCount: number;
  isStatic: boolean;
  hasDbConfig: boolean;
}

export async function getActiveCategories() {
  const dbConfigs = await prisma.categoryConfig.findMany({
    orderBy: { displayOrder: "asc" }
  });

  const dbConfigMap = new Map(dbConfigs.map(c => [c.slug, c]));

  // Merge static with DB, prioritizing DB config if it exists
  const merged: ActiveCategory[] = staticCategories.map(staticCat => {
    const override = dbConfigMap.get(staticCat.slug);
    return {
      ...staticCat,
      name: override?.name || staticCat.name,
      description: override?.description || staticCat.description,
      status: override ? override.status : true,
      featured: override?.featured ?? false,
      displayOrder: override?.displayOrder ?? 0,
      icon: override?.icon || null,
      image: override?.image || null,
      parentId: override?.parentId || null,
      seoMetadata: override?.seoMetadata || null,
      id: override?.id || null,
    };
  });

  // Add DB-only categories (newly created from Admin panel)
  dbConfigs.forEach(dbCat => {
    if (!staticCategories.some(s => s.slug === dbCat.slug)) {
      merged.push({
        slug: dbCat.slug,
        name: dbCat.name,
        shortName: dbCat.name, // fallback
        description: dbCat.description || "",
        ebosModule: "Custom",
        ebosPath: "/",
        ctaHeadline: "Explore Tools",
        ctaBody: "Try our latest free tools.",
        status: dbCat.status,
        featured: dbCat.featured,
        displayOrder: dbCat.displayOrder,
        icon: dbCat.icon,
        image: dbCat.image,
        parentId: dbCat.parentId,
        seoMetadata: dbCat.seoMetadata,
        id: dbCat.id,
      });
    }
  });

  // Filter out inactive ones
  return merged.filter(c => c.status !== false).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getAllCategoriesAdmin() {
  const dbConfigs = await prisma.categoryConfig.findMany({
    orderBy: { displayOrder: "asc" }
  });

  const dbConfigMap = new Map(dbConfigs.map(c => [c.slug, c]));
  
  // Also fetch tool counts
  const toolCountsAgg = await prisma.toolConfig.groupBy({
    by: ['categorySlug'],
    _count: {
      toolSlug: true
    }
  });
  const toolCountMap = new Map(toolCountsAgg.map(a => [a.categorySlug, a._count.toolSlug]));

  const merged: AdminCategory[] = staticCategories.map(staticCat => {
    const override = dbConfigMap.get(staticCat.slug);
    return {
      id: override?.id || `static-${staticCat.slug}`,
      slug: staticCat.slug,
      name: override?.name || staticCat.name,
      description: override?.description || staticCat.description,
      status: override ? override.status : true,
      featured: override?.featured ?? false,
      displayOrder: override?.displayOrder ?? 0,
      icon: override?.icon || null,
      image: override?.image || null,
      parentId: override?.parentId || null,
      updatedAt: override?.updatedAt || null,
      updatedBy: override?.updatedBy || null,
      toolCount: toolCountMap.get(staticCat.slug) || 0, // Wait, tools can also be static.
      isStatic: true,
      hasDbConfig: !!override
    };
  });

  // Add DB-only
  dbConfigs.forEach(dbCat => {
    if (!staticCategories.some(s => s.slug === dbCat.slug)) {
      merged.push({
        id: dbCat.id,
        slug: dbCat.slug,
        name: dbCat.name,
        description: dbCat.description || "",
        status: dbCat.status,
        featured: dbCat.featured,
        displayOrder: dbCat.displayOrder,
        icon: dbCat.icon || null,
        image: dbCat.image || null,
        parentId: dbCat.parentId || null,
        updatedAt: dbCat.updatedAt,
        updatedBy: dbCat.updatedBy,
        toolCount: toolCountMap.get(dbCat.slug) || 0,
        isStatic: false,
        hasDbConfig: true
      });
    }
  });

  return merged.sort((a, b) => a.displayOrder - b.displayOrder);
}
