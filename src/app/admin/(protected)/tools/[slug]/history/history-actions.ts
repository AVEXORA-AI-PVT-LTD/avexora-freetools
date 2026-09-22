"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";

/** Bump the patch number of a semver string, keeping it in x.y.z form. */
function bumpPatch(version: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!m) return "1.0.1";
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

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
    
    // The restored tool becomes the next patch of the restored version (x.y.z form).
    const newVersionStr = bumpPatch(revision.version);
    const newCategory = snap.categorySlug || tool.categorySlug;

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
    revalidatePath(`/${newCategory}/${revision.toolSlug}`);

    return { success: true };
  } catch (err: any) {
    console.error("Restore error:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
