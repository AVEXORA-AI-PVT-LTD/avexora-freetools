import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { computeGst } from "@/tools/compute/finance/gst";
import { computeEmi } from "@/tools/compute/finance/emi";
import { computeSip } from "@/tools/compute/finance/sip";
import { computeFd } from "@/tools/compute/finance/fd";
import { computeRd } from "@/tools/compute/finance/rd";
import { computeIncomeTax } from "@/tools/compute/finance/income-tax";
import { computeTds } from "@/tools/compute/finance/tds";
import { computeAdvanceTax } from "@/tools/compute/finance/advance-tax";
import { computeFreelanceTds } from "@/tools/compute/finance/freelance-tds";
import { computeCompoundInterest } from "@/tools/compute/finance/compound-interest";
import { computeSimpleInterest } from "@/tools/compute/finance/simple-interest";
import { computeBreakEven } from "@/tools/compute/finance/break-even";
import { computeMargin } from "@/tools/compute/finance/margin";
import { computeMarkup } from "@/tools/compute/finance/markup";
import { computeProfitMarginMarkup } from "@/tools/compute/finance/profit-margin-markup";
import { computeRoi } from "@/tools/compute/finance/roi";
import { computeDepreciation } from "@/tools/compute/finance/depreciation";
import { computeWorkingCapital } from "@/tools/compute/finance/working-capital";
import type { ComputeFn } from "@/types/tools";

function dumpResult(tag: string, r: Awaited<ReturnType<ComputeFn>>) {
  let out = `\n===${tag}===\n`;
  if ("error" in r) out += `ERR ${r.error}`;
  else {
    out += r.results.map((x) => `${x.label} => ${x.value}${x.emphasis ? " *" : ""}`).join("\n");
    if (r.tables) {
      out += `\nTABLE ${r.tables[0].title}: ${r.tables[0].headers.join("|")}\n`;
      out += r.tables[0].rows.map((row) => row.join("|")).join("\n");
    }
  }
  return out;
}

function computeDefaults(t: { compute: ComputeFn; fields: { name: string; type: string; placeholder?: number | string; defaultValue?: string | number | boolean }[] }) {
  const values: Record<string, string | number | boolean> = {};
  for (const f of t.fields) {
    if (f.defaultValue !== undefined) values[f.name] = f.defaultValue;
    else if (f.type === "number" && f.placeholder !== undefined) values[f.name] = f.placeholder;
    else if (f.type === "number") values[f.name] = "0";
  }
  return values;
}

it("dump finance", () => {
  let out = "";
  out += dumpResult("GST excl 10000@18", computeGst({ amount: 10000, rate: "18", mode: "exclusive" }));
  out += dumpResult("GST incl 11800@18", computeGst({ amount: 11800, rate: "18", mode: "inclusive" }));
  out += dumpResult("EMI 25L@8.5/20y", computeEmi({ loanAmount: 2500000, annualRate: "8.5", tenureYears: 20 }));
  out += dumpResult("EMI 25L@8/20y", computeEmi({ loanAmount: 2500000, annualRate: "8", tenureYears: 20 }));
  out += dumpResult("SIP 10k@12/15y", computeSip({ monthlyInvestment: 10000, annualReturn: "12", years: 15 }));
  out += dumpResult("FD 1L@7/5y/q", computeFd({ principal: 100000, annualRate: "7", years: 5, frequency: "quarterly" }));
  out += dumpResult("RD 5k@6.8/36m", computeRd({ monthlyDeposit: 5000, annualRate: "6.8", months: 36 }));
  out += dumpResult("IncomeTax 15L", computeIncomeTax({ annualIncome: 1500000, regime: "compare", salaried: true }));
  out += dumpResult("TDS 1L 194J", computeTds({ amount: 100000, section: "194j" }));
  out += dumpResult("AdvanceTax 15.5L", computeAdvanceTax({ taxYear: "2026-27", taxpayerType: "professional", regime: "new", incomeMode: "net", presumptive: "none", netProfit: "1500000", otherIncome: "50000", tdsDeducted: "80000", advanceTaxPaid: "0" }));
  out += dumpResult("FreelanceTDS 1L", computeFreelanceTds({ amount: 100000, category: "professional", yearlyTotal: "100000", payerType: "non-individual", panProvided: "yes" }));
  out += dumpResult("Compound 1L@8/10y", computeCompoundInterest({ principal: 100000, annualRate: "8", years: 10, frequency: "yearly" }));
  out += dumpResult("Compound 1L@8/10y monthly", computeCompoundInterest({ principal: 100000, annualRate: "8", years: 10, frequency: "monthly" }));
  out += dumpResult("Simple 50k@10/3y", computeSimpleInterest({ principal: 50000, annualRate: "10", years: 3 }));
  out += dumpResult("BreakEven", computeBreakEven({ fixedCosts: 200000, pricePerUnit: 500, variableCostPerUnit: 300 }));
  out += dumpResult("Margin 700/1000", computeMargin({ cost: 700, revenue: 1000 }));
  out += dumpResult("Markup 700/1000", computeMarkup({ cost: 700, sellingPrice: 1000 }));
  out += dumpResult("PMKU", computeProfitMarginMarkup({ sellingPrice: 1000, cost: 600, shippingCost: 50, packagingCost: 10, additionalCost: 20, marketplace: "custom", feeType: "percent" }));
  out += dumpResult("ROI 1L->1.8L/5y", computeRoi({ initialInvestment: 100000, finalValue: 180000, years: 5 }));
  out += dumpResult("SLM", computeDepreciation({ assetCost: 500000, salvageValue: 50000, usefulLife: 5, method: "straight-line" }));
  out += dumpResult("WDV", computeDepreciation({ assetCost: 500000, salvageValue: 0, usefulLife: 5, method: "wdv", wdvRate: "25" }));
  out += dumpResult("WC", computeWorkingCapital({ currentAssets: 1200000, currentLiabilities: 800000 }));
  writeFileSync("/tmp/aeo-fin-examples.txt", out);
});

it("dump hr/invoicing/marketing defaults", async () => {
  let out = "";
  for (const mod of ["@/tools/configs/hr-payroll", "@/tools/configs/invoicing-billing", "@/tools/configs/marketing-seo", "@/tools/configs/text-data-tools"]) {
    const { tools } = await import(mod);
    for (const t of tools as { slug: string; kind: string; compute?: ComputeFn; fields: FieldLike[] }[]) {
      if (t.kind === "calculator" && t.compute) {
        out += dumpResult(t.slug, t.compute(computeDefaults(t as never)));
      }
    }
  }
  writeFileSync("/tmp/aeo-calc-defaults.txt", out);
});

type FieldLike = { name: string; type: string; placeholder?: number | string; defaultValue?: string | number | boolean };