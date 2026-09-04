import type { ComputeFn } from "@/types/tools";
import { formatINR, toNonNegative, toPositive } from "../format";

export const computeHra: ComputeFn = (values) => {
  const basic = toPositive(values.basicSalary);
  const hraReceived = toNonNegative(values.hraReceived);
  const rentPaid = toNonNegative(values.rentPaid);
  const metro = values.metro === true || values.metro === "true";

  if (basic === null) return { error: "Enter your annual basic salary (greater than zero)." };
  if (hraReceived === null) return { error: "Enter the annual HRA you receive." };
  if (rentPaid === null) return { error: "Enter the annual rent you pay." };

  const rentOverTenPercent = Math.max(0, rentPaid - basic * 0.1);
  const basicPercent = basic * (metro ? 0.5 : 0.4);
  const exempt = Math.min(hraReceived, rentOverTenPercent, basicPercent);
  const taxable = hraReceived - exempt;

  return {
    results: [
      { label: "Exempt HRA", value: formatINR(exempt), emphasis: true },
      { label: "Taxable HRA", value: formatINR(taxable) },
      { label: "Actual HRA received", value: formatINR(hraReceived) },
      { label: "Rent paid minus 10% of basic", value: formatINR(rentOverTenPercent) },
      {
        label: metro ? "50% of basic (metro)" : "40% of basic (non-metro)",
        value: formatINR(basicPercent),
      },
    ],
  };
};
