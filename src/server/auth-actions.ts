"use server";

import { headers } from "next/headers";
import { signIn, emailEnabled, googleEnabled, facebookEnabled } from "@/server/auth";
import { enforceMagicLinkLimit } from "@/server/magic-link-limit";
import { safeRedirectPath } from "@/server/safe-redirect";

/**
 * Server actions backing the sign-in / sign-up cards.
 *
 * Every `next` value is re-sanitised here with `safeRedirectPath` before it is
 * used as a `redirectTo`, so a crafted `?next=` (or hidden field) can never
 * turn a sign-in redirect into an open redirect. Magic-link requests go
 * through the shared rate limiter BEFORE the email is sent, so a throttled or
 * invalid request never triggers an email — the same security policy the
 * `POST /api/auth/magic-link` handler enforces.
 */

const FALLBACK_NEXT = "/studio/app";

export type MagicLinkStatusArg = {
  error?:
    | "invalid_email"
    | "too_many_requests"
    | "send_failed"
    | "not_configured";
};

export async function sendMagicLink(
  _prev: MagicLinkStatusArg,
  formData: FormData,
): Promise<MagicLinkStatusArg> {
  const rawEmail = String(formData.get("email") ?? "").trim();
  const next = safeRedirectPath(formData.get("next"), FALLBACK_NEXT);

  // The email form is always rendered on the card (the product flow expects a
  // real email form to exist). When the Resend provider is not configured, be
  // honest about it instead of crashing on `signIn("resend", …)`.
  if (!emailEnabled) return { error: "not_configured" };

  const check = await enforceMagicLinkLimit(rawEmail, await headers());
  if (check.status === "invalid_email") return { error: "invalid_email" };
  if (check.status !== "allowed") return { error: "too_many_requests" };

  // Successful sends redirect to the check-your-email page (Auth.js raises
  // the redirect here); failed sends surface the auth error page instead.
  await signIn("resend", { email: check.email, redirectTo: next });
  return {};
}

async function startOAuth(formData: FormData, provider: "google" | "facebook") {
  const next = safeRedirectPath(formData.get("next"), FALLBACK_NEXT);
  await signIn(provider, { redirectTo: next });
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!googleEnabled) return;
  await startOAuth(formData, "google");
}

export async function signInWithFacebook(formData: FormData): Promise<void> {
  if (!facebookEnabled) return;
  await startOAuth(formData, "facebook");
}