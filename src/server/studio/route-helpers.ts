import { EntitlementError } from "./entitlements";
import { currentUserId } from "@/server/auth";

/**
 * Shared plumbing for the Studio route handlers.
 *
 * Every Studio route authenticates here rather than trusting `proxy.ts` — the
 * proxy only does an optimistic cookie check and is explicitly not the
 * authorization boundary (spec 22 §1.5).
 */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) throw new HttpError(401, "Sign in to continue.");
  return userId;
}

/**
 * Translate thrown errors into responses. Entitlement failures become 402
 * (Payment Required) with the upgrade target, so the client can route straight
 * to the right plan instead of guessing.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof EntitlementError) {
    return Response.json(
      {
        error: error.message,
        reason: error.reason,
        requiredPlan: error.requiredPlan,
      },
      { status: 402 },
    );
  }
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return Response.json({ error: "Sign in to continue." }, { status: 401 });
  }
  if (error instanceof Error && error.message.startsWith("RAZORPAY_")) {
    return Response.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  console.error("[studio] unhandled route error", error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}

export async function readJson<T>(req: Request): Promise<T> {
  const body = await req.json().catch(() => null);
  if (body === null) throw new HttpError(400, "Invalid request body.");
  return body as T;
}
