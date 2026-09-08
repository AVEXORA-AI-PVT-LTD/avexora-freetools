import type { GenerateFn } from "@/types/tools";
import { formatDate, parseLineItems, renderItemsTable, str } from "./shared";

export const generateDebitNote: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const supplierName = str(values.supplierName);
  const debitNoteNumber = str(values.debitNoteNumber);
  const date = formatDate(values.date);
  const originalInvoiceNumber = str(values.originalInvoiceNumber);
  const reason = str(values.reason);
  const itemsRaw = str(values.items);

  if (businessName === "") return { error: "Enter your business name." };
  if (supplierName === "") return { error: "Enter the supplier's name." };
  if (debitNoteNumber === "") return { error: "Enter a debit note number." };
  if (date === "") return { error: "Select the date." };
  if (originalInvoiceNumber === "") return { error: "Enter the original invoice number this note relates to." };
  if (reason === "") return { error: "Enter the reason for the debit note (e.g. goods returned to supplier, shortage)." };
  if (itemsRaw === "") return { error: "Add at least one line item (description, qty, rate)." };

  const items = parseLineItems(itemsRaw);
  if (items.length === 0) return { error: "Could not parse any line items. Use one per line: description, qty, rate." };

  const text = `${businessName}

DEBIT NOTE

Debit Note #: ${debitNoteNumber}
Date: ${date}
Original Invoice #: ${originalInvoiceNumber}

To: ${supplierName}

Reason: ${reason}

${renderItemsTable(items)}

This debit note records an increase in the amount owed to us by ${supplierName} (or a reduction in what we owe them) against the original invoice referenced above. Please adjust your accounts receivable records accordingly.

For ${businessName}

_______________________
Authorised Signatory`;

  return { text, filename: "debit-note.txt" };
};
