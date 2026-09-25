import { prisma } from "@/server/db";
import crypto from "crypto";

export type ErrorSeverity = "Low" | "Medium" | "High" | "Critical";
export type ErrorStatus = "Open" | "Investigating" | "Resolved" | "Ignored";
export type ErrorType = 
  | "Tool Failure"
  | "API Failure"
  | "Server Error"
  | "404 Error"
  | "Upload Failure"
  | "AI Failure"
  | "Payment Failure"
  | "Authentication Failure"
  | "Database Failure"
  | "External Service Failure";

export interface ErrorReportInput {
  errorType?: ErrorType;
  toolSlug?: string;
  userId?: string;
  errorCode?: string;
  message: string;
  requestId?: string;
  severity?: ErrorSeverity;
  environment?: string;
  stackTrace?: string;
  endpoint?: string;
  method?: string;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
  browser?: string;
  device?: string;
  userAgent?: string;
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "card",
  "cvv",
  "auth_token",
  "access_token",
  "refresh_token",
  "session",
  "private_key",
  "credential",
];

/**
 * Recursively redacts sensitive values from objects/headers before saving.
 */
export function sanitizeErrorMetadata(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeErrorMetadata(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeErrorMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Generates unique Error ID in format: ERR-YYYYMMDD-XXXXXX
 */
export function generateErrorId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ERR-${dateStr}-${randomHex}`;
}

/**
 * Generates fingerprint for error deduplication based on type, code, tool, endpoint.
 */
export function generateFingerprint(
  errorType: string,
  errorCode?: string,
  toolSlug?: string,
  endpoint?: string,
  message?: string
): string {
  const rawKey = `${errorType}:${errorCode || ""}:${toolSlug || ""}:${endpoint || ""}:${message?.slice(0, 100) || ""}`;
  const hash = crypto.createHash("md5").update(rawKey).digest("hex").slice(0, 12);
  return `fp_${errorType.toLowerCase().replace(/\s+/g, "_")}_${hash}`;
}

/**
 * Centralized, production-safe, non-blocking error reporter.
 */
export function reportError(input: ErrorReportInput): void {
  // Execute asynchronously in background so calling thread is never blocked
  Promise.resolve().then(async () => {
    try {
      const errorType = input.errorType || "Server Error";
      const severity = input.severity || "Medium";
      const environment = input.environment || process.env.NODE_ENV || "Production";
      const fingerprint = generateFingerprint(
        errorType,
        input.errorCode,
        input.toolSlug,
        input.endpoint,
        input.message
      );

      // Check for existing open/investigating error with same fingerprint created/seen recently
      const existing = await prisma.errorLog.findFirst({
        where: {
          fingerprint,
          status: { in: ["Open", "Investigating"] },
        },
        orderBy: { lastSeenAt: "desc" },
      });

      const sanitizedMeta = sanitizeErrorMetadata({
        ...input.metadata,
        headers: input.headers ? sanitizeErrorMetadata(input.headers) : undefined,
        browser: input.browser,
        device: input.device,
        userAgent: input.userAgent,
      });

      if (existing) {
        // Deduplicate: Increment occurrences counter & update lastSeenAt
        await prisma.errorLog.update({
          where: { id: existing.id },
          data: {
            occurrences: { increment: 1 },
            lastSeenAt: new Date(),
            message: input.message,
            stackTrace: input.stackTrace || existing.stackTrace,
            requestId: input.requestId || existing.requestId,
            metadata: sanitizedMeta ? JSON.parse(JSON.stringify(sanitizedMeta)) : undefined,
          },
        });
      } else {
        // Create new ErrorLog record
        const errorId = generateErrorId();
        await prisma.errorLog.create({
          data: {
            errorId,
            fingerprint,
            occurrences: 1,
            errorType,
            toolSlug: input.toolSlug,
            userId: input.userId,
            errorCode: input.errorCode,
            message: input.message,
            requestId: input.requestId || `req_${crypto.randomBytes(4).toString("hex")}`,
            severity,
            status: "Open",
            environment,
            stackTrace: input.stackTrace,
            endpoint: input.endpoint,
            method: input.method || "GET",
            metadata: sanitizedMeta ? JSON.parse(JSON.stringify(sanitizedMeta)) : undefined,
          },
        });
      }
    } catch (err) {
      // Fail silently to prevent error monitoring from impacting the application
      console.error("[ErrorMonitoring] Failed to record error:", err);
    }
  });
}
