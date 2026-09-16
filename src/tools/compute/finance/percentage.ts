import type { ComputeFn } from "@/types/tools";
import { formatNumber, formatPercent, toNumber } from "../format";

export const computePercentage: ComputeFn = (values) => {
  const mode = String(values.mode ?? "of");
  const x = toNumber(values.x);
  const y = toNumber(values.y);
  if (x === null) return { error: "Enter a valid number for X." };
  if (y === null) return { error: "Enter a valid number for Y." };

  if (mode === "isWhatPercent") {
    if (y === 0) return { error: "Y cannot be zero." };
    const result = (x / y) * 100;
    return {
      results: [
        {
          label: `${formatNumber(x)} is what % of ${formatNumber(y)}`,
          value: formatPercent(result),
          emphasis: true,
        },
      ],
    };
  }

  if (mode === "change") {
    if (x === 0) return { error: "The starting value (X) cannot be zero for a percentage change." };
    const diff = y - x;
    const pct = (diff / Math.abs(x)) * 100;
    const direction = diff > 0 ? "increase" : diff < 0 ? "decrease" : "change";
    return {
      results: [
        { label: "Difference (Y − X)", value: formatNumber(diff) },
        { label: `Percentage ${direction}`, value: formatPercent(Math.abs(pct)), emphasis: true },
      ],
    };
  }

  // "of": X% of Y
  const result = (x / 100) * y;
  return {
    results: [
      { label: `${formatNumber(x)}% of ${formatNumber(y)}`, value: formatNumber(result), emphasis: true },
    ],
  };
};
