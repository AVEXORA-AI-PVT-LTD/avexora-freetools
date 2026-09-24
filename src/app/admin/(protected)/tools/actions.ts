"use server";

import { hasPermission } from "@/lib/admin/permissions";
import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export async function toggleToolStatus(slug: string, status: boolean) {
  const user = await requireAdminAuth();
  
  if (!hasPermission(user.role, "tools.toggle")) {
    throw new Error("Unauthorized");
  }
  
  await prisma.toolConfig.upsert({
    where: { toolSlug: slug },
    create: {
      toolSlug: slug,
      categorySlug: "uncategorized",
      status,
      updatedBy: user.id
    },
    update: {
      status,
      updatedBy: user.id
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: status ? "TOOL_ACTIVATED" : "TOOL_DISABLED",
      targetType: "TOOL",
      targetId: slug,
      metadata: { status }
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/tools");
  return { success: true };
}

export async function bulkUpdateTools(
  slugs: string[], 
  action: "publish" | "unpublish" | "feature" | "unfeature" | "delete",
  options?: { categorySlug?: string }
) {
  const user = await requireAdminAuth();
  
  if (action === "delete" && !hasPermission(user.role, "tools.delete")) throw new Error("Unauthorized");
  if ((action === "publish" || action === "unpublish") && !hasPermission(user.role, "tools.toggle")) throw new Error("Unauthorized");
  if ((action === "feature" || action === "unfeature" || options?.categorySlug) && !hasPermission(user.role, "tools.edit")) throw new Error("Unauthorized");
  
  const now = new Date();
  
  const { allTools } = await import("@/tools/registry");
  const dynamicTools = await prisma.dynamicTool.findMany();
  
  const getCategory = (slug: string) => {
    const s = allTools.find(t => t.slug === slug);
    if (s) return s.category;
    const d = dynamicTools.find(d => d.slug === slug);
    if (d) return d.categorySlug;
    return "uncategorized";
  };

  const results = { success: 0, failed: 0 };
  
  for (const slug of slugs) {
    try {
      if (action === "delete") {
        const isDynamic = dynamicTools.some(d => d.slug === slug);
        if (isDynamic) {
          await prisma.dynamicTool.delete({ where: { slug } }).catch(() => {});
          await prisma.toolConfig.delete({ where: { toolSlug: slug } }).catch(() => {});
        } else {
          await prisma.toolConfig.upsert({
            where: { toolSlug: slug },
            create: { toolSlug: slug, categorySlug: getCategory(slug), status: false, updatedBy: user.id },
            update: { status: false, updatedBy: user.id }
          });
        }
      } else {
        const updateData: Prisma.ToolConfigUpdateInput = { updatedBy: user.id };
        if (action === "publish") updateData.status = true;
        if (action === "unpublish") updateData.status = false;
        if (action === "feature") updateData.featured = true;
        if (action === "unfeature") updateData.featured = false;
        if (options?.categorySlug) updateData.categorySlug = options.categorySlug;

        await prisma.toolConfig.upsert({
          where: { toolSlug: slug },
          create: {
            toolSlug: slug,
            categorySlug: options?.categorySlug || getCategory(slug),
            status: action === "publish" ? true : (action === "unpublish" ? false : true),
            featured: action === "feature" ? true : false,
            updatedBy: user.id
          },
          update: updateData
        });
      }
      results.success++;
    } catch (e) {
      results.failed++;
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: `BULK_${action.toUpperCase()}_TOOLS`,
      targetType: "TOOL",
      metadata: { count: slugs.length, slugs, results }
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/tools");
  
  return results;
}
