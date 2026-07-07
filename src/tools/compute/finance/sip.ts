import type { ComputeFn } from "@/tools/types";
import { formatINR, toNonNegative, toPositive } from "../format";

export const computeSip: ComputeFn = (values) => {
  const monthly = toPositive(values.monthlyInvestment);
  const annualReturn = toNonNegative(values.annualReturn);
  const years = toPositive(values.years);
  if (monthly === null) return { error: "Enter a monthly investment greater than zero." };
  if (annualReturn === null) return { error: "Enter a valid expected annual return." };
  if (years === null) return { error: "Enter an investment period greater than zero." };

  const months = Math.round(years * 12);
  if (months < 1) return { error: "Investment period must be at least one month." };

  const i = annualReturn / 12 / 100;
  const corpus =
    i === 0
      ? monthly * months
      : monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  const invested = monthly * months;
  const returns = corpus - invested;

  return {
    results: [
      { label: "Maturity corpus", value: formatINR(corpus), emphasis: true },
      { label: "Total invested", value: formatINR(invested) },
      { label: "Estimated returns", value: formatINR(returns) },
    ],
  };
};
