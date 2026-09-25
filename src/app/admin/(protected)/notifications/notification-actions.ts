"use server";

import { prisma } from "@/server/db";
import { requirePermission } from "@/server/permissions";
import { NOTIFICATION_EVENT_REGISTRY } from "@/lib/notifications/constants";
import { logAdminAction } from "@/server/audit";
import { revalidatePath } from "next/cache";

export interface GetNotificationsParams {
  status?: string; // "ALL" | "UNREAD" | "READ" | "ARCHIVED"
  type?: string;
  severity?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch notifications for current authenticated admin user.
 */
export async function getNotificationsAction(params: GetNotificationsParams = {}) {
  const { user } = await requirePermission("dashboard.view");

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    OR: [{ recipientId: user.id }, { recipientId: null }],
  };

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.type && params.type !== "ALL") {
    where.type = params.type;
  }

  if (params.severity && params.severity !== "ALL") {
    where.severity = params.severity;
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
          { targetName: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [items, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        OR: [{ recipientId: user.id }, { recipientId: null }],
        status: "UNREAD",
      },
    }),
  ]);

  return {
    items: items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString() || null,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    unreadCount,
  };
}

/**
 * Quick server action returning unread notification count for Header Bell badge.
 */
export async function getUnreadNotificationCountAction() {
  try {
    const { user } = await requirePermission("dashboard.view");

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [{ recipientId: user.id }, { recipientId: null }],
        status: "UNREAD",
      },
    });

    return unreadCount;
  } catch {
    return 0;
  }
}

/**
 * Mark a single notification as READ.
 */
export async function markNotificationReadAction(id: string) {
  const { user } = await requirePermission("dashboard.view");

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Notification not found." };

  await prisma.notification.update({
    where: { id },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  await logAdminAction({
    action: "MARK_NOTIFICATION_READ",
    targetType: "Notification",
    targetId: id,
    targetName: existing.title,
  });

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Mark a single notification as UNREAD.
 */
export async function markNotificationUnreadAction(id: string) {
  const { user } = await requirePermission("dashboard.view");

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Notification not found." };

  await prisma.notification.update({
    where: { id },
    data: {
      status: "UNREAD",
      readAt: null,
    },
  });

  await logAdminAction({
    action: "MARK_NOTIFICATION_UNREAD",
    targetType: "Notification",
    targetId: id,
    targetName: existing.title,
  });

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Mark all notifications for user as READ.
 */
export async function markAllNotificationsReadAction() {
  const { user } = await requirePermission("dashboard.view");

  await prisma.notification.updateMany({
    where: {
      OR: [{ recipientId: user.id }, { recipientId: null }],
      status: "UNREAD",
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  await logAdminAction({
    action: "MARK_ALL_NOTIFICATIONS_READ",
    targetType: "Notification",
    targetName: "All Unread Notifications",
  });

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Archive a notification.
 */
export async function archiveNotificationAction(id: string) {
  const { user } = await requirePermission("dashboard.view");

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Notification not found." };

  await prisma.notification.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await logAdminAction({
    action: "ARCHIVE_NOTIFICATION",
    targetType: "Notification",
    targetId: id,
    targetName: existing.title,
  });

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Delete a notification.
 */
export async function deleteNotificationAction(id: string) {
  const { user } = await requirePermission("dashboard.view");

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Notification not found." };

  await prisma.notification.delete({ where: { id } });

  await logAdminAction({
    action: "DELETE_NOTIFICATION",
    targetType: "Notification",
    targetId: id,
    targetName: existing.title,
  });

  revalidatePath("/admin/notifications");
  return { success: true };
}

/**
 * Get notification preferences for current user.
 */
export async function getNotificationPreferencesAction() {
  const { user } = await requirePermission("dashboard.view");

  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });

  const prefMap = new Map(prefs.map((p) => [p.eventType, p]));

  const result = Object.values(NOTIFICATION_EVENT_REGISTRY).map((evt) => {
    const existing = prefMap.get(evt.type);
    return {
      eventType: evt.type,
      label: evt.label,
      description: evt.description,
      dashboardEnabled: existing ? existing.dashboardEnabled : true,
      emailEnabled: existing ? existing.emailEnabled : true,
    };
  });

  return result;
}

/**
 * Update notification preferences for current user.
 */
export async function updateNotificationPreferencesAction(
  updates: Array<{ eventType: string; dashboardEnabled: boolean; emailEnabled: boolean }>
) {
  const { user } = await requirePermission("dashboard.view");

  for (const u of updates) {
    await prisma.notificationPreference.upsert({
      where: {
        userId_eventType: {
          userId: user.id,
          eventType: u.eventType,
        },
      },
      create: {
        userId: user.id,
        eventType: u.eventType,
        dashboardEnabled: u.dashboardEnabled,
        emailEnabled: u.emailEnabled,
      },
      update: {
        dashboardEnabled: u.dashboardEnabled,
        emailEnabled: u.emailEnabled,
      },
    });
  }

  await logAdminAction({
    action: "UPDATE_NOTIFICATION_PREFERENCES",
    targetType: "Settings",
    targetName: "Notification Preferences",
  });

  revalidatePath("/admin/notifications/preferences");
  return { success: true };
}
