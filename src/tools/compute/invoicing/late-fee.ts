import type { ComputeFn } from "@/tools/types";
import { formatINR, formatNumber, toNonNegative, toPositive } from "../format";

export const computeLateFee: ComputeFn = (values) => {
  const invoiceAmount = toPositive(values.invoiceAmount);
  const monthlyRate = toNonNegative(values.monthlyRate);
  const daysOverdue = toNonNegative(values.daysOverdue);

  if (invoiceAmount === null) return { error: "Enter the invoice amount." };
  if (monthlyRate === null) return { error: "Enter a valid monthly late fee rate." };
  if (daysOverdue === null) return { error: "Enter the number of days overdue." };

  const dailyRate = monthlyRate / 30;
  const lateFee = invoiceAmount * (dailyRate / 100) * daysOverdue;
  const totalDue = invoiceAmount + lateFee;

  return {
    results: [
      { label: "Late fee", value: formatINR(lateFee), emphasis: true },
      { label: "Total amount now due", value: formatINR(totalDue) },
      { label: "Days overdue", value: formatNumber(daysOverdue) },
      { label: "Effective daily rate", value: `${dailyRate.toFixed(4)}%` },
    ],
  };
};
