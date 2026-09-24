import type { ToolConfig } from "../../types/tools";
import { computeGst } from "../compute/finance/gst";
import { computeEmi } from "../compute/finance/emi";
import { computeSip } from "../compute/finance/sip";
import { computeFd } from "../compute/finance/fd";
import { computeRd } from "../compute/finance/rd";
import { computeIncomeTax } from "../compute/finance/income-tax";
import { computeTds } from "../compute/finance/tds";
import { computeAdvanceTax } from "../compute/finance/advance-tax";
import { computeFreelanceTds } from "../compute/finance/freelance-tds";
import { computeCompoundInterest } from "../compute/finance/compound-interest";
import { computeSimpleInterest } from "../compute/finance/simple-interest";
import { computeBreakEven } from "../compute/finance/break-even";
import { computeMargin } from "../compute/finance/margin";
import { computeMarkup } from "../compute/finance/markup";
import { computeProfitMarginMarkup } from "../compute/finance/profit-margin-markup";
import { computeRoi } from "../compute/finance/roi";
import { computeDepreciation } from "../compute/finance/depreciation";
import { computeWorkingCapital } from "../compute/finance/working-capital";
import { computePercentage } from "../compute/finance/percentage";

export const tools: ToolConfig[] = [
  {
    kind: "calculator",
    slug: "gst-calculator",
    category: "finance-calculators",
    name: "GST Calculator",
    tagline:
      "Add or remove GST from any amount and see the CGST/SGST/IGST split instantly.",
    seoDescription:
      "Free online GST calculator for India. Calculate GST inclusive or exclusive amounts at 0.25%, 3%, 5%, 12%, 18% and 28% with instant CGST, SGST and IGST breakup.",
    seoTitle: "Free GST Calculator: CGST, SGST & IGST Breakup",
    keywords: [
      "GST calculator",
      "GST calculator India",
      "online GST calculator",
      "GST inclusive calculator",
      "GST exclusive calculator",
      "reverse GST calculator",
      "CGST SGST calculator",
      "IGST calculator",
      "add GST to price",
      "remove GST from amount",
      "18% GST calculator",
      "how to calculate GST",
    ],
    directAnswer:
      "A GST calculator for India that adds or removes GST at 0.25%, 3%, 5%, 12%, 18% or 28% and shows the CGST/SGST/IGST breakup instantly.",
    formula:
      "Add GST: GST = amount × rate ÷ 100, total = amount + GST. Remove GST: base = amount ÷ (1 + rate ÷ 100), GST = amount − base.",
    example:
      "Example: ₹10,000 excluding 18% GST → GST = ₹1,800, total = ₹11,800 (CGST ₹900 + SGST ₹900 within a state, or IGST ₹1,800 inter-state). On an inclusive ₹11,800, the base is ₹10,000 and GST is ₹1,800.",
    steps: [
      "Enter the base amount or total amount.",
      "Select the applicable GST slab rate.",
      "Choose whether the amount includes or excludes GST.",
      "View the final breakup of CGST, SGST, and IGST."
    ],
    fields: [
      {
        name: "amount",
        label: "Amount",
        type: "number",
        placeholder: "10000",
        min: 0,
        unit: "₹",
      },
      {
        name: "rate",
        label: "GST rate",
        type: "select",
        defaultValue: "18",
        options: [
          { value: "0.25", label: "0.25%" },
          { value: "3", label: "3%" },
          { value: "5", label: "5%" },
          { value: "12", label: "12%" },
          { value: "18", label: "18%" },
          { value: "28", label: "28%" },
        ],
      },
      {
        name: "mode",
        label: "Amount is",
        type: "select",
        defaultValue: "exclusive",
        options: [
          { value: "exclusive", label: "Excluding GST (add GST)" },
          { value: "inclusive", label: "Including GST (remove GST)" },
        ],
      },
    ],
    compute: computeGst,
    autoCompute: true,
    about: [
      "GST (Goods and Services Tax) is India's unified indirect tax levied on the supply of goods and services. Businesses need to add GST to their base price when billing customers, and often need to work backwards from an all-inclusive price to find the taxable value. This calculator does both: choose whether your amount excludes or includes GST, pick the applicable rate, and the tax breakup appears instantly.",
      "For sales within the same state, GST is split equally between the Centre and the State as CGST and SGST — a 18% rate becomes 9% CGST + 9% SGST. For inter-state sales, the full amount is charged as IGST. The calculator shows all three so you can pick the split that applies to your invoice.",
      "The formula is simple: to add GST, tax = amount × rate ÷ 100. To remove GST from an inclusive price, base = amount ÷ (1 + rate ÷ 100). The second case trips up a lot of people — subtracting 18% from an inclusive price gives the wrong answer, because the 18% was charged on the base, not on the total. The calculator applies the correct reverse formula for you.",
      "Use it before [raising GST invoices](/invoicing-billing/invoice-generator) to double-check the tax line, when verifying supplier bills against the rate their goods should carry, while preparing quotes so you can show customers a clean with-tax and without-tax price, or when estimating your GST liability for the month. Every calculation runs instantly in your browser and nothing you enter is stored.",
    ],
    faq: [
      {
        question: "How do I calculate GST from an inclusive amount?",
        answer:
          "Divide the inclusive amount by (1 + GST rate ÷ 100) to get the base amount, then subtract it from the total. For example, ₹1,180 at 18% GST has a base of ₹1,000 and GST of ₹180. Set the calculator to “Including GST” to do this automatically.",
      },
      {
        question: "What is the difference between CGST, SGST and IGST?",
        answer:
          "CGST and SGST apply on sales within one state — the GST amount is split equally between the central and state governments. IGST applies on inter-state sales, where the full GST goes to the Centre. The total tax is the same either way.",
      },
      {
        question: "What are the GST rates in India?",
        answer:
          "The main GST slabs are 0.25%, 3%, 5%, 12%, 18% and 28%. Most services fall under 18%, essentials under 5% or 12%, and luxury or sin goods under 28%. Your product's HSN/SAC code determines the applicable rate.",
      },
      {
        question: "Is this GST calculator free?",
        answer:
          "Yes — it's completely free, requires no sign-up, and runs instantly in your browser.",
      },
      {
        question: "Do I need to calculate GST on shipping charges?",
        answer:
          "Yes, shipping or freight charges are generally subject to GST. If they are included in the same invoice as the goods, they often attract the same GST rate as the principal supply.",
      },
    ],
    related: ["tds-calculator", "margin-calculator", "income-tax-calculator", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "emi-calculator",
    category: "finance-calculators",
    name: "EMI Calculator",
    tagline: "Work out your monthly loan instalment, total interest and total repayment in seconds.",
    seoDescription:
      "Free EMI calculator for home, car and personal loans. Enter loan amount, interest rate and tenure to get your monthly EMI, total interest and total payment.",
    seoTitle: "Free EMI Calculator for Home, Car & Personal Loans",
    keywords: [
      "EMI calculator",
      "loan EMI calculator",
      "home loan EMI calculator",
      "car loan EMI calculator",
      "personal loan EMI calculator",
      "monthly instalment calculator",
      "loan interest calculator",
      "EMI formula",
      "how to calculate EMI",
    ],
    directAnswer:
      "An EMI (Equated Monthly Instalment) calculator works out the fixed monthly repayment on a home, car or personal loan — plus total interest and total payment — using the standard reducing-balance formula.",
    formula:
      "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is the principal, r the monthly interest rate (annual rate ÷ 12 ÷ 100) and n the number of monthly instalments.",
    example:
      "Example: a ₹25,00,000 loan at 8.5% for 20 years (240 months) → monthly EMI ₹21,695.58, total interest ₹27,06,939.40, total payment ₹52,06,939.40. At 8%, the EMI is ₹20,911.00.",
    steps: [
      "Enter the total loan amount.",
      "Input the annual interest rate.",
      "Specify the loan tenure in years.",
      "View your calculated EMI, total interest, and total payment amounts."
    ],
    fields: [
      { name: "loanAmount", label: "Loan amount", type: "number", placeholder: "2500000", min: 0, unit: "₹" },
      { name: "annualRate", label: "Interest rate (per year)", type: "number", placeholder: "8.5", min: 0, max: 60, step: 0.05, unit: "%" },
      { name: "tenureYears", label: "Loan tenure", type: "number", placeholder: "20", min: 0.5, max: 40, step: 0.5, unit: "years" },
    ],
    compute: computeEmi,
    autoCompute: true,
    about: [
      "An EMI (Equated Monthly Instalment) is the fixed amount you repay every month on a loan — part of it covers interest, the rest chips away at the principal. Before you sign a loan agreement, you should know three numbers: the EMI itself (can your monthly budget absorb it?), the total interest you'll pay over the tenure (the real cost of the loan), and the total repayment. This calculator gives you all three instantly for any home loan, car loan, personal loan or business loan.",
      "The standard formula banks use is EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is the principal, r the monthly interest rate (annual rate ÷ 12 ÷ 100) and n the number of monthly instalments. Early in the tenure most of each EMI goes to interest; the balance shifts toward principal as the loan matures — which is why prepaying in the early years saves the most interest.",
      "Use the calculator to compare offers: a 0.5% lower rate on a ₹25 lakh, 20-year home loan changes the EMI only modestly but saves well over a lakh in total interest. Also test shorter tenures — the EMI rises, but total interest falls sharply. Every calculation runs in your browser and nothing you enter is stored.",
    ],
    faq: [
      {
        question: "How is EMI calculated?",
        answer:
          "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where P is the loan amount, r the monthly interest rate and n the tenure in months. This calculator applies the same formula banks use, so the result matches your sanction letter.",
      },
      {
        question: "Does a longer tenure reduce my EMI?",
        answer:
          "Yes — spreading repayment over more months lowers each instalment, but you pay interest for longer, so the total interest cost rises significantly. Choose the shortest tenure whose EMI you can comfortably afford.",
      },
      {
        question: "Is it better to prepay a loan early or late?",
        answer:
          "Early. In the initial years most of each EMI is interest, so reducing the principal early shrinks the base on which all future interest is charged.",
      },
      {
        question: "Does this work for home, car and personal loans?",
        answer:
          "Yes. The EMI formula is identical for all reducing-balance loans; only the typical rates and tenures differ.",
      },
      {
        question: "Are processing fees included in this EMI calculation?",
        answer:
          "No, this calculator strictly works out the EMI on the principal amount. Processing fees are usually deducted upfront from the loan disbursement or added to the initial payment.",
      },
    ],
    related: ["simple-interest-calculator", "compound-interest-calculator", "income-tax-calculator", "late-fee-calculator"],
  },
  {
    kind: "calculator",
    slug: "sip-calculator",
    category: "finance-calculators",
    name: "SIP Calculator",
    tagline: "See what your monthly mutual-fund SIP could grow to over time.",
    seoDescription:
      "Free SIP calculator. Enter your monthly investment, expected return and period to see your maturity corpus, total invested and estimated returns instantly.",
    seoTitle: "Free SIP Calculator: Mutual Fund Returns & Maturity Value",
    keywords: [
      "SIP calculator",
      "mutual fund SIP calculator",
      "SIP return calculator",
      "SIP maturity calculator",
      "monthly SIP calculator",
      "systematic investment plan calculator",
      "SIP formula",
      "how much will my SIP grow",
    ],
    directAnswer:
      "A SIP calculator projects how a fixed monthly mutual-fund investment grows over time, using the standard SIP future-value formula with monthly compounding.",
    formula:
      "FV = A × ((1 + i)ⁿ − 1) ÷ i × (1 + i), where A is the monthly investment, i the monthly rate (expected annual return ÷ 12 ÷ 100) and n the number of instalments.",
    example:
      "Example: ₹10,000 invested monthly at a 12% expected annual return for 15 years → corpus ₹50,45,760 on ₹18,00,000 invested, i.e. estimated returns of ₹32,45,760.",
    steps: [
      "Enter the monthly investment amount.",
      "Input your expected annual return.",
      "Specify the investment period in years.",
      "See your estimated corpus and total returns."
    ],
    fields: [
      { name: "monthlyInvestment", label: "Monthly investment", type: "number", placeholder: "10000", min: 0, unit: "₹" },
      { name: "annualReturn", label: "Expected annual return", type: "number", placeholder: "12", min: 0, max: 40, step: 0.5, unit: "%" },
      { name: "years", label: "Investment period", type: "number", placeholder: "15", min: 0.5, max: 50, step: 0.5, unit: "years" },
    ],
    compute: computeSip,
    autoCompute: true,
    about: [
      "A SIP (Systematic Investment Plan) invests a fixed amount into a mutual fund every month, buying more units when prices are low and fewer when they're high. It is the most popular way to invest in equity funds in India because it needs no timing decisions and builds discipline. This calculator shows what a monthly SIP could grow to: enter the amount, an expected annual return, and the number of years, and you get the projected corpus, the total you'll have put in, and the estimated gain.",
      "The projection uses the standard SIP future-value formula — FV = A × ((1 + i)ⁿ − 1) ÷ i × (1 + i) — where A is the monthly amount, i the monthly rate and n the number of instalments. The power of it is compounding: a ₹10,000 monthly SIP at 12% grows to about ₹50 lakh in 15 years, of which only ₹18 lakh is your own money. Stretch it to 25 years and the corpus is roughly ₹1.9 crore — time in the market matters far more than the amount.",
      "Treat the expected-return field honestly: equity funds have historically delivered 10–14% over long periods, but returns are not guaranteed and vary year to year. Run the calculation at 10% and 12% to see a realistic band rather than a single number. Nothing you enter is stored.",
    ],
    faq: [

      {
        question: "What return should I assume for a SIP?",
        answer:
          "For long-term equity funds, 10–12% a year is a commonly used planning assumption based on historical index returns. Debt funds are usually assumed at 6–8%. Actual returns vary and are not guaranteed — test a range.",
      },
      {
        question: "Is SIP better than a one-time lump sum?",
        answer:
          "A SIP spreads your entry across market highs and lows (rupee-cost averaging) and suits monthly earners. A lump sum can do better if invested at a market low, but that requires timing. For most salaried investors, SIP is the practical choice.",
      },
      {
        question: "Does the calculator account for inflation or tax?",
        answer:
          "No — the corpus shown is pre-tax and in future rupees. Equity fund gains above ₹1.25 lakh a year attract LTCG tax at 12.5% currently. Consider both when setting targets.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["fd-calculator", "rd-calculator", "compound-interest-calculator", "roi-calculator"],
  },
  {
    kind: "calculator",
    slug: "fd-calculator",
    category: "finance-calculators",
    name: "Fixed Deposit Calculator",
    tagline: "Calculate FD maturity value with monthly, quarterly, half-yearly or yearly compounding.",
    seoDescription:
      "Free fixed deposit calculator for Indian banks. Enter deposit, interest rate, tenure and compounding frequency to see FD maturity amount and interest earned.",
    seoTitle: "Free Fixed Deposit Calculator: FD Maturity & Interest",
    keywords: [
      "fixed deposit calculator",
      "FD calculator",
      "FD interest calculator",
      "FD maturity calculator",
      "bank FD calculator",
      "FD calculator quarterly compounding",
      "fixed deposit interest calculator",
      "how is FD interest calculated",
    ],
    directAnswer:
      "A fixed deposit calculator tells you the exact maturity amount and total interest of an FD for any deposit, rate, tenure and compounding frequency (monthly, quarterly, half-yearly or yearly).",
    formula:
      "M = P × (1 + r/m)^(m×t), where P is the deposit, r the annual rate (÷ 100), m the compounding periods per year and t the tenure in years.",
    example:
      "Example: ₹1,00,000 at 7% for 5 years with quarterly compounding → maturity ₹1,41,477.82, interest ₹41,477.82.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "principal", label: "Deposit amount", type: "number", placeholder: "100000", min: 0, unit: "₹" },
      { name: "annualRate", label: "Interest rate (per year)", type: "number", placeholder: "7", min: 0, max: 15, step: 0.05, unit: "%" },
      { name: "years", label: "Tenure", type: "number", placeholder: "5", min: 0.25, max: 20, step: 0.25, unit: "years" },
      {
        name: "frequency",
        label: "Compounding frequency",
        type: "select",
        defaultValue: "quarterly",
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly (most banks)" },
          { value: "half-yearly", label: "Half-yearly" },
          { value: "yearly", label: "Yearly" },
        ],
      },
    ],
    compute: computeFd,
    autoCompute: true,
    about: [
      "A fixed deposit locks a lump sum with a bank for a fixed tenure at a fixed interest rate — the safest mainstream investment in India, with returns known on day one. This calculator tells you exactly what you'll receive at maturity: enter the deposit, the advertised rate, the tenure, and how often the bank compounds interest.",
      "Compounding frequency matters more than most depositors realise. The formula is M = P × (1 + r/m)^(m×t), where m is the number of compounding periods per year. Most Indian banks compound quarterly, which makes the effective annual yield slightly higher than the headline rate — a 7% FD compounded quarterly actually yields about 7.19% a year. The calculator lets you switch frequency so you can compare bank offers like-for-like.",
      "Use it to plan ladders too: instead of one large FD, split the amount across tenures of 1–5 years so a deposit matures regularly, giving liquidity without breaking an FD early (which usually costs a 0.5–1% penalty on the rate). Remember that FD interest is fully taxable at your slab rate, and banks deduct TDS at 10% once interest crosses ₹40,000 a year (₹50,000 for senior citizens) — factor that into post-tax comparisons with debt funds.",
    ],
    faq: [

      {
        question: "How do banks compound FD interest?",
        answer:
          "Most Indian banks compound quarterly. Interest earned each quarter is added to the principal, and the next quarter's interest is calculated on the higher amount — which is why the effective yield beats the headline rate.",
      },
      {
        question: "Is FD interest taxable?",
        answer:
          "Yes, fully, at your income-tax slab rate. Banks deduct 10% TDS when your interest across deposits exceeds ₹40,000 in a year (₹50,000 for senior citizens). You can submit Form 15G/15H if your total income is below the taxable limit.",
      },
      {
        question: "What happens if I break an FD early?",
        answer:
          "The bank recalculates interest at the rate applicable for the period the deposit actually ran, usually minus a 0.5–1% premature-withdrawal penalty. Laddering several smaller FDs avoids this.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["rd-calculator", "sip-calculator", "compound-interest-calculator", "tds-calculator"],
  },
  {
    kind: "calculator",
    slug: "rd-calculator",
    category: "finance-calculators",
    name: "Recurring Deposit Calculator",
    tagline: "See the maturity value of a monthly recurring deposit at any bank rate.",
    seoDescription:
      "Free RD calculator. Enter your monthly deposit, interest rate and tenure to see the recurring deposit maturity amount and interest, using the bank formula.",
    seoTitle: "Free RD Calculator: Recurring Deposit Maturity Value",
    keywords: [
      "RD calculator",
      "recurring deposit calculator",
      "RD interest calculator",
      "RD maturity calculator",
      "post office RD calculator",
      "bank RD calculator",
      "monthly deposit calculator",
      "how is RD interest calculated",
    ],
    directAnswer:
      "A recurring deposit calculator works out the maturity value of a monthly RD (bank or post office) using the standard quarterly-compounding RD formula.",
    formula:
      "Each monthly instalment compounds quarterly for the quarters remaining until maturity; the maturity value is the sum of all instalments' compounded values (standard bank/Post Office RD formula).",
    example:
      "Example: ₹5,000 deposited monthly at 6.8% for 36 months → maturity ₹2,00,058.97 on ₹1,80,000 deposited, so ₹20,058.97 in interest.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "monthlyDeposit", label: "Monthly deposit", type: "number", placeholder: "5000", min: 0, unit: "₹" },
      { name: "annualRate", label: "Interest rate (per year)", type: "number", placeholder: "6.8", min: 0, max: 15, step: 0.05, unit: "%" },
      { name: "months", label: "Tenure", type: "number", placeholder: "36", min: 3, max: 120, step: 3, unit: "months" },
    ],
    compute: computeRd,
    autoCompute: true,
    about: [
      "A recurring deposit is the savings habit-builder of Indian banking: you commit a fixed amount every month for a fixed tenure and earn FD-like interest on it. It suits anyone who can't invest a lump sum but can spare a few thousand rupees monthly — students, first jobbers, households saving for a planned expense like a wedding, school fees or a down payment.",
      "This calculator uses the standard formula banks and post offices apply, with quarterly compounding: each monthly instalment earns interest for the number of quarters it stays deposited. Because early instalments compound longer than later ones, the maturity value is a little lower than a same-size FD — your money enters gradually rather than all at once. Enter your monthly amount, the bank's RD rate and the tenure in months (banks accept 6 to 120 months, in multiples of 3) to see the maturity amount and total interest.",
      "Compare the result against a SIP in a debt or hybrid fund for the same monthly amount: the RD's return is guaranteed and fixed, the fund's is market-linked but historically somewhat higher. Many savers run both — an RD for must-have goals and a SIP for growth. RD interest, like FD interest, is taxable at your slab rate and subject to TDS above the annual threshold.",
    ],
    faq: [

      {
        question: "How is RD interest calculated?",
        answer:
          "Banks compound RD interest quarterly. Each monthly deposit earns interest for the quarters remaining until maturity, so early instalments earn more than later ones. This calculator applies the same standard formula.",
      },
      {
        question: "Can I choose any RD tenure?",
        answer:
          "Most banks accept tenures from 6 months to 10 years, in multiples of 3 months. The calculator enforces a minimum of 3 months to match the quarterly-compounding formula.",
      },
      {
        question: "RD or SIP — which is better?",
        answer:
          "An RD gives a guaranteed, fixed return and suits short-term, must-achieve goals. A SIP into a mutual fund is market-linked — historically higher over long periods but not guaranteed. Many savers use both for different goals.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["fd-calculator", "sip-calculator", "simple-interest-calculator", "compound-interest-calculator"],
  },
  {
    kind: "calculator",
    slug: "income-tax-calculator",
    category: "finance-calculators",
    name: "Income Tax Calculator (FY 2025-26)",
    tagline: "Compare your tax under the new and old regimes and see which saves you more.",
    seoDescription:
      "Free income tax calculator for FY 2025-26 (AY 2026-27). Compare new vs old regime tax on your salary with standard deduction, 87A rebate and cess included.",
    seoTitle: "Free Income Tax Calculator FY 2025-26: New vs Old Regime",
    keywords: [
      "income tax calculator",
      "income tax calculator FY 2025-26",
      "tax calculator AY 2026-27",
      "new vs old tax regime calculator",
      "new regime tax calculator",
      "salary tax calculator India",
      "87A rebate calculator",
      "which tax regime is better",
      "how much income tax on my salary",
    ],
    directAnswer:
      "An income tax calculator for FY 2025-26 (AY 2026-27) that compares your tax under the new and old regimes — with standard deduction, the §87A rebate and 4% health-and-education cess — so you can see which regime saves you more.",
    formula:
      "New regime (FY 2025-26): taxable income minus ₹75,000 standard deduction (salaried) → slab tax at 0%/5%/10%/15%/20%/25%/30% (nil to ₹4L, then 5% to ₹8L, 10% to ₹12L, 15% to ₹16L, 20% to ₹20L, 25% to ₹24L, 30% above) → §87A rebate (zero tax up to ₹12L) → + 4% cess. Old regime: ₹50,000 standard deduction then 5/20/30% slabs and rebate up to ₹5L.",
    example:
      "Example: ₹15,00,000 salary → new regime tax ₹97,500 (taxable ₹14,25,000 after ₹75,000 standard deduction) vs old regime ₹2,57,400 (taxable ₹14,50,000). New regime saves ₹1,59,900.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "annualIncome", label: "Annual income", type: "number", placeholder: "1500000", min: 0, unit: "₹" },
      {
        name: "regime",
        label: "Tax regime",
        type: "select",
        defaultValue: "compare",
        options: [
          { value: "compare", label: "Compare both regimes" },
          { value: "new", label: "New regime only" },
          { value: "old", label: "Old regime only" },
        ],
      },
      { name: "salaried", label: "I am salaried (apply standard deduction)", type: "checkbox", defaultValue: true },
    ],
    compute: computeIncomeTax,
    autoCompute: true,
    about: [
      "India gives taxpayers a choice every year: the new regime, with lower slab rates but almost no deductions, or the old regime, with higher rates but the full menu of deductions (80C, 80D, HRA, home-loan interest). For most salaried people since the 2025 Budget, the new regime wins — its ₹12 lakh rebate threshold means no tax at all up to ₹12.75 lakh of salary income — but the only way to know for your numbers is to compute both. This calculator does exactly that. To see how HRA changes the picture under the old regime, pair it with the [HRA exemption calculator](/hr-payroll/hra-exemption-calculator).",
      "For FY 2025-26 the new regime slabs are: nil up to ₹4 lakh, then 5% to ₹8L, 10% to ₹12L, 15% to ₹16L, 20% to ₹20L, 25% to ₹24L and 30% above. The §87A rebate wipes out tax up to ₹12 lakh of taxable income (with marginal relief just above it), and salaried taxpayers get a ₹75,000 standard deduction. The old regime keeps the familiar 5/20/30 slabs with a ₹50,000 standard deduction and rebate up to ₹5 lakh. Both add 4% health-and-education cess.",
      "The calculator compares gross tax under both regimes assuming no old-regime deductions beyond the standard deduction — if you claim large deductions (HRA, 80C, home-loan interest), the old regime's real position improves by your slab rate times the deduction amount, so treat the comparison as a starting point. Surcharge on incomes above ₹50 lakh is not modelled.",
    ],
    faq: [

      {
        question: "Which regime is better for FY 2025-26?",
        answer:
          "For most salaried taxpayers without large deductions, the new regime — income up to ₹12.75 lakh (salary, after standard deduction) pays zero tax thanks to the §87A rebate. If you claim substantial deductions like HRA, 80C and home-loan interest, compute the old regime with those subtracted before deciding.",
      },
      {
        question: "What is the §87A rebate?",
        answer:
          "A rebate that cancels your entire tax if taxable income is within the threshold — ₹12 lakh under the new regime (FY 2025-26) and ₹5 lakh under the old. Marginal relief in the new regime ensures earning slightly above ₹12 lakh can't leave you worse off after tax.",
      },
      {
        question: "Does the calculator include surcharge?",
        answer:
          "No. Surcharge applies on taxable income above ₹50 lakh (10% and up) and is not modelled here — treat results above that level as indicative. The 4% health-and-education cess is included.",
      },
      {
        question: "What deductions does the old regime figure assume?",
        answer:
          "Only the ₹50,000 standard deduction for salaried taxpayers. Add your own 80C/80D/HRA/home-loan deductions mentally: each ₹1 of deduction saves tax at your marginal slab rate.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
    ],
    related: ["tds-calculator", "advance-tax-calculator", "freelance-tds-calculator", "salary-calculator", "hra-exemption-calculator", "gst-calculator"],
  },
  {
    kind: "calculator",
    slug: "tds-calculator",
    category: "finance-calculators",
    name: "TDS Calculator",
    tagline: "Work out TDS to deduct on contractor, professional, rent, commission and interest payments.",
    seoDescription:
      "Free TDS calculator for sections 194C, 194J, 194I, 194H and 194A. Enter the payment amount and section to get the TDS to deduct and net amount payable.",
    seoTitle: "Free TDS Calculator: 194C, 194J, 194I, 194H & 194A",
    keywords: [
      "TDS calculator",
      "TDS calculator India",
      "194C TDS calculator",
      "194J TDS calculator",
      "TDS on rent calculator",
      "TDS on contractor payment",
      "TDS on commission",
      "TDS rate chart",
      "how much TDS to deduct",
    ],
    directAnswer:
      "A TDS calculator that applies the correct tax-at-source rate for the most common sections (194C contractors, 194J professional fees, 194I rent, 194H commission, 194A interest) and shows the TDS amount and net payment.",
    formula:
      "TDS = payment amount × section rate, deducted from what you pay the party. Rates: 194C 1% (individual/HUF payee) or 2% (company/firm); 194J 10%; 194I 10% (land/building) or 2% (plant & machinery); 194H 2%; 194A 10%. The calculator assumes a valid PAN (otherwise 20% under section 206AA).",
    example:
      "Example: a ₹1,00,000 professional-fee payment under 194J → TDS ₹10,000, net amount payable to the vendor ₹90,000.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "amount", label: "Payment amount", type: "number", placeholder: "100000", min: 0, unit: "₹" },
      {
        name: "section",
        label: "Nature of payment (TDS section)",
        type: "select",
        defaultValue: "194j",
        options: [
          { value: "194c-individual", label: "194C — Contractor (individual/HUF payee) — 1%" },
          { value: "194c-others", label: "194C — Contractor (company/firm payee) — 2%" },
          { value: "194j", label: "194J — Professional/technical fees — 10%" },
          { value: "194i-land-building", label: "194I — Rent: land or building — 10%" },
          { value: "194i-plant-machinery", label: "194I — Rent: plant & machinery — 2%" },
          { value: "194h", label: "194H — Commission or brokerage — 2%" },
          { value: "194a", label: "194A — Interest (non-securities) — 10%" },
        ],
      },
    ],
    compute: computeTds,
    autoCompute: true,
    about: [
      "If your business pays contractors, professionals, rent or commission, you are usually required to deduct tax at source (TDS) before paying, deposit it with the government, and report it in your quarterly TDS return. Getting the rate wrong cuts both ways: deduct too little and you face interest and disallowance of the expense; deduct too much and your vendor chases refunds. This calculator applies the correct rate for the most common sections and shows the TDS amount and the net you actually pay the party.",
      "The rates covered: 194C contractor payments at 1% when the payee is an individual or HUF and 2% for companies and firms; 194J professional and technical fees at 10%; 194I rent at 10% for land or buildings and 2% for plant and machinery; 194H commission or brokerage at 2%; and 194A interest at 10%. Each section also has an annual threshold below which no TDS applies — for example ₹30,000 per contract (₹1 lakh yearly) under 194C and ₹50,000 a year for professional fees — so small payments may be exempt.",
      "Remember two general rules: if the payee doesn't give you a PAN, TDS jumps to 20% under section 206AA, and TDS is deducted on the amount excluding GST when the GST is shown separately in the invoice — see the [GST calculator](/finance-calculators/gst-calculator) to work out the tax on the invoice amount. This calculator assumes a valid PAN and applies the rate to the amount you enter.",
    ],
    faq: [

      {
        question: "When do I need to deduct TDS as a business?",
        answer:
          "When you make specified payments — contractor work, professional fees, rent, commission, interest — above each section's threshold. Individuals and HUFs need to deduct only if their turnover crossed the tax-audit limit in the previous year (or for a few specific sections like 194-IB rent above ₹50,000/month).",
      },
      {
        question: "What if the payee has no PAN?",
        answer:
          "Section 206AA forces a higher deduction of 20% (or the section rate, whichever is higher). Always collect the PAN before making the payment.",
      },
      {
        question: "Is TDS calculated on the GST-inclusive amount?",
        answer:
          "No — if GST is shown separately on the invoice, TDS applies on the value excluding GST. Enter the pre-GST amount in the calculator for such invoices.",
      },
      {
        question: "What are the thresholds below which no TDS applies?",
        answer:
          "Common ones (FY 2025-26): 194C — ₹30,000 per contract or ₹1,00,000 aggregate per year; 194J — ₹50,000 per year; 194I — ₹6,00,000 per year; 194H — ₹20,000 per year; 194A — ₹10,000 (₹1,00,000 for senior citizens at banks). Below these, deduct nothing.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
    ],
    related: ["gst-calculator", "income-tax-calculator", "advance-tax-calculator", "freelance-tds-calculator", "salary-calculator", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "advance-tax-calculator",
    category: "finance-calculators",
    name: "Advance Tax Calculator (FY 2026-27)",
    tagline:
      "Estimate your annual income tax for AY 2027-28 and see exactly how much advance tax to pay and when.",
    seoDescription:
      "Free advance tax calculator for FY 2026-27. Estimate tax under the new or old regime, subtract TDS paid and get your quarterly instalments and due dates.",
    seoTitle: "Advance Tax Calculator FY 2026-27: Instalments & Due Dates",
    keywords: [
      "advance tax calculator",
      "advance tax calculator FY 2026-27",
      "advance tax due dates",
      "advance tax instalments",
      "quarterly advance tax",
      "advance tax for freelancers",
      "how to calculate advance tax",
      "who needs to pay advance tax",
    ],
    directAnswer:
      "An advance tax calculator that estimates your income tax for FY 2026-27 (AY 2027-28), subtracts TDS and advance tax already paid, and converts the balance into the exact quarterly instalments due on 15 June, 15 September, 15 December and 15 March.",
    formula:
      "Estimated annual tax (new or old regime slabs + 4% cess, surcharge above ₹50 lakh) − TDS credited to PAN − advance tax already paid = remaining advance tax, payable in instalments of 15% by 15 June, 45% by 15 September, 75% by 15 December and 100% by 15 March (single 15 March instalment for 44AD/44ADA).",
    example:
      "Example: ₹15,00,000 professional profit + ₹50,000 other income under the new regime → annual tax ₹1,17,000; minus ₹80,000 TDS → ₹37,000 remains, due as ₹5,550 on 15 June, ₹11,100 on 15 September, ₹11,100 on 15 December and ₹9,250 on 15 March.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      {
        name: "taxYear",
        label: "Tax year",
        type: "select",
        defaultValue: "2026-27",
        options: [{ value: "2026-27", label: "FY 2026-27 (AY 2027-28)" }],
      },
      {
        name: "taxpayerType",
        label: "I am a",
        type: "select",
        defaultValue: "professional",
        options: [
          { value: "individual", label: "Individual / Freelancer" },
          { value: "professional", label: "Self-employed professional" },
          { value: "business", label: "Business / Proprietor" },
        ],
      },
      {
        name: "regime",
        label: "Tax regime",
        type: "select",
        defaultValue: "new",
        options: [
          { value: "new", label: "New regime (default)" },
          { value: "old", label: "Old regime" },
        ],
      },
      {
        name: "incomeMode",
        label: "How to enter business income",
        type: "select",
        defaultValue: "net",
        options: [
          { value: "net", label: "Enter my net taxable profit" },
          { value: "gross", label: "Enter gross receipts minus expenses" },
        ],
      },
      {
        name: "presumptive",
        label: "Presumptive taxation",
        type: "select",
        defaultValue: "none",
        help: "Professionals can estimate income at 50% of receipts (44ADA), businesses at 8% (44AD). Expenses are then ignored.",
        options: [
          { value: "none", label: "Not applicable — estimate actual profit" },
          { value: "44ada", label: "Section 44ADA — professional income at 50% of gross receipts" },
          { value: "44ad", label: "Section 44AD — business income at 8% of gross receipts" },
        ],
      },
      { name: "grossReceipts", label: "Gross receipts / turnover", type: "number", placeholder: "5000000", min: 0, unit: "₹", optional: true, help: "Required when entering gross receipts, or for presumptive taxation (44AD/44ADA)." },
      { name: "businessExpenses", label: "Business expenses", type: "number", placeholder: "2000000", min: 0, unit: "₹", optional: true, help: "Only when entering gross receipts minus expenses." },
      { name: "netProfit", label: "Net taxable profit", type: "number", placeholder: "1500000", min: 0, unit: "₹", optional: true, help: "Only when entering net profit." },
      { name: "otherIncome", label: "Other taxable income", type: "number", placeholder: "50000", min: 0, unit: "₹", optional: true, help: "Interest, rent, capital gains after allowable deductions, etc." },
      { name: "tdsDeducted", label: "TDS / TCS already deducted on your income", type: "number", placeholder: "80000", min: 0, unit: "₹", optional: true },
      { name: "advanceTaxPaid", label: "Advance tax already paid this year", type: "number", placeholder: "20000", min: 0, unit: "₹", optional: true, help: "Applied against the earliest instalments first." },
      { name: "dedSection80c", label: "80C deduction (LIC, PF, ELSS…)", type: "number", placeholder: "50000", min: 0, max: 150000, unit: "₹", optional: true, help: "Old regime only — capped at ₹1,50,000." },
      { name: "dedSection24b", label: "Home-loan interest — section 24(b)", type: "number", placeholder: "120000", min: 0, max: 200000, unit: "₹", optional: true, help: "Old regime only — capped at ₹2,00,000 for a self-occupied property." },
      { name: "dedSection80d", label: "80D health insurance premium", type: "number", placeholder: "15000", min: 0, max: 25000, unit: "₹", optional: true, help: "Old regime only — capped at ₹25,000 for self and family." },
    ],
    compute: computeAdvanceTax,
    submitLabel: "Calculate advance tax",
    about: [
      "Advance tax means paying your income tax in instalments during the same financial year in which you earn the income, instead of as a single lump sum while filing in the next year. If you are a freelancer, self-employed professional, or business owner, TDS is not deducted from what your clients pay you (or only a small part is), so you owe the tax yourself — and you can be charged interest under sections 234B/234C (now 423–425 of the Income-tax Act, 2025) if you don't pay it on time. This calculator estimates your full-year tax for FY 2026-27 (AY 2027-28) and converts the balance into the exact instalments that fall due on 15 June, 15 September, 15 December and 15 March. If you're new to freelancing, the [income tax calculator](/finance-calculators/income-tax-calculator) first works out your annual liability, and the [freelance TDS calculator](/finance-calculators/freelance-tds-calculator) shows what your client already deducts.",
      "The calculation follows the FY 2026-27 rules, which are unchanged from FY 2025-26 under the new Income-tax Act, 2025. The new regime has slabs of nil/5/10/15/20/25/30% at ₹4/8/12/16/20/24 lakh, with a §87A rebate that wipes out tax entirely up to ₹12 lakh of taxable income (with marginal relief just above it). The old regime keeps the 5%/20%/30% slabs above ₹2.5/5/10 lakh with the familiar 80C, 24(b) and 80D deductions — enter those in the three deduction fields, and only the old regime uses them. Taxable income here is your business or professional profit plus other income. TDS already credited to your PAN is subtracted, the 4% health-and-education cess is included on top, and surcharge (10–37% depending on income and regime) applies above ₹50 lakh.",
      "Two simplifications are documented rather than hidden. First, TDS is assumed to be credited evenly across the year (the schedule spreads net tax, after TDS, over the four quarters). Second, surcharge is applied at its flat rate without the marginal relief that softens the jump around each threshold — treat results above ₹50 lakh as indicative. If your net tax after TDS is ₹10,000 or less, no advance tax is payable under section 404, and the calculator tells you so instead of showing instalments. It is an estimator for planning purposes, not a substitute for your chartered accountant or the return-filing computation.",
    ],
    faq: [
      {
        question: "When is advance tax due in FY 2026-27?",
        answer:
          "If your tax liability after TDS exceeds ₹10,000 (section 404), pay at least 15% by 15 June, 45% by 15 September, 75% by 15 December and 100% by 15 March. If you are taxed under presumptive schemes (44AD/44ADA), the entire balance is due as a single instalment on 15 March (section 408(2)).",
      },
      {
        question: "Who has to pay advance tax?",
        answer:
          "Freelancers, professionals and businesses whose estimated tax for the year, net of TDS deducted from them, exceeds ₹10,000. Salaried people whose employer deducts TDS usually don't need to, because the deduction covers the liability. If the ₹10,000 threshold isn't crossed, no advance tax is due.",
      },
      {
        question: "What are the new-regime slabs and rebate for FY 2026-27?",
        answer:
          "Nil up to ₹4 lakh, then 5/10/15/20/25/30% above ₹8/12/16/20/24 lakh. The §87A rebate cancels tax up to ₹12 lakh of taxable income, with marginal relief so income just above ₹12 lakh doesn't jump in tax. The old regime retains 5/20/30% slabs above ₹2.5/5/10 lakh.",
      },
      {
        question: "How is TDS and advance tax already paid handled?",
        answer:
          "TDS credited to your PAN is subtracted from your total estimated tax before the schedule is built — the calculator assumes it is spread evenly across the year. Advance tax you've already paid is applied to the earliest instalments first, so paying in June reduces what is due in June, then September, and so on. Any balance is absorbed in the final instalment.",
      },
      {
        question: "Do I need to deduct TDS when paying professionals?",
        answer:
          "Separately from your own advance tax, if you engage contractors, professionals, rent or commission payments, you generally must deduct TDS before paying them and deposit it with the government — see the TDS calculator for the applicable sections and rates.",
      },
      {
        question: "Is this a substitute for my CA or the IT Department's computation?",
        answer:
          "No. It uses the standard FY 2026-27 slabs, rebate, cess and surcharge on the income you enter, and it is a planning estimate. Your final liability depends on your exact return computation. Surcharge marginal relief is not modelled, and old-regime deductions are limited to 80C, 24(b) and 80D.",
      },
    ],
    related: ["income-tax-calculator", "tds-calculator", "freelance-tds-calculator", "gst-calculator", "depreciation-calculator"],
  },
  {
    kind: "calculator",
    slug: "freelance-tds-calculator",
    category: "finance-calculators",
    name: "Freelance TDS Calculator",
    tagline:
      "Section 194J TDS on professional and technical fees — see what your client deducts and the net you receive.",
    seoDescription:
      "Free freelance TDS calculator for Section 194J (393 in the 2025 Act). See the 10% or 2% TDS your client deducts, the ₹50,000 threshold and your net receivable.",
    seoTitle: "Free Freelance TDS Calculator: Section 194J TDS on Fees",
    keywords: [
      "freelance TDS calculator",
      "194J TDS calculator",
      "TDS on professional fees",
      "TDS on freelance income",
      "TDS on technical services",
      "TDS for consultants",
      "section 393 TDS",
      "net payment after TDS",
      "how much TDS will my client deduct",
    ],
    directAnswer:
      "A freelancer TDS calculator that works out the Section 194J (now 393(1)) deduction a client withholds from your professional or technical fees — 10% or 2% — including the ₹50,000 annual threshold, the payer-type rules and the 20% no-PAN rate.",
    formula:
      "TDS = gross fee × rate (10% professional services, 2% fees for technical services). No TDS below ₹50,000 aggregate per category per tax year; once crossed, TDS applies to the full payment. Without a valid PAN the rate becomes 20%.",
    example:
      "Example: a ₹1,00,000 professional fee with ₹1,00,000 already paid to you in that category this year → the ₹50,000 threshold is crossed, so TDS = 10% of ₹1,00,000 = ₹10,000, and your net receivable is ₹90,000.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "amount", label: "Payment / invoice amount (fee only)", type: "number", placeholder: "100000", min: 0, step: 0.01, unit: "₹", help: "Enter the fee excluding GST — when GST is shown separately on the invoice, TDS applies to the fee only." },
      {
        name: "category",
        label: "Nature of the payment",
        type: "select",
        defaultValue: "professional",
        help: "Distinguishes the two 194J rates: 10% for professional services and 2% for fees for technical services (FTS).",
        options: [
          { value: "professional", label: "Professional services — 10%" },
          { value: "technical", label: "Fees for technical services (FTS) — 2%" },
        ],
      },
      { name: "yearlyTotal", label: "Total paid to you in this category this year (including this payment)", type: "number", placeholder: "100000", min: 0, step: 0.01, unit: "₹", optional: true, help: "TDS starts once the year's aggregate in the category exceeds ₹50,000. Leave blank to treat this as the only payment." },
      {
        name: "payerType",
        label: "Who is paying you?",
        type: "select",
        defaultValue: "non-individual",
        options: [
          { value: "non-individual", label: "Company, firm or other non-individual" },
          { value: "huf-specified", label: "Individual / HUF with turnover above ₹1 crore (business) or ₹50 lakh (profession) last year" },
          { value: "huf-exempt", label: "Individual / HUF within those limits, or paying me for personal purposes" },
        ],
      },
      {
        name: "panProvided",
        label: "Have you furnished a valid PAN to the payer?",
        type: "select",
        defaultValue: "yes",
        options: [
          { value: "yes", label: "Yes — normal section rate applies" },
          { value: "no", label: "No — TDS at 20% (Section 397(2))" },
        ],
      },
    ],
    compute: computeFreelanceTds,
    autoCompute: true,
    about: [
      "When a client pays a freelancer or consultant for professional or technical services, the payer is generally required to deduct TDS before making the payment, deposit it with the Income Tax Department, and report it in their return. The fee you invoice is not what lands in your bank account — the TDS is credited to your PAN and adjusted against your own tax, but the timing matters for your cash flow. This calculator works out the Section 194J deduction for a single payment: the category sets the rate (10% for professional services, 2% for fees for technical services), the annual aggregate in that category sets the threshold, and the result tells you the exact TDS to expect and the net amount you will actually receive.",
      "Under the Income-tax Act, 2025 (in force from 1 April 2026), Section 194J has been renumbered as Section 393(1), Table Sl. No. 6(iii), with the same rates: professional services attract 10%, and fees for technical services (FTS) — an engagement that is managerial, technical or consultancy in nature rather than a professional service — attract 2%. No TDS is deducted while the aggregate of payments in a single category during the tax year is within ₹50,000 (raised from ₹30,000 by the Finance Act, 2025). Once that aggregate crosses ₹50,000, TDS applies to the full amount of the payment, not just the excess. Payment codes in TDS returns are 1027 for professional fees and 1026 for technical fees.",
      "Applicability depends on the payer. Companies, firms and other non-individuals must always deduct once the threshold is crossed; an individual or HUF deducts only if their business turnover exceeded ₹1 crore or their professional receipts exceeded ₹50 lakh in the immediately preceding tax year, and never for payments made for purely personal purposes. If the payee has not furnished a valid PAN the rate rises to 20% (Section 397(2) of the 2025 Act, formerly 206AA). This calculator models the current residency threshold and applies TDS on the fee excluding separately-shown GST — payments to non-residents, royalty, call-centre and director-remuneration variants of the section are outside its scope.",
    ],
    faq: [
      {
        question: "What TDS rate applies to my freelance income?",
        answer:
          "10% if you are paid for professional services — services in the course of a legal, medical, engineering, architectural, accountancy, technical-consultancy, interior-design or advertising profession. 2% if you are paid fees for technical services (FTS) — managerial, technical or consultancy work. If you haven't furnished a valid PAN, both rates rise to 20%.",
      },
      {
        question: "Is there a threshold below which no TDS is deducted?",
        answer:
          "Yes. No TDS is deducted while the aggregate of payments in a single category during the tax year is within ₹50,000 — professional and technical services are tested separately. Once the aggregate crosses ₹50,000, TDS applies to the full amount of the payment. Payments within the threshold are still your taxable income.",
      },
      {
        question: "Do all clients have to deduct TDS on fees over ₹50,000 a year?",
        answer:
          "Companies, firms and other non-individual payers must. An individual or HUF client deducts only if their business turnover exceeded ₹1 crore or their professional gross receipts exceeded ₹50 lakh in the previous tax year — and never for payments for purely personal purposes. Select the payer type that matches to see whether TDS is deducted in your case.",
      },
      {
        question: "Is TDS calculated on the GST-inclusive amount?",
        answer:
          "No. When GST is shown separately on the invoice, TDS under Section 194J applies to the fee excluding GST. Enter the pre-GST fee amount.",
      },
      {
        question: "Which section governs my fees now that the Income-tax Act 2025 is in force?",
        answer:
          "From 1 April 2026, old Section 194J of the 1961 Act is renumbered as Section 393(1), Table Sl. No. 6(iii). Rates, the ₹50,000 threshold and the PAN rules are unchanged, and no TDS is required on payments to residents below the threshold. This calculator models the rules for Tax Year 2026-27 (AY 2027-28).",
      },
      {
        question: "What happens to the TDS my client deducts?",
        answer:
          "Your client deposits it with the Income Tax Department, it appears against your PAN, and you claim it against your tax while filing your return — your tax return (ITR) follows the same calculation as the advance-tax calculator on this site, where TDS credited is subtracted from your total liability.",
      },
    ],
    related: ["tds-calculator", "advance-tax-calculator", "income-tax-calculator", "gst-calculator", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "compound-interest-calculator",
    category: "finance-calculators",
    name: "Compound Interest Calculator",
    tagline: "See how money grows when interest earns interest.",
    seoDescription:
      "Free compound interest calculator. Enter principal, rate, time and compounding frequency to see the maturity amount and total interest earned instantly.",
    seoTitle: "Free Compound Interest Calculator: Maturity & Interest",
    keywords: [
      "compound interest calculator",
      "compound interest formula",
      "monthly compound interest calculator",
      "quarterly compounding calculator",
      "CI calculator",
      "compound interest calculator India",
      "interest on interest calculator",
      "how to calculate compound interest",
    ],
    directAnswer:
      "A compound interest calculator that shows how much a principal grows when interest earns interest, for any rate, period and compounding frequency (yearly, half-yearly, quarterly or monthly).",
    formula:
      "A = P × (1 + r/m)^(m×t), where P is the principal, r the annual rate (÷ 100), m the compounding periods per year and t the time in years.",
    example:
      "Example: ₹1,00,000 at 8% for 10 years → ₹2,15,892.50 (interest ₹1,15,892.50) compounded yearly, but ₹2,21,964.02 (interest ₹1,21,964.02) compounded monthly.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "principal", label: "Principal amount", type: "number", placeholder: "100000", min: 0, unit: "₹" },
      { name: "annualRate", label: "Interest rate (per year)", type: "number", placeholder: "8", min: 0, max: 50, step: 0.1, unit: "%" },
      { name: "years", label: "Time period", type: "number", placeholder: "10", min: 0.25, max: 50, step: 0.25, unit: "years" },
      {
        name: "frequency",
        label: "Compounding frequency",
        type: "select",
        defaultValue: "yearly",
        options: [
          { value: "yearly", label: "Yearly" },
          { value: "half-yearly", label: "Half-yearly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "monthly", label: "Monthly" },
        ],
      },
    ],
    compute: computeCompoundInterest,
    autoCompute: true,
    about: [
      "Compound interest is interest calculated on both your original principal and the interest already earned — the mechanism behind nearly all long-term wealth building, from fixed deposits to equity returns. Where simple interest grows your money in a straight line, compounding curves upward: the growth itself starts growing. This calculator shows the effect precisely for any principal, rate, period and compounding frequency.",
      "The formula is A = P × (1 + r/m)^(m×t), where P is the principal, r the annual rate, m the number of compounding periods per year and t the time in years. Frequency matters: ₹1 lakh at 8% for 10 years becomes ₹2.16 lakh compounded yearly, but ₹2.22 lakh compounded monthly. The more often interest is credited, the earlier it starts earning its own interest.",
      "Two practical uses. First, comparing products: banks quote nominal rates with different compounding — converting them to maturity values makes offers directly comparable. Second, appreciating time: at 8%, money doubles roughly every 9 years (the rule of 72 — divide 72 by the rate). Starting ten years earlier doesn't add a little, it roughly doubles the outcome. Play with the time field and watch how disproportionately the final amount responds — that's the argument for starting to invest now rather than at a 'better' time.",
    ],
    faq: [

      {
        question: "What's the difference between simple and compound interest?",
        answer:
          "Simple interest is charged only on the original principal every period. Compound interest is charged on principal plus accumulated interest, so the amount grows faster — dramatically so over long periods.",
      },
      {
        question: "What is the rule of 72?",
        answer:
          "A mental shortcut: divide 72 by the annual rate to estimate how many years money takes to double. At 8%, roughly 9 years; at 12%, roughly 6 years.",
      },
      {
        question: "Does compounding frequency really matter?",
        answer:
          "Yes, though moderately. More frequent compounding gives a higher effective yield for the same nominal rate — 8% compounded monthly is an effective 8.30% a year. Always compare effective yields, not headline rates.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["simple-interest-calculator", "fd-calculator", "sip-calculator", "roi-calculator"],
  },
  {
    kind: "calculator",
    slug: "simple-interest-calculator",
    category: "finance-calculators",
    name: "Simple Interest Calculator",
    tagline: "Calculate interest charged only on the principal — the SI = P×R×T formula.",
    seoDescription:
      "Free simple interest calculator. Enter principal, annual rate and time to get the interest and total amount using the SI = P × R × T ÷ 100 formula.",
    seoTitle: "Free Simple Interest Calculator: SI = P × R × T ÷ 100",
    keywords: [
      "simple interest calculator",
      "simple interest formula",
      "SI calculator",
      "simple interest on loan",
      "interest calculator",
      "simple interest vs compound interest",
      "how to calculate simple interest",
    ],
    directAnswer:
      "A simple interest calculator that computes interest charged only on the principal (no compounding) and the total amount repayable, using the SI = P × R × T ÷ 100 formula.",
    formula:
      "SI = P × R × T ÷ 100, where P is the principal, R the annual rate in percent and T the time in years. Total amount = P + SI.",
    example:
      "Example: ₹50,000 at 10% per year for 3 years → SI = 50,000 × 10 × 3 ÷ 100 = ₹15,000; total amount repayable ₹65,000.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "principal", label: "Principal amount", type: "number", placeholder: "50000", min: 0, unit: "₹" },
      { name: "annualRate", label: "Interest rate (per year)", type: "number", placeholder: "10", min: 0, max: 60, step: 0.1, unit: "%" },
      { name: "years", label: "Time period", type: "number", placeholder: "3", min: 0.1, max: 50, step: 0.1, unit: "years" },
    ],
    compute: computeSimpleInterest,
    autoCompute: true,
    about: [
      "Simple interest is the most basic way to price the use of money: a fixed percentage of the principal, per year, for the time the money is used — interest never earns interest. The formula everyone learns in school, SI = P × R × T ÷ 100, is still how a lot of real-world lending works: informal and personal loans, gold loans at many lenders, invoice late-payment interest, security deposits, court-awarded interest and short-term business borrowing are all commonly quoted on simple interest.",
      "Enter the principal, the annual rate and the period (fractions of a year work — 18 months is 1.5 years) and you get the interest plus the total repayable. Because there's no compounding, the relationship is perfectly linear: double the time or the rate and the interest exactly doubles. That linearity is what makes simple interest easy to reason about — and why lenders who compound instead can surprise borrowers who assumed otherwise.",
      "When you're offered a loan, always confirm whether the quoted rate is simple or compounded (and if compounded, how often). For the same headline rate, simple interest is always cheaper for the borrower. Compare the two side by side with our compound interest calculator: ₹1 lakh at 12% for 5 years costs ₹60,000 in simple interest but ₹76,234 compounded annually. On short tenures the gap is small; over years it becomes the difference between a fair deal and an expensive one.",
    ],
    faq: [

      {
        question: "What is the simple interest formula?",
        answer:
          "SI = P × R × T ÷ 100 — principal times the annual rate times the time in years. The total amount repayable is principal plus that interest.",
      },
      {
        question: "Where is simple interest used in practice?",
        answer:
          "Personal and informal lending, many gold loans, late-payment interest on invoices, security deposits, and court-awarded interest are typically simple interest. Bank FDs, credit cards and most formal loans compound instead.",
      },
      {
        question: "Can I calculate for months instead of years?",
        answer:
          "Yes — convert months to years (6 months = 0.5 years, 18 months = 1.5) and enter the fraction in the time field.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["compound-interest-calculator", "emi-calculator", "late-fee-calculator", "fd-calculator"],
  },
  {
    kind: "calculator",
    slug: "break-even-calculator",
    category: "finance-calculators",
    name: "Break-Even Point Calculator",
    tagline: "Find how many units you must sell before your business stops losing money.",
    seoDescription:
      "Free break-even calculator. Enter fixed costs, price per unit and variable cost to get break-even units, revenue and contribution margin instantly.",
    seoTitle: "Free Break-Even Calculator: Units, Revenue & Margin",
    keywords: [
      "break-even calculator",
      "break-even point calculator",
      "break-even analysis",
      "break-even formula",
      "break-even units",
      "contribution margin calculator",
      "BEP calculator",
      "how many units to break even",
    ],
    directAnswer:
      "A break-even calculator that finds how many units you must sell before total revenue covers total costs — break-even units, break-even revenue and contribution margin ratio in one go.",
    formula:
      "Break-even units = fixed costs ÷ (selling price − variable cost per unit). Break-even revenue = break-even units × selling price. Contribution margin per unit = selling price − variable cost; ratio = contribution ÷ price.",
    example:
      "Example: ₹2,00,000 fixed costs, ₹500 selling price and ₹300 variable cost per unit → contribution ₹200/unit → 1,000 units (₹5,00,000 revenue) to break even, with a 40% contribution margin ratio.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "fixedCosts", label: "Total fixed costs (per period)", type: "number", placeholder: "200000", min: 0, unit: "₹" },
      { name: "pricePerUnit", label: "Selling price per unit", type: "number", placeholder: "500", min: 0, unit: "₹" },
      { name: "variableCostPerUnit", label: "Variable cost per unit", type: "number", placeholder: "300", min: 0, unit: "₹" },
    ],
    compute: computeBreakEven,
    autoCompute: true,
    about: [
      "The break-even point is where total revenue equals total cost — sell fewer units and you lose money, sell more and every additional unit contributes pure profit toward your fixed costs and beyond. Knowing this number changes how you price, how much you dare spend on rent and salaries, and whether a product idea is viable at all.",
      "The mechanics: every unit you sell contributes its price minus its variable cost (materials, packaging, shipping, transaction fees) toward covering fixed costs (rent, salaries, software, insurance — costs that don't change with volume). Break-even units = fixed costs ÷ contribution per unit. If your studio's fixed costs are ₹2,00,000 a month and each unit sells for ₹500 with ₹300 of variable cost, you need 1,000 units a month just to stand still — the 1,001st unit is where profit begins.",
      "Use the calculator to stress-test decisions before making them: What if I raise the price by ₹50? What if a supplier increase pushes variable cost up 10%? What does hiring one more person (higher fixed costs) do to my required volume? The contribution-margin ratio shown alongside tells you what share of every rupee of sales is available to cover fixed costs — a quick health indicator to compare products against each other. If your variable cost is at or above your price, no volume will ever save you; the calculator will tell you that too.",
    ],
    faq: [

      {
        question: "What counts as a fixed cost vs a variable cost?",
        answer:
          "Fixed costs stay the same regardless of how much you sell — rent, salaries, insurance, software subscriptions. Variable costs scale with each unit — raw materials, packaging, delivery, payment-gateway fees. Semi-variable items (electricity, commissions) can be split between the two.",
      },
      {
        question: "What is contribution margin?",
        answer:
          "Selling price minus variable cost per unit — the amount each sale 'contributes' toward fixed costs and then profit. As a ratio of price, it lets you compare the profitability structure of different products.",
      },
      {
        question: "How can I lower my break-even point?",
        answer:
          "Three levers: raise the price (if the market allows), cut variable cost per unit (better sourcing, packaging), or cut fixed costs (cheaper premises, leaner payroll). Small changes in contribution per unit often move the break-even volume dramatically.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["margin-calculator", "markup-calculator", "working-capital-calculator", "roi-calculator", "profit-margin-markup-calculator"],
  },
  {
    kind: "calculator",
    slug: "margin-calculator",
    category: "finance-calculators",
    name: "Profit Margin Calculator",
    tagline: "Calculate your gross profit and margin percentage from cost and revenue.",
    seoDescription:
      "Free profit margin calculator. Enter cost and revenue to get gross profit, profit margin percentage and equivalent markup — know what you really earn per sale.",
    seoTitle: "Free Profit Margin Calculator: Gross Profit & Margin %",
    keywords: [
      "profit margin calculator",
      "margin calculator",
      "gross margin calculator",
      "gross profit calculator",
      "profit percentage calculator",
      "margin formula",
      "margin vs markup",
      "how to calculate profit margin",
    ],
    directAnswer:
      "A profit margin calculator that turns cost and revenue into gross profit, the margin percentage on the selling price, and the equivalent markup on cost.",
    formula:
      "Profit = revenue − cost. Margin % = profit ÷ revenue × 100. Markup % = profit ÷ cost × 100.",
    example:
      "Example: cost ₹700, revenue ₹1,000 → profit ₹300, profit margin 30%, equivalent markup 42.86%.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "cost", label: "Cost", type: "number", placeholder: "700", min: 0, unit: "₹" },
      { name: "revenue", label: "Revenue (selling price)", type: "number", placeholder: "1000", min: 0, unit: "₹" },
    ],
    compute: computeMargin,
    autoCompute: true,
    about: [
      "Profit margin answers the most basic business question: of every rupee a customer pays you, how much do you keep? Margin = (revenue − cost) ÷ revenue. Sell for ₹1,000 what costs you ₹700 and your margin is 30% — thirty paise of every rupee of sales is gross profit, available to pay overheads and leave a net profit.",
      "Margin is routinely confused with markup, and the confusion costs money. Markup measures profit against cost: the same ₹300 profit on a ₹700 cost is a 42.9% markup but only a 30% margin. A shopkeeper who wants a '30% margin' and adds 30% to cost actually ends up with a 23% margin. This calculator shows both figures side by side so the distinction is always visible; if you think in markup terms, use the dedicated markup calculator, which works from cost and price.",
      "Track margin at two levels: per product, to decide what to promote, reprice or drop; and blended across the business, to watch the trend — a slowly eroding margin usually means input costs are creeping up faster than your prices. Typical gross margins vary hugely by industry: grocery retail runs on 15–25%, apparel 40–60%, restaurants 60–70% on food (before heavy fixed costs), and software much higher. Compare yourself with your industry, not with a universal number.",
    ],
    faq: [

      {
        question: "What is the difference between margin and markup?",
        answer:
          "Margin is profit as a share of the selling price; markup is profit as a share of cost. A ₹300 profit on a ₹700 cost sold at ₹1,000 is a 30% margin but a 42.9% markup. Using one when you mean the other systematically underprices your goods.",
      },
      {
        question: "What is a good profit margin?",
        answer:
          "It depends entirely on the industry: 15–25% gross margin is normal in grocery retail, 40–60% in apparel, 60%+ in services and software. What matters most is your trend and how you compare with direct competitors.",
      },
      {
        question: "Is this gross or net margin?",
        answer:
          "Gross — it considers only the direct cost of the goods sold. Net margin also subtracts overheads like rent, salaries and marketing from the profit before dividing by revenue.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["markup-calculator", "break-even-calculator", "gst-calculator", "discount-calculator", "profit-margin-markup-calculator"],
  },
  {
    kind: "calculator",
    slug: "markup-calculator",
    category: "finance-calculators",
    name: "Markup Calculator",
    tagline: "Work out your markup percentage on cost — and the margin it translates to.",
    seoDescription:
      "Free markup calculator. Enter cost price and selling price to get markup percentage on cost, profit per unit and the equivalent profit margin.",
    seoTitle: "Free Markup Calculator: Markup % on Cost & Margin",
    keywords: [
      "markup calculator",
      "markup percentage calculator",
      "markup on cost",
      "markup formula",
      "markup to margin calculator",
      "markup vs margin",
      "how to calculate markup",
    ],
    directAnswer:
      "A markup calculator that works out the percentage you add to cost to reach a selling price, plus the equivalent profit margin — you buy at a cost, mark up, and see both perspectives on the same profit.",
    formula:
      "Markup % = (selling price − cost) ÷ cost × 100. Equivalent margin % = (selling price − cost) ÷ selling price × 100.",
    example:
      "Example: cost ₹700, selling price ₹1,000 → markup 42.86% on cost, profit ₹300 per unit, equivalent margin 30%.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "cost", label: "Cost price", type: "number", placeholder: "700", min: 0, unit: "₹" },
      { name: "sellingPrice", label: "Selling price", type: "number", placeholder: "1000", min: 0, unit: "₹" },
    ],
    compute: computeMarkup,
    autoCompute: true,
    about: [
      "Markup is the percentage you add to your cost to arrive at a selling price — the trader's everyday pricing arithmetic. Buy at ₹700, sell at ₹1,000, and your markup is (1,000 − 700) ÷ 700 = 42.9%. It's the natural way to price when you start from what things cost you: apply a standard markup across a product line and the prices set themselves.",
      "The number to keep separate in your head is margin, which divides the same profit by the selling price instead of the cost, and therefore always looks smaller: that 42.9% markup is a 30% margin. The two have fixed conversions — margin = markup ÷ (1 + markup), and markup = margin ÷ (1 − margin) — and this calculator always shows both so you can quote whichever your counterpart uses. Distributors and retailers often negotiate in margin; manufacturers and importers usually think in markup. Knowing both languages avoids leaving money on the table.",
      "Common practice: keystone pricing in retail is a 100% markup (doubling cost, a 50% margin); food service often marks up ingredients 200–300%; commodity trading may survive on single-digit markups with volume. Whatever your norm, sanity-check it against your fixed costs with the break-even calculator — a markup that looks healthy per unit can still be too thin if your volumes are low relative to rent and salaries.",
    ],
    faq: [

      {
        question: "How do I convert markup to margin?",
        answer:
          "Margin = markup ÷ (1 + markup). A 50% markup is a 33.3% margin; a 100% markup is a 50% margin. Going the other way, markup = margin ÷ (1 − margin).",
      },
      {
        question: "What is keystone pricing?",
        answer:
          "The retail convention of doubling the wholesale cost — a 100% markup, equal to a 50% gross margin. It's a starting point, not a rule; fast-moving or highly competitive items often carry less.",
      },
      {
        question: "Should I use markup or margin for pricing?",
        answer:
          "Use markup when you start from cost and want a price. Use margin when you start from a target share of revenue. They're two views of the same profit — this calculator shows both so nothing is lost in translation.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["margin-calculator", "break-even-calculator", "discount-calculator", "gst-calculator", "profit-margin-markup-calculator"],
  },
  {
    kind: "calculator",
    slug: "profit-margin-markup-calculator",
    category: "finance-calculators",
    name: "Profit Margin & Markup Calculator",
    tagline:
      "See your true profit on every sale after marketplace fees, shipping, packaging and other costs.",
    seoDescription:
      "Free seller profit calculator for Indian marketplace sellers. Enter price, cost, marketplace fee and shipping to get net profit, margin %, markup % and payout.",
    seoTitle: "Free Seller Profit Calculator: Margin, Markup & Fees",
    keywords: [
      "seller profit calculator",
      "marketplace profit calculator",
      "profit margin and markup calculator",
      "ecommerce profit calculator",
      "online seller margin calculator",
      "marketplace fee calculator",
      "net profit per order",
      "how much profit after marketplace fees",
    ],
    directAnswer:
      "A marketplace seller profit calculator that works backwards from the customer price to the rupees that actually land with you — net of product cost, marketplace fee, shipping, packaging and other costs — and reports both margin (on price) and markup (on cost).",
    formula:
      "Total cost = cost price + shipping + packaging + other costs + marketplace fee. Net profit = selling price − total cost. Margin % = net profit ÷ selling price × 100. Markup % = net profit ÷ cost price × 100. Amount after marketplace fee = selling price − fee.",
    example:
      "Example: sell at ₹1,000 a product costing ₹600, with ₹50 shipping, ₹10 packaging, ₹20 other costs and no marketplace fee → total cost ₹680, net profit ₹320, margin 32%, markup 53.33%.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "sellingPrice", label: "Selling price", type: "number", placeholder: "1000", min: 0, unit: "₹" },
      { name: "cost", label: "Cost price (product cost)", type: "number", placeholder: "600", min: 0, unit: "₹" },
      { name: "shippingCost", label: "Shipping cost", type: "number", placeholder: "50", min: 0, unit: "₹", optional: true, help: "What delivery of this one order costs you — including the loss you absorb on free shipping." },
      { name: "packagingCost", label: "Packaging cost", type: "number", placeholder: "10", min: 0, unit: "₹", optional: true, help: "Boxes, labels, tape, inserts, and prep — whatever packaging one unit actually costs." },
      { name: "additionalCost", label: "Additional costs", type: "number", placeholder: "20", min: 0, unit: "₹", optional: true, help: "Any other per-order cost — discounts, coupons, payment-gateway fees, photography per unit, etc." },
      {
        name: "marketplace",
        label: "Marketplace",
        type: "select",
        defaultValue: "custom",
        options: [
          { value: "custom", label: "Custom (no marketplace fee)" },
          { value: "amazon", label: "Amazon India" },
          { value: "flipkart", label: "Flipkart India" },
        ],
        help: "Select Custom to price without marketplace fees. With Amazon or Flipkart you must enter the fee you actually pay — no automatic rate is assumed.",
      },
      {
        name: "feeType",
        label: "Marketplace fee type",
        type: "select",
        defaultValue: "percent",
        options: [
          { value: "percent", label: "Percentage (%) of selling price" },
          { value: "fixed", label: "Fixed amount (₹) per order" },
        ],
        help: "Most marketplaces charge a percentage fee plus a fixed closing fee. Pick the component you want to model in the next field.",
      },
      {
        name: "feePercent",
        label: "Marketplace fee",
        type: "number",
        placeholder: "15",
        min: 0,
        unit: "%",
        visibleWhen: { field: "feeType", equals: "percent" },
        help: "Percentage of the selling price charged as the fee. Used only while the fee type is Percentage.",
      },
      {
        name: "feeFixed",
        label: "Marketplace fee",
        type: "number",
        placeholder: "25",
        min: 0,
        unit: "₹",
        visibleWhen: { field: "feeType", equals: "fixed" },
        help: "Fixed fee per order charged by the marketplace. Used only while the fee type is Fixed.",
      },
    ],
    compute: computeProfitMarginMarkup,
    autoCompute: true,
    about: [
      "Most sellers know their product cost but guess at what a sale actually earns them. The marketplace takes a commission, delivery eats into the price, packaging adds up — and the margin you think you're making on the selling price is not the margin you end up with. This calculator works backwards from the customer-facing price to the rupees that actually land with you: gross profit, the marketplace fee, total cost after shipping and packaging, net profit, and then the two numbers that pricing decisions really need — profit margin and markup.",
      "The two percentages differ because they use different denominators. Profit margin is net profit ÷ selling price: of every rupee the customer pays, how much do you keep. Markup is net profit ÷ cost price: how much you earn on top of what the product cost you. A ₹1,000 sale of a ₹600 product with a ₹150 marketplace fee leaves ₹250 net — a 25% margin on the selling price but a 41.67% markup on cost. Confusing the two is the classic pricing error: aiming for a '30% margin' while adding 30% to cost gives you only a 23% margin. Both figures are shown here, labelled with their denominator.",
      "Marketplace fees are the reason most Amazon India and Flipkart sellers under-price. Referral fees vary by category, and sellers also face closing fees, weight-based fulfilment charges, shipping subsidies, GST input cosupplies and coupon costs. Because these rates change and depend on your seller plan and fulfilment method, this calculator never assumes one — select Amazon or Flipkart and it asks for the fee you actually pay, and shows a disclaimer instead of a guess. If you're selling from your own store or comparing scenarios without a platform fee, choose Custom.",
      "Use it before every listing launch to set a bottom-line price, when a marketplace announces a fee change, and while deciding whether to absorb or pass on shipping. The 'amount after marketplace fee' is what the marketplace actually pays you per sale — compare that with your product cost and other costs to see the true per-unit profit. That figure is before fixed costs like rent, staff and subscriptions (the break-even calculator handles those) and before income tax. Every calculation runs in your browser; nothing you enter is stored.",
    ],
    faq: [
      {
        question: "What is the difference between profit margin and markup?",
        answer:
          "Profit margin is net profit divided by the selling price — the share of each sale you keep. Markup is net profit divided by the cost price — how much you earn on top of cost. On a ₹1,000 sale with a ₹600 cost and ₹150 fee, net profit is ₹250: a 25% margin but a 41.67% markup. Using one when you mean the other underprices or overprices your goods.",
      },
      {
        question: "Am I asked to enter the Amazon or Flipkart fee automatically?",
        answer:
          "No — deliberately. Marketplace fees vary by category, seller plan, fulfilment method, weight, and taxes, and they change over time. Baking a single rate in would mislead you. Select Amazon India or Flipkart India and enter the percentage or fixed fee you actually pay from your seller dashboard.",
      },
      {
        question: "What does 'amount after marketplace fee' mean?",
        answer:
          "It is the selling price minus the marketplace fee — the money the marketplace actually transfers to you per sale, before you subtract your product and other costs. Compare it with your total cost (product + shipping + packaging + other) to judge whether an order is worth taking.",
      },
      {
        question: "Is this my net profit after all expenses?",
        answer:
          "No. It is profit per unit after product cost, marketplace fee, shipping, packaging and the other costs you entered, but before fixed business costs (rent, salaries, subscriptions) and before income tax. Layer those on with the break-even calculator.",
      },
      {
        question: "Why does markup show '—' sometimes?",
        answer:
          "Markup divides net profit by cost price, so when your cost price is zero the calculation has no denominator — it shows '—' instead of an undefined value. Profit margin likewise shows '—' when the selling price is zero. The net-profit rupees are always shown.",
      },
    ],
    related: ["margin-calculator", "markup-calculator", "break-even-calculator", "gst-calculator"],
  },
  {
    kind: "calculator",
    slug: "roi-calculator",
    category: "finance-calculators",
    name: "ROI Calculator",
    tagline: "Measure total and annualized return on any investment.",
    seoDescription:
      "Free ROI calculator. Enter initial investment, final value and holding period to get total ROI, net gain and annualized return (CAGR) instantly.",
    seoTitle: "Free ROI Calculator: Total Return & Annualized CAGR",
    keywords: [
      "ROI calculator",
      "return on investment calculator",
      "ROI formula",
      "ROI percentage",
      "annualized return calculator",
      "CAGR calculator",
      "investment return calculator",
      "how to calculate ROI",
    ],
    directAnswer:
      "An ROI calculator that measures the total return on an investment, the rupee gain or loss, and the annualized return (CAGR) that makes investments with different holding periods comparable.",
    formula:
      "Total ROI % = (final value − initial investment) ÷ initial investment × 100. CAGR % = ((final ÷ initial) ^ (1/years)) − 1 × 100.",
    example:
      "Example: ₹1,00,000 invested becomes ₹1,80,000 in 5 years → total ROI 80%, net gain ₹80,000, annualized return (CAGR) 12.47%.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "initialInvestment", label: "Initial investment", type: "number", placeholder: "100000", min: 0, unit: "₹" },
      { name: "finalValue", label: "Final value", type: "number", placeholder: "180000", min: 0, unit: "₹" },
      { name: "years", label: "Holding period", type: "number", placeholder: "5", min: 0.1, max: 60, step: 0.1, unit: "years" },
    ],
    compute: computeRoi,
    autoCompute: true,
    about: [
      "Return on investment (ROI) is your gain or loss expressed as a percentage of what you put in: ROI = (final value − initial investment) ÷ initial investment × 100. It's the universal scorecard for any investment — this calculator gives you that total ROI, the absolute gain or loss in rupees, and the annualized return (CAGR), which is the figure that makes different investments comparable.",
      "Total ROI alone can mislead because it ignores time. An 80% total return sounds excellent — but over 10 years it's a modest 6.1% a year, less than many fixed deposits, while over 3 years it's an outstanding 21.6% annually. CAGR = (final ÷ initial)^(1/years) − 1 smooths the entire journey into a single steady annual rate, which you can then hold against benchmarks: recent FD rates around 7%, long-run index returns of 11–12%, or inflation at 5–6%. Any investment whose CAGR trails inflation lost purchasing power, whatever the rupee gain says.",
      "Use it for more than stocks: property (include purchase costs and improvements in the initial amount), gold, a business you invested in, a course that raised your salary, or marketing spend against the revenue it produced. For honest numbers, add incidental costs — brokerage, stamp duty, taxes on exit — to the initial investment or subtract them from the final value. The calculator handles losses too: a final value below the initial simply shows a negative ROI.",
    ],
    faq: [

      {
        question: "What is the difference between ROI and CAGR?",
        answer:
          "ROI is the total percentage gain over the whole holding period; CAGR is the equivalent steady annual growth rate. ROI tells you how much; CAGR tells you how fast — and only CAGR is comparable across investments held for different periods.",
      },
      {
        question: "What is a good CAGR?",
        answer:
          "Context decides: Indian large-cap equity has historically delivered 11–12% over long periods, fixed deposits recently 6–7.5%, and inflation runs 5–6%. Beating inflation is the minimum bar; beating the index consistently is genuinely hard.",
      },
      {
        question: "Should I include costs and taxes in ROI?",
        answer:
          "Yes, for real-world accuracy: add purchase costs (brokerage, stamp duty, registration) to the initial investment and subtract exit costs and taxes from the final value. The pre-cost figure flatters every investment.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["sip-calculator", "compound-interest-calculator", "fd-calculator", "roas-calculator"],
  },
  {
    kind: "calculator",
    slug: "depreciation-calculator",
    category: "finance-calculators",
    name: "Depreciation Calculator",
    tagline: "Straight-line and written-down-value depreciation with year-wise book values.",
    seoDescription:
      "Free depreciation calculator with straight-line and WDV (reducing balance) methods. Get annual depreciation and year-wise book value for any business asset.",
    seoTitle: "Free Depreciation Calculator: SLM & WDV Methods",
    keywords: [
      "depreciation calculator",
      "straight line depreciation calculator",
      "WDV depreciation calculator",
      "written down value method",
      "SLM depreciation",
      "reducing balance depreciation",
      "depreciation schedule",
      "book value calculator",
      "how to calculate depreciation",
    ],
    directAnswer:
      "A depreciation calculator that spreads an asset's cost over its useful life using either straight-line (SLM) or written-down value (WDV) method, with the year-wise book value for each year.",
    formula:
      "SLM: annual depreciation = (asset cost − salvage value) ÷ useful life. WDV: depreciation = current book value × WDV rate, applied to the reducing balance each year.",
    example:
      "Example: ₹5,00,000 asset, ₹50,000 salvage, 5-year life → SLM charges ₹90,000 each year (book value ₹4,10,000 after year 1). WDV at 25% on the same asset charges ₹1,25,000 in year 1, and the book value falls to ₹2,10,937.50 by year 3.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "assetCost", label: "Asset cost", type: "number", placeholder: "500000", min: 0, unit: "₹" },
      { name: "salvageValue", label: "Salvage value at end of life", type: "number", placeholder: "50000", min: 0, unit: "₹", defaultValue: 0 },
      { name: "usefulLife", label: "Useful life", type: "number", placeholder: "5", min: 1, max: 40, unit: "years" },
      {
        name: "method",
        label: "Method",
        type: "select",
        defaultValue: "straight-line",
        options: [
          { value: "straight-line", label: "Straight-line (SLM)" },
          { value: "wdv", label: "Written-down value (WDV / reducing balance)" },
        ],
      },
      { name: "wdvRate", label: "WDV rate (only for WDV method)", type: "number", placeholder: "25", min: 0, max: 99, step: 0.5, unit: "%", optional: true },
    ],
    compute: computeDepreciation,
    autoCompute: true,
    about: [
      "Depreciation spreads the cost of a long-lived asset — machinery, vehicles, computers, furniture — over the years it's used, so each year's accounts carry a fair share of the expense instead of one distorted year. It matters twice: in your books (profit is overstated if you ignore it) and in your tax return (depreciation is a deductible expense, and the Income Tax Act prescribes WDV rates for most asset blocks).",
      "This calculator covers the two standard methods. Straight-line (SLM) charges the same amount every year: (cost − salvage value) ÷ useful life. A ₹5,00,000 machine with ₹50,000 salvage value and a 5-year life costs ₹90,000 a year. Companies commonly use SLM for books under Schedule II useful lives. Written-down value (WDV) charges a fixed percentage of the asset's remaining book value, so the expense is front-loaded — a 25% WDV on ₹5,00,000 takes ₹1,25,000 in year 1 but only ₹70,312 in year 3. Income-tax depreciation in India is WDV for most assets: commonly 15% for plant and machinery, 40% for computers, 10% for furniture and 30–45% for vehicles depending on use — check the current rate for your block.",
      "Choose the method the context requires: your accountant may keep SLM books and a WDV tax computation for the same asset. The WDV view here lists the book value at the end of each year of the asset's life so you can see the declining balance at a glance.",
    ],
    faq: [

      {
        question: "Which method does Indian income tax use?",
        answer:
          "WDV (reducing balance) on blocks of assets, at prescribed rates — commonly 15% for plant & machinery, 40% for computers and software, 10% for furniture. SLM is permitted only for certain power-sector undertakings.",
      },
      {
        question: "What is salvage (residual) value?",
        answer:
          "The amount you expect to recover when the asset is disposed of at the end of its useful life. Companies Act guidance generally caps it at 5% of cost for Schedule II calculations; it's often taken as zero for low-value assets.",
      },
      {
        question: "SLM or WDV — which is better?",
        answer:
          "Neither is universally better. SLM gives smooth, predictable book expenses; WDV front-loads the deduction, which matches the faster early loss of value in most equipment and gives earlier tax relief. Tax law usually decides for you: WDV in India.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["working-capital-calculator", "roi-calculator", "break-even-calculator", "income-tax-calculator"],
  },
  {
    kind: "calculator",
    slug: "working-capital-calculator",
    category: "finance-calculators",
    name: "Working Capital Calculator",
    tagline: "Check your business's short-term financial health: net working capital and current ratio.",
    seoDescription:
      "Free working capital calculator. Enter current assets and current liabilities to get net working capital and current ratio — a quick liquidity check.",
    seoTitle: "Free Working Capital Calculator & Current Ratio",
    keywords: [
      "working capital calculator",
      "net working capital calculator",
      "current ratio calculator",
      "working capital formula",
      "liquidity ratio calculator",
      "current assets minus current liabilities",
      "how to calculate working capital",
    ],
    directAnswer:
      "A working capital calculator that measures a business's short-term liquidity: net working capital (current assets minus current liabilities) and the current ratio.",
    formula:
      "Net working capital = current assets − current liabilities. Current ratio = current assets ÷ current liabilities.",
    example:
      "Example: ₹12,00,000 current assets and ₹8,00,000 current liabilities → net working capital ₹4,00,000 and a current ratio of 1.5 — in the conventionally healthy 1.5–2 range.",
    steps: [
      "Enter your basic details in the fields provided.",
      "Select the appropriate options from the dropdowns.",
      "View your precise calculation results instantly."
    ],
    fields: [
      { name: "currentAssets", label: "Current assets", type: "number", placeholder: "1200000", min: 0, unit: "₹", help: "Cash, bank balances, receivables, inventory, other assets convertible within a year" },
      { name: "currentLiabilities", label: "Current liabilities", type: "number", placeholder: "800000", min: 0, unit: "₹", help: "Payables, short-term loans, taxes due, other obligations payable within a year" },
    ],
    compute: computeWorkingCapital,
    autoCompute: true,
    about: [
      "Working capital is the money a business has available to run its day-to-day operations: net working capital = current assets − current liabilities. Current assets are what you own that converts to cash within a year (cash itself, customer receivables, inventory); current liabilities are what you must pay within a year (supplier dues, short-term borrowings, taxes payable). Positive working capital means you can pay what's coming due; negative means a cash crunch is scheduled unless something changes.",
      "The companion figure is the current ratio — current assets ÷ current liabilities. A ratio around 1.5 to 2 is conventionally healthy for most trading and manufacturing businesses: enough cushion to absorb late-paying customers or slow-moving stock without missing supplier payments. Below 1, obligations exceed near-term resources; far above 2 can actually signal inefficiency — cash sitting idle or inventory piling up instead of working.",
      "Profitable companies fail on working capital surprisingly often: sales grow, but the cash is trapped in receivables and stock while salaries and suppliers must be paid now. Watch the trend monthly, not just the level. The practical levers are collecting receivables faster (shorter credit periods, payment reminders — see the payment reminder generator), negotiating longer supplier terms, and right-sizing inventory. Banks assess exactly these numbers when pricing working-capital loans and cash-credit limits, so knowing yours before the meeting puts you ahead.",
    ],
    faq: [

      {
        question: "What counts as current assets and current liabilities?",
        answer:
          "Current assets: cash and bank balances, accounts receivable, inventory, short-term investments and prepaid expenses — anything expected to convert to cash within 12 months. Current liabilities: accounts payable, short-term loans and overdrafts, taxes payable, and the portion of long-term debt due within the year.",
      },
      {
        question: "What is a good current ratio?",
        answer:
          "Roughly 1.5–2 for most businesses. Below 1 signals liquidity stress; well above 2 may mean idle cash or bloated inventory. Norms vary by industry — fast-turnover retailers run leaner than manufacturers.",
      },
      {
        question: "Can a profitable business have negative working capital?",
        answer:
          "Yes — profit is an accounting result, cash is a timing reality. If customers pay in 90 days but suppliers demand 30, growth itself consumes cash. Some models (supermarkets, subscriptions) deliberately run negative working capital because customers pay upfront.",
      },
      {
        question: "Is my financial data secure?",
        answer: "Absolutely. All calculations happen entirely in your browser and none of your inputs are saved or sent to any server.",
      },
      {
        question: "Can I use this for official tax filing?",
        answer: "While highly accurate for planning and estimation, always consult your CA or tax professional for final official filings.",
      },
    ],
    related: ["break-even-calculator", "margin-calculator", "invoice-due-date-calculator", "payment-reminder-generator"],
  },
  {
    kind: "calculator",
    slug: "percentage-calculator",
    category: "finance-calculators",
    name: "Percentage Calculator",
    tagline: "Find X% of Y, what percent X is of Y, or the percentage change between two numbers.",
    seoDescription:
      "Free percentage calculator. Find X% of Y, work out what percent one number is of another, or calculate the percentage increase or decrease between two values.",
    seoTitle: "Free Percentage Calculator: % Of, Increase & Decrease",
    keywords: [
      "percentage calculator",
      "percent calculator",
      "percentage increase calculator",
      "percentage decrease calculator",
      "percentage change calculator",
      "X% of Y",
      "what percent of a number",
      "percentage formula",
      "how to calculate percentage",
    ],
    directAnswer:
      "A percentage calculator answers the three everyday percentage questions: what X% of Y is, what percent X is of Y, and the percentage increase or decrease from X to Y (with the difference), updating as you type.",
    fields: [
      {
        name: "mode",
        label: "What do you want to work out?",
        type: "select",
        defaultValue: "of",
        options: [
          { value: "of", label: "X% of Y" },
          { value: "isWhatPercent", label: "X is what % of Y" },
          { value: "change", label: "Percentage change from X to Y" },
        ],
      },
      { name: "x", label: "X", type: "number", placeholder: "20" },
      { name: "y", label: "Y", type: "number", placeholder: "500" },
    ],
    compute: computePercentage,
    autoCompute: true,
    about: [
      "X% of Y = (X ÷ 100) × Y. That single formula answers the most common percentage question there is — what is 20% of 500? — and this calculator solves it instantly, along with the two other percentage questions people actually search for: what percent one number is of another, and how much a value has increased or decreased in percentage terms.",
      "The three calculations use different arithmetic, so mixing them up is the usual source of error. \"X% of Y\" multiplies. \"X is what percent of Y\" divides X by Y and multiplies by 100 — useful for things like \"I scored 42 out of 50, what percent is that?\". \"Percentage change from X to Y\" takes (Y − X) ÷ X × 100 — the formula behind every price-increase, discount and salary-hike calculation, and the one people most often get backwards by dividing by the wrong number.",
      "Pick the calculation you need from the dropdown, enter your two numbers, and the result updates immediately. For GST-specific percentage math (adding or removing tax from an amount), use the GST Calculator instead — it applies the same core arithmetic but with the CGST/SGST/IGST split built in.",
    ],
    faq: [
      {
        question: "How do I calculate X% of Y?",
        answer: "Divide X by 100 and multiply by Y: X% of Y = (X ÷ 100) × Y. For example, 20% of 500 = (20 ÷ 100) × 500 = 100.",
      },
      {
        question: "How do I find what percentage one number is of another?",
        answer: "Divide the part by the whole and multiply by 100: (part ÷ whole) × 100. For example, 42 out of 50 is (42 ÷ 50) × 100 = 84%.",
      },
      {
        question: "Why did I get a negative result for percentage change?",
        answer:
          "A negative percentage change means Y is smaller than X — a decrease. This calculator shows the direction (increase or decrease) explicitly alongside the magnitude, so a negative sign is never the only signal.",
      },
      {
        question: "What's the difference between percentage change and percentage points?",
        answer:
          "Percentage change is relative (a rate moving from 10% to 15% is a 50% increase, since 5 ÷ 10 × 100 = 50). Percentage points is the raw difference (that same move is \"5 percentage points\"). This calculator computes percentage change, not percentage points.",
      },
    ],
    related: ["gst-calculator", "margin-calculator", "markup-calculator", "compound-interest-calculator"],
  },
];
