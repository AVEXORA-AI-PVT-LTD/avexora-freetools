import type { ComputeFn } from "@/tools/types";
import { formatINR, formatPercent, toPositive } from "../format";

export const computeMarkup: ComputeFn = (values) => {
  const cost = toPositive(values.cost);
  const sellingPrice = toPositive(values.sellingPrice);
  if (cost === null) return { error: "Enter a cost greater than zero." };
  if (sellingPrice === null) return { error: "Enter a selling price greater than zero." };

  const profit = sellingPrice - cost;
  const markup = (profit / cost) * 100;
  const margin = (profit / sellingPrice) * 100;

  return {
    results: [
      { label: "Markup (on cost)", value: formatPercent(markup), emphasis: true },
      { label: "Profit per unit", value: formatINR(profit) },
      { label: "Equivalent margin (on price)", value: formatPercent(margin) },
    ],
  };
};
