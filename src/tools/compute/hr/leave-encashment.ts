import type { ComputeFn } from "@/tools/types";
import { formatINR, formatNumber, toNonNegative, toPositive } from "../format";

export const computeLeaveEncashment: ComputeFn = (values) => {
  const salary = toPositive(values.monthlySalary);
  const days = toNonNegative(values.leaveDays);

  if (salary === null) return { error: "Enter your monthly salary (basic + DA)." };
  if (days === null) return { error: "Enter the number of earned leave days to encash." };

  const perDay = salary / 30;
  const amount = perDay * days;

  return {
    results: [
      { label: "Leave encashment amount", value: formatINR(amount), emphasis: true },
      { label: "Per-day rate (salary ÷ 30)", value: formatINR(perDay) },
      { label: "Leave days encashed", value: formatNumber(days) },
    ],
  };
};
