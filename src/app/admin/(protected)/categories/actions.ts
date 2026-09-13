"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { hasPermission } from "@/lib/admin/permissions";
import { categories } from "@/tools/categories";
import { revalidatePath } from "next/cache";

export async function updateCategoryStatus(slug: string, status: boolean) {
  try {
    const user = await requireAdminAuth();
    if (!hasPermission(user.role, "categories.toggle")) {
      return { success: false, error: "You do not have permission to modify categories." };
    }

    // Validate the slug against the existing static registry
    const categoryExists = categories.some((c) => c.slug === slug);
    if (!categoryExists) {
      return { success: false, error: "Category not found in registry." };
    }

    if (typeof status !== "boolean") {
      return { success: false, error: "Invalid status value." };
    }

    await prisma.categoryConfig.upsert({
      where: { slug },
      update: { status },
      create: { slug, status },
    });

    // Revalidate public surfaces
    revalidatePath("/");
    revalidatePath(`/${slug}`);
    revalidatePath("/(public)", "layout"); // For header/navigation
    revalidatePath("/admin/categories");
    revalidatePath("/admin/tools");

    return { success: true };
  } catch (error) {
    console.error("[updateCategoryStatus Error]:", error);
    return { success: false, error: "Unable to update category. Please try again." };
  }
}
