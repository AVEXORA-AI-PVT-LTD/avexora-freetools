import type { GenerateFn } from "@/tools/types";
import { formatDate, parseLineItems, renderItemsTable, str } from "./shared";

export const generateCreditNote: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const customerName = str(values.customerName);
  const creditNoteNumber = str(values.creditNoteNumber);
  const date = formatDate(values.date);
  const originalInvoiceNumber = str(values.originalInvoiceNumber);
  const reason = str(values.reason);
  const itemsRaw = str(values.items);

  if (businessName === "") return { error: "Enter your business name." };
  if (customerName === "") return { error: "Enter the customer name." };
  if (creditNoteNumber === "") return { error: "Enter a credit note number." };
  if (date === "") return { error: "Select the date." };
  if (originalInvoiceNumber === "") return { error: "Enter the original invoice number this note relates to." };
  if (reason === "") return { error: "Enter the reason for the credit note (e.g. goods returned, billing error)." };
  if (itemsRaw === "") return { error: "Add at least one line item (description, qty, rate)." };

  const items = parseLineItems(itemsRaw);
  if (items.length === 0) return { error: "Could not parse any line items. Use one per line: description, qty, rate." };

  const text = `${businessName}

CREDIT NOTE

Credit Note #: ${creditNoteNumber}
Date: ${date}
Original Invoice #: ${originalInvoiceNumber}

To: ${customerName}

Reason: ${reason}

${renderItemsTable(items)}

This credit note reduces the amount owed by ${customerName} against the original invoice referenced above. Please adjust your accounts payable records accordingly.

For ${businessName}

_______________________
Authorised Signatory`;

  return { text, filename: "credit-note.txt" };
};
