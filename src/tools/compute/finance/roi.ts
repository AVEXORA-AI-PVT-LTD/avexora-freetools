import type { ComputeFn } from "@/tools/types";
import { formatINR, formatPercent, toNonNegative, toPositive } from "../format";

export const computeRoi: ComputeFn = (values) => {
  const initial = toPositive(values.initialInvestment);
  const final = toNonNegative(values.finalValue);
  const years = toPositive(values.years);
  if (initial === null) return { error: "Enter an initial investment greater than zero." };
  if (final === null) return { error: "Enter a valid final value." };
  if (years === null) return { error: "Enter a holding period greater than zero." };

  const gain = final - initial;
  const roi = (gain / initial) * 100;

  const results = [
    { label: "Total ROI", value: formatPercent(roi), emphasis: true },
    { label: "Net gain / loss", value: formatINR(gain) },
  ];
  if (final > 0) {
    const annualized = (Math.pow(final / initial, 1 / years) - 1) * 100;
    results.push({ label: "Annualized ROI (CAGR)", value: formatPercent(annualized) });
  }
  return { results };
};
