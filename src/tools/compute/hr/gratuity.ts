import type { ComputeFn } from "@/tools/types";
import { formatINR, formatNumber, toPositive } from "../format";

/** Statutory gratuity ceiling under the Payment of Gratuity Act, 1972 (as amended). */
const GRATUITY_CAP = 2000000;

export const computeGratuity: ComputeFn = (values) => {
  const salary = toPositive(values.monthlySalary);
  const years = toPositive(values.yearsOfService);

  if (salary === null) return { error: "Enter your last drawn monthly salary (basic + DA)." };
  if (years === null) return { error: "Enter your total years of service." };
  if (years < 5)
    return {
      error:
        "Gratuity requires at least 5 years of continuous service with the same employer under the Payment of Gratuity Act, so you are not yet eligible.",
    };

  // Service beyond 6 months in the final year rounds up to a full year.
  const completed = Math.floor(years);
  const fraction = years - completed;
  const roundedYears = fraction > 0.5 ? completed + 1 : completed;

  const raw = (15 * salary * roundedYears) / 26;
  const capped = Math.min(raw, GRATUITY_CAP);

  const results = [
    { label: "Gratuity payable", value: formatINR(capped), emphasis: true },
    { label: "Years of service counted", value: formatNumber(roundedYears) },
    { label: "15-day salary (per year of service)", value: formatINR((15 * salary) / 26) },
  ];
  if (raw > GRATUITY_CAP) {
    results.push({
      label: "Before the ₹20 lakh statutory cap",
      value: formatINR(raw),
    });
  }
  return { results };
};
