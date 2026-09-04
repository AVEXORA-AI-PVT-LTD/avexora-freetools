import type { ComputeFn } from "@/types/tools";
import { formatINR, formatNumber, toNonNegative, toPositive } from "../format";

export const computeNoticePeriodRecovery: ComputeFn = (values) => {
  const salary = toPositive(values.monthlySalary);
  const requiredDays = toPositive(values.requiredDays);
  const servedDays = toNonNegative(values.servedDays);

  if (salary === null) return { error: "Enter your monthly gross salary." };
  if (requiredDays === null) return { error: "Enter the notice period required by your contract (in days)." };
  if (servedDays === null) return { error: "Enter the notice days actually served (zero or more)." };

  const shortfallDays = Math.max(0, requiredDays - servedDays);
  const perDay = salary / 30;
  const recovery = perDay * shortfallDays;

  return {
    results: [
      { label: "Notice period recovery", value: formatINR(recovery), emphasis: true },
      { label: "Shortfall days", value: formatNumber(shortfallDays) },
      { label: "Per-day rate (salary ÷ 30)", value: formatINR(perDay) },
    ],
  };
};
