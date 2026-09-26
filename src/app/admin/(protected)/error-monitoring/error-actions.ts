"use server";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { logAdminAction } from "@/server/audit";
import { revalidatePath } from "next/cache";
import { allTools as staticTools } from "@/tools/registry";
import { subDays, startOfDay, endOfDay } from "date-fns";

export interface GetErrorLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  errorType?: string;
  severity?: string;
  status?: string;
  toolSlug?: string;
  environment?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getErrorLogsAction(params: GetErrorLogsParams) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.view")) {
    throw new Error("Unauthorized access to Error Monitoring");
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search && params.search.trim()) {
    const query = params.search.trim();
    where.OR = [
      { errorId: { contains: query, mode: "insensitive" } },
      { errorCode: { contains: query, mode: "insensitive" } },
      { message: { contains: query, mode: "insensitive" } },
      { toolSlug: { contains: query, mode: "insensitive" } },
      { requestId: { contains: query, mode: "insensitive" } },
      { endpoint: { contains: query, mode: "insensitive" } },
      { fingerprint: { contains: query, mode: "insensitive" } },
    ];
  }

  if (params.errorType && params.errorType.toUpperCase() !== "ALL") {
    where.errorType = { equals: params.errorType, mode: "insensitive" };
  }
  if (params.severity && params.severity.toUpperCase() !== "ALL") {
    const sevMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    };
    where.severity = sevMap[params.severity.toLowerCase()] || params.severity;
  }
  if (params.status && params.status.toUpperCase() !== "ALL") {
    const statusMap: Record<string, string> = {
      open: "Open",
      investigating: "Investigating",
      resolved: "Resolved",
      ignored: "Ignored",
    };
    where.status = statusMap[params.status.toLowerCase()] || params.status;
  }
  if (params.toolSlug && params.toolSlug.toUpperCase() !== "ALL") {
    where.toolSlug = params.toolSlug;
  }
  if (params.environment && params.environment.toUpperCase() !== "ALL") {
    const envMap: Record<string, string> = {
      production: "Production",
      staging: "Staging",
      development: "Development",
    };
    where.environment = envMap[params.environment.toLowerCase()] || params.environment;
  }

  const orderByField = params.sortBy || "createdAt";
  const orderDirection = params.sortOrder || "desc";

  const [items, totalCount, allCount, openCount, investigatingCount, resolvedCount, ignoredCount, criticalCount, highCount] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderByField]: orderDirection },
    }),
    prisma.errorLog.count({ where }),
    prisma.errorLog.count(),
    prisma.errorLog.count({ where: { status: "Open" } }),
    prisma.errorLog.count({ where: { status: "Investigating" } }),
    prisma.errorLog.count({ where: { status: "Resolved" } }),
    prisma.errorLog.count({ where: { status: "Ignored" } }),
    prisma.errorLog.count({ where: { severity: "Critical", status: { in: ["Open", "Investigating"] } } }),
    prisma.errorLog.count({ where: { severity: "High", status: { in: ["Open", "Investigating"] } } }),
  ]);

  // Fetch associated user emails for items with userId
  const userIds = Array.from(new Set(items.map((item) => item.userId).filter(Boolean))) as string[];
  let userMap: Record<string, { email: string; name?: string | null }> = {};

  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    userMap = Object.fromEntries(users.map((u) => [u.id, { email: u.email, name: u.name }]));
  }

  const formattedItems = items.map((item) => ({
    ...item,
    userEmail: item.userId ? userMap[item.userId]?.email || null : null,
    userName: item.userId ? userMap[item.userId]?.name || null : null,
  }));

  return {
    items: formattedItems,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    counters: {
      all: allCount,
      open: openCount,
      investigating: investigatingCount,
      resolved: resolvedCount,
      ignored: ignoredCount,
      critical: criticalCount,
      high: highCount,
    },
  };
}

export async function getErrorByIdAction(id: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.view")) {
    throw new Error("Unauthorized access");
  }

  const errorLog = await prisma.errorLog.findUnique({
    where: { id },
  });

  if (!errorLog) return null;

  // User Context
  let userContext = null;
  if (errorLog.userId) {
    const user = await prisma.user.findUnique({
      where: { id: errorLog.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: true,
      },
    });

    if (user) {
      const usageCount = await prisma.toolUsage.count({ where: { userId: user.id } }).catch(() => 0);
      userContext = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.subscription?.plan || "free",
        createdAt: user.createdAt,
        totalUsages: usageCount,
      };
    }
  }

  // Tool Context
  let toolContext = null;
  if (errorLog.toolSlug) {
    const staticTool = staticTools.find((t) => t.slug === errorLog.toolSlug);
    const dbTool = await prisma.toolConfig?.findUnique({ where: { toolSlug: errorLog.toolSlug } }).catch(() => null);
    const totalUsages = await prisma.toolUsage?.count({ where: { toolSlug: errorLog.toolSlug } }).catch(() => 0);

    toolContext = {
      slug: errorLog.toolSlug,
      name: staticTool?.name || dbTool?.nameOverride || errorLog.toolSlug,
      category: staticTool?.category || dbTool?.categorySlug || "Tools",
      status: dbTool?.status ?? true,
      totalUsages,
    };
  }

  // Assignee Admin
  let assignedAdmin = null;
  if (errorLog.assignedAdminId) {
    assignedAdmin = await prisma.user.findUnique({
      where: { id: errorLog.assignedAdminId },
      select: { id: true, name: true, email: true },
    });
  }

  // Resolver Admin
  let resolverAdmin = null;
  if (errorLog.resolvedBy) {
    resolverAdmin = await prisma.user.findUnique({
      where: { id: errorLog.resolvedBy },
      select: { id: true, name: true, email: true },
    });
  }

  // Available Admins list for assignment
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin", "editor"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return {
    errorLog,
    userContext,
    toolContext,
    assignedAdmin,
    resolverAdmin,
    admins,
  };
}

export async function updateErrorStatusAction(id: string, status: string, resolutionNote?: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.update")) {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await prisma.errorLog.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Error record not found" };

  const isResolving = status === "Resolved";
  const data: any = {
    status,
    updatedAt: new Date(),
  };

  if (isResolving) {
    data.resolvedAt = new Date();
    data.resolvedBy = session.user?.id;
    if (resolutionNote) data.resolutionNote = resolutionNote.trim();
  } else if (existing.status === "Resolved" && status !== "Resolved") {
    // Reopening error
    data.resolvedAt = null;
    data.resolvedBy = null;
  }

  await prisma.errorLog.update({
    where: { id },
    data,
  });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: existing.errorId,
    metadata: {
      action: "ERROR_LOG_STATUS_CHANGED",
      oldStatus: existing.status,
      newStatus: status,
      resolutionNote,
    },
  });

  revalidatePath("/admin/error-monitoring");
  revalidatePath(`/admin/error-monitoring/${id}`);

  return { success: true };
}

export async function assignErrorAction(id: string, assignedAdminId: string | null) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.assign")) {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await prisma.errorLog.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Error record not found" };

  await prisma.errorLog.update({
    where: { id },
    data: {
      assignedAdminId: assignedAdminId || null,
      updatedAt: new Date(),
    },
  });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: existing.errorId,
    metadata: {
      action: "ERROR_LOG_ASSIGNED",
      assignedAdminId,
    },
  });

  revalidatePath("/admin/error-monitoring");
  revalidatePath(`/admin/error-monitoring/${id}`);

  return { success: true };
}

export async function addErrorInternalNoteAction(id: string, noteText: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.update")) {
    return { success: false, error: "Unauthorized" };
  }

  if (!noteText.trim()) return { success: false, error: "Note text cannot be empty" };

  const existing = await prisma.errorLog.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Error record not found" };

  const existingNotes = (existing.internalNotes as Array<any>) || [];
  const newNote = {
    id: `note_${Date.now()}`,
    authorId: session.user?.id,
    authorName: session.user?.name || session.user?.email || "Admin",
    note: noteText.trim(),
    createdAt: new Date().toISOString(),
  };

  await prisma.errorLog.update({
    where: { id },
    data: {
      internalNotes: [...existingNotes, newNote],
      updatedAt: new Date(),
    },
  });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: existing.errorId,
    metadata: {
      action: "ERROR_LOG_NOTE_ADDED",
      noteId: newNote.id,
    },
  });

  revalidatePath(`/admin/error-monitoring/${id}`);
  return { success: true };
}

export async function deleteErrorAction(id: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.delete")) {
    return { success: false, error: "Unauthorized to delete error logs" };
  }

  const existing = await prisma.errorLog.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Error record not found" };

  await prisma.errorLog.delete({ where: { id } });

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: existing.errorId,
    metadata: {
      action: "ERROR_LOG_DELETED",
    },
  });

  revalidatePath("/admin/error-monitoring");
  return { success: true };
}

export async function bulkUpdateErrorsAction(
  ids: string[],
  action: "mark_open" | "mark_investigating" | "mark_resolved" | "mark_ignored" | "delete",
  payload?: { resolutionNote?: string }
) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.update")) {
    return { success: false, error: "Unauthorized" };
  }

  if (!ids || ids.length === 0) return { success: false, error: "No error records selected" };

  if (action === "delete") {
    if (!hasPermission(session.user?.role, "errors.delete")) {
      return { success: false, error: "Unauthorized to delete error logs" };
    }
    await prisma.errorLog.deleteMany({
      where: { id: { in: ids } },
    });
  } else {
    const statusMap = {
      mark_open: "Open",
      mark_investigating: "Investigating",
      mark_resolved: "Resolved",
      mark_ignored: "Ignored",
    };
    const newStatus = statusMap[action];
    const isResolving = newStatus === "Resolved";

    await prisma.errorLog.updateMany({
      where: { id: { in: ids } },
      data: {
        status: newStatus,
        resolvedAt: isResolving ? new Date() : undefined,
        resolvedBy: isResolving ? session.user?.id : undefined,
        resolutionNote: isResolving && payload?.resolutionNote ? payload.resolutionNote : undefined,
        updatedAt: new Date(),
      },
    });
  }

  await logAdminAction({
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: `BULK_${ids.length}`,
    metadata: {
      action: `BULK_ERROR_${action.toUpperCase()}`,
      count: ids.length,
    },
  });

  revalidatePath("/admin/error-monitoring");
  return { success: true };
}

export async function getErrorAnalyticsAction() {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "errors.view")) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);

  const [totalErrors, openErrors, criticalErrors, todayErrors, byType, bySeverity, byEnv] = await Promise.all([
    prisma.errorLog.count(),
    prisma.errorLog.count({ where: { status: "Open" } }),
    prisma.errorLog.count({ where: { severity: "Critical", status: { in: ["Open", "Investigating"] } } }),
    prisma.errorLog.count({ where: { createdAt: { gte: startToday, lte: endToday } } }),
    prisma.errorLog.groupBy({ by: ["errorType"], _count: true }),
    prisma.errorLog.groupBy({ by: ["severity"], _count: true }),
    prisma.errorLog.groupBy({ by: ["environment"], _count: true }),
  ]);

  return {
    totalErrors,
    openErrors,
    criticalErrors,
    todayErrors,
    byType: byType.map((b) => ({ type: b.errorType, count: b._count })),
    bySeverity: bySeverity.map((b) => ({ severity: b.severity, count: b._count })),
    byEnv: byEnv.map((b) => ({ environment: b.environment, count: b._count })),
  };
}
