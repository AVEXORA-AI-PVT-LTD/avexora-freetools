import type { ComputeFn } from "@/tools/types";
import { formatINR, toNonNegative, toPositive } from "../format";

export const computeSimpleInterest: ComputeFn = (values) => {
  const principal = toPositive(values.principal);
  const annualRate = toNonNegative(values.annualRate);
  const years = toPositive(values.years);
  if (principal === null) return { error: "Enter a principal amount greater than zero." };
  if (annualRate === null) return { error: "Enter a valid interest rate." };
  if (years === null) return { error: "Enter a time period greater than zero." };

  const interest = (principal * annualRate * years) / 100;
  const total = principal + interest;

  return {
    results: [
      { label: "Simple interest", value: formatINR(interest), emphasis: true },
      { label: "Total amount (principal + interest)", value: formatINR(total) },
      { label: "Principal", value: formatINR(principal) },
    ],
  };
};
