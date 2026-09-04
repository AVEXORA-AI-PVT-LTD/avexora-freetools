import type { ToolConfig } from "../../types/tools";
import { computeSalary } from "../compute/hr/salary";
import { computeGratuity } from "../compute/hr/gratuity";
import { computePf } from "../compute/hr/pf";
import { computeHra } from "../compute/hr/hra";
import { computeLeaveEncashment } from "../compute/hr/leave-encashment";
import { computeBonus } from "../compute/hr/bonus";
import { computeOvertime } from "../compute/hr/overtime";
import { computeNoticePeriodRecovery } from "../compute/hr/notice-period-recovery";
import { generatePayslip } from "../compute/hr/payslip";
import { generateOfferLetter } from "../compute/hr/offer-letter";
import { generateAppointmentLetter } from "../compute/hr/appointment-letter";
import { generateExperienceLetter } from "../compute/hr/experience-letter";

export const tools: ToolConfig[] = [
  {
    kind: "calculator",
    slug: "salary-calculator",
    category: "hr-payroll",
    name: "In-Hand Salary Calculator",
    tagline: "See your monthly take-home pay from your annual CTC.",
    seoDescription:
      "Free in-hand salary calculator. Enter your annual CTC to get monthly take-home pay, PF deduction and income tax under the new regime (FY 2025-26).",
    fields: [
      { name: "annualCtc", label: "Annual CTC", type: "number", placeholder: "1200000", min: 0, unit: "₹" },
      { name: "basicPercent", label: "Basic salary (% of CTC)", type: "number", defaultValue: 40, min: 1, max: 100, unit: "%" },
      { name: "professionalTax", label: "Monthly professional tax", type: "number", defaultValue: 200, min: 0, unit: "₹" },
      { name: "employerPfInCtc", label: "Employer's PF contribution is included in CTC", type: "checkbox", defaultValue: true },
    ],
    compute: computeSalary,
    autoCompute: true,
    about: [
      "The CTC on your offer letter is never the number that lands in your bank account, and the gap between the two catches almost everyone by surprise on their first payslip. Cost-to-company bundles in the employer's PF contribution, insurance and other benefits that you never actually see as cash; from what's left, your own PF contribution, professional tax and income tax are deducted before the rest reaches you monthly. This calculator walks that whole chain for you.",
      "The estimate uses common defaults you can adjust: basic salary at 40% of CTC (a widely used structuring norm), employee and employer PF each at 12% of basic, and income tax computed under the new regime for FY 2025-26 — nil up to ₹4 lakh, rising through 5/10/15/20/25% slabs to 30% above ₹24 lakh, with the §87A rebate zeroing out tax for taxable income up to ₹12 lakh and a ₹75,000 standard deduction applied automatically. Real payslips vary — some companies use a different basic percentage, add HRA and special allowance lines, or offer the old tax regime — so treat this as a close, well-reasoned estimate rather than a payroll-exact figure.",
      "Use it while negotiating an offer to translate a CTC number into what you'll actually bank each month, or to sanity-check your own payslip against the standard structure. If your real basic percentage or professional tax differs, adjust the fields — the effect on your in-hand pay is immediate and visible.",
    ],
    faq: [
      {
        question: "Why is my in-hand salary so much lower than my CTC divided by 12?",
        answer:
          "CTC includes the employer's PF contribution and other benefits you don't receive as cash, plus your own PF, professional tax and income tax are deducted from what remains. All of that combined typically leaves 70-85% of CTC as annual take-home, depending on your tax slab.",
      },
      {
        question: "Why does the calculator assume 40% basic salary?",
        answer:
          "It's a common structuring convention, but your company's actual split may differ — some use 35-50%. Adjust the basic percentage field to match your real payslip for a more accurate estimate.",
      },
      {
        question: "Does this account for HRA or other exemptions?",
        answer:
          "No — this is a simplified estimate assuming the new tax regime, which offers no HRA exemption. If you're on the old regime with HRA and other deductions, your actual tax (and in-hand pay) will differ; use the HRA exemption calculator alongside the income tax calculator for that scenario.",
      },
      {
        question: "What is professional tax?",
        answer:
          "A small state-levied tax on salaried income, typically ₹200/month in most states (with a lower amount in one month in some states), capped by state law. It varies by state and is deducted directly from your salary.",
      },
    ],
    related: ["income-tax-calculator", "hra-exemption-calculator", "pf-calculator", "payslip-generator"],
  },
  {
    kind: "calculator",
    slug: "gratuity-calculator",
    category: "hr-payroll",
    name: "Gratuity Calculator",
    tagline: "Calculate gratuity payable under the Payment of Gratuity Act.",
    seoDescription:
      "Free gratuity calculator for India. Enter your last drawn salary and years of service to calculate gratuity payable under the Payment of Gratuity Act, 1972.",
    fields: [
      { name: "monthlySalary", label: "Last drawn monthly salary (basic + DA)", type: "number", placeholder: "50000", min: 0, unit: "₹" },
      { name: "yearsOfService", label: "Years of service", type: "number", placeholder: "8", min: 0, max: 50, step: 0.1 },
    ],
    compute: computeGratuity,
    autoCompute: true,
    about: [
      "Gratuity is a lump-sum thank-you an employer owes an employee who has stayed at least five years — a statutory right under the Payment of Gratuity Act, 1972, not a discretionary bonus. It's paid on resignation, retirement, termination (other than for misconduct) or death, and the formula is fixed by law: 15 days' wages for every completed year of service, calculated on your last drawn basic salary plus dearness allowance.",
      "The exact formula is (15 × last drawn monthly salary × years of service) ÷ 26 — the 26 representing working days in a month, so it's really 15/26ths of a month's salary per year served. Service beyond six months in your final year rounds up to a full year: 8 years and 7 months counts as 9 years for this calculation, while 8 years and 4 months counts as 8. The law also caps total gratuity at ₹20 lakh regardless of the formula's output — a limit that mainly bites senior employees with long tenure and high salaries.",
      "Eligibility requires five years of continuous service (this requirement is waived on death or disablement). Below that threshold, no gratuity is payable however good your service was — a rule you should know before resigning just short of your fifth anniversary. Note that gratuity received on retirement is tax-exempt up to ₹20 lakh for private-sector employees; consult a tax advisor for your specific situation.",
    ],
    faq: [
      {
        question: "Do I need to complete exactly 5 years to get gratuity?",
        answer:
          "Yes for resignation or retirement — a minimum of 5 years of continuous service is required. The requirement is waived if employment ends due to death or permanent disablement.",
      },
      {
        question: "Why did 8.4 years count as 8, but 8.7 years count as 9?",
        answer:
          "The Act rounds the final year up only if you've served more than 6 months into it. Less than or equal to 6 months rounds down to the completed year.",
      },
      {
        question: "Is there a maximum gratuity amount?",
        answer:
          "Yes — ₹20 lakh under the current statutory ceiling, regardless of what the formula computes for high earners with long service. The calculator applies this cap automatically.",
      },
      {
        question: "Is gratuity taxable?",
        answer:
          "For private-sector employees covered by the Act, gratuity is tax-exempt up to ₹20 lakh (the same statutory cap). Amounts above that, or for employees not covered by the Act, follow different exemption rules.",
      },
    ],
    related: ["salary-calculator", "leave-encashment-calculator", "pf-calculator", "experience-letter-generator"],
  },
  {
    kind: "calculator",
    slug: "pf-calculator",
    category: "hr-payroll",
    name: "EPF Calculator",
    tagline: "Project your Employees' Provident Fund corpus at retirement.",
    seoDescription:
      "Free EPF calculator. Project your Provident Fund corpus at retirement based on your basic salary, contribution rate, salary growth and EPF interest rate.",
    fields: [
      { name: "currentAge", label: "Current age", type: "number", placeholder: "28", min: 18, max: 60 },
      { name: "retirementAge", label: "Retirement age", type: "number", defaultValue: 58, min: 19, max: 60 },
      { name: "basicSalary", label: "Basic monthly salary", type: "number", placeholder: "30000", min: 0, unit: "₹" },
      { name: "currentBalance", label: "Current EPF balance", type: "number", defaultValue: 0, min: 0, unit: "₹", optional: true },
      { name: "salaryIncrease", label: "Expected annual salary increase", type: "number", defaultValue: 5, min: 0, max: 30, unit: "%" },
      { name: "interestRate", label: "EPF interest rate", type: "number", defaultValue: 8.25, min: 0, max: 15, step: 0.05, unit: "%" },
    ],
    compute: computePf,
    autoCompute: true,
    about: [
      "The Employees' Provident Fund is the default retirement savings vehicle for salaried India, and because contributions are automatic and invisible in the monthly payslip, most people never actually project what it will become. That's a shame — EPF is quietly one of the better-performing, government-backed instruments available, and seeing the compounding at work is motivating on its own.",
      "The mechanics: you contribute 12% of your basic salary every month, matched by your employer's 12% — except of the employer's share, 8.33% is diverted to the Employees' Pension Scheme (EPS) rather than your EPF account, so only 3.67% of the employer's contribution actually reaches your PF balance. Combined with your own 12%, that's 15.67% of basic flowing into EPF each month, compounding monthly at the interest rate the EPFO announces annually (recently around 8.25%).",
      "This calculator projects your corpus to retirement, stepping your basic salary up each year by your expected raise percentage and compounding contributions monthly. Two levers matter most for the final number: starting early (the compounding has more years to work) and your basic salary's actual growth rate, which most people underestimate over a full career. Note that EPF withdrawal before 5 years of continuous service is taxable, and partial withdrawals for specific purposes (medical, housing, marriage) are permitted under EPFO rules but aren't modelled here.",
    ],
    faq: [
      {
        question: "Why does only 3.67% of the employer's contribution go to my EPF, not 12%?",
        answer:
          "Of the employer's 12% of basic, 8.33% is mandatorily diverted to the Employees' Pension Scheme (EPS), which pays a monthly pension after retirement rather than a lump sum. Only the remaining 3.67% adds to your EPF balance.",
      },
      {
        question: "What EPF interest rate should I assume?",
        answer:
          "The EPFO announces a rate annually, recently around 8.1-8.25%. It has stayed in that range for several years but is not guaranteed — use a realistic figure and revisit the projection yearly as rates are announced.",
      },
      {
        question: "Can I withdraw my EPF before retirement?",
        answer:
          "Partial withdrawals are allowed for specific purposes (housing, medical treatment, marriage, education) after certain service milestones, and the full balance can be withdrawn 2 months after leaving employment (with conditions). This calculator projects the full-tenure corpus assuming no withdrawals.",
      },
    ],
    related: ["salary-calculator", "gratuity-calculator", "sip-calculator", "working-capital-calculator"],
  },
  {
    kind: "calculator",
    slug: "hra-exemption-calculator",
    category: "hr-payroll",
    name: "HRA Exemption Calculator",
    tagline: "Work out how much of your House Rent Allowance is tax-exempt.",
    seoDescription:
      "Free HRA exemption calculator. Enter basic salary, HRA received and rent paid to calculate your tax-exempt HRA under the old tax regime — metro and non-metro.",
    fields: [
      { name: "basicSalary", label: "Annual basic salary", type: "number", placeholder: "600000", min: 0, unit: "₹" },
      { name: "hraReceived", label: "Annual HRA received", type: "number", placeholder: "240000", min: 0, unit: "₹" },
      { name: "rentPaid", label: "Annual rent paid", type: "number", placeholder: "300000", min: 0, unit: "₹" },
      { name: "metro", label: "I live in a metro city (Delhi, Mumbai, Kolkata or Chennai)", type: "checkbox" },
    ],
    compute: computeHra,
    autoCompute: true,
    about: [
      "House Rent Allowance exemption is one of the largest tax breaks available to salaried tenants under the old tax regime — and one of the most confusing, because it isn't simply \"HRA received is tax-free.\" The exempt amount is the smallest of three separate figures, and most people have never seen all three laid out side by side to understand which one actually binds.",
      "The three figures: the actual HRA your employer pays you, your annual rent minus 10% of your basic salary (rent below that 10% threshold gives zero exemption — the law assumes you'd pay some rent regardless of any allowance), and 50% of basic salary if you live in a metro (Delhi, Mumbai, Kolkata, Chennai) or 40% elsewhere. Whichever of the three is smallest is what you can claim exempt; the rest of your HRA becomes taxable income. This calculator computes and displays all three so you see exactly which constraint is binding for you.",
      "Two situations trip people up. If you own your home (or live with parents rent-free) and don't pay rent, you can't claim any HRA exemption regardless of the allowance in your salary structure. And this exemption only applies under the old tax regime — the new regime (now the default) offers no HRA exemption at all, so factor that into your regime choice with the income tax calculator. Keep rent receipts and, for annual rent above ₹1 lakh, your landlord's PAN — your employer will ask for both to process the exemption.",
    ],
    faq: [
      {
        question: "Why is my rent minus 10% of basic sometimes zero?",
        answer:
          "The law only exempts rent paid above 10% of your basic salary, on the reasoning that some baseline rent would be paid regardless of any allowance. If your rent doesn't clear that 10% threshold, this component of the exemption is zero.",
      },
      {
        question: "Does HRA exemption apply under the new tax regime?",
        answer:
          "No — the new regime (the current default) doesn't allow HRA exemption at all. This calculation only matters if you've opted for the old regime. Compare both regimes with the income tax calculator before deciding.",
      },
      {
        question: "What documents do I need to claim HRA exemption?",
        answer:
          "Rent receipts for the claimed period, and your landlord's PAN if annual rent exceeds ₹1 lakh. Submit these to your employer for payroll processing, or claim directly while filing your return if not processed through payroll.",
      },
      {
        question: "Can I claim HRA if I live in my own house?",
        answer:
          "No — HRA exemption requires you to actually pay rent for accommodation you occupy. Homeowners cannot claim this exemption, though they may claim home loan interest deductions instead.",
      },
    ],
    related: ["salary-calculator", "income-tax-calculator", "leave-encashment-calculator", "rent-agreement-generator"],
  },
  {
    kind: "calculator",
    slug: "leave-encashment-calculator",
    category: "hr-payroll",
    name: "Leave Encashment Calculator",
    tagline: "Calculate the cash value of your unused earned leave.",
    seoDescription:
      "Free leave encashment calculator. Enter your monthly salary and earned leave days to calculate the cash amount payable for unused leave.",
    fields: [
      { name: "monthlySalary", label: "Monthly salary (basic + DA)", type: "number", placeholder: "50000", min: 0, unit: "₹" },
      { name: "leaveDays", label: "Earned leave days to encash", type: "number", placeholder: "15", min: 0, max: 365 },
    ],
    compute: computeLeaveEncashment,
    autoCompute: true,
    about: [
      "Most companies let earned leave accumulate and let you convert unused days to cash — commonly at resignation, retirement, or through an annual encashment window many employers offer for leave beyond a certain balance. The math is simple once you know the rate: your monthly salary divided by 30 gives a per-day rate, multiplied by the number of days encashed.",
      "This calculator applies exactly that formula to your basic salary plus dearness allowance (the components leave encashment is typically based on — check your company's policy, as some also include other fixed allowances). The result is a straightforward per-day rate times days, useful for estimating what a resignation payout will include or deciding whether to encash accumulated leave now versus carrying it forward.",
      "Tax treatment differs by circumstance and matters for planning: leave encashment received during employment (an annual encashment scheme) is fully taxable as salary income. At retirement or resignation, however, non-government employees get an exemption up to ₹25 lakh (a limit revised upward in recent years) on encashment received at that time, subject to conditions in the Income Tax Act — government employees get full exemption. Factor the tax treatment into whether encashing now or later suits your situation better.",
    ],
    faq: [
      {
        question: "What salary components does leave encashment use?",
        answer:
          "Typically basic salary plus dearness allowance — check your company's specific leave policy, as some employers include other fixed allowances in the calculation.",
      },
      {
        question: "Is leave encashment taxable?",
        answer:
          "Yes, during employment it's fully taxable as salary. At retirement or resignation, non-government employees get an exemption up to ₹25 lakh (subject to conditions); government employees get full exemption. Confirm current limits with a tax advisor.",
      },
      {
        question: "Is there a limit on how many leave days I can encash?",
        answer:
          "That depends entirely on your company's leave policy — some cap encashable leave at a fixed number of days per year, others allow encashing the full accumulated balance at exit. Check your employment contract or HR policy.",
      },
    ],
    related: ["gratuity-calculator", "salary-calculator", "notice-period-recovery-calculator", "experience-letter-generator"],
  },
  {
    kind: "calculator",
    slug: "bonus-calculator",
    category: "hr-payroll",
    name: "Statutory Bonus Calculator",
    tagline: "Calculate the statutory bonus payable under the Payment of Bonus Act.",
    seoDescription:
      "Free statutory bonus calculator for India. Enter your salary, bonus rate and months worked to calculate the bonus payable under the Payment of Bonus Act, 1965.",
    fields: [
      { name: "monthlySalary", label: "Monthly salary (basic + DA)", type: "number", placeholder: "15000", min: 0, unit: "₹" },
      { name: "bonusRate", label: "Bonus rate", type: "number", defaultValue: 8.33, min: 8.33, max: 20, step: 0.01, unit: "%" },
      { name: "monthsWorked", label: "Months worked in the accounting year", type: "number", defaultValue: 12, min: 1, max: 12 },
    ],
    compute: computeBonus,
    autoCompute: true,
    about: [
      "The Payment of Bonus Act, 1965 entitles eligible employees to a statutory annual bonus, distinct from any discretionary performance bonus a company might additionally pay. It applies to employees earning up to ₹21,000 per month (basic plus dearness allowance) who have worked at least 30 days in the accounting year, in establishments employing 20 or more people. If your salary crosses that ceiling, this particular statutory entitlement doesn't apply to you — though your employer may still offer a bonus voluntarily.",
      "The rate must fall between 8.33% (the statutory minimum, mathematically equal to one month's salary spread across the year) and 20% (the statutory maximum), depending on the company's profits under the Act's formula. The trickier part is the calculation ceiling: even if your actual salary is higher (up to the ₹21,000 eligibility limit), the bonus is calculated as though your salary were capped at ₹7,000 per month or the state minimum wage, whichever is higher — this calculator applies the simplified ₹7,000 cap; check your state's minimum wage notification if it exceeds that figure.",
      "Bonus is payable within 8 months of the close of the accounting year. If you worked only part of the year, the months-worked field pro-rates the entitlement accordingly. This is a statutory floor, not a ceiling on generosity — many employers pay bonuses well above what the Act requires, and those additional amounts aren't governed by this specific calculation.",
    ],
    faq: [
      {
        question: "Who is eligible for statutory bonus?",
        answer:
          "Employees earning up to ₹21,000/month (basic + DA) who worked at least 30 days in the accounting year, in an establishment with 20 or more employees. Above that salary ceiling, this statutory entitlement doesn't apply.",
      },
      {
        question: "Why is my bonus calculated on ₹7,000, not my actual salary?",
        answer:
          "The Act caps the calculation salary at ₹7,000/month or the state government's minimum wage for the role, whichever is higher — even though eligibility extends up to ₹21,000/month salary. This calculator applies the simplified ₹7,000 figure; check your state's minimum wage if it's higher.",
      },
      {
        question: "What's the difference between minimum and maximum bonus rate?",
        answer:
          "8.33% is the statutory minimum every eligible employee must receive regardless of company performance. Up to 20% may be paid depending on the company's \"allocable surplus\" (profit-linked formula) under the Act — the actual rate is usually announced by the employer for the accounting year.",
      },
    ],
    related: ["salary-calculator", "overtime-calculator", "leave-encashment-calculator", "payslip-generator"],
  },
  {
    kind: "calculator",
    slug: "overtime-calculator",
    category: "hr-payroll",
    name: "Overtime Pay Calculator",
    tagline: "Calculate overtime pay at the statutory double-rate.",
    seoDescription:
      "Free overtime pay calculator for India. Enter monthly wages, daily working hours and overtime hours to calculate overtime pay at the statutory double rate.",
    fields: [
      { name: "monthlyWages", label: "Monthly wages", type: "number", placeholder: "20000", min: 0, unit: "₹" },
      { name: "dailyHours", label: "Normal daily working hours", type: "number", defaultValue: 8, min: 1, max: 24 },
      { name: "overtimeHours", label: "Overtime hours worked", type: "number", placeholder: "10", min: 0 },
    ],
    compute: computeOvertime,
    autoCompute: true,
    about: [
      "Overtime pay in India is governed by laws like the Factories Act, 1948 (and analogous state Shops & Establishments Acts) which mandate that hours worked beyond the normal working day be paid at twice the ordinary rate of wages — not time-and-a-half as in some other countries, but double. This calculator applies that statutory multiplier to your actual wages.",
      "The calculation works backward from your monthly wages to an hourly rate, using 26 as the standard divisor for working days in a month (accounting for weekly offs), then dividing by your normal daily working hours to get an ordinary hourly rate. Overtime hours are paid at exactly twice that hourly rate — the statutory floor that applies to workers covered under these Acts, regardless of what a company's informal overtime policy might otherwise offer.",
      "Coverage varies: the Factories Act applies to factory workers, and many white-collar or managerial roles may be exempt from statutory overtime provisions depending on their state's Shops & Establishments Act and the nature of the role. If you're unsure whether your role is covered, check your state's applicable Act or your employment contract — but where the law applies, double-rate overtime is a floor employers cannot legally pay below.",
    ],
    faq: [
      {
        question: "Why is overtime paid at double rate, not 1.5x?",
        answer:
          "Indian labour law (the Factories Act and equivalent state legislation) sets the statutory overtime rate at twice the ordinary wage rate — higher than the time-and-a-half common in some other countries.",
      },
      {
        question: "Why does the calculator divide monthly wages by 26?",
        answer:
          "26 is the standard number of working days assumed in a month for daily-wage calculations under Indian labour law, accounting for weekly offs (leaving roughly 4 off-days in a 30-day month).",
      },
      {
        question: "Does overtime law apply to all employees?",
        answer:
          "Coverage depends on the applicable Act (Factories Act for factory workers, state Shops & Establishments Acts for others) and often excludes managerial or supervisory roles. Check your state's specific law or employment contract if you're unsure of your coverage.",
      },
    ],
    related: ["salary-calculator", "bonus-calculator", "notice-period-recovery-calculator", "payslip-generator"],
  },
  {
    kind: "calculator",
    slug: "notice-period-recovery-calculator",
    category: "hr-payroll",
    name: "Notice Period Recovery Calculator",
    tagline: "Calculate the salary recovery for notice period shortfall.",
    seoDescription:
      "Free notice period recovery calculator. Enter your salary, required notice period and days actually served to calculate the recovery amount for a shortfall.",
    fields: [
      { name: "monthlySalary", label: "Monthly gross salary", type: "number", placeholder: "60000", min: 0, unit: "₹" },
      { name: "requiredDays", label: "Notice period required (days)", type: "number", defaultValue: 60, min: 1, max: 180 },
      { name: "servedDays", label: "Notice days actually served", type: "number", placeholder: "30", min: 0 },
    ],
    compute: computeNoticePeriodRecovery,
    autoCompute: true,
    about: [
      "Most Indian employment contracts specify a notice period — commonly 30, 60 or 90 days — that either party must give before ending employment. Leave earlier than that (with your employer's approval to buy out the balance, or without it, depending on your contract) and the company typically recovers salary equivalent to the shortfall from your final settlement, often called \"notice pay recovery\" or \"buyout amount.\"",
      "The calculation is straightforward: your monthly salary divided by 30 gives a per-day rate, multiplied by the shortfall in days — the gap between what your contract requires and what you actually served. If you served the full required notice, there's no shortfall and no recovery; the calculator correctly shows zero rather than an error in that case.",
      "This is exactly the mirror image of the leave encashment calculation, just working in the opposite direction — money the company owes you for unused leave versus money you owe the company for unserved notice. Whether an employer can actually enforce recovery, and how it's structured (deducted from final salary vs. a separate demand), depends on your specific contract terms; some employers waive the recovery for a smooth transition or accept a shorter notice by mutual agreement.",
    ],
    faq: [
      {
        question: "How is notice period recovery calculated?",
        answer:
          "Monthly salary ÷ 30 gives a per-day rate, multiplied by the number of shortfall days (required notice minus days actually served). It mirrors the leave encashment formula but runs in the company's favour instead of yours.",
      },
      {
        question: "Can my employer always recover the full notice period shortfall?",
        answer:
          "Usually yes, if your employment contract specifies it — but many employers negotiate a shorter effective notice by mutual consent, sometimes waiving recovery entirely for a smooth handover. Check your specific contract terms.",
      },
      {
        question: "What if I served more than the required notice?",
        answer:
          "There's no recovery — the calculator returns zero for the recovery amount since there's no shortfall to recover.",
      },
    ],
    related: ["salary-calculator", "leave-encashment-calculator", "experience-letter-generator", "appointment-letter-generator"],
  },
  {
    kind: "generator",
    slug: "payslip-generator",
    category: "hr-payroll",
    name: "Payslip Generator",
    tagline: "Create a clean, itemised payslip in seconds.",
    seoDescription:
      "Free payslip generator. Enter earnings and deductions to generate a clean, itemised payslip with automatic net pay calculation — download as a text file.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Technologies Pvt Ltd" },
      { name: "employeeName", label: "Employee name", type: "text", placeholder: "Priya Sharma" },
      { name: "designation", label: "Designation", type: "text", placeholder: "Senior Executive" },
      { name: "month", label: "Payslip month", type: "text", placeholder: "June 2026" },
      { name: "basic", label: "Basic salary", type: "number", placeholder: "30000", min: 0, unit: "₹" },
      { name: "hra", label: "House rent allowance", type: "number", placeholder: "12000", min: 0, unit: "₹" },
      { name: "specialAllowance", label: "Special allowance", type: "number", placeholder: "8000", min: 0, unit: "₹" },
      { name: "otherAllowances", label: "Other allowances", type: "number", defaultValue: 0, min: 0, unit: "₹", optional: true },
      { name: "pfDeduction", label: "PF deduction (employee)", type: "number", placeholder: "3600", min: 0, unit: "₹" },
      { name: "professionalTax", label: "Professional tax", type: "number", defaultValue: 200, min: 0, unit: "₹" },
      { name: "otherDeductions", label: "Other deductions", type: "number", defaultValue: 0, min: 0, unit: "₹", optional: true },
    ],
    generate: generatePayslip,
    submitLabel: "Generate payslip",
    emailGate: true,
    about: [
      "A payslip is a simple document that carries real weight: employees need it for loan applications, visa processing, rental agreements and their own tax filing, and small businesses without a full payroll system often need a fast, professional way to produce one every month without spreadsheet gymnastics. This generator builds a clean, itemised payslip from the numbers you enter — earnings section, deductions section, and net pay computed automatically so it's never wrong by hand-arithmetic mistake.",
      "The structure follows what every payslip needs: basic salary, HRA and special allowance broken out (plus optional other allowances), followed by PF deduction, professional tax and any other deductions, with the total earnings, total deductions and net pay clearly labelled. It's formatted as plain, aligned text — readable on any device, easy to paste into an email, and simple to convert to PDF via your browser's print function if you need a more formal document.",
      "For a growing team, doing this manually every month doesn't scale — the moment you're generating more than a handful of payslips, a proper payroll system that handles statutory compliance, TDS calculation and year-end Form 16 automatically saves real hours and reduces error risk. That's exactly what the EBOS HR & Payroll module is built for; this generator is the right tool for a small team or a one-off need.",
    ],
    faq: [
      {
        question: "Is this payslip legally valid?",
        answer:
          "It includes the standard components — earnings, deductions, net pay — that a payslip needs. For full statutory compliance (TDS certificates, Form 16, PF challan matching), use a proper payroll system once your team grows beyond a handful of employees.",
      },
      {
        question: "Can I add more allowance or deduction lines?",
        answer:
          "The optional \"other allowances\" and \"other deductions\" fields let you fold in any additional amount as a single line. For a fully custom layout with many line items, a spreadsheet or payroll software gives more flexibility.",
      },
      {
        question: "Is my employee data stored anywhere?",
        answer:
          "No — the payslip is generated entirely in your browser and is not stored on our servers. It exists only until you download or close the page.",
      },
    ],
    related: ["salary-calculator", "offer-letter-generator", "appointment-letter-generator", "invoice-generator"],
  },
  {
    kind: "generator",
    slug: "offer-letter-generator",
    category: "hr-payroll",
    name: "Offer Letter Generator",
    tagline: "Create a professional job offer letter in minutes.",
    seoDescription:
      "Free offer letter generator. Enter the position, CTC and joining date to create a professional job offer letter with standard clauses — ready to send.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Technologies Pvt Ltd" },
      { name: "candidateName", label: "Candidate name", type: "text", placeholder: "Rahul Verma" },
      { name: "designation", label: "Designation", type: "text", placeholder: "Product Manager" },
      { name: "annualCtc", label: "Annual CTC", type: "number", placeholder: "1500000", min: 0, unit: "₹" },
      { name: "joiningDate", label: "Proposed joining date", type: "date" },
      { name: "workLocation", label: "Work location", type: "text", placeholder: "Bengaluru" },
      { name: "reportingManager", label: "Reporting manager", type: "text", placeholder: "Anjali Mehta", optional: true },
    ],
    generate: generateOfferLetter,
    submitLabel: "Generate offer letter",
    emailGate: true,
    about: [
      "The offer letter is the first formal document a candidate receives from your company, and its tone and clarity set expectations for the whole relationship ahead. Writing one from scratch means remembering every standard clause — position, compensation, joining date, probation, confidentiality, acceptance — and getting the legal-sounding parts phrased correctly. This generator produces a complete, professional offer letter from a handful of fields.",
      "The output covers the clauses every Indian offer letter should include: the position and location (with a note that the company may require work at other locations, standard flexibility language), compensation stated as annual CTC with a note that a detailed break-up follows in the appointment letter, the proposed joining date with a list of documents to bring, a standard six-month probation period, a confidentiality clause, and a clear acceptance section for the candidate to sign. If you name a reporting manager, that's woven in naturally.",
      "Treat this as the letter that gets a candidate excited and committed, not the final word on every legal term — the fuller terms of employment belong in the appointment letter (generated separately, once the candidate has accepted) alongside your employee handbook and policies. Have your HR or legal team review anything unusual to your company's specific compensation structure or statutory obligations before sending.",
    ],
    faq: [
      {
        question: "What's the difference between an offer letter and an appointment letter?",
        answer:
          "The offer letter is sent before joining to confirm the position, compensation and joining date, and get the candidate's acceptance. The appointment letter is issued on or after the joining date with the full, detailed terms of employment. Both are available as separate generators here.",
      },
      {
        question: "Is this offer letter legally binding?",
        answer:
          "It creates a standard offer with acceptance, which is generally binding once signed by both parties, subject to the conditions stated (like background verification). Have your legal team review it for anything specific to your industry or state before use.",
      },
      {
        question: "Can I add custom clauses?",
        answer:
          "The generated letter covers standard terms; copy the text into a document editor to add clauses specific to your company — non-compete terms, relocation assistance, sign-on bonus, or anything your legal team requires.",
      },
    ],
    related: ["appointment-letter-generator", "experience-letter-generator", "payslip-generator", "salary-calculator"],
  },
  {
    kind: "generator",
    slug: "appointment-letter-generator",
    category: "hr-payroll",
    name: "Appointment Letter Generator",
    tagline: "Generate a complete appointment letter with standard employment terms.",
    seoDescription:
      "Free appointment letter generator. Create a complete appointment letter with position, salary, probation, notice period and confidentiality terms — ready to sign.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Technologies Pvt Ltd" },
      { name: "employeeName", label: "Employee name", type: "text", placeholder: "Rahul Verma" },
      { name: "designation", label: "Designation", type: "text", placeholder: "Product Manager" },
      { name: "joiningDate", label: "Date of joining", type: "date" },
      { name: "annualCtc", label: "Annual CTC", type: "number", placeholder: "1500000", min: 0, unit: "₹" },
      { name: "workLocation", label: "Work location", type: "text", placeholder: "Bengaluru" },
      { name: "noticePeriodDays", label: "Notice period (days)", type: "number", defaultValue: 60, min: 1, max: 180 },
    ],
    generate: generateAppointmentLetter,
    submitLabel: "Generate appointment letter",
    emailGate: true,
    about: [
      "Where the offer letter gets a candidate to say yes, the appointment letter is the fuller, more formal document issued on or around the joining date that actually governs the employment relationship — the one referenced in disputes, audits and background checks years later. It needs to be thorough and correctly worded, which is exactly the kind of document that's easy to get subtly wrong when written in a hurry.",
      "This generator produces the standard clause set: position and place of work (with the conventional transfer clause giving the company flexibility), the effective date of appointment, remuneration stated as CTC with a note on statutory deductions, a six-month probation period with the company's right to extend it, the notice period you specify for post-confirmation termination, a reference to the leave policy, confidentiality and return-of-property obligations, and a jurisdiction clause tied to your work location. It closes with a proper acceptance block for the employee's signature.",
      "This is the document HR and payroll systems reference for compliance, so keep a signed copy on file (physical or digital) for every employee — it's typically requested during PF/ESI inspections, background verification for the employee's next job, and any employment dispute. As with the offer letter, have your legal team review it against your state's specific Shops & Establishments Act requirements and your company's actual policies before use at scale.",
    ],
    faq: [
      {
        question: "Do I need both an offer letter and an appointment letter?",
        answer:
          "Most established companies issue both — the offer letter to secure acceptance before joining, and the more detailed appointment letter on or after the joining date. Smaller companies sometimes combine them into one document, but separating them is standard good practice.",
      },
      {
        question: "What notice period should I set?",
        answer:
          "30 days is common for junior roles, 60-90 days for mid-to-senior roles where handover matters more. Whatever you set here should match what you'll enforce — use the notice period recovery calculator to see the buyout implications.",
      },
      {
        question: "Is a 6-month probation period standard?",
        answer:
          "Yes, it's the most common default in Indian appointment letters, though some companies use 3 or 12 months depending on role seniority and industry norms. Edit the generated text if your policy differs.",
      },
    ],
    related: ["offer-letter-generator", "experience-letter-generator", "payslip-generator", "notice-period-recovery-calculator"],
  },
  {
    kind: "generator",
    slug: "experience-letter-generator",
    category: "hr-payroll",
    name: "Experience Letter Generator",
    tagline: "Generate a professional experience/relieving certificate.",
    seoDescription:
      "Free experience letter generator. Create a professional 'to whomsoever it may concern' experience certificate confirming employment dates and conduct.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", placeholder: "Avexora Technologies Pvt Ltd" },
      { name: "employeeName", label: "Employee name", type: "text", placeholder: "Rahul Verma" },
      { name: "designation", label: "Designation", type: "text", placeholder: "Product Manager" },
      { name: "joiningDate", label: "Date of joining", type: "date" },
      { name: "leavingDate", label: "Last working date", type: "date" },
      {
        name: "conduct",
        label: "Conduct remark",
        type: "select",
        defaultValue: "good",
        options: [
          { value: "excellent", label: "Excellent" },
          { value: "good", label: "Good" },
          { value: "satisfactory", label: "Satisfactory" },
        ],
      },
    ],
    generate: generateExperienceLetter,
    submitLabel: "Generate experience letter",
    emailGate: true,
    about: [
      "An experience letter (also called a relieving letter or service certificate) is the document that proves someone actually worked where they claim to have — every subsequent employer's background check and every visa application asks for it, and a delayed or missing one can genuinely hold up a former employee's next opportunity. It's a short document, but getting it out promptly and correctly matters more than its length suggests.",
      "This generator produces the standard \"to whomsoever it may concern\" format: confirmation of the employee's name, designation, and the exact period of employment, a short conduct remark drawn from your selection (excellent, good or satisfactory — each phrased professionally rather than as a bare adjective), a statement that all dues are settled and exit formalities complete, and a closing note of thanks. It's the format background-verification agencies and HR departments universally recognise.",
      "Issue this promptly when an employee leaves — delays create real friction for someone trying to start a new job on time, and in India it's considered standard professional courtesy to provide it within a few days of the last working date, regardless of how the departure occurred (except in cases of termination for serious misconduct, which follow different documentation). Keep a copy on file alongside the appointment letter for your own records.",
    ],
    faq: [
      {
        question: "What's the difference between an experience letter and a relieving letter?",
        answer:
          "In practice the terms are used interchangeably in India — both confirm employment dates, role and conduct. Some companies issue a separate, shorter relieving letter focused only on the last working date, with the experience letter as the fuller reference document.",
      },
      {
        question: "How soon after an employee leaves should this be issued?",
        answer:
          "As promptly as possible — ideally within a few working days of the last working day, once exit formalities and dues are settled. Delays can hold up the employee's next job or visa processing.",
      },
      {
        question: "What if the employee's conduct wasn't good?",
        answer:
          "Use the \"satisfactory\" option, which is professionally neutral without being negative. Indian employment norms generally avoid negative remarks in experience letters — serious issues are documented separately through termination or disciplinary records, not the experience certificate.",
      },
    ],
    related: ["appointment-letter-generator", "offer-letter-generator", "gratuity-calculator", "leave-encashment-calculator"],
  },
];
