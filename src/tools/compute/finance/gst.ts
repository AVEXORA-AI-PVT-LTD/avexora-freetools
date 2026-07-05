import type { ComputeFn } from "@/tools/types";
import { formatINR, formatPercent, toNonNegative, toPositive } from "../format";

export const computeGst: ComputeFn = (values) => {
  const amount = toPositive(values.amount);
  const rate = toNonNegative(values.rate);
  if (amount === null) return { error: "Enter an amount greater than zero." };
  if (rate === null) return { error: "Select a GST rate." };

  const exclusive = values.mode !== "inclusive";
  const base = exclusive ? amount : amount / (1 + rate / 100);
  const gst = exclusive ? amount * (rate / 100) : amount - base;
  const total = base + gst;

  return {
    results: [
      { label: "Base amount (pre-GST)", value: formatINR(base) },
      { label: `Total GST (${formatPercent(rate)})`, value: formatINR(gst) },
      { label: "CGST", value: formatINR(gst / 2) },
      { label: "SGST", value: formatINR(gst / 2) },
      { label: "IGST (inter-state)", value: formatINR(gst) },
      { label: "Total amount (incl. GST)", value: formatINR(total), emphasis: true },
    ],
  };
};
