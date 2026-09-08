import type { ComputeFn } from "@/types/tools";
import { formatINR, toNonNegative, toPositive } from "../format";

const PERIODS: Record<string, number> = {
  yearly: 1,
  "half-yearly": 2,
  quarterly: 4,
  monthly: 12,
};

export const computeCompoundInterest: ComputeFn = (values) => {
  const principal = toPositive(values.principal);
  const annualRate = toNonNegative(values.annualRate);
  const years = toPositive(values.years);
  const m = PERIODS[String(values.frequency)];
  if (principal === null) return { error: "Enter a principal amount greater than zero." };
  if (annualRate === null) return { error: "Enter a valid interest rate." };
  if (years === null) return { error: "Enter a time period greater than zero." };
  if (!m) return { error: "Select a compounding frequency." };

  const amount = principal * Math.pow(1 + annualRate / 100 / m, m * years);
  const interest = amount - principal;

  return {
    results: [
      { label: "Maturity amount", value: formatINR(amount), emphasis: true },
      { label: "Compound interest earned", value: formatINR(interest) },
      { label: "Principal", value: formatINR(principal) },
    ],
  };
};
