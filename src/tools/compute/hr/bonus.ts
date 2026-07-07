import type { ComputeFn } from "@/tools/types";
import { formatINR, formatNumber, toPositive } from "../format";

/** Eligibility ceiling under the Payment of Bonus Act, 1965 (₹21,000/month basic + DA). */
const ELIGIBILITY_CEILING = 21000;
/** Salary used for the calculation is capped at ₹7,000/month (simplified — see FAQ). */
const CALCULATION_CEILING = 7000;

export const computeBonus: ComputeFn = (values) => {
  const salary = toPositive(values.monthlySalary);
  const rate = toPositive(values.bonusRate);
  const months = toPositive(values.monthsWorked);

  if (salary === null) return { error: "Enter your monthly salary (basic + DA)." };
  if (rate === null || rate < 8.33 || rate > 20)
    return { error: "Bonus rate must be between 8.33% (statutory minimum) and 20% (maximum)." };
  if (months === null || months > 12)
    return { error: "Enter months worked in the accounting year (between 1 and 12)." };
  if (salary > ELIGIBILITY_CEILING)
    return {
      error:
        "Employees earning more than ₹21,000 per month (basic + DA) are not covered by the Payment of Bonus Act, so no statutory bonus is payable.",
    };

  const cappedSalary = Math.min(salary, CALCULATION_CEILING);
  const bonus = cappedSalary * (rate / 100) * months;

  const results = [
    { label: "Statutory bonus payable", value: formatINR(bonus), emphasis: true },
    { label: "Salary used for calculation", value: formatINR(cappedSalary) },
    { label: "Bonus rate applied", value: `${formatNumber(rate)}%` },
  ];
  if (salary > CALCULATION_CEILING) {
    results.push({
      label: "Note",
      value: "Salary capped at ₹7,000/month for the bonus calculation",
    });
  }
  return { results };
};
