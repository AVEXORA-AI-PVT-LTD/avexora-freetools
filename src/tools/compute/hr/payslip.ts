import type { GenerateFn } from "@/tools/types";
import { formatINR, toNonNegative, toNonNegativeOr, toPositive } from "../format";

const WIDTH = 58;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function center(text: string): string {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
}

function row(label: string, amount: number): string {
  const value = formatINR(amount);
  return `  ${label.padEnd(WIDTH - 4 - value.length)}${value}`;
}

export const generatePayslip: GenerateFn = (values) => {
  const companyName = str(values.companyName);
  const employeeName = str(values.employeeName);
  const designation = str(values.designation);
  const month = str(values.month);
  const basic = toPositive(values.basic);
  const hra = toNonNegative(values.hra);
  const specialAllowance = toNonNegative(values.specialAllowance);
  const otherAllowances = toNonNegativeOr(values.otherAllowances ?? 0, 0);
  const pfDeduction = toNonNegative(values.pfDeduction);
  const professionalTax = toNonNegative(values.professionalTax);
  const otherDeductions = toNonNegativeOr(values.otherDeductions ?? 0, 0);

  if (companyName === "") return { error: "Enter the company name." };
  if (employeeName === "") return { error: "Enter the employee name." };
  if (designation === "") return { error: "Enter the designation." };
  if (month === "") return { error: "Enter the payslip month (e.g. June 2026)." };
  if (basic === null) return { error: "Enter a basic salary greater than zero." };
  if (hra === null) return { error: "Enter the HRA amount (zero or more)." };
  if (specialAllowance === null) return { error: "Enter the special allowance (zero or more)." };
  if (otherAllowances === null) return { error: "Enter a valid other allowances amount (or leave it empty)." };
  if (pfDeduction === null) return { error: "Enter the PF deduction (zero or more)." };
  if (professionalTax === null) return { error: "Enter the professional tax (zero or more)." };
  if (otherDeductions === null) return { error: "Enter a valid other deductions amount (or leave it empty)." };

  const totalEarnings = basic + hra + specialAllowance + otherAllowances;
  const totalDeductions = pfDeduction + professionalTax + otherDeductions;
  const netPay = totalEarnings - totalDeductions;

  if (netPay < 0) return { error: "Total deductions exceed total earnings — check the amounts." };

  const divider = "=".repeat(WIDTH);
  const rule = "-".repeat(WIDTH);

  const lines: string[] = [
    divider,
    center(companyName.toUpperCase()),
    center(`Payslip for ${month}`),
    divider,
    "",
    `Employee    : ${employeeName}`,
    `Designation : ${designation}`,
    "",
    "EARNINGS",
    rule,
    row("Basic salary", basic),
    row("House rent allowance", hra),
    row("Special allowance", specialAllowance),
  ];
  if (otherAllowances > 0) lines.push(row("Other allowances", otherAllowances));
  lines.push(rule, row("Total earnings", totalEarnings), "", "DEDUCTIONS", rule);
  lines.push(row("Provident fund (employee)", pfDeduction));
  lines.push(row("Professional tax", professionalTax));
  if (otherDeductions > 0) lines.push(row("Other deductions", otherDeductions));
  lines.push(rule, row("Total deductions", totalDeductions), "", divider);
  lines.push(row("NET PAY", netPay));
  lines.push(divider);

  return { text: lines.join("\n"), filename: "payslip.txt" };
};
