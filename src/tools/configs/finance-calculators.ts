import type { ToolConfig } from "../types";
import { computeGst } from "../compute/finance/gst";

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
      "The formula is simple: to add GST, tax = amount × rate ÷ 100. To remove GST from an inclusive price, base = amount ÷ (1 + rate ÷ 100). Use this before raising invoices, checking supplier bills, or estimating tax liability for a quote.",
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
];
