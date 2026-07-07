import type { ComputeFn } from "@/tools/types";
import { formatINR, formatPercent, toNonNegative, toPositive } from "../format";

export const computeDiscount: ComputeFn = (values) => {
  const price = toPositive(values.price);
  const discount1 = toNonNegative(values.discount1);
  const discount2 = toNonNegative(values.discount2 ?? 0) ?? 0;

  if (price === null) return { error: "Enter the original price." };
  if (discount1 === null) return { error: "Enter the first discount percentage." };
  if (discount1 > 100 || discount2 > 100) return { error: "Discount percentages cannot exceed 100%." };

  const afterFirst = price * (1 - discount1 / 100);
  const afterSecond = afterFirst * (1 - discount2 / 100);
  const totalSaved = price - afterSecond;
  const effectiveDiscount = (totalSaved / price) * 100;

  const results = [
    { label: "Final price", value: formatINR(afterSecond), emphasis: true },
    { label: "Total amount saved", value: formatINR(totalSaved) },
    { label: "Effective discount", value: formatPercent(effectiveDiscount) },
  ];
  if (discount2 > 0) {
    results.push({ label: "Price after first discount only", value: formatINR(afterFirst) });
  }
  return { results };
};
