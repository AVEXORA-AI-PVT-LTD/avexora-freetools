import type { GenerateFn } from "@/tools/types";
import { formatDate, parseLineItems, renderItemsTable, str } from "./shared";

export const generateProformaInvoice: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const customerName = str(values.customerName);
  const invoiceNumber = str(values.invoiceNumber);
  const date = formatDate(values.date);
  const itemsRaw = str(values.items);

  if (businessName === "") return { error: "Enter your business name." };
  if (customerName === "") return { error: "Enter the customer name." };
  if (invoiceNumber === "") return { error: "Enter a proforma invoice number." };
  if (date === "") return { error: "Select the invoice date." };
  if (itemsRaw === "") return { error: "Add at least one line item (description, qty, rate)." };

  const items = parseLineItems(itemsRaw);
  if (items.length === 0) return { error: "Could not parse any line items. Use one per line: description, qty, rate." };

  const text = `${businessName}

PROFORMA INVOICE

Proforma Invoice #: ${invoiceNumber}
Date: ${date}

To: ${customerName}

${renderItemsTable(items)}

This is a proforma invoice issued for reference and advance payment purposes only. It is NOT a tax invoice/demand for payment under GST law and should not be recorded as a sale. A tax invoice will be issued upon delivery/completion.`;

  return { text, filename: "proforma-invoice.txt" };
};
