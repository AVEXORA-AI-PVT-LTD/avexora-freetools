import type { ComputeFn } from "@/types/tools";
import { formatINR, toNonNegative, toPositive } from "../format";

const FREQUENCIES: Record<string, { periodsPerYear: number; label: string }> = {
  monthly: { periodsPerYear: 12, label: "monthly" },
  quarterly: { periodsPerYear: 4, label: "quarterly" },
  "half-yearly": { periodsPerYear: 2, label: "half-yearly" },
  yearly: { periodsPerYear: 1, label: "yearly" },
};

export const computeFd: ComputeFn = (values) => {
  const principal = toPositive(values.principal);
  const annualRate = toNonNegative(values.annualRate);
  const years = toPositive(values.years);
  const frequency = FREQUENCIES[String(values.frequency)];
  if (principal === null) return { error: "Enter a deposit amount greater than zero." };
  if (annualRate === null) return { error: "Enter a valid interest rate." };
  if (years === null) return { error: "Enter a tenure greater than zero." };
  if (!frequency) return { error: "Select a compounding frequency." };

  const m = frequency.periodsPerYear;
  const maturity = principal * Math.pow(1 + annualRate / 100 / m, m * years);
  const interest = maturity - principal;

  return {
    results: [
      { label: "Maturity amount", value: formatINR(maturity), emphasis: true },
      { label: "Total interest earned", value: formatINR(interest) },
      { label: "Principal invested", value: formatINR(principal) },
    ],
  };
};
