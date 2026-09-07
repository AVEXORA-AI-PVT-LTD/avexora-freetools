import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { computeBreakEven } from "@/tools/compute/finance/break-even";
import { computeDepreciation } from "@/tools/compute/finance/depreciation";
import { computePf } from "@/tools/compute/hr/pf";
import { computeDiscount } from "@/tools/compute/invoicing/discount";
import { generatePayslip } from "@/tools/compute/hr/payslip";
import { generateRefundPolicy } from "@/tools/compute/legal/refund-policy";
import { generateEmploymentContract } from "@/tools/compute/legal/employment-contract";
import { generateLoanAgreement } from "@/tools/compute/legal/loan-agreement";
import { buildUtmUrl } from "@/tools/compute/marketing/utm-builder";
import { generateHtmlEntities } from "@/tools/compute/dev/html-entities";
import { decodeJwt } from "@/tools/compute/dev/jwt-decoder";

const results: string[] = [];
const P = (label: string, val: unknown) => results.push(`${label} = ${JSON.stringify(val)}`);

function calcLabel(fn: Function, v: unknown): string {
  const o = fn(v) as any;
  if ("error" in o) return `{ERROR:${o.error}}`;
  if ("text" in o) return `{TEXT:${String(o.text).slice(0, 400)}}`;
  if ("results" in o) return `{${(o.results as any[]).map((x) => `${x.label}=${x.value}`).join(" | ")}}`;
  return JSON.stringify(o);
}

describe("REPRO", () => {
  it("run all user journeys", () => {
    // ISSUE-003 break-even
    P("BE-1 F101 P10 V8", calcLabel(computeBreakEven, { fixedCosts: 101, pricePerUnit: 10, variableCostPerUnit: 8 }));
    P("BE-2 F200k P500 V300", calcLabel(computeBreakEven, { fixedCosts: 200000, pricePerUnit: 500, variableCostPerUnit: 300 }));
    P("BE-3 F0 P10 V10", calcLabel(computeBreakEven, { fixedCosts: 0, pricePerUnit: 10, variableCostPerUnit: 10 }));

    // ISSUE-032 WDV depreciation
    for (const life of [1, 5, 10, 11, 15, 20]) {
      P(`WDV life=${life}`, calcLabel(computeDepreciation, { assetCost: 100000, salvageValue: 0, usefulLife: life, method: "wdv", wdvRate: 25 }));
    }
    // straight-line for reference
    P("SLM life=15", calcLabel(computeDepreciation, { assetCost: 100000, salvageValue: 10000, usefulLife: 15, method: "straight-line" }));

    // ISSUE-031 EPF wage ceiling
    for (const s of [10000, 14999, 15000, 15001, 20000, 50000]) {
      P(`PF salary=${s}`, calcLabel(computePf, { currentAge: 25, retirementAge: 26, basicSalary: s, currentBalance: 0, salaryIncrease: 0, interestRate: 8.25 }));
    }

    // ISSUE-004 loan agreement - extract interest wording + instalment
    const loan = generateLoanAgreement({ principal: 100000, interestRate: 12, repaymentMonths: 12, lenderName: "Test Lender", borrowerName: "Test Borrower", loanDate: "2026-01-15" }) as any;
    if ("error" in loan) P("LOAN", { ERROR: loan.error });
    else {
      const t = loan.text as string;
      const instalment = t.match(/₹[\d,]+(?:\.[\d]+)?\s*(?:per month|monthly)/);
      const reducing = /reduc[ei]ng|outstanding/i.test(t);
      P("LOAN mentions-reducing", reducing);
      P("LOAN instalment-mention", instalment?.[0] ?? null);
      P("LOAN head", t.slice(0, 200));
      // re-extract the schedule numbers
      const nums = t.match(/₹[\d,]+(?:\.\d+)?/g);
      P("LOAN rupee-figures", nums?.slice(0, 10));
    }

    // ISSUE-005 UTM fragment
    P("UTM fragment", calcLabel(buildUtmUrl, { url: "https://x.in/page#top", source: "google", medium: "cpc", campaign: "spring" }));
    P("UTM query+frag", calcLabel(buildUtmUrl, { url: "https://x.in/page?x=1#top", source: "google", medium: "cpc", campaign: "spring" }));
    P("UTM ends-?", calcLabel(buildUtmUrl, { url: "https://x.in/page?", source: "google", medium: "cpc", campaign: "spring" }));
    P("UTM plain", calcLabel(buildUtmUrl, { url: "https://x.in/page", source: "google", medium: "cpc", campaign: "spring" }));

    // ISSUE-001 HTML entities crash - use try/catch
    for (const inp of ["&#1114112;", "&#xD800;", "&#999999999;", "&#-1;", "&#1114111;", "&#65;"]) {
      try {
        P(`HTML decode ${inp}`, calcLabel(generateHtmlEntities, { text: inp, mode: "decode" }));
      } catch (e: any) {
        P(`HTML decode ${inp}`, `THREW ${e.constructor.name}: ${e.message}`);
      }
    }

    // ISSUE-002 JWT Infinity - try/catch
    const jwtInf = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0." + Buffer.from(JSON.stringify({ exp: 1e400, iat: 1e400 })).toString("base64url") + ".sig";
    try {
      P("JWT exp=1e400", calcLabel(decodeJwt, { token: jwtInf }));
    } catch (e: any) {
      P("JWT exp=1e400", `THREW ${e.constructor.name}: ${e.message}`);
    }
    // JWT null date / string date / negative
    try {
      P("JWT exp=null", calcLabel(decodeJwt, { token: "a." + Buffer.from(JSON.stringify({ exp: null })).toString("base64url") + ".b" }));
      P("JWT exp=str", calcLabel(decodeJwt, { token: "a." + Buffer.from(JSON.stringify({ exp: "abc" })).toString("base64url") + ".b" }));
      P("JWT exp=-5", calcLabel(decodeJwt, { token: "a." + Buffer.from(JSON.stringify({ exp: -5 })).toString("base64url") + ".b" }));
    } catch (e: any) {
      P("JWT other", `THREW ${e.constructor.name}: ${e.message}`);
    }
    // valid JWT baseline
    try {
      P("JWT valid", calcLabel(decodeJwt, { token: "a." + Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url") + ".b" }));
    } catch (e: any) {
      P("JWT valid", `THREW ${e.constructor.name}: ${e.message}`);
    }

    // ISSUE-009 silent coercion - invalid optional numeric fields
    P("DISC discount2=abc", calcLabel(computeDiscount, { price: 1000, discount1: 10, discount2: "abc" }));
    P("DISC discount2=-5", calcLabel(computeDiscount, { price: 1000, discount1: 10, discount2: -5 }));
    P("DISC discount2=20", calcLabel(computeDiscount, { price: 1000, discount1: 10, discount2: 20 }));
    P("Payslip otherAllow=abc", calcLabel(generatePayslip, { companyName: "C", employeeName: "E", designation: "D", month: "Jun 2026", basic: 30000, hra: 0, specialAllowance: 0, otherAllowances: "abc", pfDeduction: 0, professionalTax: 0, otherDeductions: 0 }));
    P("Payslip otherDed=-10", calcLabel(generatePayslip, { companyName: "C", employeeName: "E", designation: "D", month: "Jun 2026", basic: 30000, hra: 0, specialAllowance: 0, otherAllowances: 0, pfDeduction: 0, professionalTax: 0, otherDeductions: -10 }));
    P("Refund returnWindowDays=abc", calcLabel(generateRefundPolicy, { companyName: "C", contactEmail: "a@b.com", returnWindowDays: "abc" }));
    P("Refund returnWindowDays=-3", calcLabel(generateRefundPolicy, { companyName: "C", contactEmail: "a@b.com", returnWindowDays: -3 }));
    P("Employment noticePeriodDays=abc", calcLabel(generateEmploymentContract, { companyName: "C", employeeName: "E", designation: "D", annualCtc: 1200000, startDate: "2026-01-01", workLocation: "Delhi", noticePeriodDays: "abc" }));

    // Required field INVALID (contrast - should error)
    P("DISC price=abc (required)", calcLabel(computeDiscount, { price: "abc", discount1: 10, discount2: 0 }));
    P("Refund companyName empty (required)", calcLabel(generateRefundPolicy, { companyName: "", contactEmail: "a@b.com" }));

    writeFileSync("/tmp/repro-calc-results.txt", results.join("\n"));
  });
});
