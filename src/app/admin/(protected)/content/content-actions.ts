"use server";

import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";
import { ContentType, ContentStatus, ContentItem, Prisma } from "@prisma/client";

export async function saveContent(data: Partial<ContentItem> & { slug: string, title: string, contentType: ContentType }) {
  const user = await requireAdminAuth();
  
  const isNew = !data.id;
  if (isNew && !hasPermission(user.role, "content.create")) throw new Error("Unauthorized: Cannot create");
  if (!isNew && !hasPermission(user.role, "content.edit")) throw new Error("Unauthorized: Cannot edit");

  // Determine effective status based on permissions
  let effectiveStatus = data.status || ContentStatus.DRAFT;
  
  if (effectiveStatus === ContentStatus.PUBLISHED && !hasPermission(user.role, "content.publish")) {
    effectiveStatus = ContentStatus.REVIEW; // Fallback for editors
  }
  
  const upsertData: Prisma.ContentItemUncheckedCreateInput = {
    title: data.title,
    slug: data.slug,
    contentType: data.contentType,
    content: data.content || "",
    excerpt: data.excerpt || null,
    featuredImage: data.featuredImage || null,
    status: effectiveStatus,
    tags: data.tags || [],
    category: data.category || null,
    seoTitle: data.seoTitle || null,
    metaDesc: data.metaDesc || null,
    ogTitle: data.ogTitle || null,
    ogDesc: data.ogDesc || null,
    ogImage: data.ogImage || null,
    canonicalUrl: data.canonicalUrl || null,
    noIndex: data.noIndex || false,
    updatedBy: user.id,
    authorId: data.authorId || user.id,
    featured: data.featured || false,
    relatedTools: data.relatedTools || [],
    relatedPosts: data.relatedPosts || [],
    scheduledAt: data.scheduledAt || null,
  };

  if (effectiveStatus === ContentStatus.PUBLISHED && !data.publishedAt) {
    upsertData.publishedAt = new Date();
  } else if (effectiveStatus === ContentStatus.SCHEDULED) {
    upsertData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  }

  let savedItem;
  let versionUpdate: Prisma.IntFieldUpdateOperationsInput | undefined;
  if (isNew) {
    savedItem = await prisma.contentItem.create({
      data: { ...upsertData, authorId: user.id }
    });
  } else {
    // Save previous version
    const existing = await prisma.contentItem.findUnique({ where: { id: data.id } });
    if (existing) {
      await prisma.contentRevision.create({
        data: {
          contentId: existing.id,
          version: existing.version,
          data: existing as unknown as Prisma.InputJsonObject,
          createdBy: user.id
        }
      });
      versionUpdate = { increment: 1 };
    }
    
    savedItem = await prisma.contentItem.update({
      where: { id: data.id },
      data: versionUpdate ? { ...upsertData, version: versionUpdate } : upsertData
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: isNew ? "CONTENT_CREATED" : "CONTENT_UPDATED",
      targetType: "CONTENT",
      targetId: savedItem.id,
      metadata: { slug: savedItem.slug, status: effectiveStatus }
    }
  });

  // Revalidations based on type
  if (effectiveStatus === ContentStatus.PUBLISHED) {
    revalidatePath(`/${savedItem.slug}`);
    revalidatePath(`/blog/${savedItem.slug}`);
    revalidatePath(`/legal/${savedItem.slug}`);
    revalidatePath(`/blog`);
  }
  revalidatePath("/admin/content");

  return { success: true, id: savedItem.id };
}

export async function deleteContent(id: string) {
  const user = await requireAdminAuth();
  if (!hasPermission(user.role, "content.delete")) throw new Error("Unauthorized");

  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (existing) {
    await prisma.contentItem.delete({ where: { id } });
    await prisma.contentRevision.deleteMany({ where: { contentId: id } }); // clean up history
    
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role || "unknown",
        action: "CONTENT_DELETED",
        targetType: "CONTENT",
        targetId: id,
      }
    });

    revalidatePath(`/${existing.slug}`);
    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath(`/legal/${existing.slug}`);
  }

  revalidatePath("/admin/content");
  return { success: true };
}

export async function changeContentStatus(id: string, newStatus: ContentStatus) {
  const user = await requireAdminAuth();
  
  if (newStatus === ContentStatus.PUBLISHED && !hasPermission(user.role, "content.publish")) throw new Error("Unauthorized");
  if (newStatus === ContentStatus.ARCHIVED && !hasPermission(user.role, "content.archive")) throw new Error("Unauthorized");

  const updated = await prisma.contentItem.update({
    where: { id },
    data: { 
      status: newStatus,
      publishedAt: newStatus === ContentStatus.PUBLISHED ? new Date() : undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role || "unknown",
      action: `CONTENT_STATUS_CHANGED`,
      targetType: "CONTENT",
      targetId: id,
      metadata: { status: newStatus }
    }
  });

  revalidatePath("/admin/content");
  revalidatePath(`/${updated.slug}`);
  revalidatePath(`/blog/${updated.slug}`);
  return { success: true };
}
