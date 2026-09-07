import type { ComputeFn } from "@/tools/types";
import { formatINR, toNonNegative, toPositive } from "../format";

export const computeDepreciation: ComputeFn = (values) => {
  const cost = toPositive(values.assetCost);
  const salvage = toNonNegative(values.salvageValue);
  const life = toPositive(values.usefulLife);
  const method = String(values.method ?? "straight-line");
  if (cost === null) return { error: "Enter an asset cost greater than zero." };
  if (salvage === null) return { error: "Enter a valid salvage value." };
  if (life === null) return { error: "Enter a useful life greater than zero." };
  if (salvage >= cost) return { error: "Salvage value must be less than the asset cost." };

  const years = Math.round(life);

  if (method === "wdv") {
    const rate = toPositive(values.wdvRate);
    if (rate === null) return { error: "Enter a WDV depreciation rate greater than zero." };
    if (rate >= 100) return { error: "WDV rate must be below 100%." };
    let value = cost;
    const results = [
      {
        label: `Year 1 depreciation (${rate}% WDV)`,
        value: formatINR(cost * (rate / 100)),
        emphasis: true,
      },
    ];
    for (let y = 1; y <= years; y++) {
      const dep = value * (rate / 100);
      value -= dep;
      results.push({
        label: `Book value after year ${y}`,
        value: formatINR(value),
        emphasis: false,
      });
    }
    return { results };
  }

  const annual = (cost - salvage) / life;
  return {
    results: [
      { label: "Annual depreciation (straight-line)", value: formatINR(annual), emphasis: true },
      { label: "Monthly depreciation", value: formatINR(annual / 12) },
      { label: "Total depreciable amount", value: formatINR(cost - salvage) },
      {
        label: `Book value after year 1`,
        value: formatINR(cost - annual),
      },
    ],
  };
};
