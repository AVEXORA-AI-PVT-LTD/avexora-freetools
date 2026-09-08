/**
 * Centralised tax rules for the Advanced Tax Calculator.
 *
 * Values apply to the Financial Year 2026-27 (Assessment Year 2027-28) under
 * the Income-tax Act, 2025 (which replaced the Income-tax Act, 1961 from
 * 1 April 2026). Where the Act uses new section numbers, the old ones are
 * noted alongside. Slab rates are unchanged from FY 2025-26.
 */

export interface Slab {
  /** Upper limit of the slab; Infinity for the top slab. */
  upTo: number;
  /** Rate applied to income within this slab, in percent. */
  rate: number;
}

export interface RebateRules {
  /** Maximum taxable income eligible for the §87A rebate. */
  threshold: number;
  /** Maximum rebate amount in rupees. */
  cap: number;
}

export interface RegimeRules {
  id: "new" | "old";
  label: string;
  slabs: Slab[];
  rebate: RebateRules;
  /**
   * Marginal relief: above this taxable income, income tax can never exceed
   * (income − threshold). Only applicable to the new regime.
   */
  marginalReliefThreshold?: number;
  /**
   * Surcharge bands, sorted ascending by `above` (income at which the rate
   * kicks in, exclusive). The rate applies to the income tax after rebate.
   */
  surchargeBands: { above: number; rate: number }[];
}

export interface AdvanceTaxRules {
  /** Net tax liability above which advance tax becomes payable (Sec 404). */
  threshold: number;
  /** Statutory quarterly accumulation targets (Sec 408). */
  quarters: { label: string; dueDate: string; cumulativePercent: number }[];
  /** Presumptive taxpayers pay the full amount in one instalment (Sec 408(2)). */
  presumptiveInstallmentLabel: string;
  presumptiveInstallmentDate: string;
}

export interface PresumptiveRule {
  id: "44ad" | "44ada";
  label: string;
  /** Presumptive rate applied to gross receipts, in percent. */
  rate: number;
  /**
   * Gross-receipts eligibility limit. Uses the higher limit applicable when
   * 5% or less of the gross receipts are received in cash (limits are lower
   * when cash receipts exceed 5%).
   */
  limit: number;
}

export const TAX_YEAR_LABEL = "FY 2026-27 (AY 2027-28)";

/** New regime slabs, FY 2026-27. */
export const NEW_REGIME_SLABS: Slab[] = [
  { upTo: 4_00_000, rate: 0 },
  { upTo: 8_00_000, rate: 5 },
  { upTo: 12_00_000, rate: 10 },
  { upTo: 16_00_000, rate: 15 },
  { upTo: 20_00_000, rate: 20 },
  { upTo: 24_00_000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];

/** Old regime slabs, FY 2026-27. */
export const OLD_REGIME_SLABS: Slab[] = [
  { upTo: 2_50_000, rate: 0 },
  { upTo: 5_00_000, rate: 5 },
  { upTo: 10_00_000, rate: 20 },
  { upTo: Infinity, rate: 30 },
];

export const REGIMES: RegimeRules[] = [
  {
    id: "new",
    label: "New regime (default)",
    slabs: NEW_REGIME_SLABS,
    rebate: { threshold: 12_00_000, cap: 60_000 },
    marginalReliefThreshold: 12_00_000,
    surchargeBands: [
      { above: 50_00_000, rate: 10 },
      { above: 1_00_00_000, rate: 15 },
      { above: 2_00_00_000, rate: 25 },
      { above: 5_00_00_000, rate: 25 },
    ],
  },
  {
    id: "old",
    label: "Old regime",
    slabs: OLD_REGIME_SLABS,
    rebate: { threshold: 5_00_000, cap: 12_500 },
    surchargeBands: [
      { above: 50_00_000, rate: 10 },
      { above: 1_00_00_000, rate: 15 },
      { above: 2_00_00_000, rate: 25 },
      { above: 5_00_00_000, rate: 37 },
    ],
  },
];

/** Health and education cess, percent of (income tax + surcharge). */
export const CESS_RATE_PERCENT = 4;

export const ADVANCE_TAX: AdvanceTaxRules = {
  threshold: 10_000,
  quarters: [
    { label: "Quarter 1", dueDate: "15 June", cumulativePercent: 15 },
    { label: "Quarter 2", dueDate: "15 September", cumulativePercent: 45 },
    { label: "Quarter 3", dueDate: "15 December", cumulativePercent: 75 },
    { label: "Quarter 4", dueDate: "15 March", cumulativePercent: 100 },
  ],
  presumptiveInstallmentLabel: "Single instalment",
  presumptiveInstallmentDate: "15 March",
};

/** Presumptive taxation schemes (Section 58, formerly 44AD/44ADA). */
export const PRESUMPTIVE_RULES: Record<string, PresumptiveRule> = {
  "44ada": {
    id: "44ada",
    label: "Section 44ADA — specified professionals (50%)",
    rate: 50,
    limit: 75_00_000,
  },
  "44ad": {
    id: "44ad",
    label: "Section 44AD — eligible businesses (8%)",
    rate: 8,
    limit: 3_00_00_000,
  },
};

/** Old-regime deduction caps (statutory maxima, FY 2026-27). */
export const DEDUCTION_CAPS = {
  "80c": 1_50_000,
  "24b": 2_00_000,
  "80d": 25_000,
} as const;