import type { ComputeFn } from "@/tools/types";
import { formatINR, formatPercent, toNonNegative, toPositive } from "../format";

interface Slab {
  upTo: number;
  rate: number;
}

/** FY 2025-26 new-regime slabs. */
const NEW_REGIME_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 5 },
  { upTo: 1200000, rate: 10 },
  { upTo: 1600000, rate: 15 },
  { upTo: 2000000, rate: 20 },
  { upTo: 2400000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];

function slabTax(taxable: number): number {
  let tax = 0;
  let lower = 0;
  for (const slab of NEW_REGIME_SLABS) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, slab.upTo) - lower) * (slab.rate / 100);
    lower = slab.upTo;
  }
  return tax;
}

/** New-regime tax with §87A rebate (zero up to ₹12L taxable), marginal relief and 4% cess. */
function newRegimeTax(taxable: number): number {
  let baseTax = slabTax(taxable);
  if (taxable <= 1200000) {
    baseTax = 0;
  } else {
    baseTax = Math.min(baseTax, taxable - 1200000);
  }
  return baseTax * 1.04;
}

export const computeSalary: ComputeFn = (values) => {
  const ctc = toPositive(values.annualCtc);
  const basicPercent = toPositive(values.basicPercent);
  const professionalTax = toNonNegative(values.professionalTax);
  const pfInCtc = values.employerPfInCtc === true || values.employerPfInCtc === "true";

  if (ctc === null) return { error: "Enter an annual CTC greater than zero." };
  if (basicPercent === null || basicPercent > 100)
    return { error: "Enter a basic salary percentage between 1 and 100." };
  if (professionalTax === null)
    return { error: "Enter a valid monthly professional tax (zero or more)." };

  const basic = (ctc * basicPercent) / 100;
  const employeePf = basic * 0.12;
  const employerPf = basic * 0.12;

  // Gross salary = CTC minus the employer's PF share when it is part of CTC.
  const gross = ctc - (pfInCtc ? employerPf : 0);
  const taxable = Math.max(0, gross - 75000);
  const tax = newRegimeTax(taxable);

  const annualInHand = gross - employeePf - tax - professionalTax * 12;
  const monthlyInHand = annualInHand / 12;

  if (annualInHand < 0)
    return { error: "Deductions exceed the CTC — check the basic percentage and professional tax." };

  return {
    results: [
      { label: "Monthly in-hand salary", value: formatINR(monthlyInHand), emphasis: true },
      { label: "Annual in-hand salary", value: formatINR(annualInHand) },
      { label: "Monthly PF contribution (employee)", value: formatINR(employeePf / 12) },
      { label: "Annual income tax (new regime, incl. cess)", value: formatINR(tax) },
      { label: "Effective tax rate (on CTC)", value: formatPercent((tax / ctc) * 100) },
    ],
  };
};
