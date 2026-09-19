"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { hasPermission } from "@/lib/admin/permissions";
import { categories as staticCategories } from "@/tools/categories";
import { revalidatePath } from "next/cache";
import type { CategorySlug } from "@/types/tools";

export async function reorderCategories(orderedSlugs: string[]) {
  try {
    const user = await requireAdminAuth();
    if (!hasPermission(user.role, "tools.reorder")) {
      return { success: false, error: "You do not have permission to reorder categories." };
    }

    if (!Array.isArray(orderedSlugs)) {
      return { success: false, error: "Invalid payload format." };
    }

    const allSlugs = new Set(staticCategories.map(c => c.slug));
    const slugSet = new Set(orderedSlugs);

    if (slugSet.size !== orderedSlugs.length) {
      return { success: false, error: "Duplicate category slugs found." };
    }

    for (const slug of orderedSlugs) {
      if (!allSlugs.has(slug as CategorySlug)) {
        return { success: false, error: `Invalid category slug: ${slug}` };
      }
    }

    const updates = orderedSlugs.map((slug, index) => {
      return prisma.categoryConfig.upsert({
        where: { slug },
        update: { displayOrder: index },
        create: {
          slug,
          displayOrder: index,
          status: true // Fallback default
        },
      });
    });

    await prisma.$transaction(updates);

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/categories/reorder");
    // We cannot easily revalidate all dynamic routes using this format without triggering a layout revalidation
    revalidatePath("/(public)", "layout"); 

    return { success: true };
  } catch (error) {
    console.error("[reorderCategories Error]:", error);
    return { success: false, error: "Unable to save category order." };
  }
}
