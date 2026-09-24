"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";
import { categories as staticCategories } from "@/tools/categories";
import type { Prisma } from "@prisma/client";

interface SaveCategoryInput {
  name?: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  status?: boolean;
  featured?: boolean;
  displayOrder?: number;
  seoMetadata?: Prisma.InputJsonValue | null;
  parentId?: string | null;
}

export async function saveCategory(data: SaveCategoryInput) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "categories.create") && !hasPermission(user.role, "categories.edit")) {
    throw new Error("Unauthorized");
  }

  const upsertData = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    icon: data.icon,
    image: data.image,
    status: data.status,
    featured: data.featured,
    displayOrder: data.displayOrder || 0,
    seoMetadata: data.seoMetadata,
    parentId: data.parentId || null,
    updatedBy: user.id,
  };

  const saved = await prisma.categoryConfig.upsert({
    where: { slug: data.slug },
    create: { ...upsertData, createdBy: user.id },
    update: upsertData
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "CATEGORY_SAVED",
      targetType: "CATEGORY",
      targetId: data.slug,
      metadata: { name: data.name }
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/categories");
  
  return { success: true };
}

export async function deleteCategory(slug: string) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "categories.delete")) throw new Error("Unauthorized");

  // Check if tools exist
  const toolsCount = await prisma.toolConfig.count({ where: { categorySlug: slug } });
  
  // also check static tools
  // (We'll assume for simplicity that deleting a category that has tools is blocked)
  if (toolsCount > 0) {
    throw new Error(`Cannot delete category because it contains ${toolsCount} tools in the database. Move them first.`);
  }

  const existing = await prisma.categoryConfig.findUnique({ where: { slug } });
  if (existing) {
    await prisma.categoryConfig.delete({ where: { slug } });
    
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role || "unknown",
        action: "CATEGORY_DELETED",
        targetType: "CATEGORY",
        targetId: slug,
      }
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function reorderCategories(orderedSlugs: string[]) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "categories.reorder")) throw new Error("Unauthorized");

  const ops = orderedSlugs.map((slug, idx) => 
    prisma.categoryConfig.upsert({
      where: { slug },
      create: {
        slug,
        name: staticCategories.find(c => c.slug === slug)?.name || slug,
        displayOrder: idx,
        createdBy: user.id
      },
      update: {
        displayOrder: idx
      }
    })
  );

  await prisma.$transaction(ops);

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "CATEGORY_REORDERED",
      targetType: "CATEGORY",
      targetId: "all",
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function mergeCategories(sourceSlug: string, targetSlug: string) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "categories.merge")) throw new Error("Unauthorized");

  if (sourceSlug === targetSlug) throw new Error("Cannot merge into the same category.");

  // Update all tools that reference the source category
  const updatedCount = await prisma.toolConfig.updateMany({
    where: { categorySlug: sourceSlug },
    data: { categorySlug: targetSlug }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "CATEGORY_MERGED",
      targetType: "CATEGORY",
      targetId: sourceSlug,
      metadata: { targetSlug, toolsMoved: updatedCount.count }
    }
  });

  // Safe delete source category
  await prisma.categoryConfig.delete({ where: { slug: sourceSlug } });

  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/tools");

  return { success: true, toolsMoved: updatedCount.count };
}
