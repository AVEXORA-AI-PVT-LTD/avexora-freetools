import { describe, expect, it } from "vitest";
import type { ComputeFn, FieldValues, GenerateFn } from "@/tools/types";
import { computeSalary } from "@/tools/compute/hr/salary";
import { computeGratuity } from "@/tools/compute/hr/gratuity";
import { computePf } from "@/tools/compute/hr/pf";
import { computeHra } from "@/tools/compute/hr/hra";
import { computeLeaveEncashment } from "@/tools/compute/hr/leave-encashment";
import { computeBonus } from "@/tools/compute/hr/bonus";
import { computeOvertime } from "@/tools/compute/hr/overtime";
import { computeNoticePeriodRecovery } from "@/tools/compute/hr/notice-period-recovery";
import { generatePayslip } from "@/tools/compute/hr/payslip";
import { generateOfferLetter } from "@/tools/compute/hr/offer-letter";
import { generateAppointmentLetter } from "@/tools/compute/hr/appointment-letter";
import { generateExperienceLetter } from "@/tools/compute/hr/experience-letter";

function resultMap(fn: ComputeFn, values: FieldValues) {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return new Map(out.results.map((r) => [r.label, r.value]));
}

function textOf(fn: GenerateFn, values: FieldValues): string {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return out.text;
}

describe("computeSalary", () => {
  it("computes monthly in-hand pay for a mid salary", () => {
    const r = resultMap(computeSalary, {
      annualCtc: "1200000", basicPercent: 40, professionalTax: 200, employerPfInCtc: true,
    });
    expect(r.get("Monthly in-hand salary")).toBeTruthy();
    expect(Number(r.get("Monthly in-hand salary")!.replace(/[₹,]/g, ""))).toBeGreaterThan(60000);
  });
  it("rejects invalid basic percentage", () => {
    expect(computeSalary({ annualCtc: "1000000", basicPercent: 150, professionalTax: 200 })).toHaveProperty("error");
  });
});

describe("computeGratuity", () => {
  it("computes gratuity for 8 years at ₹50,000/month", () => {
    // (15 * 50000 * 8) / 26 = 230,769.23
    const r = resultMap(computeGratuity, { monthlySalary: "50000", yearsOfService: "8" });
    expect(r.get("Gratuity payable")).toBe("₹2,30,769.23");
    expect(r.get("Years of service counted")).toBe("8");
  });
  it("rounds up service beyond 6 months in the final year", () => {
    const r = resultMap(computeGratuity, { monthlySalary: "50000", yearsOfService: "8.7" });
    expect(r.get("Years of service counted")).toBe("9");
  });
  it("rejects under 5 years of service", () => {
    expect(computeGratuity({ monthlySalary: "50000", yearsOfService: "3" })).toHaveProperty("error");
  });
  it("applies the ₹20 lakh statutory cap", () => {
    const r = resultMap(computeGratuity, { monthlySalary: "500000", yearsOfService: "30" });
    expect(r.get("Gratuity payable")).toBe("₹20,00,000.00");
  });
});

describe("computePf", () => {
  it("projects a growing corpus over time", () => {
    const r = resultMap(computePf, {
      currentAge: "30", retirementAge: "58", basicSalary: "30000",
      currentBalance: 0, salaryIncrease: 5, interestRate: 8.25,
    });
    const corpus = Number(r.get("EPF corpus at retirement")!.replace(/[₹,]/g, ""));
    expect(corpus).toBeGreaterThan(3000000);
  });
  it("rejects retirement age below current age", () => {
    expect(computePf({ currentAge: "40", retirementAge: "35", basicSalary: "30000", salaryIncrease: 5, interestRate: 8 })).toHaveProperty("error");
  });
});

describe("computeHra", () => {
  it("picks the smallest of the three HRA components", () => {
    const r = resultMap(computeHra, { basicSalary: "600000", hraReceived: "240000", rentPaid: "300000", metro: false });
    // rent - 10% basic = 300000 - 60000 = 240000; 40% basic = 240000; HRA received = 240000 -> all equal at 240000
    expect(r.get("Exempt HRA")).toBe("₹2,40,000.00");
  });
  it("uses 50% of basic for metro cities", () => {
    const r = resultMap(computeHra, { basicSalary: "600000", hraReceived: "400000", rentPaid: "500000", metro: true });
    expect(r.get("50% of basic (metro)")).toBe("₹3,00,000.00");
  });
  it("floors rent-minus-10%-basic at zero", () => {
    const r = resultMap(computeHra, { basicSalary: "600000", hraReceived: "100000", rentPaid: "10000", metro: false });
    expect(r.get("Rent paid minus 10% of basic")).toBe("₹0.00");
    expect(r.get("Exempt HRA")).toBe("₹0.00");
  });
});

describe("computeLeaveEncashment", () => {
  it("computes per-day rate times days", () => {
    const r = resultMap(computeLeaveEncashment, { monthlySalary: "30000", leaveDays: "15" });
    expect(r.get("Leave encashment amount")).toBe("₹15,000.00");
  });
});

describe("computeBonus", () => {
  it("applies the ₹7,000 calculation cap", () => {
    const r = resultMap(computeBonus, { monthlySalary: "15000", bonusRate: 8.33, monthsWorked: 12 });
    // 7000 * 0.0833 * 12 = 6997.2
    expect(r.get("Statutory bonus payable")).toBe("₹6,997.20");
  });
  it("rejects salary above the eligibility ceiling", () => {
    expect(computeBonus({ monthlySalary: "25000", bonusRate: 8.33, monthsWorked: 12 })).toHaveProperty("error");
  });
  it("rejects an out-of-range bonus rate", () => {
    expect(computeBonus({ monthlySalary: "15000", bonusRate: 25, monthsWorked: 12 })).toHaveProperty("error");
  });
});

describe("computeOvertime", () => {
  it("pays overtime at double the ordinary hourly rate", () => {
    // hourly = 20800 / 26 / 8 = 100; OT hourly = 200; 10 hours = 2000
    const r = resultMap(computeOvertime, { monthlyWages: "20800", dailyHours: 8, overtimeHours: "10" });
    expect(r.get("Ordinary hourly rate")).toBe("₹100.00");
    expect(r.get("Overtime pay")).toBe("₹2,000.00");
  });
});

describe("computeNoticePeriodRecovery", () => {
  it("computes recovery for a shortfall", () => {
    const r = resultMap(computeNoticePeriodRecovery, { monthlySalary: "60000", requiredDays: 60, servedDays: "30" });
    expect(r.get("Shortfall days")).toBe("30");
    expect(r.get("Notice period recovery")).toBe("₹60,000.00");
  });
  it("returns zero recovery when full notice served", () => {
    const r = resultMap(computeNoticePeriodRecovery, { monthlySalary: "60000", requiredDays: 60, servedDays: "90" });
    expect(r.get("Shortfall days")).toBe("0");
    expect(r.get("Notice period recovery")).toBe("₹0.00");
  });
});

describe("generatePayslip", () => {
  it("computes net pay and includes all sections", () => {
    const out = textOf(generatePayslip, {
      companyName: "Acme Pvt Ltd", employeeName: "Priya Sharma", designation: "Executive", month: "June 2026",
      basic: "30000", hra: "12000", specialAllowance: "8000", otherAllowances: 0,
      pfDeduction: "3600", professionalTax: 200, otherDeductions: 0,
    });
    expect(out).toContain("ACME PVT LTD");
    expect(out).toContain("Priya Sharma");
    // total earnings 50000, deductions 3800, net 46200
    expect(out).toMatch(/NET PAY\s+₹46,200\.00/);
  });
  it("rejects missing required fields", () => {
    expect(generatePayslip({ companyName: "", employeeName: "X", designation: "Y", month: "June", basic: "1000", hra: 0, specialAllowance: 0, pfDeduction: 0, professionalTax: 0 })).toHaveProperty("error");
  });
});

describe("generateOfferLetter", () => {
  it("includes candidate name, position and CTC", () => {
    const out = textOf(generateOfferLetter, {
      companyName: "Acme Pvt Ltd", candidateName: "Rahul Verma", designation: "Product Manager",
      annualCtc: "1500000", joiningDate: "2026-08-01", workLocation: "Bengaluru", reportingManager: "",
    });
    expect(out).toContain("Rahul Verma");
    expect(out).toContain("Product Manager");
    expect(out).toContain("1 August 2026");
    expect(out).toContain("₹15,00,000.00");
  });
  it("rejects missing candidate name", () => {
    expect(generateOfferLetter({ companyName: "Acme", candidateName: "", designation: "PM", annualCtc: "1000000", joiningDate: "2026-08-01", workLocation: "Pune" })).toHaveProperty("error");
  });
});

describe("generateAppointmentLetter", () => {
  it("includes notice period in the text", () => {
    const out = textOf(generateAppointmentLetter, {
      companyName: "Acme Pvt Ltd", employeeName: "Rahul Verma", designation: "PM",
      joiningDate: "2026-08-01", annualCtc: "1500000", workLocation: "Pune", noticePeriodDays: "60",
    });
    expect(out).toContain("60 days");
  });
});

describe("generateExperienceLetter", () => {
  it("includes employment dates and conduct phrase", () => {
    const out = textOf(generateExperienceLetter, {
      companyName: "Acme Pvt Ltd", employeeName: "Rahul Verma", designation: "PM",
      joiningDate: "2020-01-01", leavingDate: "2026-01-01", conduct: "excellent",
    });
    expect(out).toContain("1 January 2020");
    expect(out).toContain("1 January 2026");
    expect(out).toMatch(/exemplary/);
  });
  it("rejects an unselected conduct value", () => {
    expect(generateExperienceLetter({ companyName: "A", employeeName: "B", designation: "C", joiningDate: "2020-01-01", leavingDate: "2021-01-01", conduct: "" })).toHaveProperty("error");
  });
});
