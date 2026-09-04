import { describe, expect, it } from "vitest";
import type { ComputeFn, FieldValues } from "@/types/tools";
import { computeEmi } from "@/tools/compute/finance/emi";
import { computeSip } from "@/tools/compute/finance/sip";
import { computeFd } from "@/tools/compute/finance/fd";
import { computeRd } from "@/tools/compute/finance/rd";
import { computeIncomeTax } from "@/tools/compute/finance/income-tax";
import { computeTds } from "@/tools/compute/finance/tds";
import { computeCompoundInterest } from "@/tools/compute/finance/compound-interest";
import { computeSimpleInterest } from "@/tools/compute/finance/simple-interest";
import { computeBreakEven } from "@/tools/compute/finance/break-even";
import { computeMargin } from "@/tools/compute/finance/margin";
import { computeMarkup } from "@/tools/compute/finance/markup";
import { computeRoi } from "@/tools/compute/finance/roi";
import { computeDepreciation } from "@/tools/compute/finance/depreciation";
import { computeWorkingCapital } from "@/tools/compute/finance/working-capital";

function resultMap(fn: ComputeFn, values: FieldValues) {
  const outcome = fn(values);
  if ("error" in outcome) throw new Error(outcome.error);
  return new Map(outcome.results.map((r) => [r.label, r.value]));
}

describe("computeEmi", () => {
  it("computes a 12% 1-year loan", () => {
    const r = resultMap(computeEmi, { loanAmount: "100000", annualRate: "12", tenureYears: "1" });
    expect(r.get("Monthly EMI")).toBe("₹8,884.88");
    expect(r.get("Number of instalments")).toBe("12");
  });
  it("handles zero interest", () => {
    const r = resultMap(computeEmi, { loanAmount: "120000", annualRate: "0", tenureYears: "10" });
    expect(r.get("Monthly EMI")).toBe("₹1,000.00");
    expect(r.get("Total interest payable")).toBe("₹0.00");
  });
  it("rejects missing loan amount", () => {
    expect(computeEmi({ loanAmount: "", annualRate: "10", tenureYears: "5" })).toHaveProperty("error");
  });
});

describe("computeSip", () => {
  it("equals invested amount at zero return", () => {
    const r = resultMap(computeSip, { monthlyInvestment: "1000", annualReturn: "0", years: "1" });
    expect(r.get("Maturity corpus")).toBe("₹12,000.00");
    expect(r.get("Estimated returns")).toBe("₹0.00");
  });
  it("computes a standard 12% 10-year SIP", () => {
    const r = resultMap(computeSip, { monthlyInvestment: "10000", annualReturn: "12", years: "10" });
    expect(r.get("Total invested")).toBe("₹12,00,000.00");
    // Corpus ≈ ₹23.23 lakh with the standard annuity-due formula
    expect(r.get("Maturity corpus")).toMatch(/^₹23,2/);
  });
  it("rejects zero monthly investment", () => {
    expect(computeSip({ monthlyInvestment: "0", annualReturn: "12", years: "5" })).toHaveProperty("error");
  });
});

describe("computeFd", () => {
  it("computes yearly compounding exactly", () => {
    const r = resultMap(computeFd, { principal: "100000", annualRate: "10", years: "1", frequency: "yearly" });
    expect(r.get("Maturity amount")).toBe("₹1,10,000.00");
  });
  it("quarterly compounding beats yearly", () => {
    const q = resultMap(computeFd, { principal: "100000", annualRate: "8", years: "5", frequency: "quarterly" });
    const y = resultMap(computeFd, { principal: "100000", annualRate: "8", years: "5", frequency: "yearly" });
    const num = (s?: string) => Number(s!.replace(/[₹,]/g, ""));
    expect(num(q.get("Maturity amount"))).toBeGreaterThan(num(y.get("Maturity amount")));
  });
  it("rejects an unknown frequency", () => {
    expect(computeFd({ principal: "1000", annualRate: "7", years: "1", frequency: "daily" })).toHaveProperty("error");
  });
});

describe("computeRd", () => {
  it("equals total deposits at zero rate", () => {
    const r = resultMap(computeRd, { monthlyDeposit: "1000", annualRate: "0", months: "12" });
    expect(r.get("Maturity amount")).toBe("₹12,000.00");
  });
  it("rejects tenure under 3 months", () => {
    expect(computeRd({ monthlyDeposit: "1000", annualRate: "7", months: "2" })).toHaveProperty("error");
  });
});

describe("computeIncomeTax", () => {
  it("gives zero new-regime tax at ₹10L salaried (87A rebate)", () => {
    const r = resultMap(computeIncomeTax, { annualIncome: "1000000", salaried: true, regime: "new" });
    expect(r.get("Total tax — new regime")).toBe("₹0.00");
  });
  it("computes old-regime tax at ₹10L salaried", () => {
    const r = resultMap(computeIncomeTax, { annualIncome: "1000000", salaried: true, regime: "old" });
    // taxable 9.5L → 12,500 + 90,000 = 1,02,500 + 4% cess = 1,06,600
    expect(r.get("Total tax — old regime")).toBe("₹1,06,600.00");
  });
  it("compare mode marks the cheaper regime and savings", () => {
    const r = resultMap(computeIncomeTax, { annualIncome: "1000000", salaried: true, regime: "compare" });
    expect(r.get("You save with the new regime")).toBe("₹1,06,600.00");
  });
  it("applies new-regime slabs above the rebate threshold", () => {
    // ₹20L salaried → taxable 19.25L → 20000+40000+60000+65000 = 1,85,000 + cess = 1,92,400
    const r = resultMap(computeIncomeTax, { annualIncome: "2000000", salaried: true, regime: "new" });
    expect(r.get("Total tax — new regime")).toBe("₹1,92,400.00");
  });
});

describe("computeTds", () => {
  it("deducts 10% under 194J", () => {
    const r = resultMap(computeTds, { amount: "100000", section: "194j" });
    expect(r.get("TDS to deduct")).toBe("₹10,000.00");
    expect(r.get("Net amount payable")).toBe("₹90,000.00");
  });
  it("deducts 1% for individual contractors under 194C", () => {
    const r = resultMap(computeTds, { amount: "50000", section: "194c-individual" });
    expect(r.get("TDS to deduct")).toBe("₹500.00");
  });
  it("rejects an unknown section", () => {
    expect(computeTds({ amount: "1000", section: "195x" })).toHaveProperty("error");
  });
});

describe("computeCompoundInterest", () => {
  it("computes yearly compounding exactly", () => {
    const r = resultMap(computeCompoundInterest, { principal: "100000", annualRate: "10", years: "2", frequency: "yearly" });
    expect(r.get("Maturity amount")).toBe("₹1,21,000.00");
    expect(r.get("Compound interest earned")).toBe("₹21,000.00");
  });
  it("rejects missing frequency", () => {
    expect(computeCompoundInterest({ principal: "1000", annualRate: "8", years: "1", frequency: "" })).toHaveProperty("error");
  });
});

describe("computeSimpleInterest", () => {
  it("applies SI = P*R*T/100", () => {
    const r = resultMap(computeSimpleInterest, { principal: "50000", annualRate: "10", years: "3" });
    expect(r.get("Simple interest")).toBe("₹15,000.00");
    expect(r.get("Total amount (principal + interest)")).toBe("₹65,000.00");
  });
});

describe("computeBreakEven", () => {
  it("computes units, revenue and contribution", () => {
    const r = resultMap(computeBreakEven, { fixedCosts: "200000", pricePerUnit: "500", variableCostPerUnit: "300" });
    expect(r.get("Break-even units")).toBe("1,000");
    expect(r.get("Break-even revenue")).toBe("₹5,00,000.00");
    expect(r.get("Contribution margin ratio")).toBe("40%");
  });
  it("errors when variable cost >= price", () => {
    expect(computeBreakEven({ fixedCosts: "1000", pricePerUnit: "100", variableCostPerUnit: "100" })).toHaveProperty("error");
  });
  it("uses ceil'd units for revenue (bug fix)", () => {
    const r = resultMap(computeBreakEven, { fixedCosts: "101", pricePerUnit: "10", variableCostPerUnit: "8" });
    expect(r.get("Break-even units")).toBe("51");
    expect(r.get("Break-even revenue")).toBe("₹510.00");
    expect(r.get("Contribution margin per unit")).toBe("₹2.00");
    expect(r.get("Contribution margin ratio")).toBe("20%");
  });
  it("exact division produces correct revenue", () => {
    const r = resultMap(computeBreakEven, { fixedCosts: "100", pricePerUnit: "10", variableCostPerUnit: "5" });
    expect(r.get("Break-even units")).toBe("20");
    expect(r.get("Break-even revenue")).toBe("₹200.00");
  });
  it("ceil with fractional units and higher price", () => {
    const r = resultMap(computeBreakEven, { fixedCosts: "100", pricePerUnit: "20", variableCostPerUnit: "12" });
    expect(r.get("Break-even units")).toBe("13");
    expect(r.get("Break-even revenue")).toBe("₹260.00");
  });
  it("larger values", () => {
    const r = resultMap(computeBreakEven, { fixedCosts: "1000", pricePerUnit: "100", variableCostPerUnit: "60" });
    expect(r.get("Break-even units")).toBe("25");
    expect(r.get("Break-even revenue")).toBe("₹2,500.00");
  });
});

describe("computeMargin", () => {
  it("computes margin and equivalent markup", () => {
    const r = resultMap(computeMargin, { cost: "700", revenue: "1000" });
    expect(r.get("Profit margin")).toBe("30%");
    expect(r.get("Markup (on cost)")).toBe("42.86%");
  });
});

describe("computeMarkup", () => {
  it("computes markup and equivalent margin", () => {
    const r = resultMap(computeMarkup, { cost: "700", sellingPrice: "1000" });
    expect(r.get("Markup (on cost)")).toBe("42.86%");
    expect(r.get("Equivalent margin (on price)")).toBe("30%");
  });
});

describe("computeRoi", () => {
  it("computes total and annualized ROI", () => {
    const r = resultMap(computeRoi, { initialInvestment: "100000", finalValue: "200000", years: "5" });
    expect(r.get("Total ROI")).toBe("100%");
    expect(r.get("Annualized ROI (CAGR)")).toBe("14.87%");
  });
  it("handles losses", () => {
    const r = resultMap(computeRoi, { initialInvestment: "100000", finalValue: "80000", years: "2" });
    expect(r.get("Total ROI")).toBe("-20%");
  });
});

describe("computeDepreciation", () => {
  it("computes straight-line depreciation", () => {
    const r = resultMap(computeDepreciation, {
      assetCost: "500000", salvageValue: "50000", usefulLife: "5", method: "straight-line",
    });
    expect(r.get("Annual depreciation (straight-line)")).toBe("₹90,000.00");
    expect(r.get("Book value after year 1")).toBe("₹4,10,000.00");
  });
  it("computes WDV year-wise book values", () => {
    const r = resultMap(computeDepreciation, {
      assetCost: "100000", salvageValue: "0", usefulLife: "3", method: "wdv", wdvRate: "10",
    });
    expect(r.get("Year 1 depreciation (10% WDV)")).toBe("₹10,000.00");
    expect(r.get("Book value after year 3")).toBe("₹72,900.00");
  });
  it("rejects salvage >= cost", () => {
    expect(
      computeDepreciation({ assetCost: "1000", salvageValue: "1000", usefulLife: "5", method: "straight-line" }),
    ).toHaveProperty("error");
  });
  it("wdv respects full useful life beyond 10 years", () => {
    const out = computeDepreciation({
      assetCost: "500000", salvageValue: "0", usefulLife: "15", method: "wdv", wdvRate: "15",
    });
    expect("error" in out).toBe(false);
    const results = (out as any).results;
    const bookValues = results.filter((r: any) => r.label.startsWith("Book value after year"));
    expect(bookValues).toHaveLength(15);
    expect(bookValues[bookValues.length - 1].label).toBe("Book value after year 15");
    expect(bookValues[10].label).toBe("Book value after year 11");
    expect(bookValues[10].value).toBe("₹83,671.62");
  });
  it("wdv emits one row per useful life year (5, 10, 11, 20)", () => {
    for (const life of [5, 10, 11, 20]) {
      const out = computeDepreciation({
        assetCost: "100000", salvageValue: "0", usefulLife: String(life), method: "wdv", wdvRate: "25",
      });
      expect("error" in out).toBe(false);
      const results = (out as any).results;
      const bookValues = results.filter((r: any) => r.label.startsWith("Book value after year"));
      expect(bookValues).toHaveLength(life);
      expect(bookValues[bookValues.length - 1].label).toBe(`Book value after year ${life}`);
    }
  });
});

describe("computeWorkingCapital", () => {
  it("computes net working capital and current ratio", () => {
    const r = resultMap(computeWorkingCapital, { currentAssets: "1200000", currentLiabilities: "800000" });
    expect(r.get("Net working capital")).toBe("₹4,00,000.00");
    expect(r.get("Current ratio")).toBe("1.5");
  });
  it("handles negative working capital", () => {
    const r = resultMap(computeWorkingCapital, { currentAssets: "500000", currentLiabilities: "800000" });
    expect(r.get("Net working capital")).toBe("-₹3,00,000.00");
  });
});
