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
