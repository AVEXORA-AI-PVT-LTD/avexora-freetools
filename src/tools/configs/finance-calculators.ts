import type { ToolConfig } from "../types";
import { computeGst } from "../compute/finance/gst";
import { computeEmi } from "../compute/finance/emi";
import { computeSip } from "../compute/finance/sip";
import { computeFd } from "../compute/finance/fd";
import { computeRd } from "../compute/finance/rd";
import { computeIncomeTax } from "../compute/finance/income-tax";
import { computeTds } from "../compute/finance/tds";
import { computeCompoundInterest } from "../compute/finance/compound-interest";
import { computeSimpleInterest } from "../compute/finance/simple-interest";
import { computeBreakEven } from "../compute/finance/break-even";
import { computeMargin } from "../compute/finance/margin";
import { computeMarkup } from "../compute/finance/markup";
import { computeRoi } from "../compute/finance/roi";
import { computeDepreciation } from "../compute/finance/depreciation";
import { computeWorkingCapital } from "../compute/finance/working-capital";

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
      "Use it before raising invoices to double-check the tax line, when verifying supplier bills against the rate their goods should carry, while preparing quotes so you can show customers a clean with-tax and without-tax price, or when estimating your GST liability for the month. Every calculation runs instantly in your browser and nothing you enter is stored.",
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
      "Free RD calculator. Enter your monthly deposit, interest rate and tenure to see the recurring deposit maturity amount and interest, using the standard bank formula.",
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
      "India gives taxpayers a choice every year: the new regime, with lower slab rates but almost no deductions, or the old regime, with higher rates but the full menu of deductions (80C, 80D, HRA, home-loan interest). For most salaried people since the 2025 Budget, the new regime wins — its ₹12 lakh rebate threshold means no tax at all up to ₹12.75 lakh of salary income — but the only way to know for your numbers is to compute both. This calculator does exactly that.",
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
    ],
    related: ["tds-calculator", "salary-calculator", "hra-exemption-calculator", "gst-calculator"],
  },
  {
    kind: "calculator",
    slug: "tds-calculator",
    category: "finance-calculators",
    name: "TDS Calculator",
    tagline: "Work out TDS to deduct on contractor, professional, rent, commission and interest payments.",
    seoDescription:
      "Free TDS calculator for sections 194C, 194J, 194I, 194H and 194A. Enter the payment amount and section to get the TDS to deduct and net amount payable.",
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
      "Remember two general rules: if the payee doesn't give you a PAN, TDS jumps to 20% under section 206AA, and TDS is deducted on the amount excluding GST when the GST is shown separately in the invoice. This calculator assumes a valid PAN and applies the rate to the amount you enter.",
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
    ],
    related: ["gst-calculator", "income-tax-calculator", "salary-calculator", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "compound-interest-calculator",
    category: "finance-calculators",
    name: "Compound Interest Calculator",
    tagline: "See how money grows when interest earns interest.",
    seoDescription:
      "Free compound interest calculator. Enter principal, rate, time and compounding frequency to see the maturity amount and total interest earned instantly.",
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
    ],
    related: ["margin-calculator", "markup-calculator", "working-capital-calculator", "roi-calculator"],
  },
  {
    kind: "calculator",
    slug: "margin-calculator",
    category: "finance-calculators",
    name: "Profit Margin Calculator",
    tagline: "Calculate your gross profit and margin percentage from cost and revenue.",
    seoDescription:
      "Free profit margin calculator. Enter cost and revenue to get gross profit, profit margin percentage and equivalent markup — know what you really earn per sale.",
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
    ],
    related: ["markup-calculator", "break-even-calculator", "gst-calculator", "discount-calculator"],
  },
  {
    kind: "calculator",
    slug: "markup-calculator",
    category: "finance-calculators",
    name: "Markup Calculator",
    tagline: "Work out your markup percentage on cost — and the margin it translates to.",
    seoDescription:
      "Free markup calculator. Enter cost price and selling price to get markup percentage on cost, profit per unit and the equivalent profit margin.",
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
    ],
    related: ["margin-calculator", "break-even-calculator", "discount-calculator", "gst-calculator"],
  },
  {
    kind: "calculator",
    slug: "roi-calculator",
    category: "finance-calculators",
    name: "ROI Calculator",
    tagline: "Measure total and annualized return on any investment.",
    seoDescription:
      "Free ROI calculator. Enter initial investment, final value and holding period to get total ROI, net gain and annualized return (CAGR) instantly.",
    fields: [
      { name: "initialInvestment", label: "Initial investment", type: "number", placeholder: "100000", min: 0, unit: "₹" },
      { name: "finalValue", label: "Final value", type: "number", placeholder: "180000", min: 0, unit: "₹" },
      { name: "years", label: "Holding period", type: "number", placeholder: "5", min: 0.1, max: 60, step: 0.1, unit: "years" },
    ],
    compute: computeRoi,
    autoCompute: true,
    about: [
      "Return on investment is the universal scorecard: what did I put in, what did I get back, and what does that work out to per year? This calculator gives you all three — total ROI as a percentage of the initial amount, the absolute gain or loss in rupees, and the annualized return (CAGR), which is the figure that makes different investments comparable.",
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
      "Free working capital calculator. Enter current assets and current liabilities to get net working capital and current ratio — your short-term liquidity health check.",
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
    ],
    related: ["break-even-calculator", "margin-calculator", "invoice-due-date-calculator", "payment-reminder-generator"],
  },
];
