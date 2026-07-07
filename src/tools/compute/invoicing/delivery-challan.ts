import type { GenerateFn } from "@/tools/types";
import { formatDate, str } from "./shared";
import { formatINR, toPositive } from "../format";

interface ChallanItem {
  description: string;
  qty: number;
}

function parseChallanItems(raw: string): ChallanItem[] {
  const items: ChallanItem[] = [];
  for (const line of raw.split("\n")) {
    const parts = line.split(",").map((p) => p.trim());
    if (!parts[0]) continue;
    const qty = parts[1] ? Number(parts[1]) : 1;
    if (!Number.isFinite(qty)) continue;
    items.push({ description: parts[0], qty });
  }
  return items;
}

export const generateDeliveryChallan: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const consigneeName = str(values.consigneeName);
  const challanNumber = str(values.challanNumber);
  const date = formatDate(values.date);
  const deliveryAddress = str(values.deliveryAddress);
  const vehicleNumber = str(values.vehicleNumber);
  const itemsRaw = str(values.items);
  const value = toPositive(values.approxValue);

  if (businessName === "") return { error: "Enter your business name." };
  if (consigneeName === "") return { error: "Enter the consignee's name." };
  if (challanNumber === "") return { error: "Enter a delivery challan number." };
  if (date === "") return { error: "Select the date." };
  if (deliveryAddress === "") return { error: "Enter the delivery address." };
  if (itemsRaw === "") return { error: "Add at least one item (description, qty)." };

  const items = parseChallanItems(itemsRaw);
  if (items.length === 0) return { error: "Could not parse any items. Use one per line: description, qty." };

  const table = [
    "Description                                          Quantity",
    "-".repeat(65),
    ...items.map((it) => `${it.description.slice(0, 48).padEnd(54)}${it.qty}`),
  ].join("\n");

  const text = `${businessName}

DELIVERY CHALLAN

Challan #: ${challanNumber}
Date: ${date}
${vehicleNumber ? `Vehicle #: ${vehicleNumber}\n` : ""}
Consignee: ${consigneeName}
Deliver to: ${deliveryAddress}

${table}
${value !== null ? `\nApproximate value (for transport purposes only): ${formatINR(value)}` : ""}

This delivery challan accompanies the goods listed above for transportation purposes. It is not a tax invoice. A separate tax invoice, if applicable, will follow or has already been issued.

For ${businessName}

_______________________
Authorised Signatory`;

  return { text, filename: "delivery-challan.txt" };
};
