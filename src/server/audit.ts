import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { AuditAction, TargetType, getActionSeverity } from "@/lib/admin/audit-actions";
import { sanitizeAuditMetadata, computeChangeSummary } from "@/lib/admin/audit-sanitizer";

export interface LogAdminActionOptions {
  action: AuditAction;
  targetType: TargetType;
  targetId?: string;
  targetName?: string;

  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;

  status?: "SUCCESS" | "FAILED" | "DENIED";
  severity?: "INFO" | "WARNING" | "CRITICAL";

  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;

  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Generates unique event ID: AUD-YYYYMMDD-XXXXXX
 */
function generateEventId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AUD-${dateStr}-${randomHex}`;
}

/**
 * Safely extracts client IP from request headers.
 */
function extractIpFromHeaders(reqHeaders: Headers): string | undefined {
  const forwarded = reqHeaders.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = reqHeaders.get("x-real-ip");
  if (realIp) return realIp;
  return undefined;
}

/**
 * Centralized Audit Logging Utility.
 * Asynchronously logs security, administrative, user, and tool mutations.
 * Never throws exceptions or breaks primary business logic.
 */
export async function logAdminAction(options: LogAdminActionOptions): Promise<boolean> {
  try {
    const session = await auth();

    // Determine actor details
    const actorId = options.actorId || session?.user?.id || undefined;
    const actorName = options.actorName || session?.user?.name || "System Admin";
    const actorEmail = options.actorEmail || session?.user?.email || "system@avextools.internal";
    const actorRole = options.actorRole || session?.user?.role || "user";

    // Extract headers safely if available
    let headerIp: string | undefined;
    let headerUserAgent: string | undefined;
    let headerRequestId: string | undefined;

    try {
      const h = await headers();
      headerIp = extractIpFromHeaders(h);
      headerUserAgent = h.get("user-agent") || undefined;
      headerRequestId = h.get("x-request-id") || h.get("x-trace-id") || undefined;
    } catch {
      // Ignore if headers() is called outside request context
    }

    const ip = options.ip || headerIp || "127.0.0.1";
    const userAgent = options.userAgent || headerUserAgent || "Internal Server Execution";
    const requestId = options.requestId || headerRequestId || `req_${Math.random().toString(36).substring(2, 10)}`;

    const status = options.status || "SUCCESS";
    const severity = options.severity || getActionSeverity(options.action);

    // Sanitize before/after/metadata
    const sanitizedBefore = options.before ? sanitizeAuditMetadata(options.before) : undefined;
    const sanitizedAfter = options.after ? sanitizeAuditMetadata(options.after) : undefined;
    const sanitizedMetadata = options.metadata ? sanitizeAuditMetadata(options.metadata) : undefined;

    // Compute diffs
    const computedChanges = computeChangeSummary(sanitizedBefore, sanitizedAfter);

    await prisma.auditLog.create({
      data: {
        eventId: generateEventId(),
        actorId,
        actorName,
        actorEmail,
        actorRole,
        action: options.action,
        targetType: options.targetType,
        targetId: options.targetId,
        targetName: options.targetName,
        status,
        severity,
        environment: process.env.NODE_ENV || "production",
        ip,
        userAgent,
        requestId,
        metadata: sanitizedMetadata ? JSON.parse(JSON.stringify(sanitizedMetadata)) : undefined,
        before: sanitizedBefore ? JSON.parse(JSON.stringify(sanitizedBefore)) : undefined,
        after: sanitizedAfter ? JSON.parse(JSON.stringify(sanitizedAfter)) : undefined,
        changes: computedChanges.length > 0 ? JSON.parse(JSON.stringify(computedChanges)) : undefined,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to log admin action:", error);
    return false;
  }
}
