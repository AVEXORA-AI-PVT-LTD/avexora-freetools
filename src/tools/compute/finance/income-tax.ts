import type { ComputeFn } from "@/tools/types";
import { formatINR, formatPercent, toPositive } from "../format";

interface Slab {
  upTo: number;
  rate: number;
}

const NEW_REGIME_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 5 },
  { upTo: 1200000, rate: 10 },
  { upTo: 1600000, rate: 15 },
  { upTo: 2000000, rate: 20 },
  { upTo: 2400000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];

const OLD_REGIME_SLABS: Slab[] = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 5 },
  { upTo: 1000000, rate: 20 },
  { upTo: Infinity, rate: 30 },
];

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

interface RegimeResult {
  taxable: number;
  baseTax: number;
  cess: number;
  total: number;
}

/** New regime, FY 2025-26: §87A rebate up to ₹12L taxable, with marginal relief above it. */
function newRegimeTax(income: number, salaried: boolean): RegimeResult {
  const taxable = Math.max(0, income - (salaried ? 75000 : 0));
  let baseTax = slabTax(taxable, NEW_REGIME_SLABS);
  if (taxable <= 1200000) {
    baseTax = 0;
  } else {
    // Marginal relief: tax cannot exceed income above the ₹12L rebate threshold.
    baseTax = Math.min(baseTax, taxable - 1200000);
  }
  const cess = baseTax * 0.04;
  return { taxable, baseTax, cess, total: baseTax + cess };
}

/** Old regime: §87A rebate (max ₹12,500) up to ₹5L taxable income. */
function oldRegimeTax(income: number, salaried: boolean): RegimeResult {
  const taxable = Math.max(0, income - (salaried ? 50000 : 0));
  let baseTax = slabTax(taxable, OLD_REGIME_SLABS);
  if (taxable <= 500000) baseTax = 0;
  const cess = baseTax * 0.04;
  return { taxable, baseTax, cess, total: baseTax + cess };
}

export const computeIncomeTax: ComputeFn = (values) => {
  const income = toPositive(values.annualIncome);
  if (income === null) return { error: "Enter an annual income greater than zero." };
  const salaried = values.salaried === true || values.salaried === "true";
  const regime = String(values.regime ?? "compare");

  const nw = newRegimeTax(income, salaried);
  const old = oldRegimeTax(income, salaried);

  if (regime === "new" || regime === "old") {
    const r = regime === "new" ? nw : old;
    const label = regime === "new" ? "New regime" : "Old regime";
    return {
      results: [
        { label: `Taxable income (${label.toLowerCase()})`, value: formatINR(r.taxable) },
        { label: "Income tax (before cess)", value: formatINR(r.baseTax) },
        { label: "Health & education cess (4%)", value: formatINR(r.cess) },
        { label: `Total tax — ${label.toLowerCase()}`, value: formatINR(r.total), emphasis: true },
        {
          label: "Effective tax rate",
          value: formatPercent((r.total / income) * 100),
        },
      ],
    };
  }

  const newIsLower = nw.total <= old.total;
  const savings = Math.abs(nw.total - old.total);
  return {
    results: [
      {
        label: "Total tax — new regime (incl. cess)",
        value: formatINR(nw.total),
        emphasis: newIsLower,
      },
      {
        label: "Total tax — old regime (incl. cess)",
        value: formatINR(old.total),
        emphasis: !newIsLower,
      },
      {
        label: newIsLower ? "You save with the new regime" : "You save with the old regime",
        value: formatINR(savings),
      },
      { label: "Taxable income (new regime)", value: formatINR(nw.taxable) },
      { label: "Taxable income (old regime)", value: formatINR(old.taxable) },
    ],
  };
};
