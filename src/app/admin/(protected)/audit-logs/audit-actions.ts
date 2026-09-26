"use server";

import { prisma } from "@/server/db";
import { requirePermission } from "@/server/permissions";
import { logAdminAction } from "@/server/audit";

export interface GetAuditLogsParams {
  search?: string;
  action?: string;
  targetType?: string;
  status?: string;
  severity?: string;
  dateRange?: string; // "today" | "7days" | "30days" | "all"
  sortOrder?: "desc" | "asc";
  page?: number;
  limit?: number;
}

/**
 * Fetch server-paginated, filtered audit logs.
 */
export async function getAuditLogsAction(params: GetAuditLogsParams = {}) {
  await requirePermission("audit.view");

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Text search across multiple fields
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { eventId: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { targetType: { contains: q, mode: "insensitive" } },
      { targetName: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
      { requestId: { contains: q, mode: "insensitive" } },
      { ip: { contains: q, mode: "insensitive" } },
    ];
  }

  // Action filter
  if (params.action && params.action !== "ALL") {
    where.action = params.action;
  }

  // Target type filter
  if (params.targetType && params.targetType !== "ALL") {
    where.targetType = params.targetType;
  }

  // Status filter
  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  // Severity filter
  if (params.severity && params.severity !== "ALL") {
    where.severity = params.severity;
  }

  // Date range filter
  if (params.dateRange && params.dateRange !== "all") {
    const now = new Date();
    let startDate = new Date();

    if (params.dateRange === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (params.dateRange === "7days") {
      startDate.setDate(now.getDate() - 7);
    } else if (params.dateRange === "30days") {
      startDate.setDate(now.getDate() - 30);
    }

    where.createdAt = { gte: startDate };
  }

  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

  // Execute queries in parallel
  const [items, totalCount, todayCount, failedCount, distinctActors] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.auditLog.count({
      where: {
        OR: [{ status: "FAILED" }, { status: "DENIED" }],
      },
    }),
    prisma.auditLog.groupBy({
      by: ["actorEmail"],
      where: { actorEmail: { not: null } },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    stats: {
      todayCount,
      failedCount,
      uniqueActorsCount: distinctActors.length,
    },
  };
}

/**
 * Fetch detailed audit log by ID or Event ID.
 */
export async function getAuditLogByIdAction(idOrEventId: string) {
  await requirePermission("audit.view");

  const log = await prisma.auditLog.findFirst({
    where: {
      OR: [{ id: idOrEventId }, { eventId: idOrEventId }],
    },
  });

  if (!log) return null;

  return {
    ...log,
    createdAt: log.createdAt.toISOString(),
  };
}

/**
 * Export filtered audit logs into CSV or JSON format.
 */
export async function exportAuditLogsAction(params: GetAuditLogsParams, format: "csv" | "json") {
  const { user } = await requirePermission("audit.view");

  // Fetch up to 1000 filtered logs for export
  const where: any = {};
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { eventId: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { targetType: { contains: q, mode: "insensitive" } },
      { targetName: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.action && params.action !== "ALL") where.action = params.action;
  if (params.targetType && params.targetType !== "ALL") where.targetType = params.targetType;
  if (params.status && params.status !== "ALL") where.status = params.status;
  if (params.severity && params.severity !== "ALL") where.severity = params.severity;

  const logs = await prisma.auditLog.findMany({
    where,
    take: 1000,
    orderBy: { createdAt: "desc" },
  });

  // Log export operation
  await logAdminAction({
    action: "EXPORT_AUDIT_LOGS",
    targetType: "System",
    targetName: `Audit Log Export (${format.toUpperCase()})`,
    metadata: {
      exportedCount: logs.length,
      format,
      filterCount: Object.keys(where).length,
    },
  });

  if (format === "json") {
    return {
      success: true,
      filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.json`,
      content: JSON.stringify(logs, null, 2),
      mimeType: "application/json",
    };
  }

  // Generate CSV
  const csvHeaders = [
    "Event ID",
    "Timestamp",
    "Actor Name",
    "Actor Email",
    "Actor Role",
    "Action",
    "Target Type",
    "Target Name",
    "Target ID",
    "Status",
    "Severity",
    "IP Address",
    "User Agent",
    "Request ID",
  ];

  const csvRows = logs.map((l) => [
    l.eventId || l.id,
    l.createdAt.toISOString(),
    `"${(l.actorName || "").replace(/"/g, '""')}"`,
    `"${(l.actorEmail || "").replace(/"/g, '""')}"`,
    l.actorRole,
    l.action,
    l.targetType,
    `"${(l.targetName || "").replace(/"/g, '""')}"`,
    l.targetId || "",
    l.status,
    l.severity,
    l.ip || "",
    `"${(l.userAgent || "").replace(/"/g, '""')}"`,
    l.requestId || "",
  ]);

  const csvContent = [csvHeaders.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

  return {
    success: true,
    filename: `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    content: csvContent,
    mimeType: "text/csv",
  };
}
