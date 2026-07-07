import type { ToolConfig } from "../types";
import InvoiceGenerator from "../ui/invoicing/invoice-generator";
import { generateQuotation } from "../compute/invoicing/quotation";
import { generateProformaInvoice } from "../compute/invoicing/proforma-invoice";
import { generateReceipt } from "../compute/invoicing/receipt";
import { generateCreditNote } from "../compute/invoicing/credit-note";
import { generateDebitNote } from "../compute/invoicing/debit-note";
import { generatePurchaseOrder } from "../compute/invoicing/purchase-order";
import { generateDeliveryChallan } from "../compute/invoicing/delivery-challan";
import { generatePaymentReminder } from "../compute/invoicing/payment-reminder";
import { computeLateFee } from "../compute/invoicing/late-fee";
import { computeDiscount } from "../compute/invoicing/discount";
import { computeInvoiceDueDate } from "../compute/invoicing/due-date";

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
  {
    kind: "generator",
    slug: "quotation-generator",
    category: "invoicing-billing",
    name: "Quotation Generator",
    tagline: "Create a professional price quotation with line items and validity date.",
    seoDescription:
      "Free quotation generator. Add your business details, customer, line items and validity date to create a professional price quotation in seconds.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "customerName", label: "Customer name", type: "text", placeholder: "Ravi Kumar" },
      { name: "quotationNumber", label: "Quotation number", type: "text", placeholder: "QUOT-001" },
      { name: "date", label: "Quotation date", type: "date" },
      { name: "validUntil", label: "Valid until", type: "date", optional: true },
      { name: "items", label: "Line items (one per line: description, qty, rate)", type: "textarea", rows: 6, placeholder: "Website design, 1, 25000\nHosting setup, 1, 3000" },
    ],
    generate: generateQuotation,
    submitLabel: "Generate quotation",
    emailGate: true,
    about: [
      "A quotation is the first document a prospective customer sees before committing to buy — it needs to look professional enough to build confidence while making the price and scope unambiguous. This generator produces a clean, itemised quotation from your business details, customer name, and a simple line-item list, ready to send or print.",
      "Enter each item as a single line — description, quantity, rate — and the generator computes line totals and the grand total automatically, formatted as a clean aligned table. Add a validity date so the customer knows the quoted prices aren't open-ended, which protects you if your costs change before they decide.",
      "A quotation is explicitly not a tax invoice — it's an estimate, and the generated document says so clearly to avoid any confusion with your GST records. Once the customer accepts, convert it to a proper invoice using the invoice generator linked below.",
      "Number your quotations sequentially just as you would invoices (QUOT-001, QUOT-002…) so you can track how many convert to actual sales over time — that conversion rate is a useful, easy-to-track business metric that most small businesses never bother measuring even though it's sitting right there in their sent-quotes folder.",
      "Keep a copy of every quotation you send, even the ones that don't convert — a customer who declines this time may come back months later referencing the price you quoted, and having it on hand avoids an awkward renegotiation from scratch.",
    ],
    faq: [
      {
        question: "Is a quotation the same as an invoice?",
        answer:
          "No — a quotation is a price estimate before a sale is confirmed; an invoice is a demand for payment for a completed sale and has GST/tax implications a quotation doesn't. Don't record quotations in your books as sales.",
      },
      {
        question: "Why should I add a validity date?",
        answer:
          "Prices, especially for materials or services with variable costs, can change. A validity date protects you from being held to an old quote after your costs have moved, and creates gentle urgency for the customer to decide.",
      },
      {
        question: "How do I format the line items?",
        answer:
          "One item per line, comma-separated: description, quantity, rate — for example \"Website design, 1, 25000\". The generator computes each line's amount and the grand total automatically.",
      },
    ],
    related: ["invoice-generator", "proforma-invoice-generator", "purchase-order-generator", "discount-calculator"],
  },
  {
    kind: "generator",
    slug: "proforma-invoice-generator",
    category: "invoicing-billing",
    name: "Proforma Invoice Generator",
    tagline: "Create a proforma invoice for advance payment or customs purposes.",
    seoDescription:
      "Free proforma invoice generator. Create a proforma invoice with line items for advance payment requests or customs declarations — not a tax invoice.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "customerName", label: "Customer name", type: "text", placeholder: "Ravi Kumar" },
      { name: "invoiceNumber", label: "Proforma invoice number", type: "text", placeholder: "PI-001" },
      { name: "date", label: "Date", type: "date" },
      { name: "items", label: "Line items (one per line: description, qty, rate)", type: "textarea", rows: 6, placeholder: "Custom furniture order, 1, 45000" },
    ],
    generate: generateProformaInvoice,
    submitLabel: "Generate proforma invoice",
    emailGate: true,
    about: [
      "A proforma invoice sits between a quotation and a final tax invoice — used when a customer needs a formal-looking document to arrange payment (an advance, a letter of credit, an import declaration) before the actual sale and tax invoice are finalised. It looks like an invoice but explicitly isn't one for accounting or GST purposes.",
      "This generator produces exactly that: your business and customer details, line items with computed totals, and a clear statement that this is a proforma document, not a tax invoice or a demand for payment under GST law. It's commonly requested by customers making advance payments, and by customs authorities for cross-border shipments where the actual tax invoice will follow later.",
      "Once the customer pays the advance or the transaction proceeds, issue a proper tax invoice using the invoice generator — never record a proforma invoice as a sale in your books, since doing so can create GST filing mismatches.",
      "Exporters in particular rely on proforma invoices constantly: overseas buyers frequently need one to open a letter of credit or arrange currency remittance before goods ship, and customs authorities on both ends may request it as part of the shipment paperwork. Keep the format simple and consistent across your business so buyers and banks recognise it immediately.",
    ],
    faq: [
      {
        question: "Is a proforma invoice a legal tax invoice?",
        answer:
          "No — it's explicitly not a tax invoice or demand for payment under GST law. It's used for advance payment requests, customs declarations, or internal approval processes before the actual sale is finalised.",
      },
      {
        question: "When do businesses typically use a proforma invoice?",
        answer:
          "Common cases: requesting an advance payment before starting work, supporting a customer's internal purchase approval process, or accompanying export shipments for customs purposes ahead of the final commercial invoice.",
      },
      {
        question: "Should I record a proforma invoice in my GST returns?",
        answer:
          "No — only actual tax invoices should be recorded as sales for GST purposes. Recording a proforma invoice as a sale can create mismatches when you later issue the real tax invoice.",
      },
    ],
    related: ["invoice-generator", "quotation-generator", "purchase-order-generator", "gst-calculator"],
  },
  {
    kind: "generator",
    slug: "receipt-generator",
    category: "invoicing-billing",
    name: "Payment Receipt Generator",
    tagline: "Create a clean payment receipt acknowledging money received.",
    seoDescription:
      "Free payment receipt generator. Create a professional receipt acknowledging payment received, with amount, method and purpose — ready to print or send.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "payerName", label: "Received from (payer name)", type: "text", placeholder: "Ravi Kumar" },
      { name: "receiptNumber", label: "Receipt number", type: "text", placeholder: "RCPT-001" },
      { name: "date", label: "Date", type: "date" },
      { name: "amount", label: "Amount received", type: "number", placeholder: "15000", min: 0, unit: "₹" },
      {
        name: "paymentMethod",
        label: "Payment method",
        type: "select",
        defaultValue: "Cash",
        options: [
          { value: "Cash", label: "Cash" },
          { value: "Bank Transfer / NEFT / RTGS", label: "Bank Transfer / NEFT / RTGS" },
          { value: "UPI", label: "UPI" },
          { value: "Cheque", label: "Cheque" },
          { value: "Card", label: "Card" },
        ],
      },
      { name: "forPayment", label: "Payment for", type: "text", placeholder: "e.g. Invoice #INV-045" },
    ],
    generate: generateReceipt,
    submitLabel: "Generate receipt",
    emailGate: true,
    about: [
      "A receipt is simple but important — it's the customer's proof that a specific payment was made and accepted, and it's what they'll ask for when reconciling their own books or resolving any later dispute about whether they paid. This generator produces a clean receipt with the amount, method, purpose and date, ready to hand over or email immediately after receiving payment.",
      "Fill in who paid, how much, by what method, and what it was for (referencing the original invoice number keeps your paper trail connected), and the receipt is ready. It's deliberately simple — no line items or tax breakdown, since that detail belongs on the invoice being paid, not the receipt confirming payment.",
      "Issue a receipt for every payment you accept, even informal or cash payments — it protects both you and the customer, and for cash transactions particularly, a receipt is often the only record either side has. Keep a copy for your own records alongside the invoice it settles.",
      "A receipt is also the fastest way to close out a payment dispute before it becomes one — a customer who has your signed receipt in hand has no room to later claim they never paid, and you have equally clean proof of exactly what you received and when, which matters at tax time and during any bank reconciliation.",
    ],
    faq: [
      {
        question: "What's the difference between a receipt and an invoice?",
        answer:
          "An invoice requests payment for goods or services rendered. A receipt confirms that payment has already been received. Issue the invoice first, then the receipt once payment arrives.",
      },
      {
        question: "Should I issue a receipt for every payment, even small cash ones?",
        answer:
          "Yes — receipts protect both parties and are often the only proof of payment for informal or cash transactions. Keep a copy for your own records too.",
      },
      {
        question: "Can this replace a formal GST receipt requirement?",
        answer:
          "For most small transactions this is sufficient, but check current GST rules if you need to issue a formal receipt voucher (particularly for advance payments received against future supply).",
      },
    ],
    related: ["invoice-generator", "payment-reminder-generator", "late-fee-calculator", "credit-note-generator"],
  },
  {
    kind: "generator",
    slug: "credit-note-generator",
    category: "invoicing-billing",
    name: "Credit Note Generator",
    tagline: "Issue a credit note against a previous invoice for returns or corrections.",
    seoDescription:
      "Free credit note generator. Issue a credit note against an original invoice for returned goods, billing errors or discounts — with line items and reason.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "customerName", label: "Customer name", type: "text", placeholder: "Ravi Kumar" },
      { name: "creditNoteNumber", label: "Credit note number", type: "text", placeholder: "CN-001" },
      { name: "date", label: "Date", type: "date" },
      { name: "originalInvoiceNumber", label: "Original invoice number", type: "text", placeholder: "INV-045" },
      { name: "reason", label: "Reason for credit note", type: "text", placeholder: "e.g. goods returned due to damage" },
      { name: "items", label: "Line items being credited (one per line: description, qty, rate)", type: "textarea", rows: 5, placeholder: "Damaged unit returned, 1, 2000" },
    ],
    generate: generateCreditNote,
    submitLabel: "Generate credit note",
    emailGate: true,
    about: [
      "A credit note reduces the amount a customer owes you against a previous invoice — issued when goods are returned, an invoice was overbilled, or you're granting a post-sale discount. It's a formal accounting document, not just an apology email, and it keeps both your books and your customer's straight on what's actually still owed.",
      "This generator references the original invoice number (so the correction is traceable), states the reason clearly, and lists the specific items or amounts being credited with computed totals. That reason field matters more than it might seem — under GST, credit notes need a documented reason, and auditors or your accountant will want it on record.",
      "Once issued, both parties should adjust their accounting records accordingly — the customer's payable reduces, your receivable and revenue recognition may need adjustment depending on your accounting method. If this relates to a GST-registered sale, check current e-invoicing and credit note reporting requirements with your accountant.",
      "Send the credit note promptly once the underlying issue is confirmed (a return received, an error verified) rather than letting it sit unissued — a customer waiting on a documented credit for a return they've already sent back is a common, avoidable source of friction that a same-day credit note resolves immediately.",
    ],
    faq: [
      {
        question: "When do I issue a credit note instead of a refund?",
        answer:
          "A credit note reduces what the customer owes on their account (useful for ongoing business relationships or when goods are returned but no cash refund is due yet); a refund is an actual cash repayment. Sometimes both — a credit note documents the reduction, then a refund settles it in cash.",
      },
      {
        question: "Does a credit note need to reference the original invoice?",
        answer:
          "Yes — always reference the original invoice number so the correction is traceable in both your records and the customer's, and to satisfy GST documentation requirements.",
      },
      {
        question: "Are credit notes reported under GST?",
        answer:
          "Yes — credit notes against GST-registered supplies generally need to be reported in your GST returns and, above certain turnover thresholds, through e-invoicing. Confirm current requirements with your accountant.",
      },
    ],
    related: ["invoice-generator", "debit-note-generator", "refund-policy-generator", "gst-calculator"],
  },
  {
    kind: "generator",
    slug: "debit-note-generator",
    category: "invoicing-billing",
    name: "Debit Note Generator",
    tagline: "Issue a debit note against a supplier invoice for returns or shortages.",
    seoDescription:
      "Free debit note generator. Issue a debit note against a supplier's invoice for returned goods, shortages or price corrections — with line items and reason.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "supplierName", label: "Supplier name", type: "text", placeholder: "Global Supplies Ltd" },
      { name: "debitNoteNumber", label: "Debit note number", type: "text", placeholder: "DN-001" },
      { name: "date", label: "Date", type: "date" },
      { name: "originalInvoiceNumber", label: "Original supplier invoice number", type: "text", placeholder: "SUP-INV-220" },
      { name: "reason", label: "Reason for debit note", type: "text", placeholder: "e.g. goods returned due to quality issue" },
      { name: "items", label: "Line items being debited (one per line: description, qty, rate)", type: "textarea", rows: 5, placeholder: "Defective units returned, 5, 500" },
    ],
    generate: generateDebitNote,
    submitLabel: "Generate debit note",
    emailGate: true,
    about: [
      "A debit note is the mirror image of a credit note, issued from the buyer's side: when you return goods to a supplier, receive a short shipment, or need to correct an undercharge on their invoice, a debit note formally records that you're claiming back money or adjusting what you owe them.",
      "This generator references the supplier's original invoice number, records the reason for the adjustment, and lists the specific items or amounts involved with computed totals. As with credit notes, keeping a clear, documented reason matters for both your internal records and GST compliance.",
      "Send the debit note to your supplier as formal notice of the adjustment, and follow up to confirm they've processed a corresponding credit note or refund on their end — the two documents should reconcile with each other for both parties' books to stay accurate.",
      "Keeping a numbered, dated record of every debit note you issue also makes supplier performance visible over time — if the same supplier keeps generating debit notes for shortages or quality issues, that pattern is worth raising directly with them, or worth factoring into your next sourcing decision.",
      "Attach the debit note alongside the original purchase order and delivery documentation when you send it, so the supplier can verify your claim quickly without a back-and-forth over which shipment or invoice it refers to.",
    ],
    faq: [
      {
        question: "Who issues a debit note versus a credit note?",
        answer:
          "The buyer typically issues a debit note (claiming an adjustment against a supplier's invoice); the seller issues a credit note (acknowledging that adjustment). For the same transaction, both documents should reconcile with each other.",
      },
      {
        question: "What's a common reason to issue a debit note?",
        answer:
          "Goods returned to a supplier due to damage or quality issues, a shortage in the quantity delivered versus invoiced, or a pricing error where the supplier overcharged you.",
      },
      {
        question: "Does the supplier need to respond with a credit note?",
        answer:
          "Ideally yes — a debit note is your formal claim, and the supplier confirming it with a matching credit note keeps both sets of books reconciled and satisfies GST documentation on both sides.",
      },
    ],
    related: ["credit-note-generator", "purchase-order-generator", "invoice-generator", "gst-calculator"],
  },
  {
    kind: "generator",
    slug: "purchase-order-generator",
    category: "invoicing-billing",
    name: "Purchase Order Generator",
    tagline: "Create a formal purchase order to send to your suppliers.",
    seoDescription:
      "Free purchase order generator. Create a formal PO with line items, delivery date and delivery address to send to your suppliers — ready to print or email.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "supplierName", label: "Supplier name", type: "text", placeholder: "Global Supplies Ltd" },
      { name: "poNumber", label: "Purchase order number", type: "text", placeholder: "PO-001" },
      { name: "date", label: "Order date", type: "date" },
      { name: "deliveryDate", label: "Required delivery date", type: "date", optional: true },
      { name: "deliveryAddress", label: "Delivery address", type: "textarea", rows: 2, placeholder: "Warehouse 3, Industrial Area, Pune" },
      { name: "items", label: "Line items (one per line: description, qty, rate)", type: "textarea", rows: 6, placeholder: "Steel rods 10mm, 200, 450" },
    ],
    generate: generatePurchaseOrder,
    submitLabel: "Generate purchase order",
    emailGate: true,
    about: [
      "A purchase order is your formal, documented commitment to buy specific goods at specific terms — sending one instead of a verbal or email agreement protects you if a supplier later disputes quantities, prices, or delivery expectations, and it gives your own accounts team a clean record to match against the eventual supplier invoice.",
      "This generator produces a complete PO: supplier details, order and required delivery dates, the delivery address, and itemised quantities and rates with computed totals. Any established supplier relationship should run on POs rather than ad-hoc ordering — it's the paper trail that makes three-way matching (PO, delivery receipt, invoice) possible before you pay a supplier invoice.",
      "Send the PO to your supplier and ask for confirmation of receipt and the expected delivery date before goods ship — catching a pricing or quantity mismatch before dispatch is far easier than after. When goods arrive, check them against this PO before accepting the corresponding invoice for payment.",
      "Keeping every PO numbered and filed also gives you a clean audit trail if a supplier dispute ever escalates, and makes year-end reconciliation of your purchases against supplier statements far faster than reconstructing what was ordered from scattered emails and phone calls.",
    ],
    faq: [
      {
        question: "Why use a purchase order instead of just emailing an order?",
        answer:
          "A formal PO creates a clear, numbered record of exactly what was ordered, at what price, and by when — protecting you in any dispute and enabling three-way matching against the delivery and invoice before payment.",
      },
      {
        question: "Should I get supplier confirmation before goods ship?",
        answer:
          "Yes — asking the supplier to confirm the PO and delivery date catches pricing or quantity errors before goods are dispatched, which is much cheaper to fix than after delivery.",
      },
      {
        question: "What is three-way matching?",
        answer:
          "Checking that the purchase order, the delivery/goods receipt, and the supplier's invoice all agree on quantity and price before you approve payment — a standard accounts payable control against errors and overbilling.",
      },
    ],
    related: ["delivery-challan-generator", "invoice-generator", "debit-note-generator", "working-capital-calculator"],
  },
  {
    kind: "generator",
    slug: "delivery-challan-generator",
    category: "invoicing-billing",
    name: "Delivery Challan Generator",
    tagline: "Create a delivery challan to accompany goods in transit.",
    seoDescription:
      "Free delivery challan generator. Create a delivery challan listing goods, quantity and vehicle details to accompany a shipment — not a tax invoice.",
    fields: [
      { name: "businessName", label: "Your business name", type: "text", placeholder: "Acme Traders Pvt Ltd" },
      { name: "consigneeName", label: "Consignee (receiving party)", type: "text", placeholder: "Ravi Kumar" },
      { name: "challanNumber", label: "Challan number", type: "text", placeholder: "DC-001" },
      { name: "date", label: "Date", type: "date" },
      { name: "vehicleNumber", label: "Vehicle number", type: "text", placeholder: "MH12AB1234", optional: true },
      { name: "deliveryAddress", label: "Delivery address", type: "textarea", rows: 2, placeholder: "Shop 12, Market Road, Nashik" },
      { name: "items", label: "Items being transported (one per line: description, qty)", type: "textarea", rows: 5, placeholder: "Ceramic tiles (box of 10), 50" },
      { name: "approxValue", label: "Approximate value (for transport records)", type: "number", min: 0, unit: "₹", optional: true },
    ],
    generate: generateDeliveryChallan,
    submitLabel: "Generate delivery challan",
    emailGate: true,
    about: [
      "A delivery challan travels with goods, not with the sale — it's the document a transporter or delivery vehicle carries to prove what's being moved, where it's going, and (under GST e-way bill rules) is often required alongside or in place of an invoice for certain movement types like job work, returns, or goods sent for approval before a sale is finalised.",
      "This generator produces exactly that: consignee details, vehicle number, delivery address, and an itemised list of what's being transported with quantities (deliberately without pricing detail the way an invoice has, since a challan documents movement, not a sale). An optional approximate value field supports e-way bill and transport documentation needs without turning the challan into a priced commercial document.",
      "Keep a signed copy from the receiving party as proof of delivery, and match it against your dispatch records. If the movement is also a taxable supply, a proper tax invoice should accompany or follow the challan — check current e-way bill thresholds and requirements for your specific goods and distance.",
      "This is especially useful for job-work movements (sending raw material to a contractor for processing and receiving finished goods back), stock transfers between your own branches or warehouses, and goods sent on approval, where issuing a full tax invoice for a movement that isn't yet a completed sale would create an unnecessary and incorrect GST entry.",
    ],
    faq: [
      {
        question: "Is a delivery challan the same as an invoice?",
        answer:
          "No — a challan documents the physical movement of goods; an invoice documents a sale and its tax implications. Some movements (job work, goods on approval, returns) use a challan without an invoice; a taxable sale typically needs both.",
      },
      {
        question: "Do I need an e-way bill in addition to this challan?",
        answer:
          "Depending on the value and distance of the shipment, an e-way bill may be required under GST rules regardless of whether a challan or invoice accompanies the goods. Check current thresholds for your situation.",
      },
      {
        question: "Why doesn't the challan show pricing per item?",
        answer:
          "A challan's purpose is documenting what's moving and where, not billing for it — that's why it lists quantities rather than a priced line-item breakdown. An optional approximate total value is included for transport/e-way bill documentation.",
      },
    ],
    related: ["purchase-order-generator", "invoice-generator", "receipt-generator", "gst-calculator"],
  },
  {
    kind: "generator",
    slug: "payment-reminder-generator",
    category: "invoicing-billing",
    name: "Payment Reminder Generator",
    tagline: "Generate a payment reminder message in the right tone for the situation.",
    seoDescription:
      "Free payment reminder generator. Create a friendly, firm or final-notice payment reminder message for an overdue invoice — ready to email or send.",
    fields: [
      { name: "customerName", label: "Customer name", type: "text", placeholder: "Ravi Kumar" },
      { name: "invoiceNumber", label: "Invoice number", type: "text", placeholder: "INV-045" },
      { name: "amountDue", label: "Amount due", type: "number", placeholder: "25000", min: 0, unit: "₹" },
      { name: "dueDate", label: "Invoice due date", type: "date" },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        defaultValue: "friendly",
        options: [
          { value: "friendly", label: "Friendly (first reminder)" },
          { value: "firm", label: "Firm (second reminder)" },
          { value: "final", label: "Final notice" },
        ],
      },
    ],
    generate: generatePaymentReminder,
    submitLabel: "Generate reminder",
    emailGate: true,
    about: [
      "Chasing late payments is uncomfortable, and that discomfort is exactly why so many small businesses let overdue invoices sit far longer than they should. Having a ready-made message for each stage of the conversation removes the awkward blank-page moment and makes it easy to actually send the reminder promptly — which is the single biggest factor in getting paid faster.",
      "The tone escalates deliberately across three stages: friendly for the first, gentle nudge (assumes it might simply be an oversight), firm for a second reminder after the friendly one is ignored (states a clear 7-day deadline and mentions late charges), and final notice for a last attempt before considering suspension of services or collections (a clear 3-day deadline and explicit consequences). Escalating tone this way, rather than staying friendly forever or going straight to threats, is both more professional and more effective.",
      "Send the first reminder promptly once an invoice is even a few days overdue — waiting weeks before the first nudge signals that your payment terms aren't really enforced, which invites slower payment across your whole customer base. Pair persistent, professional reminders with the late fee calculator to show customers exactly what continued delay will cost them.",
      "Keep a copy of each reminder you send along with its date — a documented, escalating trail is useful if the matter ever needs to go further, and it also shows a genuinely good-faith customer exactly how much notice they were given before things got firm.",
    ],
    faq: [
      {
        question: "How soon after the due date should I send the first reminder?",
        answer:
          "Within a few days of the invoice becoming overdue — prompt, friendly reminders set the expectation that your payment terms are taken seriously, without damaging the relationship.",
      },
      {
        question: "Should I mention late fees in the reminder?",
        answer:
          "The firm and final tones mention late payment charges explicitly, which is appropriate once a friendly reminder has already been ignored — check that your invoice/contract terms actually specify a late fee before threatening one.",
      },
      {
        question: "What should I do if the final notice is also ignored?",
        answer:
          "That depends on your risk tolerance and the amount involved — options include suspending services, engaging a collections process, or, for larger amounts, legal notice. This generator covers the reminder stage; escalation beyond that needs case-by-case judgement.",
      },
    ],
    related: ["late-fee-calculator", "invoice-due-date-calculator", "ai-cold-email-writer", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "late-fee-calculator",
    category: "invoicing-billing",
    name: "Late Payment Fee Calculator",
    tagline: "Calculate the late fee and total due on an overdue invoice.",
    seoDescription:
      "Free late payment fee calculator. Enter the invoice amount, monthly late fee rate and days overdue to calculate the late fee and total amount now due.",
    fields: [
      { name: "invoiceAmount", label: "Invoice amount", type: "number", placeholder: "50000", min: 0, unit: "₹" },
      { name: "monthlyRate", label: "Late fee rate (per month)", type: "number", defaultValue: 2, min: 0, max: 10, step: 0.1, unit: "%" },
      { name: "daysOverdue", label: "Days overdue", type: "number", placeholder: "20", min: 0 },
    ],
    compute: computeLateFee,
    autoCompute: true,
    about: [
      "Most invoices and contracts specify a late payment charge — commonly 1.5-2% per month — but almost nobody actually calculates what that amounts to on a specific overdue amount for a specific number of days late. This calculator does that arithmetic instantly: enter the invoice amount, the agreed monthly rate, and days overdue, and get the exact late fee and total now due.",
      "The calculation converts your monthly rate to a daily rate (monthly rate ÷ 30) and applies it per day overdue — a simple, defensible method that matches how most late-fee clauses are actually worded. This makes the number concrete rather than abstract when you're following up on late payment, which strengthens a payment reminder considerably: \"the late fee is currently ₹1,167 and grows daily\" lands harder than a vague mention of penalties.",
      "Before charging a late fee, confirm your invoice or contract actually specifies one — charging a fee that wasn't agreed upfront is legally shaky and damages the relationship. If you haven't been including a late-fee clause, add one to future invoices and contracts so this calculator has real teeth going forward.",
      "Recalculate as the overdue period grows rather than quoting a stale figure from the first reminder — the fee compounds daily under most clause wordings, so a number quoted three weeks ago understates what's actually owed today. Keeping the figure current also signals to the customer that you're tracking the account closely.",
    ],
    faq: [
      {
        question: "What late fee rate is standard?",
        answer:
          "1.5-2% per month is common in Indian B2B invoicing and contracts, though it varies by industry and negotiating power. Whatever rate you use, it should be explicitly stated in your invoice terms or contract before you attempt to charge it.",
      },
      {
        question: "Can I charge a late fee if it wasn't mentioned on the invoice?",
        answer:
          "Legally and practically, no — a late fee needs to be agreed in advance (on the invoice, in a contract, or in your standard terms) to be enforceable. Add a late-fee clause to future invoices if you don't already.",
      },
      {
        question: "How is the daily rate calculated from a monthly rate?",
        answer:
          "Monthly rate ÷ 30 gives a daily rate, which is then applied to the invoice amount for the exact number of days overdue — a simple, commonly used method for pro-rating monthly late-fee clauses.",
      },
    ],
    related: ["payment-reminder-generator", "invoice-due-date-calculator", "simple-interest-calculator", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "discount-calculator",
    category: "invoicing-billing",
    name: "Discount Calculator",
    tagline: "Calculate the final price after single or stacked discounts.",
    seoDescription:
      "Free discount calculator. Enter the original price and one or two discount percentages to get the final price, amount saved and effective discount rate.",
    fields: [
      { name: "price", label: "Original price", type: "number", placeholder: "2000", min: 0, unit: "₹" },
      { name: "discount1", label: "First discount", type: "number", placeholder: "20", min: 0, max: 100, unit: "%" },
      { name: "discount2", label: "Second discount (stacked, optional)", type: "number", defaultValue: 0, min: 0, max: 100, unit: "%", optional: true },
    ],
    compute: computeDiscount,
    autoCompute: true,
    about: [
      "A single discount is easy to compute in your head; stacked discounts (\"20% off, plus an extra 10%\") are where most people get the arithmetic wrong — the second discount applies to the already-discounted price, not the original, so 20% + 10% is not a flat 30% off. This calculator gets the sequencing right and shows you the true effective discount.",
      "Enter the original price and your first discount, and optionally a second discount that stacks on top of the first. The calculator applies them in sequence — first discount off the original price, second discount off that reduced price — and reports both the final price and the true effective discount percentage, which is always slightly less than simply adding the two percentages together.",
      "This matters for retailers designing promotions (know exactly what margin you're giving away before advertising \"up to 30% off\"), and for shoppers evaluating whether a stacked coupon deal is actually as good as it sounds. A 20% + 10% stack, for instance, works out to a 28% effective discount, not 30% — a difference worth knowing on a large purchase.",
      "If you're pricing a sale, check the final margin left after the discount against your product cost, not just against the original price — a generous-looking discount can quietly erase your entire profit on a low-margin item, something the margin calculator makes easy to check once you know the discounted selling price.",
    ],
    faq: [
      {
        question: "Why isn't 20% + 10% equal to 30% off?",
        answer:
          "Because the second discount applies to the price after the first discount, not the original price. A ₹2,000 item at 20% off becomes ₹1,600; a further 10% off ₹1,600 is ₹1,440 — a 28% effective discount overall, not 30%.",
      },
      {
        question: "Can I calculate more than two stacked discounts?",
        answer:
          "This calculator supports two stacked discounts. For three or more, apply the second and third discounts sequentially: take the output final price from a two-discount calculation and run it again as the \"original price\" with the third discount.",
      },
      {
        question: "Is stacking always applied multiplicatively, not additively?",
        answer:
          "Yes, this is how nearly all real-world stacked discounts and coupon stacks work — each discount is applied to the current, already-discounted price, not the original one. Retailers who advertise a flat combined percentage are usually being imprecise.",
      },
    ],
    related: ["margin-calculator", "markup-calculator", "gst-calculator", "invoice-generator"],
  },
  {
    kind: "calculator",
    slug: "invoice-due-date-calculator",
    category: "invoicing-billing",
    name: "Invoice Due Date Calculator",
    tagline: "Calculate an invoice's due date from standard net payment terms.",
    seoDescription:
      "Free invoice due date calculator. Enter the invoice date and payment terms (Net 15/30/45/60/90 or custom) to calculate the exact due date and status.",
    fields: [
      { name: "invoiceDate", label: "Invoice date", type: "date" },
      {
        name: "term",
        label: "Payment terms",
        type: "select",
        defaultValue: "net-30",
        options: [
          { value: "net-15", label: "Net 15" },
          { value: "net-30", label: "Net 30" },
          { value: "net-45", label: "Net 45" },
          { value: "net-60", label: "Net 60" },
          { value: "net-90", label: "Net 90" },
          { value: "custom", label: "Custom" },
        ],
      },
      { name: "customDays", label: "Custom days (if selected above)", type: "number", min: 1, max: 365, optional: true },
    ],
    compute: computeInvoiceDueDate,
    autoCompute: true,
    about: [
      "\"Net 30\" and similar payment terms are everywhere on invoices, but the actual due date they imply isn't always obvious at a glance, especially when you're juggling many invoices with different terms. This calculator takes the invoice date and payment term and gives you the exact due date, plus a live status showing whether it's still upcoming, due today, or already overdue.",
      "Standard net terms (15, 30, 45, 60 or 90 days from the invoice date) cover most business arrangements; select custom for anything non-standard your contract specifies. The calculation is a straightforward date addition, but doing it correctly and consistently across dozens of invoices — rather than eyeballing a calendar each time — avoids the easy mistake of chasing payment too early or too late.",
      "Use this when setting up a new customer relationship (agreeing terms upfront and knowing exactly what date that implies), when building a collections follow-up schedule (know precisely when an invoice crosses into overdue territory), or simply to double-check your own or a supplier's stated due date on an invoice.",
      "The status line updates against today's date, so bookmarking this tool and re-checking it periodically for your open invoices is a quick, low-effort way to spot which accounts have quietly slipped into overdue territory before they've been chased — pairing that with the payment reminder generator turns the check into an actual follow-up in under a minute.",
    ],
    faq: [
      {
        question: "What does \"Net 30\" mean?",
        answer:
          "Payment is due 30 days from the invoice date (not the delivery date, unless your terms specify otherwise). Net 15/45/60/90 follow the same logic with a different number of days.",
      },
      {
        question: "Does the due date account for weekends or holidays?",
        answer:
          "No — it's a straightforward calendar-day calculation. If your contract specifies that the due date shifts to the next business day when it falls on a weekend or holiday, adjust manually.",
      },
      {
        question: "What payment terms should I offer new customers?",
        answer:
          "Net 30 is the most common default in B2B. Shorter terms (Net 15) improve your cash flow but may be less attractive to customers used to standard terms; longer terms (Net 60/90) are sometimes required by larger customers with their own payment cycles.",
      },
    ],
    related: ["late-fee-calculator", "payment-reminder-generator", "working-capital-calculator", "invoice-generator"],
  },
];
