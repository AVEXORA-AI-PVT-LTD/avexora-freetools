import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

export type ActivityType = 
  | "USER_CREATED" 
  | "TOOL_UPDATED" 
  | "CONTENT_PUBLISHED" 
  | "PAYMENT_RECEIVED" 
  | "FEEDBACK_RECEIVED" 
  | "ADMIN_ACTION" 
  | "ERROR_OCCURRED";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Prisma.JsonValue;
  actor?: string;
  target?: string;
  href?: string;
  severity?: "info" | "warning" | "error" | "critical";
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  // 1. Fetch New Users
  try {
    const newUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, name: true, email: true, createdAt: true }
    });
    
    newUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: "USER_CREATED",
        title: "New user registered",
        description: user.name || user.email || "Unknown user",
        timestamp: user.createdAt,
        actor: user.name || "System",
        href: `/admin/users/${user.id}`,
        severity: "info"
      });
    });
  } catch (e) {
    console.error("Failed to fetch recent users", e);
  }

  // 2. Fetch Audit Logs (Admin Actions, Tool Updates, Content Published, Errors)
  try {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { name: true, email: true } } }
    });

    auditLogs.forEach(log => {
      let type: ActivityType = "ADMIN_ACTION";
      let title = "Admin action";
      let severity: "info" | "warning" | "error" | "critical" = "info";

      if (log.action.includes("TOOL")) {
        type = "TOOL_UPDATED";
        title = "Tool updated";
      } else if (log.action.includes("CONTENT")) {
        type = "CONTENT_PUBLISHED";
        title = "Content published";
      } else if (log.action === "TOOL_FAILURE") {
        type = "ERROR_OCCURRED";
        title = "Tool execution failed";
        severity = "error";
      } else if (log.action.includes("ERROR")) {
        type = "ERROR_OCCURRED";
        title = "System error";
        severity = "error";
      }

      const meta = log.metadata;
      const reason =
        meta && typeof meta === "object" && !Array.isArray(meta) ? meta.reason : undefined;
      const description = meta
        ? (typeof reason === "string" && reason) || `${log.action} on ${log.targetType}`
        : `${log.action} performed`;

      activities.push({
        id: `audit-${log.id}`,
        type,
        title,
        description,
        timestamp: log.createdAt,
        actor: log.actor?.name || log.actorName || log.actorEmail || "System Admin",
        target: log.targetName || log.targetId || undefined,
        severity,
        metadata: log.metadata,
        href: `/admin/audit-logs/${log.eventId || log.id}`,
      });
    });
  } catch (e) {
    console.error("Failed to fetch audit logs", e);
  }

  // 3. Fetch Subscriptions (Proxy for Payments)
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true, email: true } } }
    });

    subscriptions.forEach(sub => {
      activities.push({
        id: `sub-${sub.id}`,
        type: "PAYMENT_RECEIVED",
        title: "Subscription activated",
        description: `${sub.plan.toUpperCase()} plan via ${sub.cycle}`,
        timestamp: sub.createdAt,
        actor: sub.user?.name || sub.user?.email || "Unknown User",
        severity: "info"
      });
    });
  } catch (e) {
    console.error("Failed to fetch subscriptions", e);
  }

  // Sort combined activities by timestamp DESC
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Return limited result set
  return activities.slice(0, limit);
}
