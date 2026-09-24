import type { Prisma, Plan as PlanRow } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "@/server/db";
/**
 * Single source of truth for plan pricing and limits (spec 22 §6).
 *
 * Every gated action resolves its allowance from here. Nothing else in the
 * codebase may hardcode a limit — if a number appears twice, one of them is
 * wrong the next time pricing changes.
 */

export type PlanId = "free" | "launch" | "growth" | "agency";

/** Metered actions. Counted per calendar month in `UsageCounter`. */
export type Metric = "exports" | "aiCurations";

/** Actions that are allowed or denied outright rather than metered. */
export type Capability =
  | "printPdf"
  | "svgExport"
  | "idCards"
  | "aiCopy"
  | "brandGuidelines"
  | "whiteLabel"
  | "apiAccess";

/** `null` means unlimited. */
export interface PlanLimits {
  brands: number | null;
  exportsPerMonth: number | null;
  aiCurationsPerMonth: number | null;
  idCards: number | null;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** Price in paise, to avoid float arithmetic on money. */
  monthlyPaise: number;
  yearlyPaise: number;
  tagline: string;
  limits: PlanLimits;
  capabilities: Record<Capability, boolean>;
  /** Free-tier exports carry a watermark. */
  watermark: boolean;
  highlights: string[];
  isActive?: boolean;
  displayOrder?: number;
  razorpayMonthlyId?: string | null;
  razorpayYearlyId?: string | null;
}

const noCapabilities: Record<Capability, boolean> = {
  printPdf: false,
  svgExport: false,
  idCards: false,
  aiCopy: false,
  brandGuidelines: false,
  whiteLabel: false,
  apiAccess: false,
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPaise: 0,
    yearlyPaise: 0,
    tagline: "Check your stationery is legal. Fix it when you're ready.",
    limits: {
      brands: 1,
      exportsPerMonth: 10,
      aiCurationsPerMonth: 3,
      idCards: 0,
    },
    capabilities: { ...noCapabilities },
    watermark: true,
    highlights: [
      "1 brand",
      "Logo concepts",
      "Full compliance report",
      "Watermarked PNG exports",
    ],
  },
  launch: {
    id: "launch",
    name: "Launch",
    monthlyPaise: 49_900,
    yearlyPaise: 478_800,
    tagline: "Everything a newly incorporated company needs on day one.",
    limits: {
      brands: 1,
      exportsPerMonth: 50,
      aiCurationsPerMonth: 30,
      idCards: 0,
    },
    capabilities: {
      ...noCapabilities,
      printPdf: true,
      svgExport: true,
    },
    watermark: false,
    highlights: [
      "1 brand",
      "Full logo suite — SVG, PNG, mono, reversed",
      "Letterhead, envelope & business card",
      "Print-ready PDFs with bleed and crop marks",
      "Compliance report with statutory citations",
      "50 social & ad exports / month",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    monthlyPaise: 149_900,
    yearlyPaise: 1_438_800,
    tagline: "For teams that are hiring and shipping campaigns.",
    limits: {
      brands: 3,
      exportsPerMonth: null,
      aiCurationsPerMonth: 150,
      idCards: 50,
    },
    capabilities: {
      ...noCapabilities,
      printPdf: true,
      svgExport: true,
      idCards: true,
      aiCopy: true,
      brandGuidelines: true,
    },
    watermark: false,
    highlights: [
      "3 brands",
      "Employee ID cards — up to 50",
      "Unlimited exports",
      "AI copy for posts and ads",
      "Brand guidelines PDF",
      "Email signatures",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    monthlyPaise: 399_900,
    yearlyPaise: 3_838_800,
    tagline: "For CA/CS firms and agencies running many client brands.",
    limits: {
      brands: 25,
      exportsPerMonth: null,
      aiCurationsPerMonth: 600,
      idCards: null,
    },
    capabilities: {
      printPdf: true,
      svgExport: true,
      idCards: true,
      aiCopy: true,
      brandGuidelines: true,
      whiteLabel: true,
      apiAccess: true,
    },
    watermark: false,
    highlights: [
      "25 brands",
      "Client workspaces",
      "White-label export",
      "Bulk ID card generation",
      "API access",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "launch", "growth", "agency"];



// --- Phase 16: DB-driven Pricing ---
// We keep the hardcoded PLANS as a fallback/seed template, but the active
// configuration is pulled from the DB.

function fromRow(p: PlanRow): Plan {
  return {
    id: p.slug as PlanId,
    name: p.name,
    monthlyPaise: p.monthlyPrice,
    yearlyPaise: p.yearlyPrice,
    tagline: p.tagline || "",
    limits: p.limits as unknown as PlanLimits,
    capabilities: p.capabilities as unknown as Record<Capability, boolean>,
    watermark: p.watermark,
    highlights: p.highlights,
    isActive: p.isActive,
    displayOrder: p.displayOrder,
    razorpayMonthlyId: p.razorpayMonthlyId,
    razorpayYearlyId: p.razorpayYearlyId,
  };
}

export async function getAllPlans(): Promise<Plan[]> {
  // Without a database (CI, `next build`, a bare container) the hardcoded
  // plans are the configuration.
  if (!isDatabaseConfigured()) return PLAN_ORDER.map(id => PLANS[id]);

  const dbPlans = await prisma.plan.findMany({
    orderBy: { displayOrder: "asc" }
  });

  if (dbPlans.length > 0) return dbPlans.map(fromRow);

  // Fallback to hardcoded if DB is empty
  return PLAN_ORDER.map(id => PLANS[id]);
}

export async function getPlanAsync(id: string | null | undefined): Promise<Plan> {
  if (!isDatabaseConfigured()) return getPlan(id);
  if (!id) return (await getAllPlans()).find(p => p.id === "free") || PLANS.free;

  const dbPlan = await prisma.plan.findUnique({ where: { slug: id } });
  if (dbPlan) return fromRow(dbPlan);

  return PLANS[id as PlanId] ?? PLANS.free;
}

export async function seedPlansIfEmpty() {
  const count = await prisma.plan.count();
  if (count > 0) return;
  
  const ops = PLAN_ORDER.map((id, index) => {
    const plan = PLANS[id];
    return prisma.plan.create({
      data: {
        slug: id,
        name: plan.name,
        monthlyPrice: plan.monthlyPaise,
        yearlyPrice: plan.yearlyPaise,
        tagline: plan.tagline,
        limits: plan.limits as unknown as Prisma.InputJsonValue,
        capabilities: plan.capabilities as unknown as Prisma.InputJsonValue,
        watermark: plan.watermark,
        highlights: plan.highlights,
        isActive: true,
        displayOrder: index
      }
    });
  });
  await prisma.$transaction(ops);
}

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id ?? "free") as PlanId] ?? PLANS.free;
}

export function isPlanId(value: string): value is PlanId {
  return value in PLANS;
}

/** Rupees, for display. Prices are held in paise. */
export function rupees(paise: number): number {
  return paise / 100;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees(paise));
}

/**
 * Months of an annual plan that are effectively free, versus paying monthly.
 * Displayed on the pricing page; derived rather than hardcoded so it can never
 * drift from the actual prices above.
 */
export function annualSavingMonths(plan: Plan): number {
  if (plan.monthlyPaise === 0) return 0;
  const monthsPaidFor = plan.yearlyPaise / plan.monthlyPaise;
  return Math.round(12 - monthsPaidFor);
}

export function metricLimit(plan: Plan, metric: Metric): number | null {
  return metric === "exports"
    ? plan.limits.exportsPerMonth
    : plan.limits.aiCurationsPerMonth;
}
