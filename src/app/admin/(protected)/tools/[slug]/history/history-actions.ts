"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";

export async function restoreToolRevision(revisionId: string) {
  const user = await requireAdminAuth();
  
  if (!hasPermission(user.role, "tools.version.restore")) {
    return { success: false, error: "Unauthorized: You don't have permission to restore versions." };
  }

  try {
    const revision = await prisma.toolRevision.findUnique({
      where: { id: revisionId }
    });

    if (!revision) {
      return { success: false, error: "Revision not found." };
    }

    const tool = await prisma.toolConfig.findUnique({
      where: { toolSlug: revision.toolSlug }
    });

    if (!tool) {
      return { success: false, error: "Tool not found." };
    }

    const snap = revision.snapshot as any;
    
    // Create the "new" version string based on restore
    const newVersionStr = `${revision.version}-restored-${Date.now().toString().slice(-4)}`;

    // Update tool
    await prisma.toolConfig.update({
      where: { toolSlug: revision.toolSlug },
      data: {
        currentVersion: newVersionStr,
        categorySlug: snap.categorySlug || tool.categorySlug,
        status: snap.status ?? tool.status,
        featured: snap.featured ?? tool.featured,
        pricing: snap.pricing || tool.pricing,
        nameOverride: snap.nameOverride || tool.nameOverride,
        description: snap.description || tool.description,
        subCategory: snap.subCategory || tool.subCategory,
        tags: snap.tags || tool.tags,
        icon: snap.icon || tool.icon,
        thumbnail: snap.thumbnail || tool.thumbnail,
        homepageVisible: snap.homepageVisible ?? tool.homepageVisible,
        content: snap.content || tool.content,
        runtimeConfig: snap.runtimeConfig || tool.runtimeConfig,
        technicalConfig: snap.technicalConfig || tool.technicalConfig,
        publishingConfig: snap.publishingConfig || tool.publishingConfig,
        seoMetadata: snap.seoMetadata || tool.seoMetadata,
        updatedBy: user.id,
      }
    });

    // Create a new revision marking it as Restored
    await prisma.toolRevision.create({
      data: {
        toolSlug: revision.toolSlug,
        version: newVersionStr,
        changelog: `Restored from version ${revision.version}`,
        revisionType: "Restored",
        isPublished: snap.status ?? tool.status,
        createdBy: user.id,
        snapshot: snap,
      }
    });

    // Log the restore event
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role || "unknown",
        action: "TOOL_VERSION_RESTORED",
        targetType: "TOOL",
        targetId: revision.toolSlug,
        metadata: { fromVersion: tool.currentVersion, restoredVersion: revision.version, newVersion: newVersionStr }
      }
    });

    revalidatePath("/");
    revalidatePath("/admin/tools");
    revalidatePath(`/${tool.categorySlug}/${revision.toolSlug}`);

    return { success: true };
  } catch (err: any) {
    console.error("Restore error:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
