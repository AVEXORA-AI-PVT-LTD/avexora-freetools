const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatINR(value: number): string {
  return inr.format(value);
}

export function formatNumber(value: number): string {
  return num.format(value);
}

export function formatPercent(value: number): string {
  return `${num.format(value)}%`;
}

/** Coerce a form field value to a finite number, or null if it isn't one. */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Coerce to a number, requiring it to be positive (> 0). */
export function toPositive(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 ? n : null;
}

/** Coerce to a number, requiring it to be zero or more. */
export function toNonNegative(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n >= 0 ? n : null;
}

/**
 * Resolve an optional numeric field: empty/undefined input falls back to the
 * supplied default, while present-but-invalid input returns null so callers can
 * surface a validation error (invalid input must never be silently coerced to
 * a default/zero).
 */
function toOptional(
  value: unknown,
  validate: (v: unknown) => number | null,
  fallback: number,
): number | null {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    return fallback;
  }
  const n = validate(value);
  return n === null ? null : n;
}

/** Optional field requiring a positive (> 0) value; empty -> fallback, invalid -> null. */
export function toPositiveOr(value: unknown, fallback: number): number | null {
  return toOptional(value, toPositive, fallback);
}

/** Optional field requiring a zero-or-more value; empty -> fallback, invalid -> null. */
export function toNonNegativeOr(value: unknown, fallback: number): number | null {
  return toOptional(value, toNonNegative, fallback);
}
