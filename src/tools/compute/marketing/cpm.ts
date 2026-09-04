import type { ComputeFn, ResultItem } from "@/types/tools";
import { formatINR, toNumber, toPositive } from "../format";

function optionalPositive(value: unknown): { n: number | null; invalid: boolean } {
  if (value === undefined || value === null || value === "") return { n: null, invalid: false };
  const n = toNumber(value);
  if (n === null || n <= 0) return { n: null, invalid: true };
  return { n, invalid: false };
}

export const computeCpm: ComputeFn = (values) => {
  const cost = toPositive(values.cost);
  if (cost === null) return { error: "Enter the total campaign cost (greater than zero)." };

  const impressions = optionalPositive(values.impressions);
  if (impressions.invalid) return { error: "Impressions must be a number greater than zero (or left empty)." };
  const clicks = optionalPositive(values.clicks);
  if (clicks.invalid) return { error: "Clicks must be a number greater than zero (or left empty)." };

  if (impressions.n === null && clicks.n === null) {
    return { error: "Enter impressions, clicks, or both to calculate CPM, CPC and CTR." };
  }

  const results: ResultItem[] = [];
  if (impressions.n !== null) {
    results.push({ label: "CPM (cost per 1,000 impressions)", value: formatINR((cost / impressions.n) * 1000), emphasis: true });
  }
  if (clicks.n !== null) {
    results.push({ label: "CPC (cost per click)", value: formatINR(cost / clicks.n), emphasis: impressions.n === null });
  }
  if (impressions.n !== null && clicks.n !== null) {
    results.push({ label: "CTR (click-through rate)", value: `${((clicks.n / impressions.n) * 100).toFixed(2)}%` });
  }
  return { results };
};
