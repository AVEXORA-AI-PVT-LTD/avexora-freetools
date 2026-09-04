import type { GenerateFn } from "@/types/tools";
import { formatDate, parseLineItems, renderItemsTable, str } from "./shared";

export const generatePurchaseOrder: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const supplierName = str(values.supplierName);
  const poNumber = str(values.poNumber);
  const date = formatDate(values.date);
  const deliveryDate = formatDate(values.deliveryDate);
  const deliveryAddress = str(values.deliveryAddress);
  const itemsRaw = str(values.items);

  if (businessName === "") return { error: "Enter your business name." };
  if (supplierName === "") return { error: "Enter the supplier's name." };
  if (poNumber === "") return { error: "Enter a purchase order number." };
  if (date === "") return { error: "Select the order date." };
  if (deliveryAddress === "") return { error: "Enter the delivery address." };
  if (itemsRaw === "") return { error: "Add at least one line item (description, qty, rate)." };

  const items = parseLineItems(itemsRaw);
  if (items.length === 0) return { error: "Could not parse any line items. Use one per line: description, qty, rate." };

  const text = `${businessName}

PURCHASE ORDER

PO #: ${poNumber}
Date: ${date}${deliveryDate ? `\nRequired delivery date: ${deliveryDate}` : ""}

Supplier: ${supplierName}
Deliver to: ${deliveryAddress}

${renderItemsTable(items)}

Please confirm receipt of this purchase order and the expected delivery date. All goods must match the specifications and quantities stated above; any discrepancy should be reported before dispatch.

For ${businessName}

_______________________
Authorised Signatory`;

  return { text, filename: "purchase-order.txt" };
};
