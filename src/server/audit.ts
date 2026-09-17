import { prisma } from "@/server/db";
import { auth } from "@/server/auth";

export type AuditAction = 
  | "LOGIN"
  | "LOGOUT"
  | "TOOL_CREATED"
  | "TOOL_UPDATED"
  | "TOOL_DELETED"
  | "TOOL_STATUS_CHANGED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED"
  | "CATEGORY_STATUS_CHANGED"
  | "USER_UPDATED"
  | "USER_ROLE_CHANGED"
  | "USER_BLOCKED"
  | "SEO_UPDATED"
  | "CONTENT_UPDATED"
  | "NAVIGATION_UPDATED"
  | "SETTINGS_UPDATED";

export type TargetType = 
  | "TOOL"
  | "CATEGORY"
  | "USER"
  | "SEO"
  | "CONTENT"
  | "NAVIGATION"
  | "SETTINGS"
  | "SYSTEM";

interface AuditLogOptions {
  action: AuditAction;
  targetType: TargetType;
  targetId?: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
}

/**
 * Creates an audit log entry for a specific action performed by an admin.
 * Requires an active authentication session.
 */
export async function logAdminAction(options: AuditLogOptions) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      console.warn("Attempted to log admin action without active session", options);
      return false;
    }

    const { action, targetType, targetId, metadata, ip, userAgent } = options;

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: (session.user as any).role || "user",
        action,
        targetType,
        targetId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined, // Ensure valid JSON
        ip,
        userAgent,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Best effort logging, don't throw to break the main transaction
    return false;
  }
}
