import { prisma } from "@/server/db";
import {
  mapStatus,
  planFromNotes,
  userIdFromNotes,
  verifyWebhookSignature,
} from "@/server/billing/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay subscription webhooks (spec 22 §7).
 *
 * The raw body is read as text *before* parsing — HMAC is computed over the
 * exact bytes Razorpay signed, and re-serialising parsed JSON would change
 * them. Everything downstream of the signature check is treated as trusted;
 * everything before it is not.
 */

interface RazorpaySubscriptionEntity {
  id: string;
  status: string;
  current_end?: number | null;
  customer_id?: string | null;
  notes?: unknown;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionEntity };
  };
}

const HANDLED = new Set([
  "subscription.activated",
  "subscription.charged",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
  "subscription.paused",
  "subscription.resumed",
  "subscription.pending",
]);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const event = payload.event ?? "";
  if (!HANDLED.has(event)) {
    // Acknowledge unhandled events so Razorpay stops retrying them.
    return Response.json({ ok: true, ignored: event });
  }

  const entity = payload.payload?.subscription?.entity;
  if (!entity?.id) {
    return Response.json({ error: "Missing subscription." }, { status: 400 });
  }

  const userId = userIdFromNotes(entity.notes);
  const planInfo = planFromNotes(entity.notes);
  if (!userId || !planInfo) {
    // A subscription we didn't create, or one whose notes were stripped.
    return Response.json({ ok: true, ignored: "unattributable" });
  }

  const status = mapStatus(entity.status);
  const currentPeriodEnd = entity.current_end
    ? new Date(entity.current_end * 1000)
    : null;

  // A cancelled subscription keeps its plan on the row; `resolvePlan` treats
  // any non-active status as free, so entitlements drop immediately without
  // losing the record of what they had.
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planInfo.plan,
      cycle: planInfo.cycle,
      status,
      razorpaySubscriptionId: entity.id,
      razorpayCustomerId: entity.customer_id ?? null,
      currentPeriodEnd,
    },
    update: {
      plan: planInfo.plan,
      cycle: planInfo.cycle,
      status,
      razorpaySubscriptionId: entity.id,
      razorpayCustomerId: entity.customer_id ?? null,
      currentPeriodEnd,
      cancelAtPeriodEnd: status === "cancelled",
    },
  });

  return Response.json({ ok: true });
}
