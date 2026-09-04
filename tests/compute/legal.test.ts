import { describe, expect, it } from "vitest";
import type { FieldValues, GenerateFn } from "@/types/tools";
import { generateNda } from "@/tools/compute/legal/nda";
import { generatePrivacyPolicy } from "@/tools/compute/legal/privacy-policy";
import { generateTerms } from "@/tools/compute/legal/terms";
import { generateRefundPolicy } from "@/tools/compute/legal/refund-policy";
import { generateDisclaimer } from "@/tools/compute/legal/disclaimer";
import { generateRentAgreement } from "@/tools/compute/legal/rent-agreement";
import { generateFreelanceContract } from "@/tools/compute/legal/freelance-contract";
import { generateEmploymentContract } from "@/tools/compute/legal/employment-contract";
import { generateLoanAgreement } from "@/tools/compute/legal/loan-agreement";
import { generatePartnershipDeed } from "@/tools/compute/legal/partnership-deed";

function textOf(fn: GenerateFn, values: FieldValues): string {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return out.text;
}

describe("generateNda", () => {
  it("includes both party names, purpose and disclaimer", () => {
    const out = textOf(generateNda, {
      partyA: "Acme Pvt Ltd", partyB: "Priya Sharma", effectiveDate: "2026-08-01",
      purpose: "evaluating a partnership", termYears: 2, mutual: true,
    });
    expect(out).toContain("Acme Pvt Ltd");
    expect(out).toContain("Priya Sharma");
    expect(out).toContain("1 August 2026");
    expect(out).toMatch(/does not constitute legal advice/);
  });
  it("rejects missing required fields", () => {
    expect(generateNda({ partyA: "", partyB: "B", effectiveDate: "2026-01-01", purpose: "x" })).toHaveProperty("error");
  });
});

describe("generatePrivacyPolicy", () => {
  it("includes conditional sections based on checkboxes", () => {
    const out = textOf(generatePrivacyPolicy, {
      companyName: "Acme", websiteUrl: "https://acme.in", contactEmail: "hi@acme.in",
      collectsPayments: true, usesCookies: true, usesAnalytics: true,
    });
    expect(out).toContain("Payment information");
    expect(out).toContain("Cookies");
  });
  it("omits cookies section when disabled", () => {
    const out = textOf(generatePrivacyPolicy, {
      companyName: "Acme", websiteUrl: "https://acme.in", contactEmail: "hi@acme.in",
      collectsPayments: false, usesCookies: false, usesAnalytics: false,
    });
    expect(out).not.toContain("4. Cookies");
  });
  it("rejects missing company name", () => {
    expect(generatePrivacyPolicy({ companyName: "", websiteUrl: "x", contactEmail: "y" })).toHaveProperty("error");
  });
});

describe("generateTerms", () => {
  it("includes business type and governing city", () => {
    const out = textOf(generateTerms, {
      companyName: "Acme", websiteUrl: "https://acme.in", contactEmail: "hi@acme.in",
      businessType: "online courses", governingCity: "Pune",
    });
    expect(out).toContain("online courses");
    expect(out).toContain("Pune");
  });
});

describe("generateRefundPolicy", () => {
  it("uses the digital goods clause when selected", () => {
    const out = textOf(generateRefundPolicy, {
      companyName: "Acme", contactEmail: "hi@acme.in", returnWindowDays: "14", digitalGoods: true,
    });
    expect(out).toContain("14 days");
    expect(out).toMatch(/digital and delivered instantly/);
  });
  it("uses the physical goods clause otherwise", () => {
    const out = textOf(generateRefundPolicy, {
      companyName: "Acme", contactEmail: "hi@acme.in", returnWindowDays: "7", digitalGoods: false,
    });
    expect(out).toMatch(/unused, in its original packaging/);
  });
  it("rejects invalid return window instead of falling back to default", () => {
    expect(generateRefundPolicy({ companyName: "Acme", contactEmail: "hi@acme.in", returnWindowDays: "abc" })).toHaveProperty("error");
    expect(generateRefundPolicy({ companyName: "Acme", contactEmail: "hi@acme.in", returnWindowDays: "12..5" })).toHaveProperty("error");
    expect(generateRefundPolicy({ companyName: "Acme", contactEmail: "hi@acme.in", returnWindowDays: "-3" })).toHaveProperty("error");
  });
  it("falls back to default when return window is empty", () => {
    const out = textOf(generateRefundPolicy, { companyName: "Acme", contactEmail: "hi@acme.in", returnWindowDays: "" });
    expect(out).toContain("7 days");
  });
});

describe("generateDisclaimer", () => {
  it("includes affiliate section only when enabled", () => {
    const withAffiliate = textOf(generateDisclaimer, {
      companyName: "Acme", websiteUrl: "https://acme.in", contactEmail: "hi@acme.in", affiliateLinks: true,
    });
    expect(withAffiliate).toContain("Affiliate Disclaimer");
    const without = textOf(generateDisclaimer, {
      companyName: "Acme", websiteUrl: "https://acme.in", contactEmail: "hi@acme.in", affiliateLinks: false,
    });
    expect(without).not.toContain("Affiliate Disclaimer");
  });
});

describe("generateRentAgreement", () => {
  it("includes rent, deposit and duration", () => {
    const out = textOf(generateRentAgreement, {
      landlordName: "Suresh Kumar", tenantName: "Ananya Rao", propertyAddress: "Flat 4B, Bengaluru",
      monthlyRent: "25000", securityDeposit: "100000", startDate: "2026-09-01", durationMonths: "11",
    });
    expect(out).toContain("₹25,000.00");
    expect(out).toContain("₹1,00,000.00");
    expect(out).toContain("11 months");
  });
  it("rejects missing property address", () => {
    expect(generateRentAgreement({
      landlordName: "A", tenantName: "B", propertyAddress: "",
      monthlyRent: "1000", securityDeposit: "1000", startDate: "2026-01-01",
    })).toHaveProperty("error");
  });
  it("rejects invalid duration instead of falling back to default", () => {
    expect(generateRentAgreement({
      landlordName: "A", tenantName: "B", propertyAddress: "X",
      monthlyRent: "1000", securityDeposit: "1000", startDate: "2026-01-01", durationMonths: "abc",
    })).toHaveProperty("error");
    expect(generateRentAgreement({
      landlordName: "A", tenantName: "B", propertyAddress: "X",
      monthlyRent: "1000", securityDeposit: "1000", startDate: "2026-01-01", durationMonths: "12..5",
    })).toHaveProperty("error");
  });
  it("falls back to default when duration is empty", () => {
    const out = textOf(generateRentAgreement, {
      landlordName: "A", tenantName: "B", propertyAddress: "X",
      monthlyRent: "1000", securityDeposit: "1000", startDate: "2026-01-01", durationMonths: "",
    });
    expect(out).toContain("11 months");
  });
});

describe("generateFreelanceContract", () => {
  it("includes scope, fee and IP clause", () => {
    const out = textOf(generateFreelanceContract, {
      clientName: "Acme", freelancerName: "Rohan Mehta", projectDescription: "build a website",
      fee: "75000", paymentTerms: "50/50", startDate: "2026-08-01", deliveryDate: "2026-09-01",
    });
    expect(out).toContain("₹75,000.00");
    expect(out).toMatch(/Upon full payment/);
  });
});

describe("generateEmploymentContract", () => {
  it("includes CTC, notice period and work location", () => {
    const out = textOf(generateEmploymentContract, {
      companyName: "Acme", employeeName: "Kavya Reddy", designation: "Engineer",
      annualCtc: "1000000", startDate: "2026-08-01", workLocation: "Hyderabad", noticePeriodDays: "30",
    });
    expect(out).toContain("₹10,00,000.00");
    expect(out).toContain("30 days");
    expect(out).toContain("Hyderabad");
  });
  it("rejects invalid notice period instead of falling back to default", () => {
    const base = { companyName: "Acme", employeeName: "Kavya Reddy", designation: "Engineer", annualCtc: "1000000", startDate: "2026-08-01", workLocation: "Hyderabad" };
    expect(generateEmploymentContract({ ...base, noticePeriodDays: "abc" })).toHaveProperty("error");
    expect(generateEmploymentContract({ ...base, noticePeriodDays: "12..5" })).toHaveProperty("error");
    expect(generateEmploymentContract({ ...base, noticePeriodDays: "--100" })).toHaveProperty("error");
  });
  it("falls back to default when notice period is empty", () => {
    const out = textOf(generateEmploymentContract, { companyName: "Acme", employeeName: "Kavya Reddy", designation: "Engineer", annualCtc: "1000000", startDate: "2026-08-01", workLocation: "Hyderabad", noticePeriodDays: "" });
    expect(out).toContain("30 days");
  });
});

describe("generateLoanAgreement", () => {
  it("computes an approximate monthly instalment", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "Vikram Singh", borrowerName: "Arjun Nair", principal: "120000",
      interestRate: "0", repaymentMonths: "12", loanDate: "2026-08-01",
    });
    expect(out).toContain("₹10,000.00");
  });
  it("rejects a negative interest rate", () => {
    expect(generateLoanAgreement({
      lenderName: "A", borrowerName: "B", principal: "1000", interestRate: "-5", repaymentMonths: "12", loanDate: "2026-01-01",
    })).toHaveProperty("error");
  });

  it("uses reducing-balance EMI, not flat interest (regression for ₹2,00,000 @12% / 12 mo)", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "A", borrowerName: "B", principal: "200000",
      interestRate: "12", repaymentMonths: "12", loanDate: "2026-01-01",
    });
    // The old flat-interest figure must no longer appear.
    expect(out).not.toContain("₹18,666.67");
    // The correct reducing-balance EMI under the project's computeEmi
    // convention is ₹17,769.76 for this case.
    expect(out).toContain("₹17,769.76");
  });

  it("computes reducing-balance EMI for a different principal", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "A", borrowerName: "B", principal: "100000",
      interestRate: "12", repaymentMonths: "12", loanDate: "2026-01-01",
    });
    expect(out).toContain("₹8,884.88");
  });

  it("computes reducing-balance EMI for a different term", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "A", borrowerName: "B", principal: "200000",
      interestRate: "12", repaymentMonths: "24", loanDate: "2026-01-01",
    });
    expect(out).toContain("₹9,414.69");
  });

  it("computes zero-interest EMI as principal / months", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "A", borrowerName: "B", principal: "120000",
      interestRate: "0", repaymentMonths: "12", loanDate: "2026-01-01",
    });
    expect(out).toContain("₹10,000.00");
  });

  it("preserves the original agreement content (no added schedule or totals)", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "A", borrowerName: "B", principal: "200000",
      interestRate: "12", repaymentMonths: "12", loanDate: "2026-01-01",
    });
    // Newly introduced content from the previous regression must NOT be present.
    expect(out).not.toContain("Repayment Schedule");
    expect(out).not.toContain("total interest payable");
    expect(out).not.toContain("total repayment (principal and interest)");
    expect(out).not.toContain("reducing-balance calculation");

    // Original structure is preserved.
    expect(out).toContain("1. Loan Amount");
    expect(out).toContain("2. Interest");
    expect(out).toContain("3. Repayment");
    expect(out).toContain("4. Prepayment");
    expect(out).toContain("5. Default");
    expect(out).toContain("6. Security");
    expect(out).toContain("7. Governing Law");
    expect(out).toContain("8. Entire Agreement");
    expect(out).toContain("Witnesses:");
  });

  it("keeps original interest wording and correct instalment in the repayment clause", () => {
    const out = textOf(generateLoanAgreement, {
      lenderName: "A", borrowerName: "B", principal: "200000",
      interestRate: "12", repaymentMonths: "12", loanDate: "2026-01-01",
    });
    // Interest wording preserved verbatim.
    expect(out).toContain("calculated on the outstanding principal balance.");
    // Repayment clause keeps original wording with only the corrected amount.
    expect(out).toContain(
      "The Borrower shall repay the Loan Amount together with interest in 12 equal monthly instalments of approximately ₹17,769.76 each, commencing one month from the date of disbursement, until the Loan Amount and all accrued interest are repaid in full.",
    );
  });
});

describe("generatePartnershipDeed", () => {
  it("computes profit shares that sum to 100", () => {
    const out = textOf(generatePartnershipDeed, {
      firmName: "Sharma & Rao", partner1Name: "Rajesh Sharma", partner1Share: "60",
      partner2Name: "Deepa Rao", partner2Share: "40", businessAddress: "MG Road",
      capitalContribution: "500000", startDate: "2026-08-01",
    });
    expect(out).toContain("60%");
    expect(out).toContain("40%");
  });
  it("rejects shares that don't sum to 100", () => {
    expect(generatePartnershipDeed({
      firmName: "F", partner1Name: "A", partner1Share: "60", partner2Name: "B", partner2Share: "60",
      businessAddress: "X", capitalContribution: "1000", startDate: "2026-01-01",
    })).toHaveProperty("error");
  });
});
