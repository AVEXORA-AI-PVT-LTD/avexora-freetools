import { describe, expect, it } from "vitest";
import {
  calculateFreelanceTds,
  computeFreelanceTds,
} from "@/tools/compute/finance/freelance-tds";
import type { FreelanceTdsInput } from "@/tools/compute/finance/freelance-tds";

function calc(overrides: Partial<FreelanceTdsInput> = {}) {
  return calculateFreelanceTds({
    amount: 100000,
    category: "professional",
    yearlyTotal: 0,
    payerType: "non-individual",
    panProvided: true,
    ...overrides,
  });
}

describe("calculateFreelanceTds — pure engine", () => {
  it("applies 10% to professional fees once the threshold is crossed", () => {
    const r = calc({ amount: 100000 });
    expect(r.categoryLabel).toBe("Professional services");
    expect(r.rate).toBe(10);
    expect(r.applicable).toBe(true);
    expect(r.tds).toBe(10000);
    expect(r.net).toBe(90000);
    expect(r.thresholdStatus).toBe("crossed");
  });

  it("applies no TDS while the annual aggregate is within the threshold", () => {
    const r = calc({ amount: 30000 });
    expect(r.applicable).toBe(false);
    expect(r.tds).toBe(0);
    expect(r.net).toBe(30000);
    expect(r.thresholdStatus).toBe("not-crossed");
  });

  it("treats an aggregate exactly at the threshold as within it (no TDS)", () => {
    const r = calc({ amount: 50000 });
    expect(r.tds).toBe(0);
    expect(r.thresholdStatus).toBe("not-crossed");
  });

  it("deducts TDS just above the threshold, on the full payment", () => {
    const r = calc({ amount: 50001 });
    expect(r.applicable).toBe(true);
    expect(r.tds).toBe(5000.1);
  });

  it("applies 2% to fees for technical services", () => {
    const r = calc({ amount: 100000, category: "technical" });
    expect(r.rate).toBe(2);
    expect(r.tds).toBe(2000);
    expect(r.net).toBe(98000);
  });

  it("tests the threshold against the annual aggregate, including this payment", () => {
    const r = calc({ amount: 20000, category: "technical", yearlyTotal: 60000 });
    expect(r.aggregate).toBe(60000);
    expect(r.tds).toBe(400);
    expect(r.thresholdStatus).toBe("crossed");
  });

  it("never lets the aggregate fall below the current payment", () => {
    const r = calc({ amount: 60000, yearlyTotal: 20000 });
    expect(r.aggregate).toBe(60000);
    expect(r.tds).toBe(6000);
  });

  it("raises the rate to 20% without a valid PAN (professional)", () => {
    const r = calc({ amount: 100000, panProvided: false });
    expect(r.rate).toBe(20);
    expect(r.tds).toBe(20000);
    expect(r.rateNote).toContain("20%");
  });

  it("raises the rate to 20% without a valid PAN (technical, from 2%)", () => {
    const r = calc({ amount: 100000, category: "technical", panProvided: false });
    expect(r.rate).toBe(20);
    expect(r.tds).toBe(20000);
  });

  it("exempts payments by small individual/HUF clients entirely", () => {
    const r = calc({ amount: 100000, payerType: "huf-exempt" });
    expect(r.applicable).toBe(false);
    expect(r.tds).toBe(0);
    expect(r.net).toBe(100000);
    expect(r.thresholdStatus).toBe("payer-exempt");
  });

  it("deducts TDS from individual/HUF payers above the turnover limits", () => {
    const r = calc({ amount: 100000, payerType: "huf-specified" });
    expect(r.applicable).toBe(true);
    expect(r.tds).toBe(10000);
  });

  it("accepts a zero payment as a valid no-TDS result", () => {
    const r = calc({ amount: 0 });
    expect(r.tds).toBe(0);
    expect(r.net).toBe(0);
  });

  it("handles paise precisely", () => {
    const r = calc({ amount: 52500.5 });
    expect(r.tds).toBe(5250.05);
    expect(r.net).toBe(47250.45);
  });

  it("rounds TDS to the nearest paisa at the low end", () => {
    const r = calc({ amount: 0.04 });
    expect(r.tds).toBe(0);
    expect(r.net).toBe(0.04);
  });

  it("handles large amounts without overflow or NaN", () => {
    const r = calc({ amount: 100000000 });
    expect(Number.isFinite(r.tds)).toBe(true);
    expect(r.tds).toBe(10000000);
  });

  it("always reconciles: gross = TDS + net", () => {
    const cases: FreelanceTdsInput[] = [
      { amount: 100000, category: "professional", yearlyTotal: 0, payerType: "non-individual", panProvided: true },
      { amount: 50001, category: "professional", yearlyTotal: 50001, payerType: "huf-specified", panProvided: false },
      { amount: 98765.43, category: "technical", yearlyTotal: 200000, payerType: "non-individual", panProvided: true },
      { amount: 0.05, category: "technical", yearlyTotal: 0.05, payerType: "non-individual", panProvided: false },
      { amount: 123456.78, category: "professional", yearlyTotal: 40000, payerType: "huf-exempt", panProvided: false },
    ];
    for (const input of cases) {
      const r = calculateFreelanceTds(input);
      expect(r.tds + r.net).toBeCloseTo(input.amount, 6);
    }
  });
});

describe("computeFreelanceTds — ComputeFn", () => {
  function resultMap(values: Record<string, string | number | boolean>) {
    const outcome = computeFreelanceTds(values);
    if ("error" in outcome) throw new Error(outcome.error);
    return new Map(outcome.results.map((r) => [r.label, r.value]));
  }

  it("returns the expected headline figures for professional fees", () => {
    const r = resultMap({ amount: "100000", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" });
    expect(r.get("Gross payment / invoice amount")).toBe("₹1,00,000.00");
    expect(r.get("Applicable TDS rate")).toBe("10%");
    expect(r.get("TDS to deduct")).toBe("₹10,000.00");
    expect(r.get("Net amount receivable")).toBe("₹90,000.00");
    expect(r.get("Threshold status (₹50,000 per category per year)")).toBe("Crossed — TDS applies to the full payment");
    expect(r.get("Annual aggregate in this category")).toBe("₹1,00,000.00");
  });

  it("shows the 2% rate for technical services", () => {
    const r = resultMap({ amount: "100000", category: "technical", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" });
    expect(r.get("Applicable TDS rate")).toBe("2%");
    expect(r.get("TDS to deduct")).toBe("₹2,000.00");
  });

  it("annotates the 20% rate when no PAN is furnished", () => {
    const r = resultMap({ amount: "100000", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "no" });
    expect(r.get("Applicable TDS rate")).toBe("20% (no valid PAN furnished — rate raised to 20% (Section 397(2)))");
  });

  it("uses a blank annual aggregate as a single payment", () => {
    const r = resultMap({ amount: "30000", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" });
    expect(r.get("TDS to deduct")).toBe("₹0.00");
    expect(r.get("Net amount receivable")).toBe("₹30,000.00");
    expect(r.get("Threshold status (₹50,000 per category per year)")).toBe("Within ₹50,000 — no TDS");
  });

  it("reports a payer-exempt status for small individual/HUF clients", () => {
    const r = resultMap({ amount: "100000", category: "professional", yearlyTotal: "", payerType: "huf-exempt", panProvided: "yes" });
    expect(r.get("TDS to deduct")).toBe("₹0.00");
    expect(r.get("Threshold status (₹50,000 per category per year)")).toBe("Payer not required to deduct");
  });

  it("attaches the calculation and assumptions tables", () => {
    const outcome = computeFreelanceTds({ amount: "100000", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" });
    if ("error" in outcome) throw new Error(outcome.error);
    expect(outcome.tables).toBeDefined();
    const titles = outcome.tables!.map((t) => t.title);
    expect(titles).toEqual(["How it was calculated", "Tax rules & assumptions"]);
  });

  it("rejects a missing amount", () => {
    expect(computeFreelanceTds({ amount: "", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" })).toEqual({
      error: "Enter the payment / invoice amount.",
    });
    expect(computeFreelanceTds({ category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" })).toEqual({
      error: "Enter the payment / invoice amount.",
    });
  });

  it("rejects invalid, non-numeric and negative amounts", () => {
    for (const bad of ["abc", "12..5", "--100", "-100", "@#$"]) {
      expect(computeFreelanceTds({ amount: bad, category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" })).toEqual({
        error: "Enter a valid payment amount (zero or more).",
      });
    }
  });

  it("treats whitespace-only amounts as a missing amount", () => {
    expect(computeFreelanceTds({ amount: "  ", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" })).toEqual({
      error: "Enter the payment / invoice amount.",
    });
  });

  it("rejects an unknown category", () => {
    expect(computeFreelanceTds({ amount: "100000", category: "consulting", yearlyTotal: "", payerType: "non-individual", panProvided: "yes" })).toEqual({
      error: "Select a payment category.",
    });
  });

  it("rejects a negative annual aggregate", () => {
    expect(computeFreelanceTds({ amount: "100000", category: "professional", yearlyTotal: "-1", payerType: "non-individual", panProvided: "yes" })).toEqual({
      error: "Enter a valid annual aggregate for this category (zero or more).",
    });
  });

  it("rejects an unknown payer type", () => {
    expect(computeFreelanceTds({ amount: "100000", category: "professional", yearlyTotal: "", payerType: "cooperative", panProvided: "yes" })).toEqual({
      error: "Select a payer type.",
    });
  });

  it("rejects an unknown PAN value", () => {
    expect(computeFreelanceTds({ amount: "100000", category: "professional", yearlyTotal: "", payerType: "non-individual", panProvided: "maybe" })).toEqual({
      error: "Select whether a valid PAN is furnished.",
    });
  });
});