"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";

export async function reorderToolsAction(
  items: { slug: string; category: string; displayOrder: number }[]
) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "tools.edit")) {
    throw new Error("Unauthorized");
  }

  // We need to upsert ToolConfig for each because static tools might not have one yet
  for (const item of items) {
    await prisma.toolConfig.upsert({
      where: { toolSlug: item.slug },
      create: {
        toolSlug: item.slug,
        categorySlug: item.category,
        displayOrder: item.displayOrder,
        updatedBy: user.id,
      },
      update: {
        displayOrder: item.displayOrder,
        updatedBy: user.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: "TOOLS_REORDERED",
      targetType: "CATEGORY",
      targetId: items[0]?.category || "unknown",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/tools");
  if (items[0]?.category) {
    revalidatePath(`/${items[0].category}`);
  }

  return { success: true };
}
