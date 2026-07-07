import type { ComputeFn } from "@/tools/types";
import { formatINR, toNonNegative, toPositive } from "../format";

export const computeOvertime: ComputeFn = (values) => {
  const wages = toPositive(values.monthlyWages);
  const dailyHours = toPositive(values.dailyHours);
  const otHours = toNonNegative(values.overtimeHours);

  if (wages === null) return { error: "Enter your monthly wages." };
  if (dailyHours === null || dailyHours > 24)
    return { error: "Enter normal daily working hours (between 1 and 24)." };
  if (otHours === null) return { error: "Enter the overtime hours worked (zero or more)." };

  // 26 working days per month is the standard divisor used for daily wages.
  const hourlyRate = wages / 26 / dailyHours;
  const otHourlyRate = 2 * hourlyRate;
  const otPay = otHourlyRate * otHours;

  return {
    results: [
      { label: "Overtime pay", value: formatINR(otPay), emphasis: true },
      { label: "Ordinary hourly rate", value: formatINR(hourlyRate) },
      { label: "Overtime hourly rate (2×)", value: formatINR(otHourlyRate) },
    ],
  };
};
