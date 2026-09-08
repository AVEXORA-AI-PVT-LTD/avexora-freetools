import type { ComputeFn } from "@/types/tools";
import { formatINR, formatNumber, toNonNegative } from "../format";

export const computeWorkingCapital: ComputeFn = (values) => {
  const assets = toNonNegative(values.currentAssets);
  const liabilities = toNonNegative(values.currentLiabilities);
  if (assets === null) return { error: "Enter valid current assets." };
  if (liabilities === null) return { error: "Enter valid current liabilities." };

  const workingCapital = assets - liabilities;
  const results = [
    { label: "Net working capital", value: formatINR(workingCapital), emphasis: true },
    { label: "Current assets", value: formatINR(assets) },
    { label: "Current liabilities", value: formatINR(liabilities) },
  ];
  if (liabilities > 0) {
    results.push({
      label: "Current ratio",
      value: formatNumber(assets / liabilities),
      emphasis: false,
    });
  }
  return { results };
};
