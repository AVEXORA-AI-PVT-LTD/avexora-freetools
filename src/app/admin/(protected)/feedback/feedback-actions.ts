"use server";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { logAdminAction } from "@/server/audit";
import { revalidatePath } from "next/cache";
import { allTools as staticTools } from "@/tools/registry";

export interface GetFeedbackParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  priority?: string;
  assignedAdminId?: string;
  toolSlug?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getFeedbackSubmissionsAction(params: GetFeedbackParams) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.view")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.type && params.type !== "all") {
    where.type = params.type;
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.priority && params.priority !== "all") {
    where.priority = params.priority;
  }

  if (params.assignedAdminId) {
    if (params.assignedAdminId === "unassigned") {
      where.assignedAdminId = null;
    } else if (params.assignedAdminId !== "all") {
      where.assignedAdminId = params.assignedAdminId;
    }
  }

  if (params.toolSlug && params.toolSlug !== "all") {
    where.toolSlug = params.toolSlug;
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { referenceId: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { toolSlug: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderByField = params.sortBy || "createdAt";
  const orderDirection = params.sortOrder || "desc";

  const [items, total] = await Promise.all([
    prisma.contactSubmission?.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderByField]: orderDirection },
    }).catch(() => []) ?? [],
    prisma.contactSubmission?.count({ where }).catch(() => 0) ?? 0,
  ]);

  // Count aggregations for tab counters
  const [allCount, newCount, inProgressCount, resolvedCount, closedCount, spamCount, urgentCount, unassignedCount] = await Promise.all([
    prisma.contactSubmission?.count({ where: { status: { not: "Spam" } } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { status: "New" } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { status: "In Progress" } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { status: "Resolved" } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { status: "Closed" } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { status: "Spam" } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { priority: "Urgent", status: { notIn: ["Resolved", "Closed", "Spam"] } } }).catch(() => 0) ?? 0,
    prisma.contactSubmission?.count({ where: { assignedAdminId: null, status: { notIn: ["Resolved", "Closed", "Spam"] } } }).catch(() => 0) ?? 0,
  ]);

  // Fetch admin user names for assignedAdminId mapping
  const adminIds = Array.from(new Set(items.map((i) => i.assignedAdminId).filter(Boolean))) as string[];
  const adminUsers = adminIds.length > 0
    ? await prisma.user?.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true, email: true },
      }).catch(() => []) ?? []
    : [];
  const adminMap = new Map(adminUsers.map((u) => [u.id, u.name || u.email]));

  const formattedItems = items.map((item) => ({
    ...item,
    assignedAdminName: item.assignedAdminId ? adminMap.get(item.assignedAdminId) || "Unknown Admin" : null,
  }));

  return {
    items: formattedItems,
    total,
    pages: Math.ceil(total / limit) || 1,
    page,
    counts: {
      all: allCount,
      new: newCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      closed: closedCount,
      spam: spamCount,
      urgent: urgentCount,
      unassigned: unassignedCount,
    },
  };
}

export async function getFeedbackByIdAction(idOrRef: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.view")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const submission = await prisma.contactSubmission?.findFirst({
    where: {
      OR: [{ id: idOrRef }, { referenceId: idOrRef }],
    },
  }).catch(() => null);

  if (!submission) {
    return null;
  }

  // User Context (if userId exists)
  let userContext = null;
  if (submission.userId) {
    const [userProfile, usageCount, subscription, recentActivity] = await Promise.all([
      prisma.user?.findUnique({
        where: { id: submission.userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }).catch(() => null),
      prisma.toolUsage?.count({ where: { userId: submission.userId } }).catch(() => 0),
      prisma.subscription?.findUnique({ where: { userId: submission.userId } }).catch(() => null),
      prisma.toolUsage?.findMany({
        where: { userId: submission.userId },
        take: 5,
        orderBy: { createdAt: "desc" },
      }).catch(() => []),
    ]);

    userContext = {
      profile: userProfile,
      totalUsage: usageCount || 0,
      plan: subscription?.plan || "free",
      recentActivity: recentActivity || [],
    };
  }

  // Tool Context (if toolSlug exists)
  let toolContext = null;
  if (submission.toolSlug) {
    const staticTool = staticTools.find((t) => t.slug === submission.toolSlug);
    const dbTool = await prisma.toolConfig?.findUnique({ where: { toolSlug: submission.toolSlug } }).catch(() => null);
    const usageCount = await prisma.toolUsage?.count({ where: { toolSlug: submission.toolSlug } }).catch(() => 0);

    toolContext = {
      slug: submission.toolSlug,
      name: staticTool?.name || dbTool?.nameOverride || submission.toolSlug,
      category: staticTool?.category || dbTool?.categorySlug || "tools",
      status: dbTool?.status ?? true,
      totalUsage: usageCount || 0,
    };
  }

  // Assigned Admin Details
  let assignedAdmin = null;
  if (submission.assignedAdminId) {
    assignedAdmin = await prisma.user?.findUnique({
      where: { id: submission.assignedAdminId },
      select: { id: true, name: true, email: true },
    }).catch(() => null);
  }

  // Available Admins for dropdown
  const availableAdmins = await prisma.user?.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  }).catch(() => []) ?? [];

  // Log audit event for viewing submission
  await logAdminAction({
    action: "CONTENT_UPDATED",
    targetType: "SYSTEM",
    targetId: submission.id,
    metadata: { changeType: "FEEDBACK_VIEWED", referenceId: submission.referenceId },
  });

  return {
    submission,
    userContext,
    toolContext,
    assignedAdmin,
    availableAdmins,
  };
}

export async function updateFeedbackStatusAction(id: string, newStatus: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.update")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const validStatuses = ["New", "In Progress", "Resolved", "Closed", "Spam"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error("Invalid status transition.");
  }

  const existing = await prisma.contactSubmission?.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Submission not found.");
  }

  const updateData: any = { status: newStatus };
  if (newStatus === "Resolved") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = session.user.id;
  }

  const updated = await prisma.contactSubmission?.update({
    where: { id },
    data: updateData,
  });

  await logAdminAction({
    action: "CONTENT_UPDATED",
    targetType: "SYSTEM",
    targetId: id,
    metadata: {
      changeType: "FEEDBACK_STATUS_UPDATED",
      previousStatus: existing.status,
      newStatus,
      referenceId: existing.referenceId,
    },
  });

  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${id}`);

  return updated;
}

export async function updateFeedbackPriorityAction(id: string, newPriority: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.update")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const validPriorities = ["Low", "Medium", "High", "Urgent"];
  if (!validPriorities.includes(newPriority)) {
    throw new Error("Invalid priority level.");
  }

  const existing = await prisma.contactSubmission?.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Submission not found.");
  }

  const updated = await prisma.contactSubmission?.update({
    where: { id },
    data: { priority: newPriority },
  });

  await logAdminAction({
    action: "CONTENT_UPDATED",
    targetType: "SYSTEM",
    targetId: id,
    metadata: {
      changeType: "FEEDBACK_PRIORITY_UPDATED",
      previousPriority: existing.priority,
      newPriority,
      referenceId: existing.referenceId,
    },
  });

  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${id}`);

  return updated;
}

export async function assignFeedbackAction(id: string, assignedAdminId: string | null) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.assign")) {
    throw new Error("Unauthorized: Insufficient permissions to assign feedback.");
  }

  const existing = await prisma.contactSubmission?.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Submission not found.");
  }

  let assignedAdminName = "Unassigned";
  if (assignedAdminId) {
    const adminUser = await prisma.user?.findUnique({ where: { id: assignedAdminId } });
    if (!adminUser) {
      throw new Error("Assigned admin user does not exist.");
    }
    assignedAdminName = adminUser.name || adminUser.email;
  }

  const updated = await prisma.contactSubmission?.update({
    where: { id },
    data: { assignedAdminId },
  });

  await logAdminAction({
    action: "USER_UPDATED",
    targetType: "SYSTEM",
    targetId: id,
    metadata: {
      changeType: "FEEDBACK_ASSIGNMENT_CHANGED",
      assignedAdminId,
      assignedAdminName,
      referenceId: existing.referenceId,
    },
  });

  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${id}`);

  return updated;
}

export async function addInternalNoteAction(id: string, content: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.update")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  if (!content || !content.trim()) {
    throw new Error("Internal note content cannot be empty.");
  }

  const existing = await prisma.contactSubmission?.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Submission not found.");
  }

  const currentNotes = Array.isArray(existing.internalNotes) ? (existing.internalNotes as any[]) : [];
  const newNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    authorId: session.user.id,
    authorName: session.user.name || session.user.email || "Admin",
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const updated = await prisma.contactSubmission?.update({
    where: { id },
    data: {
      internalNotes: [...currentNotes, newNote],
    },
  });

  await logAdminAction({
    action: "CONTENT_UPDATED",
    targetType: "SYSTEM",
    targetId: id,
    metadata: {
      changeType: "FEEDBACK_INTERNAL_NOTE_ADDED",
      referenceId: existing.referenceId,
      noteId: newNote.id,
    },
  });

  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${id}`);

  return updated;
}

export async function markAsSpamAction(id: string) {
  return updateFeedbackStatusAction(id, "Spam");
}

export async function restoreFromSpamAction(id: string) {
  return updateFeedbackStatusAction(id, "New");
}

export async function deleteFeedbackAction(id: string) {
  const session = await auth();
  if (!session || !hasPermission(session.user?.role, "feedback.delete")) {
    throw new Error("Unauthorized: Insufficient permissions.");
  }

  const existing = await prisma.contactSubmission?.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Submission not found.");
  }

  await prisma.contactSubmission?.delete({ where: { id } });

  await logAdminAction({
    action: "TOOL_DELETED",
    targetType: "SYSTEM",
    targetId: id,
    metadata: {
      changeType: "FEEDBACK_DELETED",
      referenceId: existing.referenceId,
    },
  });

  revalidatePath("/admin/feedback");
  return { success: true };
}

export async function bulkUpdateFeedbackAction(
  ids: string[],
  action: "status" | "priority" | "assign" | "spam" | "delete",
  value?: any
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized.");
  }

  if (!ids || ids.length === 0) {
    throw new Error("No items selected.");
  }

  if (action === "delete") {
    if (!hasPermission(session.user?.role, "feedback.delete")) {
      throw new Error("Unauthorized: Insufficient permissions to delete.");
    }

    await prisma.contactSubmission?.deleteMany({
      where: { id: { in: ids } },
    });

    await logAdminAction({
      action: "TOOL_DELETED",
      targetType: "SYSTEM",
      metadata: { changeType: "FEEDBACK_BULK_DELETE", count: ids.length },
    });
  } else if (action === "status") {
    if (!hasPermission(session.user?.role, "feedback.update")) {
      throw new Error("Unauthorized: Insufficient permissions to update status.");
    }

    const updateData: any = { status: value };
    if (value === "Resolved") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = session.user.id;
    }

    await prisma.contactSubmission?.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    await logAdminAction({
      action: "CONTENT_UPDATED",
      targetType: "SYSTEM",
      metadata: { changeType: "FEEDBACK_BULK_STATUS_UPDATE", newStatus: value, count: ids.length },
    });
  } else if (action === "priority") {
    if (!hasPermission(session.user?.role, "feedback.update")) {
      throw new Error("Unauthorized: Insufficient permissions to update priority.");
    }

    await prisma.contactSubmission?.updateMany({
      where: { id: { in: ids } },
      data: { priority: value },
    });

    await logAdminAction({
      action: "CONTENT_UPDATED",
      targetType: "SYSTEM",
      metadata: { changeType: "FEEDBACK_BULK_PRIORITY_UPDATE", newPriority: value, count: ids.length },
    });
  } else if (action === "assign") {
    if (!hasPermission(session.user?.role, "feedback.assign")) {
      throw new Error("Unauthorized: Insufficient permissions to assign.");
    }

    await prisma.contactSubmission?.updateMany({
      where: { id: { in: ids } },
      data: { assignedAdminId: value || null },
    });

    await logAdminAction({
      action: "USER_UPDATED",
      targetType: "SYSTEM",
      metadata: { changeType: "FEEDBACK_BULK_ASSIGN", assignedAdminId: value, count: ids.length },
    });
  } else if (action === "spam") {
    if (!hasPermission(session.user?.role, "feedback.update")) {
      throw new Error("Unauthorized: Insufficient permissions.");
    }

    await prisma.contactSubmission?.updateMany({
      where: { id: { in: ids } },
      data: { status: "Spam" },
    });

    await logAdminAction({
      action: "CONTENT_UPDATED",
      targetType: "SYSTEM",
      metadata: { changeType: "FEEDBACK_BULK_MARK_SPAM", count: ids.length },
    });
  }

  revalidatePath("/admin/feedback");
  return { success: true };
}
