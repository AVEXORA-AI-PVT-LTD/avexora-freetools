"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { hasPermission } from "@/lib/admin/permissions";
import { allTools } from "@/tools/registry";
import { revalidatePath } from "next/cache";

export async function reorderTools(payload: { categorySlug: string; orderedToolSlugs: string[] }) {
  try {
    const user = await requireAdminAuth();
    if (!hasPermission(user.role, "tools.reorder")) {
      return { success: false, error: "You do not have permission to reorder tools." };
    }

    const { categorySlug, orderedToolSlugs } = payload;

    if (!categorySlug || !Array.isArray(orderedToolSlugs)) {
      return { success: false, error: "Invalid payload format." };
    }

    // Validate tools
    const categoryTools = allTools.filter(t => t.category === categorySlug);
    const categoryToolSlugs = new Set(categoryTools.map(t => t.slug));
    
    // Check for duplicates
    const slugSet = new Set(orderedToolSlugs);
    if (slugSet.size !== orderedToolSlugs.length) {
      return { success: false, error: "Duplicate tool slugs found in order payload." };
    }

    // Ensure all slugs submitted belong to this category and exist
    for (const slug of orderedToolSlugs) {
      if (!categoryToolSlugs.has(slug)) {
        return { success: false, error: `Invalid tool slug or tool does not belong to this category: ${slug}` };
      }
    }

    // We do not require ALL tools to be present in the payload (in case some were removed from config),
    // but typically the client will send all of them.

    // Perform bulk update in a transaction
    // Prisma does not have a single bulk update with different values for different rows (like CASE WHEN),
    // so we execute multiple upserts inside a $transaction.
    const updates = orderedToolSlugs.map((slug, index) => {
      return prisma.toolConfig.upsert({
        where: { toolSlug: slug },
        update: { displayOrder: index },
        create: {
          toolSlug: slug,
          categorySlug,
          displayOrder: index,
          status: true // Fallback defaults
        },
      });
    });

    await prisma.$transaction(updates);

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath(`/${categorySlug}`);
    revalidatePath("/admin/tools");
    revalidatePath("/admin/tools/reorder");

    return { success: true };
  } catch (error) {
    console.error("[reorderTools Error]:", error);
    return { success: false, error: "Unable to save tool order." };
  }
}
