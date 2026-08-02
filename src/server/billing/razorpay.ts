import crypto from "node:crypto";
import Razorpay from "razorpay";
import { PLANS, type PlanId, type Plan } from "@/studio/plans";

/**
 * Razorpay subscriptions (spec 22 §7).
 *
 * Env-gated exactly like the AI key: without RAZORPAY_KEY_ID the Studio runs
 * in dev mode — the pricing page renders, checkout returns 503, and every plan
 * behaves as free. This keeps the whole product demoable before the merchant
 * account exists.
 */

export const razorpayEnabled = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
);

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!razorpayEnabled) throw new Error("RAZORPAY_NOT_CONFIGURED");
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export type BillingCycle = "monthly" | "yearly";

/**
 * Razorpay plan IDs are created in the Razorpay dashboard (or via their API)
 * and referenced here by env var, one per plan × cycle. Keeping them in env
 * rather than the database means test and live accounts can differ without a
 * data migration.
 */
export function razorpayPlanId(plan: PlanId, cycle: BillingCycle): string | undefined {
  const key = `RAZORPAY_PLAN_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  return process.env[key];
}

export function priceFor(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.yearlyPaise : plan.monthlyPaise;
}

export interface CreatedSubscription {
  subscriptionId: string;
  /** Razorpay Checkout needs the key id client-side. */
  keyId: string;
  planName: string;
  amountPaise: number;
}

export async function createSubscription(opts: {
  plan: PlanId;
  cycle: BillingCycle;
  email: string;
  name?: string | null;
  userId: string;
}): Promise<CreatedSubscription> {
  const plan = PLANS[opts.plan];
  if (plan.monthlyPaise === 0) throw new Error("PLAN_NOT_PURCHASABLE");

  const planId = razorpayPlanId(opts.plan, opts.cycle);
  if (!planId) throw new Error(`RAZORPAY_PLAN_NOT_CONFIGURED:${opts.plan}:${opts.cycle}`);

  const subscription = await getClient().subscriptions.create({
    plan_id: planId,
    // Yearly plans bill once a year; monthly plans run until cancelled. 120
    // months is Razorpay's practical ceiling for an open-ended monthly sub.
    total_count: opts.cycle === "yearly" ? 5 : 120,
    customer_notify: 1,
    notes: {
      userId: opts.userId,
      plan: opts.plan,
      cycle: opts.cycle,
      email: opts.email,
    },
  });

  return {
    subscriptionId: subscription.id,
    keyId: RAZORPAY_KEY_ID,
    planName: plan.name,
    amountPaise: priceFor(plan, opts.cycle),
  };
}

export async function cancelSubscription(
  subscriptionId: string,
  atCycleEnd = true,
): Promise<void> {
  await getClient().subscriptions.cancel(subscriptionId, atCycleEnd);
}

export async function fetchSubscription(subscriptionId: string) {
  return getClient().subscriptions.fetch(subscriptionId);
}

/**
 * Verify a Razorpay webhook signature.
 *
 * HMAC-SHA256 of the **raw request body** with the webhook secret. The body
 * must be read as text before any JSON parsing — re-serialising the parsed
 * object changes the bytes and the signature will never match.
 *
 * Uses a timing-safe comparison; returns false rather than throwing on any
 * malformed input so callers can respond with a plain 400.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret = process.env.RAZORPAY_WEBHOOK_SECRET,
): boolean {
  if (!signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

/** Razorpay subscription status → our internal status. */
export function mapStatus(razorpayStatus: string): "active" | "halted" | "cancelled" | "pending" {
  switch (razorpayStatus) {
    case "active":
    case "authenticated":
      return "active";
    case "halted":
    case "paused":
      return "halted";
    case "cancelled":
    case "completed":
    case "expired":
      return "cancelled";
    default:
      return "pending";
  }
}

/** Plan and cycle recovered from a subscription's `notes`. */
export function planFromNotes(notes: unknown): { plan: PlanId; cycle: BillingCycle } | null {
  if (!notes || typeof notes !== "object") return null;
  const record = notes as Record<string, unknown>;
  const plan = String(record.plan ?? "");
  const cycle = String(record.cycle ?? "monthly");
  if (!(plan in PLANS) || plan === "free") return null;
  return {
    plan: plan as PlanId,
    cycle: cycle === "yearly" ? "yearly" : "monthly",
  };
}

export function userIdFromNotes(notes: unknown): string | null {
  if (!notes || typeof notes !== "object") return null;
  const id = (notes as Record<string, unknown>).userId;
  return typeof id === "string" && id.length > 0 ? id : null;
}
