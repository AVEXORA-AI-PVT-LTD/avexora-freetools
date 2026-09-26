"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { saveFileToStorage, deleteFileFromStorage } from "@/server/storage";
import { revalidatePath } from "next/cache";

export async function getMediaAssetsAction(params: {
  page?: number;
  search?: string;
  assetType?: string;
  mimeType?: string;
  folderId?: string;
  tag?: string;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc" | "largest" | "smallest";
}) {
  await requireAdminAuth("media.view");

  const page = params.page || 1;
  const limit = 24;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    const searchRegex = { contains: params.search, mode: "insensitive" };
    where.OR = [
      { filename: searchRegex },
      { originalFilename: searchRegex },
      { title: searchRegex },
      { altText: searchRegex },
      { tags: { hasSome: [params.search] } }
    ];
  }

  if (params.assetType && params.assetType !== "all") {
    where.assetType = params.assetType;
  }

  if (params.mimeType && params.mimeType !== "all") {
    where.mimeType = { startsWith: params.mimeType };
  }

  if (params.folderId && params.folderId !== "all") {
    if (params.folderId === "root") {
      where.folderId = null;
    } else {
      where.folderId = params.folderId;
    }
  }

  if (params.tag && params.tag !== "all") {
    where.tags = { has: params.tag };
  }

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "oldest") orderBy = { createdAt: "asc" };
  else if (params.sort === "name_asc") orderBy = { filename: "asc" };
  else if (params.sort === "name_desc") orderBy = { filename: "desc" };
  else if (params.sort === "largest") orderBy = { size: "desc" };
  else if (params.sort === "smallest") orderBy = { size: "asc" };

  if (!prisma.mediaAsset) {
    return { items: [], total: 0, pages: 1 };
  }

  try {
    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { folder: true }
      }),
      prisma.mediaAsset.count({ where })
    ]);

    return {
      items: assets,
      total,
      pages: Math.ceil(total / limit)
    };
  } catch (err) {
    console.error("Failed to fetch media assets:", err);
    return { items: [], total: 0, pages: 1 };
  }
}

export async function uploadMediaAction(formData: FormData) {
  const admin = await requireAdminAuth("media.upload");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  const folderId = formData.get("folderId") as string | null;
  const assetType = (formData.get("assetType") as string) || "image";
  const altText = formData.get("altText") as string | null;
  const title = formData.get("title") as string | null;
  const rawTags = formData.get("tags") as string | null;
  const tags = rawTags ? rawTags.split(",").map(t => t.trim()).filter(Boolean) : [];

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await saveFileToStorage(
    buffer,
    file.name,
    file.type || "application/octet-stream"
  );

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: uploadResult.originalFilename,
      originalFilename: uploadResult.originalFilename,
      storageKey: uploadResult.storageKey,
      storageProvider: uploadResult.storageProvider,
      storageUrl: uploadResult.storageUrl,
      cdnUrl: uploadResult.cdnUrl,
      mimeType: uploadResult.mimeType,
      extension: uploadResult.extension,
      size: uploadResult.size,
      assetType,
      altText: altText?.trim() || null,
      title: title?.trim() || null,
      tags,
      folderId: folderId && folderId !== "root" ? folderId : null,
      uploadedBy: admin.name || admin.email || admin.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "MEDIA_UPLOADED",
      targetType: "MEDIA_ASSET",
      targetId: asset.id,
      metadata: { filename: asset.filename, size: asset.size, cdnUrl: asset.cdnUrl }
    }
  });

  revalidatePath("/admin/media");
  return asset;
}

export async function updateMediaMetadataAction(id: string, data: {
  filename?: string;
  altText?: string;
  title?: string;
  description?: string;
  tags?: string[];
  assetType?: string;
  folderId?: string | null;
}) {
  const admin = await requireAdminAuth("media.edit");

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) throw new Error("Media asset not found");

  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      filename: data.filename?.trim() || existing.filename,
      altText: data.altText !== undefined ? data.altText?.trim() || null : existing.altText,
      title: data.title !== undefined ? data.title?.trim() || null : existing.title,
      description: data.description !== undefined ? data.description?.trim() || null : existing.description,
      tags: data.tags !== undefined ? data.tags : existing.tags,
      assetType: data.assetType || existing.assetType,
      folderId: data.folderId !== undefined ? (data.folderId === "root" ? null : data.folderId) : existing.folderId,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "MEDIA_UPDATED",
      targetType: "MEDIA_ASSET",
      targetId: id,
      metadata: { filename: updated.filename }
    }
  });

  revalidatePath("/admin/media");
  return updated;
}

export async function replaceMediaAssetAction(id: string, formData: FormData) {
  const admin = await requireAdminAuth("media.replace");

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) throw new Error("Media asset not found");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No replacement file provided");

  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload new binary file to storage
  const uploadResult = await saveFileToStorage(
    buffer,
    file.name,
    file.type || existing.mimeType
  );

  // Clean up old storage file
  if (existing.storageKey) {
    await deleteFileFromStorage(existing.storageKey);
  }

  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      storageKey: uploadResult.storageKey,
      storageUrl: uploadResult.storageUrl,
      cdnUrl: uploadResult.cdnUrl,
      mimeType: uploadResult.mimeType,
      extension: uploadResult.extension,
      size: uploadResult.size,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "MEDIA_REPLACED",
      targetType: "MEDIA_ASSET",
      targetId: id,
      metadata: { newSize: updated.size, cdnUrl: updated.cdnUrl }
    }
  });

  revalidatePath("/admin/media");
  return updated;
}

export async function checkMediaUsageAction(cdnUrl: string) {
  await requireAdminAuth("media.view");

  if (!cdnUrl) return { inUse: false, usageCount: 0, references: [] };

  const references: string[] = [];

  // Check Category Configs (icons/images)
  const catMatch = await prisma.categoryConfig.findFirst({
    where: {
      OR: [
        { icon: cdnUrl },
        { image: cdnUrl }
      ]
    }
  });
  if (catMatch) references.push(`Category: ${catMatch.name || catMatch.slug}`);

  // Check Tool Configs
  const toolMatch = await prisma.toolConfig.findFirst({
    where: {
      OR: [
        { icon: cdnUrl },
        { thumbnail: cdnUrl }
      ]
    }
  });
  if (toolMatch) references.push(`Tool: ${toolMatch.nameOverride || toolMatch.toolSlug}`);

  // Check Content Items (Blog posts / Guides)
  const contentMatch = await prisma.contentItem.findFirst({
    where: {
      OR: [
        { featuredImage: cdnUrl },
        { ogImage: cdnUrl }
      ]
    }
  });
  if (contentMatch) references.push(`Content: ${contentMatch.title}`);

  return {
    inUse: references.length > 0,
    usageCount: references.length,
    references
  };
}

export async function deleteMediaAssetAction(id: string) {
  const admin = await requireAdminAuth("media.delete");

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) throw new Error("Media asset not found");

  // Clean up physical file
  if (existing.storageKey) {
    await deleteFileFromStorage(existing.storageKey);
  }

  await prisma.mediaAsset.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "MEDIA_DELETED",
      targetType: "MEDIA_ASSET",
      targetId: id,
      metadata: { filename: existing.filename, storageKey: existing.storageKey }
    }
  });

  revalidatePath("/admin/media");
  return { success: true };
}

export async function getMediaFoldersAction() {
  await requireAdminAuth("media.view");
  if (!prisma.mediaFolder) return [];
  try {
    return await prisma.mediaFolder.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } }
    });
  } catch (err) {
    console.error("Failed to fetch media folders:", err);
    return [];
  }
}

export async function createMediaFolderAction(name: string, parentId?: string | null) {
  const admin = await requireAdminAuth("media.manage_folders");

  if (!name || !name.trim()) throw new Error("Folder name is required");

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");

  const folder = await prisma.mediaFolder.create({
    data: {
      name: name.trim(),
      slug,
      parentId: parentId || null,
      createdBy: admin.name || admin.email || admin.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "MEDIA_FOLDER_CREATED",
      targetType: "MEDIA_FOLDER",
      targetId: folder.id,
      metadata: { name: folder.name }
    }
  });

  revalidatePath("/admin/media");
  return folder;
}

export async function bulkMediaAction(ids: string[], action: "move" | "tag" | "delete", payload?: any) {
  const permission = action === "delete" ? "media.delete" : "media.move";
  const admin = await requireAdminAuth(permission as any);

  if (action === "move") {
    const folderId = payload?.folderId === "root" ? null : payload?.folderId;
    await prisma.mediaAsset.updateMany({
      where: { id: { in: ids } },
      data: { folderId }
    });
  } else if (action === "tag") {
    const newTag = payload?.tag?.trim();
    if (newTag) {
      for (const id of ids) {
        await prisma.mediaAsset.update({
          where: { id },
          data: { tags: { push: newTag } }
        });
      }
    }
  } else if (action === "delete") {
    const assets = await prisma.mediaAsset.findMany({ where: { id: { in: ids } } });
    for (const asset of assets) {
      if (asset.storageKey) await deleteFileFromStorage(asset.storageKey);
    }
    await prisma.mediaAsset.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: `MEDIA_BULK_${action.toUpperCase()}`,
      targetType: "MEDIA_ASSET",
      metadata: { count: ids.length, ids }
    }
  });

  revalidatePath("/admin/media");
  return { success: true };
}
