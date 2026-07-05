import type { ComputeFn } from "@/tools/types";
import { formatINR, toNonNegative, toPositive } from "../format";

/**
 * Standard Indian bank/post-office RD formula with quarterly compounding:
 * M = R × ((1 + i)^n − 1) / (1 − (1 + i)^(−1/3))
 * where i = annual rate / 4 (quarterly rate) and n = tenure in quarters.
 */
export const computeRd: ComputeFn = (values) => {
  const monthly = toPositive(values.monthlyDeposit);
  const annualRate = toNonNegative(values.annualRate);
  const months = toPositive(values.months);
  if (monthly === null) return { error: "Enter a monthly deposit greater than zero." };
  if (annualRate === null) return { error: "Enter a valid interest rate." };
  if (months === null) return { error: "Enter a tenure greater than zero." };

  const n = Math.round(months);
  if (n < 3) return { error: "RD tenure must be at least 3 months." };

  const deposited = monthly * n;
  const i = annualRate / 4 / 100;
  const quarters = n / 3;
  const maturity =
    i === 0
      ? deposited
      : (monthly * (Math.pow(1 + i, quarters) - 1)) / (1 - Math.pow(1 + i, -1 / 3));
  const interest = maturity - deposited;

  return {
    results: [
      { label: "Maturity amount", value: formatINR(maturity), emphasis: true },
      { label: "Total deposited", value: formatINR(deposited) },
      { label: "Interest earned", value: formatINR(interest) },
    ],
  };
};
