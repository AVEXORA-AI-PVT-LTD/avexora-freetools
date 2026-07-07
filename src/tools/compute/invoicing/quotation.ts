import type { GenerateFn } from "@/tools/types";
import { formatDate, parseLineItems, renderItemsTable, str } from "./shared";

export const generateQuotation: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const customerName = str(values.customerName);
  const quotationNumber = str(values.quotationNumber);
  const date = formatDate(values.date);
  const validUntil = formatDate(values.validUntil);
  const itemsRaw = str(values.items);

  if (businessName === "") return { error: "Enter your business name." };
  if (customerName === "") return { error: "Enter the customer name." };
  if (quotationNumber === "") return { error: "Enter a quotation number." };
  if (date === "") return { error: "Select the quotation date." };
  if (itemsRaw === "") return { error: "Add at least one line item (description, qty, rate)." };

  const items = parseLineItems(itemsRaw);
  if (items.length === 0) return { error: "Could not parse any line items. Use one per line: description, qty, rate." };

  const text = `${businessName}

QUOTATION

Quotation #: ${quotationNumber}
Date: ${date}${validUntil ? `\nValid until: ${validUntil}` : ""}

To: ${customerName}

${renderItemsTable(items)}

This quotation is an estimate and does not constitute a tax invoice. Prices are subject to change after the validity period stated above.

Thank you for considering ${businessName}.`;

  return { text, filename: "quotation.txt" };
};
