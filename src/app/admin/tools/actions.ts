"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { hasPermission } from "@/lib/admin/permissions";
import { allTools } from "@/tools/registry";
import { revalidatePath } from "next/cache";

export async function updateToolStatus(slug: string, status: boolean) {
  try {
    const user = await requireAdminAuth();
    if (!hasPermission(user.role, "tools.toggle")) {
      return { success: false, error: "You do not have permission to modify tools." };
    }

    const toolExists = allTools.some((t) => t.slug === slug);
    if (!toolExists) {
      return { success: false, error: "Tool not found in registry." };
    }

    if (typeof status !== "boolean") {
      return { success: false, error: "Invalid status value." };
    }

    const tool = allTools.find((t) => t.slug === slug)!;

    await prisma.toolConfig.upsert({
      where: { toolSlug: slug },
      update: { status },
      create: { toolSlug: slug, categorySlug: tool.category, status },
    });

    revalidatePath("/");
    revalidatePath(`/${tool.category}`);
    revalidatePath(`/${tool.category}/${tool.slug}`);
    revalidatePath("/(public)", "layout"); // For search updates if any

    return { success: true };
  } catch (error) {
    console.error("[updateToolStatus Error]:", error);
    return { success: false, error: "Unable to update tool. Please try again." };
  }
}
