import type { ComputeFn } from "@/tools/types";
import { formatINR, formatNumber, toNonNegative, toPositive } from "../format";

export const computeEmi: ComputeFn = (values) => {
  const principal = toPositive(values.loanAmount);
  const annualRate = toNonNegative(values.annualRate);
  const years = toPositive(values.tenureYears);
  if (principal === null) return { error: "Enter a loan amount greater than zero." };
  if (annualRate === null) return { error: "Enter a valid annual interest rate." };
  if (years === null) return { error: "Enter a loan tenure greater than zero." };

  const months = Math.round(years * 12);
  if (months < 1) return { error: "Loan tenure must be at least one month." };

  const monthlyRate = annualRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  return {
    results: [
      { label: "Monthly EMI", value: formatINR(emi), emphasis: true },
      { label: "Total interest payable", value: formatINR(totalInterest) },
      { label: "Total payment (principal + interest)", value: formatINR(totalPayment) },
      { label: "Number of instalments", value: formatNumber(months) },
    ],
  };
};
