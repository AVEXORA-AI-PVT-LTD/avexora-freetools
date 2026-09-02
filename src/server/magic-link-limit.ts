import { normalizeEmail, rateLimitPersistent, requestIp } from "@/server/rate-limit";

/**
 * Shared magic-link sign-in rate-limiting policy (spec 22 §8 hardening).
 *
 * Used both by the `POST /api/auth/magic-link` route handler (genuine HTTP 429
 * responses) and by the sign-in page's server action (redirect to the sign-in
 * page with an `error` query param). Keeping the policy in one module means the
 * two enforcement points can never drift apart, and it is the unit-testable
 * surface for the security behaviour.
 */

export const EMAIL_WINDOW_MS = 60_000;
export const EMAIL_LIMIT = 1;
export const IP_WINDOW_MS = 60_000;
export const IP_LIMIT = 20;

export type MagicLinkLimitStatus = "allowed" | "email_limited" | "ip_limited" | "invalid_email";

export interface MagicLinkLimitResult {
  status: MagicLinkLimitStatus;
  /** Normalised email when valid, otherwise null. */
  email: string | null;
  retryAfterMs?: number;
}

/**
 * Validate and rate-limit a magic-link sign-in request. The checks run in
 * order: invalid email first, then per-email, then per-IP. On any failure the
 * caller must NOT send the magic-link email.
 */
export async function enforceMagicLinkLimit(
  rawEmail: string,
  headers: Headers,
): Promise<MagicLinkLimitResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { status: "invalid_email", email: null };

  const emailCheck = await rateLimitPersistent(
    `magiclink:email:${email}`,
    EMAIL_LIMIT,
    EMAIL_WINDOW_MS,
  );
  if (!emailCheck.allowed) {
    return { status: "email_limited", email, retryAfterMs: emailCheck.retryAfterMs };
  }

  const ip = requestIp(headers);
  const ipCheck = await rateLimitPersistent(`magiclink:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
  if (!ipCheck.allowed) {
    return { status: "ip_limited", email, retryAfterMs: ipCheck.retryAfterMs };
  }

  return { status: "allowed", email };
}
