"use server";

import { prisma } from "@/server/db";
import { requireAdminAuth } from "@/server/admin-auth";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { revalidatePath } from "next/cache";

export interface AdSlotFormData {
  name: string;
  description?: string;
  placement: string;
  device: string;
  adProvider: string;
  adReference?: string;
  customHtml?: string;
  destinationUrl?: string;
  imageUrl?: string;
  priority?: number;
  active?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  categorySlug?: string | null;
  toolSlug?: string | null;
}

export async function getAdsAction(params: {
  page?: number;
  search?: string;
  placement?: string;
  device?: string;
  adProvider?: string;
  active?: string;
}) {
  await requireAdminAuth("ads.view");

  const page = params.page || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    const searchRegex = { contains: params.search, mode: "insensitive" };
    where.OR = [
      { name: searchRegex },
      { description: searchRegex },
      { adReference: searchRegex }
    ];
  }

  if (params.placement && params.placement !== "all") {
    where.placement = params.placement;
  }

  if (params.device && params.device !== "all") {
    where.device = params.device;
  }

  if (params.adProvider && params.adProvider !== "all") {
    where.adProvider = params.adProvider;
  }

  if (params.active === "true") {
    where.active = true;
  } else if (params.active === "false") {
    where.active = false;
  }

  const [ads, total] = await Promise.all([
    prisma.adSlot.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { updatedAt: "desc" }
      ],
      skip,
      take: limit,
    }),
    prisma.adSlot.count({ where })
  ]);

  return {
    items: ads,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getAdByIdAction(id: string) {
  await requireAdminAuth("ads.view");
  return await prisma.adSlot.findUnique({ where: { id } });
}

export async function createAdAction(data: AdSlotFormData) {
  const admin = await requireAdminAuth("ads.create");

  if (!data.name || !data.name.trim()) throw new Error("Ad name is required");
  if (!data.placement) throw new Error("Placement is required");
  if (!data.adProvider) throw new Error("Ad Provider is required");

  let safeCustomHtml = data.customHtml ? sanitizeHtml(data.customHtml) : null;

  const ad = await prisma.adSlot.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      placement: data.placement,
      device: data.device || "all",
      adProvider: data.adProvider,
      adReference: data.adReference?.trim() || null,
      customHtml: safeCustomHtml,
      destinationUrl: data.destinationUrl?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      priority: Number(data.priority) || 1,
      active: data.active !== undefined ? data.active : true,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      categorySlug: data.categorySlug || null,
      toolSlug: data.toolSlug || null,
      createdBy: admin.name || admin.email || admin.id,
      updatedBy: admin.name || admin.email || admin.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "AD_CREATED",
      targetType: "AD_SLOT",
      targetId: ad.id,
      metadata: { name: ad.name, placement: ad.placement, provider: ad.adProvider }
    }
  });

  revalidatePath("/", "layout");
  return ad;
}

export async function updateAdAction(id: string, data: AdSlotFormData) {
  const admin = await requireAdminAuth("ads.edit");

  const existing = await prisma.adSlot.findUnique({ where: { id } });
  if (!existing) throw new Error("Ad slot not found");

  let safeCustomHtml = data.customHtml ? sanitizeHtml(data.customHtml) : null;

  const updated = await prisma.adSlot.update({
    where: { id },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      placement: data.placement,
      device: data.device || "all",
      adProvider: data.adProvider,
      adReference: data.adReference?.trim() || null,
      customHtml: safeCustomHtml,
      destinationUrl: data.destinationUrl?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      priority: Number(data.priority) || 1,
      active: data.active !== undefined ? data.active : existing.active,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      categorySlug: data.categorySlug || null,
      toolSlug: data.toolSlug || null,
      updatedBy: admin.name || admin.email || admin.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "AD_UPDATED",
      targetType: "AD_SLOT",
      targetId: id,
      metadata: { name: updated.name, placement: updated.placement }
    }
  });

  revalidatePath("/", "layout");
  return updated;
}

export async function toggleAdActiveAction(id: string, active: boolean) {
  const admin = await requireAdminAuth(active ? "ads.activate" : "ads.deactivate");

  const updated = await prisma.adSlot.update({
    where: { id },
    data: {
      active,
      updatedBy: admin.name || admin.email || admin.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: active ? "AD_ACTIVATED" : "AD_DEACTIVATED",
      targetType: "AD_SLOT",
      targetId: id,
      metadata: { active }
    }
  });

  revalidatePath("/", "layout");
  return updated;
}

export async function duplicateAdAction(id: string) {
  const admin = await requireAdminAuth("ads.create");

  const existing = await prisma.adSlot.findUnique({ where: { id } });
  if (!existing) throw new Error("Ad slot not found");

  const copy = await prisma.adSlot.create({
    data: {
      name: `${existing.name} (Copy)`,
      description: existing.description,
      placement: existing.placement,
      device: existing.device,
      adProvider: existing.adProvider,
      adReference: existing.adReference,
      customHtml: existing.customHtml,
      destinationUrl: existing.destinationUrl,
      imageUrl: existing.imageUrl,
      priority: existing.priority,
      active: false, // Start copies as inactive
      startDate: existing.startDate,
      endDate: existing.endDate,
      categorySlug: existing.categorySlug,
      toolSlug: existing.toolSlug,
      createdBy: admin.name || admin.email || admin.id,
      updatedBy: admin.name || admin.email || admin.id,
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "AD_DUPLICATED",
      targetType: "AD_SLOT",
      targetId: copy.id,
      metadata: { originalId: id, copyId: copy.id }
    }
  });

  return copy;
}

export async function deleteAdAction(id: string) {
  const admin = await requireAdminAuth("ads.delete");

  const existing = await prisma.adSlot.findUnique({ where: { id } });
  if (!existing) throw new Error("Ad slot not found");

  await prisma.adSlot.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: "AD_DELETED",
      targetType: "AD_SLOT",
      targetId: id,
      metadata: { name: existing.name }
    }
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkUpdateAdsAction(ids: string[], action: "activate" | "deactivate" | "delete") {
  const permission = action === "activate" ? "ads.activate" : action === "deactivate" ? "ads.deactivate" : "ads.delete";
  const admin = await requireAdminAuth(permission as any);

  if (action === "activate") {
    await prisma.adSlot.updateMany({
      where: { id: { in: ids } },
      data: { active: true, updatedBy: admin.name || admin.email || admin.id }
    });
  } else if (action === "deactivate") {
    await prisma.adSlot.updateMany({
      where: { id: { in: ids } },
      data: { active: false, updatedBy: admin.name || admin.email || admin.id }
    });
  } else if (action === "delete") {
    await prisma.adSlot.deleteMany({
      where: { id: { in: ids } }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id || "",
      actorRole: (admin as any).role || "admin",
      action: `ADS_BULK_${action.toUpperCase()}`,
      targetType: "AD_SLOT",
      metadata: { count: ids.length, ids }
    }
  });

  revalidatePath("/", "layout");
  return { success: true };
}
