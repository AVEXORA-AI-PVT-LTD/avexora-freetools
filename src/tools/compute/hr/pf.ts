import type { ComputeFn } from "@/tools/types";
import { formatINR, toNonNegative, toNonNegativeOr, toPositive } from "../format";

/**
 * Employee contributes 12% of basic; of the employer's 12%, 8.33% goes to EPS
 * (pension), so 3.67% reaches the EPF account. Total EPF inflow = 15.67% of basic.
 */
const EPF_CONTRIBUTION_RATE = 0.12 + 0.0367;

export const computePf: ComputeFn = (values) => {
  const currentAge = toPositive(values.currentAge);
  const retirementAge = toPositive(values.retirementAge);
  const basicSalary = toPositive(values.basicSalary);
  const currentBalance = toNonNegativeOr(values.currentBalance ?? 0, 0);
  const salaryIncrease = toNonNegative(values.salaryIncrease);
  const interestRate = toNonNegative(values.interestRate);

  if (currentAge === null) return { error: "Enter your current age." };
  if (retirementAge === null) return { error: "Enter a valid retirement age." };
  if (retirementAge <= currentAge)
    return { error: "Retirement age must be greater than your current age." };
  if (basicSalary === null) return { error: "Enter your basic monthly salary." };
  if (currentBalance === null) return { error: "Enter a valid current EPF balance (or leave it empty)." };
  if (salaryIncrease === null) return { error: "Enter a valid annual salary increase (zero or more)." };
  if (interestRate === null) return { error: "Enter a valid EPF interest rate (zero or more)." };

  const months = Math.round((retirementAge - currentAge) * 12);
  const monthlyRate = interestRate / 12 / 100;

  let balance = currentBalance;
  let salary = basicSalary;
  let totalContributions = 0;

  for (let m = 0; m < months; m++) {
    if (m > 0 && m % 12 === 0) salary *= 1 + salaryIncrease / 100;
    const contributionWage = Math.min(salary, 15000);
    const contribution = contributionWage * EPF_CONTRIBUTION_RATE;
    totalContributions += contribution;
    balance = (balance + contribution) * (1 + monthlyRate);
  }

  const interestEarned = balance - currentBalance - totalContributions;

  return {
    results: [
      { label: "EPF corpus at retirement", value: formatINR(balance), emphasis: true },
      { label: "Total contributions (employee + employer)", value: formatINR(totalContributions) },
      { label: "Interest earned", value: formatINR(interestEarned) },
    ],
  };
};
