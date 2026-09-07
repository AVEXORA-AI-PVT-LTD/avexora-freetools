import { signIn } from "@/server/auth";
import { enforceMagicLinkLimit } from "@/server/magic-link-limit";

export const runtime = "nodejs";

/**
 * Server-side rate-limited magic-link sign-in endpoint.
 *
 * This is the authoritative API-side gate in front of the same Auth.js Resend
 * provider the sign-in page uses (no second authentication mechanism). It:
 *
 *  1. validates/normalises the email (invalid → 400, no email sent),
 *  2. applies a per-email and per-IP persistent rate limit (exceeded → 429, no
 *     email sent),
 *  3. only then calls `signIn("resend", …)` which actually sends the email.
 *
 * The check runs *before* the email send, so a rejected request never triggers
 * another email. Responses are intentionally generic to avoid account
 * enumeration.
 */

export async function POST(req: Request) {
  let rawEmail = "";
  let redirectTo = "/studio/app";

  try {
    const body = (await req.json()) as { email?: unknown; redirectTo?: unknown };
    rawEmail = typeof body.email === "string" ? body.email : "";
    if (typeof body.redirectTo === "string" && body.redirectTo.startsWith("/")) {
      redirectTo = body.redirectTo;
    }
  } catch {
    // Malformed body → reject without sending an email.
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const check = await enforceMagicLinkLimit(rawEmail, req.headers);

  if (check.status === "invalid_email" || !check.email) {
    return Response.json({ error: "Enter a valid work email." }, { status: 400 });
  }
  if (check.status !== "allowed") {
    return Response.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  await signIn("resend", { email: check.email, redirect: false, redirectTo });

  return Response.json({ ok: true }, { status: 200 });
}
