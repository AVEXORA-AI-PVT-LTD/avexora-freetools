import type { ToolConfig } from "../types";
import InvoiceGenerator from "../ui/invoicing/invoice-generator";

export const tools: ToolConfig[] = [
  {
    kind: "generator",
    slug: "invoice-generator",
    category: "invoicing-billing",
    name: "Free Invoice Generator",
    tagline:
      "Create a professional GST invoice and print or save it as PDF — no sign-up needed.",
    seoDescription:
      "Free online GST invoice generator for India. Add your business details, line items and GST rates, then print or save a professional tax invoice as PDF in seconds.",
    component: InvoiceGenerator,
    emailGate: true,
    about: [
      "Every business needs invoices, but not every business needs invoicing software on day one. This free generator builds a clean, professional GST tax invoice in your browser: enter your business and customer details, add line items with quantity, rate and GST slab, and the invoice preview updates live with the correct CGST/SGST or IGST split.",
      "For sales within your state, GST is split as CGST + SGST; tick “Inter-state (IGST)” for sales to another state and the invoice shows IGST instead. When you're done, hit Print / Save as PDF — your browser's print dialog lets you save a PDF copy to send to your customer.",
      "A proper tax invoice needs a few things to be taken seriously — and to keep your GST paperwork clean: your business name, address and GSTIN, the customer's details, a unique invoice number, the invoice date, a clear description of each item or service with quantity and rate, the applicable GST slab per line, and the tax breakup shown separately from the subtotal. This generator lays all of that out in a clean, conventional format that accountants and customers recognise immediately, so you don't have to fight a spreadsheet template into shape.",
      "Your data stays on your device: nothing you type is uploaded or stored on our servers, which makes it safe to use for real customer details. If you raise more than a handful of invoices a month, though, a generator stops being enough — you'll want automatic numbering, saved customer records, GST reports and payment tracking with reminders. That's exactly what the EBOS Billing module does, and your invoices there will look just like the ones you make here.",
    ],
    faq: [
      {
        question: "Is this invoice format valid for GST?",
        answer:
          "The generated invoice includes the standard elements of a tax invoice: seller and buyer details with GSTIN, invoice number and date, line items with GST rate, and the CGST/SGST or IGST breakup. Check the latest GST invoicing rules for any requirements specific to your business (e.g. HSN codes or e-invoicing thresholds).",
      },
      {
        question: "How do I save the invoice as a PDF?",
        answer:
          "Click “Print / Save as PDF” and choose “Save as PDF” as the destination in your browser's print dialog. Only the invoice itself is printed, not the form.",
      },
      {
        question: "Is my invoice data stored anywhere?",
        answer:
          "No. The invoice is built entirely in your browser and is discarded when you leave the page. Nothing is uploaded to our servers.",
      },
      {
        question: "When should I charge IGST instead of CGST and SGST?",
        answer:
          "Charge IGST when the place of supply is in a different state from your registration (inter-state supply). For supplies within the same state, split the tax equally as CGST and SGST.",
      },
    ],
    related: ["quotation-generator", "gst-calculator", "receipt-generator", "payment-reminder-generator"],
  },
];
