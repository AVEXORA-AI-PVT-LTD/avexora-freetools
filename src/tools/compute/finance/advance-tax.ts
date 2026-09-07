import type { ComputeFn, ResultItem, ResultTable } from "@/types/tools";
import { formatINR, toNonNegativeOr, toPositive } from "../format";
import {
  ADVANCE_TAX,
  CESS_RATE_PERCENT,
  DEDUCTION_CAPS,
  PRESUMPTIVE_RULES,
  REGIMES,
  TAX_YEAR_LABEL,
} from "./advance-tax-rules";
import type { RegimeRules, Slab } from "./advance-tax-rules";

function slabTax(taxable: number, slabs: Slab[]): number {
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, slab.upTo) - lower) * (slab.rate / 100);
    lower = slab.upTo;
  }
  return tax;
}

export interface LiabilityDetail {
  taxable: number;
  incomeTax: number;
  surcharge: number;
  surchargeRate: number;
  cess: number;
  total: number;
}

/**
 * Income tax for the year: slabs → §87A rebate / marginal relief → surcharge →
 * health & education cess. Surcharge applies flat rates with no marginal relief
 * (a documented simplification near the band thresholds).
 */
export function computeLiability(regime: RegimeRules, taxable: number): LiabilityDetail {
  const baseTax = slabTax(taxable, regime.slabs);
  let incomeTax = baseTax;
  if (taxable <= regime.rebate.threshold) {
    incomeTax = baseTax - Math.min(baseTax, regime.rebate.cap);
  } else if (regime.marginalReliefThreshold !== undefined) {
    incomeTax = Math.min(baseTax, taxable - regime.marginalReliefThreshold);
  }
  let surchargeRate = 0;
  for (const band of regime.surchargeBands) {
    if (taxable > band.above) surchargeRate = band.rate;
  }
  const surcharge = incomeTax * (surchargeRate / 100);
  const cess = (incomeTax + surcharge) * (CESS_RATE_PERCENT / 100);
  return { taxable, incomeTax, surcharge, surchargeRate, cess, total: incomeTax + surcharge + cess };
}

export type ScheduleStatus = "quarterly" | "single" | "fully-paid" | "none";

export interface ScheduleRow {
  label: string;
  dueDate: string;
  cumulativeDue: number;
  installment: number;
  balanceAfter: number;
}

export interface AdvanceSchedule {
  status: ScheduleStatus;
  remaining: number;
  rows: ScheduleRow[];
}

/**
 * Build the advance-tax payment plan. TDS is assumed to be credited evenly
 * across the year; advance tax already paid is applied to the earliest
 * instalments first. Installment amounts are whole rupees and always reconcile
 * to `remaining`.
 */
export function buildSchedule(
  netLiability: number,
  advancePaid: number,
  presumptive: boolean,
): AdvanceSchedule {
  const netInt = Math.max(0, Math.round(netLiability));
  const paidInt = Math.max(0, Math.round(advancePaid));
  const applicable = netInt > ADVANCE_TAX.threshold;
  const remaining = applicable ? Math.max(0, netInt - paidInt) : 0;

  if (!applicable) return { status: "none", remaining: 0, rows: [] };
  if (remaining === 0) return { status: "fully-paid", remaining: 0, rows: [] };

  if (presumptive) {
    return {
      status: "single",
      remaining,
      rows: [
        {
          label: ADVANCE_TAX.presumptiveInstallmentLabel,
          dueDate: ADVANCE_TAX.presumptiveInstallmentDate,
          cumulativeDue: remaining,
          installment: remaining,
          balanceAfter: 0,
        },
      ],
    };
  }

  const targets = ADVANCE_TAX.quarters.map((q) => Math.round((q.cumulativePercent / 100) * netInt));
  const cumAfterPaid = targets.map((t) => Math.max(0, t - paidInt));
  const finalCum = cumAfterPaid[cumAfterPaid.length - 1];
  const rows: ScheduleRow[] = [];
  let prev = 0;
  ADVANCE_TAX.quarters.forEach((q, i) => {
    const installment = Math.max(0, cumAfterPaid[i] - prev);
    prev = cumAfterPaid[i];
    rows.push({
      label: `${ordinal(i + 1)} instalment`,
      dueDate: q.dueDate,
      cumulativeDue: targets[i],
      installment,
      balanceAfter: finalCum - cumAfterPaid[i],
    });
  });
  return { status: "quarterly", remaining, rows };
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const suffix = suffixes[n % 100 > 10 && n % 100 < 20 ? 0 : n % 10 <= 3 ? n % 10 : 0];
  return `${n}${suffix}`;
}

function rupee(value: number): string {
  return formatINR(Math.max(0, value));
}

export const computeAdvanceTax: ComputeFn = (values) => {
  const regimeId = String(values.regime ?? "new");
  const regime = REGIMES.find((r) => r.id === regimeId);
  if (!regime) return { error: "Select a valid tax regime." };

  const taxpayerType = String(values.taxpayerType ?? "individual");
  if (!["individual", "professional", "business"].includes(taxpayerType)) {
    return { error: "Select a valid taxpayer type." };
  }
  const presumptiveId = String(values.presumptive ?? "none");
  if (!["none", "44ada", "44ad"].includes(presumptiveId)) {
    return { error: "Select a valid income-estimation option." };
  }

  const incomeMode = String(values.incomeMode ?? "net");
  if (!["net", "gross"].includes(incomeMode)) {
    return { error: "Select a valid income entry mode." };
  }

  let presumptive = false;
  let businessIncome: number;
  let basisText: string;
  let incomeRowLabel = "Business / professional income";

  if (presumptiveId !== "none") {
    const rule = PRESUMPTIVE_RULES[presumptiveId];
    if (rule.id === "44ad" && taxpayerType !== "business") {
      return {
        error:
          "Section 44AD presumptive taxation applies to businesses and trades only. Choose “Business / Proprietor” as the taxpayer type, or select a different income option.",
      };
    }
    if (rule.id === "44ada" && taxpayerType === "business") {
      return {
        error:
          "Section 44ADA applies to specified professionals, not businesses. Choose “Self-employed professional” or “Individual / Freelancer”, or select a different income option.",
      };
    }
    const gross = toPositive(values.grossReceipts);
    if (gross === null) {
      return { error: `Enter your gross receipts to use the ${rule.label} option.` };
    }
    if (gross > rule.limit) {
      return {
        error: `Gross receipts of ${rupee(gross)} exceed the ${rupee(rule.limit)} limit for ${rule.label}.`,
      };
    }
    presumptive = true;
    businessIncome = gross * (rule.rate / 100);
    basisText = `Presumptive — ${presumptiveId.toUpperCase()}: ${rule.rate}% of gross receipts`;
    incomeRowLabel = `Presumptive income (${presumptiveId.toUpperCase()} @ ${rule.rate}%)`;
  } else if (incomeMode === "gross") {
    const gross = toPositive(values.grossReceipts);
    if (gross === null) return { error: "Enter your gross receipts greater than zero." };
    const expenses = toNonNegativeOr(values.businessExpenses, 0);
    if (expenses === null) return { error: "Enter a valid amount for business expenses." };
    if (expenses > gross) {
      return { error: "Business expenses cannot exceed gross receipts." };
    }
    businessIncome = gross - expenses;
    basisText = "Gross receipts minus expenses";
    incomeRowLabel = "Business income (gross minus expenses)";
  } else {
    const netProfit = toPositive(values.netProfit);
    if (netProfit === null) {
      return { error: "Enter your estimated net taxable profit for the year." };
    }
    businessIncome = netProfit;
    basisText = "Net taxable profit";
  }

  const otherIncome = toNonNegativeOr(values.otherIncome, 0);
  if (otherIncome === null) return { error: "Enter a valid amount for other income." };

  let deductions = 0;
  if (regime.id === "old") {
    const check = (value: unknown, cap: number): number => {
      const n = toNonNegativeOr(value, 0);
      if (n === null) return NaN;
      if (n > cap) return NaN;
      return n;
    };
    const eightyC = check(values.dedSection80c, DEDUCTION_CAPS["80c"]);
    const section24b = check(values.dedSection24b, DEDUCTION_CAPS["24b"]);
    const eightyD = check(values.dedSection80d, DEDUCTION_CAPS["80d"]);
    if ([eightyC, section24b, eightyD].some((n) => Number.isNaN(n))) {
      return {
        error:
          "Old-regime deductions are capped: 80C at ₹1,50,000, home-loan interest (24(b)) at ₹2,00,000 and 80D at ₹25,000. Enter amounts within these limits.",
      };
    }
    deductions = Number(eightyC) + Number(section24b) + Number(eightyD);
  }

  const taxable = Math.max(0, businessIncome + otherIncome - deductions);
  const liability = computeLiability(regime, taxable);

  const tds = toNonNegativeOr(values.tdsDeducted, 0);
  if (tds === null) return { error: "Enter a valid amount for TDS already deducted." };
  const advancePaid = toNonNegativeOr(values.advanceTaxPaid, 0);
  if (advancePaid === null) return { error: "Enter a valid amount for advance tax already paid." };

  const netLiability = liability.total - tds;
  const tdsExceeds = netLiability < 0;
  const schedule = buildSchedule(netLiability, advancePaid, presumptive);

  const results: ResultItem[] = [
    { label: `Income basis (${TAX_YEAR_LABEL})`, value: basisText },
    { label: incomeRowLabel, value: rupee(businessIncome) },
    { label: "Other income", value: rupee(otherIncome) },
  ];
  if (deductions > 0) {
    results.push({
      label: `Less: deductions (80C / 24(b) / 80D, capped)`,
      value: rupee(deductions),
    });
  }
  results.push(
    { label: "Total taxable income", value: rupee(taxable) },
    { label: "Income tax before surcharge & cess", value: rupee(liability.incomeTax) },
    { label: `Surcharge (${liability.surchargeRate}%)`, value: rupee(liability.surcharge) },
    { label: "Health & education cess (4%)", value: rupee(liability.cess) },
    { label: "Estimated total tax for the year", value: rupee(liability.total), emphasis: true },
    { label: "Less: TDS credited to your PAN", value: rupee(tds) },
    { label: "Net tax payable after TDS", value: rupee(Math.max(0, netLiability)) },
    { label: "Less: advance tax already paid", value: rupee(advancePaid) },
    { label: "Remaining advance tax", value: rupee(schedule.remaining), emphasis: true },
  );

  let statusText: string;
  switch (schedule.status) {
    case "quarterly":
      statusText =
        "Payable in quarterly instalments — net tax after TDS exceeds ₹10,000 (Sec 404).";
      break;
    case "single":
      statusText = `Payable in one instalment by ${ADVANCE_TAX.presumptiveInstallmentDate} — presumptive taxation (Sec 408(2)).`;
      break;
    case "fully-paid":
      statusText = "Already covered by the advance tax you have paid.";
      break;
    default:
      statusText = "Not payable — net tax after TDS does not exceed ₹10,000 (Sec 404).";
  }
  if (tdsExceeds) {
    statusText += " TDS credited exceeds your estimated tax — you may be due a refund.";
  }
  results.push({ label: "Advance tax status", value: statusText });

  const tables: ResultTable[] = [];

  if (schedule.status === "quarterly") {
    tables.push({
      title: "Advance tax payment schedule — FY 2026-27",
      headers: ["Instalment", "Due by", "Cumulative due", "Pay this instalment", "Balance after payment"],
      rows: schedule.rows.map((r) => [
        r.label,
        r.dueDate,
        rupee(r.cumulativeDue),
        rupee(r.installment),
        rupee(r.balanceAfter),
      ]),
    });
  } else if (schedule.status === "single") {
    tables.push({
      title: "Advance tax payment — presumptive taxation",
      headers: ["Instalment", "Due by", "Amount"],
      rows: schedule.rows.map((r) => [r.label, r.dueDate, rupee(r.installment)]),
    });
  }

  return { results, tables };
};