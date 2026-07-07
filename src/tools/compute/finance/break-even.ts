import type { ComputeFn } from "@/tools/types";
import { formatINR, formatNumber, formatPercent, toPositive, toNonNegative } from "../format";

export const computeBreakEven: ComputeFn = (values) => {
  const fixedCosts = toPositive(values.fixedCosts);
  const price = toPositive(values.pricePerUnit);
  const variableCost = toNonNegative(values.variableCostPerUnit);
  if (fixedCosts === null) return { error: "Enter fixed costs greater than zero." };
  if (price === null) return { error: "Enter a selling price greater than zero." };
  if (variableCost === null) return { error: "Enter a valid variable cost per unit." };
  if (variableCost >= price) {
    return {
      error:
        "Variable cost per unit must be less than the selling price — otherwise every sale loses money and there is no break-even point.",
    };
  }

  const contribution = price - variableCost;
  const units = fixedCosts / contribution;
  const unitsRounded = Math.ceil(units);
  const revenue = units * price;

  return {
    results: [
      { label: "Break-even units", value: formatNumber(unitsRounded), emphasis: true },
      { label: "Break-even revenue", value: formatINR(revenue) },
      { label: "Contribution margin per unit", value: formatINR(contribution) },
      {
        label: "Contribution margin ratio",
        value: formatPercent((contribution / price) * 100),
      },
    ],
  };
};
