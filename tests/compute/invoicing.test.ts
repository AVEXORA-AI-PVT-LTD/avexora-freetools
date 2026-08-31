import { describe, expect, it } from "vitest";
import type { ComputeFn, FieldValues, GenerateFn } from "@/tools/types";
import { generateQuotation } from "@/tools/compute/invoicing/quotation";
import { generateProformaInvoice } from "@/tools/compute/invoicing/proforma-invoice";
import { generateReceipt } from "@/tools/compute/invoicing/receipt";
import { generateCreditNote } from "@/tools/compute/invoicing/credit-note";
import { generateDebitNote } from "@/tools/compute/invoicing/debit-note";
import { generatePurchaseOrder } from "@/tools/compute/invoicing/purchase-order";
import { generateDeliveryChallan } from "@/tools/compute/invoicing/delivery-challan";
import { generatePaymentReminder } from "@/tools/compute/invoicing/payment-reminder";
import { computeLateFee } from "@/tools/compute/invoicing/late-fee";
import { computeDiscount } from "@/tools/compute/invoicing/discount";
import { computeInvoiceDueDate } from "@/tools/compute/invoicing/due-date";

function textOf(fn: GenerateFn, values: FieldValues): string {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return out.text;
}

function resultMap(fn: ComputeFn, values: FieldValues) {
  const out = fn(values);
  if ("error" in out) throw new Error(out.error);
  return new Map(out.results.map((r) => [r.label, r.value]));
}

describe("generateQuotation", () => {
  it("computes line item totals", () => {
    const out = textOf(generateQuotation, {
      businessName: "Acme", customerName: "Ravi", quotationNumber: "Q1", date: "2026-08-01",
      validUntil: "", items: "Website design, 1, 25000\nHosting, 2, 1500",
    });
    expect(out).toContain("₹25,000.00");
    expect(out).toContain("₹28,000.00"); // 25000 + 2*1500 total
  });
  it("rejects unparseable items", () => {
    expect(generateQuotation({
      businessName: "Acme", customerName: "Ravi", quotationNumber: "Q1", date: "2026-08-01", items: "   ",
    })).toHaveProperty("error");
  });
});

describe("generateProformaInvoice", () => {
  it("states it is not a tax invoice", () => {
    const out = textOf(generateProformaInvoice, {
      businessName: "Acme", customerName: "Ravi", invoiceNumber: "PI-1", date: "2026-08-01",
      items: "Furniture, 1, 45000",
    });
    expect(out).toMatch(/NOT a tax invoice/);
  });
});

describe("generateReceipt", () => {
  it("includes amount and payment method", () => {
    const out = textOf(generateReceipt, {
      businessName: "Acme", payerName: "Ravi", receiptNumber: "R1", date: "2026-08-01",
      amount: "15000", paymentMethod: "UPI", forPayment: "Invoice #INV-045",
    });
    expect(out).toContain("₹15,000.00");
    expect(out).toContain("UPI");
  });
});

describe("generateCreditNote", () => {
  it("references the original invoice and reason", () => {
    const out = textOf(generateCreditNote, {
      businessName: "Acme", customerName: "Ravi", creditNoteNumber: "CN1", date: "2026-08-01",
      originalInvoiceNumber: "INV-045", reason: "goods returned", items: "Damaged unit, 1, 2000",
    });
    expect(out).toContain("INV-045");
    expect(out).toContain("goods returned");
  });
});

describe("generateDebitNote", () => {
  it("references supplier and reason", () => {
    const out = textOf(generateDebitNote, {
      businessName: "Acme", supplierName: "Global Supplies", debitNoteNumber: "DN1", date: "2026-08-01",
      originalInvoiceNumber: "SUP-220", reason: "shortage", items: "Missing units, 5, 500",
    });
    expect(out).toContain("Global Supplies");
    expect(out).toContain("shortage");
  });
});

describe("generatePurchaseOrder", () => {
  it("includes delivery address and items", () => {
    const out = textOf(generatePurchaseOrder, {
      businessName: "Acme", supplierName: "Global Supplies", poNumber: "PO1", date: "2026-08-01",
      deliveryDate: "2026-08-15", deliveryAddress: "Warehouse 3, Pune", items: "Steel rods, 200, 450",
    });
    expect(out).toContain("Warehouse 3, Pune");
    expect(out).toContain("₹90,000.00");
  });
});

describe("generateDeliveryChallan", () => {
  it("states it is not a tax invoice and lists quantities", () => {
    const out = textOf(generateDeliveryChallan, {
      businessName: "Acme", consigneeName: "Ravi", challanNumber: "DC1", date: "2026-08-01",
      vehicleNumber: "MH12AB1234", deliveryAddress: "Market Road, Nashik", items: "Tiles, 50",
    });
    expect(out).toMatch(/not a tax invoice/);
    expect(out).toContain("MH12AB1234");
  });
  it("includes the approximate value when a valid positive value is provided", () => {
    const out = textOf(generateDeliveryChallan, {
      businessName: "Acme", consigneeName: "Ravi", challanNumber: "DC1", date: "2026-08-01",
      deliveryAddress: "Market Road, Nashik", items: "Tiles, 50", approxValue: "150000",
    });
    expect(out).toContain("₹1,50,000.00");
  });
  it("omits the approximate value line when left empty", () => {
    const out = textOf(generateDeliveryChallan, {
      businessName: "Acme", consigneeName: "Ravi", challanNumber: "DC1", date: "2026-08-01",
      deliveryAddress: "Market Road, Nashik", items: "Tiles, 50", approxValue: "",
    });
    expect(out).not.toContain("Approximate value");
  });
  it("rejects a present-but-invalid approximate value instead of silently omitting it", () => {
    for (const bad of ["abc", "12..5", "--100", "12abc"]) {
      const out = generateDeliveryChallan({
        businessName: "Acme", consigneeName: "Ravi", challanNumber: "DC1", date: "2026-08-01",
        deliveryAddress: "Market Road, Nashik", items: "Tiles, 50", approxValue: bad,
      });
      expect(out).toHaveProperty("error");
      expect(out).not.toHaveProperty("text");
    }
  });
});

describe("generatePaymentReminder", () => {
  it("uses friendly tone by default", () => {
    const out = textOf(generatePaymentReminder, {
      customerName: "Ravi", invoiceNumber: "INV-045", amountDue: "25000", dueDate: "2026-07-01", tone: "friendly",
    });
    expect(out).toMatch(/friendly reminder/);
    expect(out).toContain("₹25,000.00");
  });
  it("uses final notice language for final tone", () => {
    const out = textOf(generatePaymentReminder, {
      customerName: "Ravi", invoiceNumber: "INV-045", amountDue: "25000", dueDate: "2026-07-01", tone: "final",
    });
    expect(out).toMatch(/FINAL NOTICE/);
  });
});

describe("computeLateFee", () => {
  it("computes late fee from monthly rate and days overdue", () => {
    // daily rate = 2/30 = 0.0667%; fee = 50000 * 0.000667 * 20 = 666.67
    const r = resultMap(computeLateFee, { invoiceAmount: "50000", monthlyRate: "2", daysOverdue: "20" });
    expect(r.get("Late fee")).toBe("₹666.67");
    expect(r.get("Total amount now due")).toBe("₹50,666.67");
  });
});

describe("computeDiscount", () => {
  it("applies a single discount", () => {
    const r = resultMap(computeDiscount, { price: "2000", discount1: "20", discount2: 0 });
    expect(r.get("Final price")).toBe("₹1,600.00");
  });
  it("applies stacked discounts multiplicatively, not additively", () => {
    const r = resultMap(computeDiscount, { price: "2000", discount1: "20", discount2: "10" });
    expect(r.get("Final price")).toBe("₹1,440.00");
    expect(r.get("Effective discount")).toBe("28%");
  });
  it("rejects invalid optional discount2 instead of treating it as 0", () => {
    expect(computeDiscount({ price: "2000", discount1: "20", discount2: "abc" })).toHaveProperty("error");
    expect(computeDiscount({ price: "2000", discount1: "20", discount2: "@#$" })).toHaveProperty("error");
    expect(computeDiscount({ price: "2000", discount1: "20", discount2: "12..5" })).toHaveProperty("error");
    expect(computeDiscount({ price: "2000", discount1: "20", discount2: "--100" })).toHaveProperty("error");
    expect(computeDiscount({ price: "2000", discount1: "20", discount2: "-5" })).toHaveProperty("error");
  });
  it("allows empty optional discount2 and explicit zero", () => {
    const empty = resultMap(computeDiscount, { price: "2000", discount1: "20", discount2: "" });
    expect(empty.get("Final price")).toBe("₹1,600.00");
  });
});

describe("computeInvoiceDueDate", () => {
  it("computes Net 30 due date", () => {
    const r = resultMap(computeInvoiceDueDate, { invoiceDate: "2026-07-01", term: "net-30" });
    expect(r.get("Due date")).toBe("31 July 2026");
    expect(r.get("Payment terms")).toBe("Net 30 days");
  });
  it("supports custom terms", () => {
    const r = resultMap(computeInvoiceDueDate, { invoiceDate: "2026-07-01", term: "custom", customDays: "45" });
    expect(r.get("Due date")).toBe("15 August 2026");
  });
  it("rejects an invalid invoice date", () => {
    expect(computeInvoiceDueDate({ invoiceDate: "", term: "net-30" })).toHaveProperty("error");
  });
});
