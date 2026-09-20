"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";
import { allTools } from "@/tools/registry";

export async function reorderToolsAction(
  items: { slug: string; category: string; displayOrder: number }[]
) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "tools.reorder")) {
    throw new Error("Unauthorized");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Invalid order payload.");
  }

  // Validate every item before touching the DB so a caller can't create
  // ToolConfig rows for slugs that don't exist or belong to another category.
  const dynamicSlugs = new Set(
    (await prisma.dynamicTool.findMany({ select: { slug: true } })).map((d) => d.slug),
  );
  const staticTools = new Map(allTools.map((t) => [t.slug, t]));
  const seen = new Set<string>();

  for (const item of items) {
    if (typeof item.slug !== "string" || !item.slug || typeof item.category !== "string" || !item.category) {
      throw new Error("Invalid order item.");
    }
    if (typeof item.displayOrder !== "number" || !Number.isInteger(item.displayOrder) || item.displayOrder < 0) {
      throw new Error("Invalid display order value.");
    }
    if (seen.has(item.slug)) {
      throw new Error(`Duplicate tool slug in order payload: ${item.slug}`);
    }
    seen.add(item.slug);

    if (dynamicSlugs.has(item.slug)) continue;
    const staticTool = staticTools.get(item.slug);
    if (!staticTool) throw new Error(`Unknown tool slug: ${item.slug}`);
    if (staticTool.category !== item.category) {
      throw new Error(`Tool ${item.slug} does not belong to category ${item.category}`);
    }
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
