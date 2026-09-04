import type { ComputeFn } from "@/types/tools";
import { formatINR, formatPercent, toNonNegative, toPositive } from "../format";

export const computeMargin: ComputeFn = (values) => {
  const cost = toNonNegative(values.cost);
  const revenue = toPositive(values.revenue);
  if (cost === null) return { error: "Enter a valid cost." };
  if (revenue === null) return { error: "Enter revenue greater than zero." };

  const profit = revenue - cost;
  const margin = (profit / revenue) * 100;

  const results = [
    { label: "Gross profit", value: formatINR(profit) },
    { label: "Profit margin", value: formatPercent(margin), emphasis: true },
  ];
  if (cost > 0) {
    results.push({ label: "Markup (on cost)", value: formatPercent((profit / cost) * 100) });
  }
  return { results };
};
