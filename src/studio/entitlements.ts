import { prisma } from "@/server/db";
import {
  type Capability,
  type Metric,
  type Plan,
  getPlan,
  metricLimit,
  PLANS,
  PLAN_ORDER,
} from "./plans";

/**
 * Server-side entitlement enforcement (spec 22 §1.5).
 *
 * Client-side gating is presentation only — every export and AI route must
 * call into this module. Throws `EntitlementError`, which route handlers
 * translate into a 402/403 with an upgrade hint.
 */

export class EntitlementError extends Error {
  constructor(
    message: string,
    readonly reason: "capability" | "quota" | "brand-limit",
    readonly requiredPlan?: string,
  ) {
    super(message);
    this.name = "EntitlementError";
  }
}

/** `YYYY-MM` in IST — quotas reset on the Indian calendar month. */
export function currentPeriod(now = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * The plan a user is actually entitled to right now. A subscription that is
 * cancelled, halted, or past its period end falls back to free — we never
 * trust the stored plan string on its own.
 */
export async function resolvePlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return getPlan("free");
  if (sub.status !== "active") return getPlan("free");
  if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) {
    return getPlan("free");
  }
  return getPlan(sub.plan);
}

/** The cheapest plan that grants `capability`, for the upgrade prompt. */
function cheapestPlanWith(capability: Capability): string | undefined {
  return PLAN_ORDER.find((id) => PLANS[id].capabilities[capability]);
}

export async function assertCapability(
  userId: string,
  capability: Capability,
): Promise<Plan> {
  const plan = await resolvePlan(userId);
  if (!plan.capabilities[capability]) {
    throw new EntitlementError(
      `Your ${plan.name} plan does not include this.`,
      "capability",
      cheapestPlanWith(capability),
    );
  }
  return plan;
}

export async function usageCount(
  userId: string,
  metric: Metric,
  period = currentPeriod(),
): Promise<number> {
  const row = await prisma.usageCounter.findUnique({
    where: { userId_period_metric: { userId, period, metric } },
  });
  return row?.count ?? 0;
}

/**
 * Check the monthly allowance for `metric` and consume one unit atomically.
 *
 * The check and the increment are deliberately a single upsert-then-compare so
 * two concurrent exports cannot both pass a stale check. On overshoot the
 * increment is rolled back and the request is rejected.
 */
export async function consumeQuota(
  userId: string,
  metric: Metric,
  amount = 1,
): Promise<{ plan: Plan; used: number; limit: number | null }> {
  const plan = await resolvePlan(userId);
  const limit = metricLimit(plan, metric);
  const period = currentPeriod();

  const row = await prisma.usageCounter.upsert({
    where: { userId_period_metric: { userId, period, metric } },
    create: { userId, period, metric, count: amount },
    update: { count: { increment: amount } },
  });

  if (limit !== null && row.count > limit) {
    await prisma.usageCounter.update({
      where: { userId_period_metric: { userId, period, metric } },
      data: { count: { decrement: amount } },
    });
    throw new EntitlementError(
      metric === "exports"
        ? `You've used all ${limit} exports on the ${plan.name} plan this month.`
        : `You've used all ${limit} AI brand generations on the ${plan.name} plan this month.`,
      "quota",
    );
  }

  return { plan, used: row.count, limit };
}

export async function assertBrandLimit(userId: string): Promise<Plan> {
  const plan = await resolvePlan(userId);
  const limit = plan.limits.brands;
  if (limit === null) return plan;

  const count = await prisma.brand.count({ where: { userId } });
  if (count >= limit) {
    throw new EntitlementError(
      `The ${plan.name} plan covers ${limit} brand${limit === 1 ? "" : "s"}.`,
      "brand-limit",
    );
  }
  return plan;
}

export async function assertIdCardLimit(
  userId: string,
  requested: number,
): Promise<Plan> {
  const plan = await assertCapability(userId, "idCards");
  const limit = plan.limits.idCards;
  if (limit !== null && requested > limit) {
    throw new EntitlementError(
      `The ${plan.name} plan generates up to ${limit} ID cards at a time.`,
      "quota",
    );
  }
  return plan;
}

/** A snapshot for the dashboard — plan plus this month's usage. */
export async function entitlementSummary(userId: string) {
  const [plan, exports, aiCurations, brands] = await Promise.all([
    resolvePlan(userId),
    usageCount(userId, "exports"),
    usageCount(userId, "aiCurations"),
    prisma.brand.count({ where: { userId } }),
  ]);
  return {
    plan,
    usage: { exports, aiCurations, brands },
    limits: {
      exports: plan.limits.exportsPerMonth,
      aiCurations: plan.limits.aiCurationsPerMonth,
      brands: plan.limits.brands,
    },
  };
}
