import { prisma } from "@/server/db";
import { NOTIFICATION_EVENT_REGISTRY, NotificationEventType } from "@/lib/notifications/constants";
import { sendNotificationEmail } from "./email";
import { dispatchWebhooks } from "./webhook";
import { normalizeRoleSlug, hasPermission } from "@/lib/admin/permissions";

export interface CreateNotificationOptions {
  type: NotificationEventType;
  title: string;
  message: string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CRITICAL";

  recipientId?: string; // Target specific admin ID or null for role-based broadcast
  eligibleRoles?: string[]; // Specific role slugs if overriding defaults

  targetType?: string;
  targetId?: string;
  targetName?: string;
  actionUrl?: string;

  groupKey?: string; // For event deduplication / aggregation
  metadata?: Record<string, any>;
}

/**
 * Centralized Notification Factory Service.
 * Dispatches dashboard notifications, emails, and webhooks to authorized recipients.
 */
export async function createNotification(options: CreateNotificationOptions): Promise<boolean> {
  try {
    const {
      type,
      title,
      message,
      targetType,
      targetId,
      targetName,
      actionUrl,
      groupKey,
      metadata,
    } = options;

    const eventDef = NOTIFICATION_EVENT_REGISTRY[type];
    const severity = options.severity || eventDef?.defaultSeverity || "INFO";

    // 1. Deduplication / Aggregation Check
    if (groupKey) {
      const existing = await prisma.notification.findFirst({
        where: {
          groupKey,
          status: "UNREAD",
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // Within last 15 mins
        },
      });

      if (existing) {
        const newCount = existing.occurrenceCount + 1;
        await prisma.notification.update({
          where: { id: existing.id },
          data: {
            occurrenceCount: newCount,
            message: `${title} (Occurred ${newCount} times)`,
            createdAt: new Date(), // Refresh timestamp
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          },
        });

        return true;
      }
    }

    // 2. Resolve Eligible Administrator Recipients
    const allAdmins = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { role: { in: ["super_admin", "superadmin", "admin", "content_manager", "editor", "support", "finance"] } },
          { customRoles: { isEmpty: false } },
        ],
      },
      select: { id: true, email: true, name: true, role: true, customRoles: true },
    });

    const eligibleAdmins = allAdmins.filter((u) => {
      if (options.recipientId && u.id !== options.recipientId) return false;

      const userRoles = Array.from(new Set([normalizeRoleSlug(u.role), ...(u.customRoles || []).map(normalizeRoleSlug)]));
      if (userRoles.includes("super_admin")) return true;

      const requiredPerm = eventDef?.requiredPermission;
      if (requiredPerm && hasPermission(userRoles, requiredPerm)) return true;

      const allowedRoles = options.eligibleRoles || eventDef?.eligibleRoleSlugs || [];
      return allowedRoles.some((r) => userRoles.includes(normalizeRoleSlug(r)));
    });

    if (eligibleAdmins.length === 0) return true;

    // 3. Fetch Notification Preferences
    const eligibleUserIds = eligibleAdmins.map((u) => u.id);
    const prefs = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: eligibleUserIds },
        eventType: type,
      },
    });

    const prefMap = new Map(prefs.map((p) => [p.userId, p]));

    // 4. Create Dashboard Notifications
    const createDataList = eligibleAdmins
      .filter((u) => {
        const p = prefMap.get(u.id);
        return p ? p.dashboardEnabled : true; // Default true if no explicit preference set
      })
      .map((u) => ({
        type,
        title,
        message,
        severity,
        status: "UNREAD",
        recipientId: u.id,
        targetType,
        targetId,
        targetName,
        actionUrl,
        groupKey,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      }));

    if (createDataList.length > 0) {
      await prisma.notification.createMany({
        data: createDataList,
      });
    }

    // 5. Send Emails to Opted-in Administrators
    const emailRecipients = eligibleAdmins.filter((u) => {
      const p = prefMap.get(u.id);
      return p ? p.emailEnabled : true;
    });

    for (const u of emailRecipients) {
      if (u.email) {
        await sendNotificationEmail({
          to: u.email,
          subject: `[Avex Tools Alert] ${title}`,
          eventType: type,
          title,
          message,
          actionUrl,
          metadata,
        });
      }
    }

    // 6. Dispatch Webhook Event
    await dispatchWebhooks({
      eventType: type,
      title,
      message,
      severity,
      targetType,
      targetId,
      actionUrl,
      timestamp: new Date().toISOString(),
      metadata,
    });

    return true;
  } catch (err) {
    console.error("[Create Notification Error]:", err);
    return false;
  }
}
