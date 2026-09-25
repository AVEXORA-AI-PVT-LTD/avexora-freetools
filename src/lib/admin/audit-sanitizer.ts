const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /private[_-]?key/i,
  /cookie/i,
  /session/i,
  /cvv/i,
  /card[_-]?number/i,
  /bearer/i,
  /hash/i,
];

/**
 * Deeply sanitizes metadata objects or arbitrary primitives to redact sensitive keys.
 */
export function sanitizeAuditMetadata(data: any, depth = 0): any {
  if (data === null || data === undefined) return data;
  if (depth > 6) return "[TRUNCATED_NESTING]";

  if (typeof data === "string") {
    // Redact JWT or Bearer tokens in plain strings if present
    if (data.startsWith("Bearer ") || data.startsWith("eyJ")) {
      return "[REDACTED_TOKEN]";
    }
    return data;
  }

  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditMetadata(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeAuditMetadata(value, depth + 1);
    }
  }

  return sanitized;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Computes difference between before and after state objects.
 */
export function computeChangeSummary(
  before?: Record<string, any> | null,
  after?: Record<string, any> | null
): FieldChange[] {
  if (!before && !after) return [];
  if (!before && after) {
    return Object.entries(after).map(([field, newValue]) => ({
      field,
      oldValue: undefined,
      newValue,
    }));
  }
  if (before && !after) {
    return Object.entries(before).map(([field, oldValue]) => ({
      field,
      oldValue,
      newValue: undefined,
    }));
  }

  const changes: FieldChange[] = [];
  const allKeys = new Set([...Object.keys(before!), ...Object.keys(after!)]);

  // Keys to ignore in diffs (timestamps, internal db metadata)
  const ignoredKeys = new Set(["updatedAt", "createdAt", "_id", "id", "__v", "userCount"]);

  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue;

    const oldVal = before![key];
    const newVal = after![key];

    const oldJson = JSON.stringify(oldVal);
    const newJson = JSON.stringify(newVal);

    if (oldJson !== newJson) {
      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
}

/**
 * Formats a list of field changes into a human-readable multi-line string.
 */
export function formatChangeSummary(changes: FieldChange[]): string {
  if (!changes || changes.length === 0) return "No field modifications detected.";

  return changes
    .map((c) => {
      const oldStr = c.oldValue === undefined || c.oldValue === null ? "(none)" : JSON.stringify(c.oldValue);
      const newStr = c.newValue === undefined || c.newValue === null ? "(none)" : JSON.stringify(c.newValue);
      return `${c.field}: ${oldStr} → ${newStr}`;
    })
    .join("\n");
}
