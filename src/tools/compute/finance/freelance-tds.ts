import type { ComputeFn, ResultItem, ResultTable } from "@/types/tools";
import { formatINR, formatPercent, toNonNegative, toNonNegativeOr } from "../format";
import {
  FREELANCE_TDS_ACT_NOTE,
  FREELANCE_TDS_CATEGORIES,
  FREELANCE_TDS_NO_PAN_RATE,
  FREELANCE_TDS_PAYERS,
  FREELANCE_TDS_TAX_YEAR_LABEL,
  FREELANCE_TDS_THRESHOLD,
} from "./freelance-tds-rules";

export type FreelanceTdsCategory = "professional" | "technical";
export type FreelanceTdsPayerType = "non-individual" | "huf-specified" | "huf-exempt";

export interface FreelanceTdsInput {
  /** Fee / invoice amount, excluding GST when GST is shown separately. */
  amount: number;
  category: FreelanceTdsCategory;
  /** Aggregate paid/credited in this category during the tax year, inclusive of this payment. */
  yearlyTotal: number;
  payerType: FreelanceTdsPayerType;
  /** Whether the payee has furnished a valid PAN to the deductor. */
  panProvided: boolean;
}

export type ThresholdStatus = "crossed" | "not-crossed" | "payer-exempt";

export interface FreelanceTdsCalculation {
  categoryId: FreelanceTdsCategory;
  categoryLabel: string;
  /** Rate actually applied, in percent (raised to 20% when no valid PAN). */
  rate: number;
  /** Human-readable reason shown with the applied rate, when not the standard one. */
  rateNote: string;
  payerLabel: string;
  payerDeducts: boolean;
  /** Annual aggregate considered for the threshold test (never below this payment). */
  aggregate: number;
  thresholdStatus: ThresholdStatus;
  applicable: boolean;
  tds: number;
  net: number;
  statusText: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Pure Section 194J (now Section 393(1) S.6(iii)) TDS calculation.
 *
 * - The exemption is ₹50,000 of aggregate payments in a single category per
 *   tax year; while the aggregate stays within it, no TDS is deducted.
 * - Once the aggregate exceeds the threshold, TDS applies on the full amount
 *   of the payment, not just the excess (mainstream interpretation of the
 *   proviso — see changes.md §14).
 * - Companies/firms and individuals/HUFs above the ₹1 crore / ₹50 lakh
 *   turn-over test deduct; other individuals/HUFs do not.
 * - Without a valid PAN the rate rises to the higher of the section rate or
 *   20% (Section 397(2), formerly 206AA).
 */
export function calculateFreelanceTds(input: FreelanceTdsInput): FreelanceTdsCalculation {
  const category = FREELANCE_TDS_CATEGORIES[input.category];
  const payer = FREELANCE_TDS_PAYERS[input.payerType];

  const amount = round2(input.amount);
  const aggregate = round2(Math.max(input.yearlyTotal, input.amount));
  const payerDeducts = payer.deducts;

  let rate = category.rate;
  let rateNote = "";
  if (!input.panProvided) {
    rate = Math.max(rate, FREELANCE_TDS_NO_PAN_RATE);
    rateNote = "no valid PAN furnished — rate raised to 20% (Section 397(2))";
  }

  const crossed = aggregate > FREELANCE_TDS_THRESHOLD;
  const thresholdStatus: ThresholdStatus = payerDeducts
    ? crossed
      ? "crossed"
      : "not-crossed"
    : "payer-exempt";
  const applicable = payerDeducts && crossed;

  const tds = applicable ? round2((amount * rate) / 100) : 0;
  const net = round2(amount - tds);

  let statusText: string;
  if (!payerDeducts) {
    statusText =
      "No TDS is required — the payer is an individual or HUF within the ₹1 crore (business) / ₹50 lakh (profession) turnover limits, or is paying for personal purposes.";
  } else if (crossed) {
    statusText = `The annual aggregate for “${category.label}” exceeds the ₹50,000 threshold, so TDS applies on the full amount of this payment (not just the excess).`;
  } else {
    statusText = `The annual aggregate for “${category.label}” is within the ₹50,000 threshold — no TDS is deducted.`;
  }

  return {
    categoryId: category.id,
    categoryLabel: category.label,
    rate,
    rateNote,
    payerLabel: payer.label,
    payerDeducts,
    aggregate,
    thresholdStatus,
    applicable,
    tds,
    net,
    statusText,
  };
}

function rupee(value: number): string {
  return formatINR(value);
}

export const computeFreelanceTds: ComputeFn = (values) => {
  const amount = toNonNegative(values.amount);
  if (amount === null) {
    const blank =
      values.amount === undefined || values.amount === null ||
      (typeof values.amount === "string" && values.amount.trim() === "");
    return { error: blank ? "Enter the payment / invoice amount." : "Enter a valid payment amount (zero or more)." };
  }

  const category = FREELANCE_TDS_CATEGORIES[String(values.category)];
  if (!category) return { error: "Select a payment category." };

  const yearlyTotal = toNonNegativeOr(values.yearlyTotal, 0);
  if (yearlyTotal === null) {
    return { error: "Enter a valid annual aggregate for this category (zero or more)." };
  }

  const payerTypeValue = String(values.payerType ?? "non-individual");
  if (!(payerTypeValue in FREELANCE_TDS_PAYERS)) return { error: "Select a payer type." };
  const payerType = payerTypeValue as FreelanceTdsPayerType;

  const panValue = String(values.panProvided ?? "yes");
  if (panValue !== "yes" && panValue !== "no") {
    return { error: "Select whether a valid PAN is furnished." };
  }

  const calc = calculateFreelanceTds({
    amount,
    category: category.id,
    yearlyTotal,
    payerType,
    panProvided: panValue === "yes",
  });

  const rateValue = formatPercent(calc.rate) + (calc.rateNote ? ` (${calc.rateNote})` : "");
  const statusSummary =
    calc.thresholdStatus === "crossed"
      ? "Crossed — TDS applies to the full payment"
      : calc.thresholdStatus === "payer-exempt"
        ? "Payer not required to deduct"
        : "Within ₹50,000 — no TDS";

  const results: ResultItem[] = [
    { label: `Section (${FREELANCE_TDS_TAX_YEAR_LABEL})`, value: "393(1) Table S.6(iii) — formerly 194J" },
    { label: "Payment category", value: calc.categoryLabel },
    { label: "Applicable TDS rate", value: rateValue },
    { label: "Gross payment / invoice amount", value: rupee(amount) },
    { label: "Annual aggregate in this category", value: rupee(calc.aggregate) },
    { label: "Threshold status (₹50,000 per category per year)", value: statusSummary },
    { label: "TDS to deduct", value: rupee(calc.tds), emphasis: true },
    { label: "Net amount receivable", value: rupee(calc.net), emphasis: true },
  ];

  const tables: ResultTable[] = [
    {
      title: "How it was calculated",
      headers: ["Step", "Value"],
      rows: [
        ["Gross fee (as charged)", rupee(amount)],
        ["Annual aggregate in this category (including this payment)", rupee(calc.aggregate)],
        ["Exemption threshold", `${rupee(FREELANCE_TDS_THRESHOLD)} — Section 393(1) S.6(iii), per category per tax year`],
        ["Threshold decision", calc.statusText],
        ["Rate applied", rateValue],
        ["TDS = gross × rate", rupee(calc.tds)],
        ["Net receivable = gross − TDS", rupee(calc.net)],
      ],
    },
    {
      title: "Tax rules & assumptions",
      headers: ["Rule", "Value"],
      rows: [
        ["Section in force", "Section 393(1), Table Sl. No. 6(iii) — Income-tax Act, 2025 (formerly Section 194J of the Income-tax Act, 1961)"],
        ["Act", FREELANCE_TDS_ACT_NOTE],
        ["Tax year", FREELANCE_TDS_TAX_YEAR_LABEL],
        ["Categories & rates", "Professional services — 10% (return payment code 1027); fees for technical services (FTS) — 2% (payment code 1026)"],
        ["Threshold", "₹50,000 of aggregate payments per category per tax year. Once crossed, TDS applies to the full amount of the payment, not just the excess."],
        ["Payer applicability", calc.payerLabel],
        ["No valid PAN", "Rate raised to 20% — Section 397(2) of the 2025 Act (formerly Section 206AA). The old non-filer higher rate (206AB) was eliminated from 1 April 2026."],
        ["GST", "Enter the fee excluding GST — when GST is shown separately on the invoice, TDS applies to the fee only, not the GST."],
        ["Residency", "A resident payee is assumed. Payments to non-residents fall under a different section and rates, and are outside this tool's scope."],
        ["Disclaimer", "This is an estimate for the selected scenario and tax year based on current rules. Actual TDS depends on the payer, payee, nature of the service, aggregate payments in the year, PAN status and other facts. Verify current rules with the Income Tax Department or a qualified tax professional before relying on any amount."],
      ],
    },
  ];

  return { results, tables };
};