import type { GenerateFn } from "@/tools/types";
import { formatINR, toPositive } from "../format";
import { formatDate, str } from "./shared";

export const generateReceipt: GenerateFn = (values) => {
  const businessName = str(values.businessName);
  const payerName = str(values.payerName);
  const receiptNumber = str(values.receiptNumber);
  const date = formatDate(values.date);
  const amount = toPositive(values.amount);
  const paymentMethod = str(values.paymentMethod) || "Cash";
  const forPayment = str(values.forPayment);

  if (businessName === "") return { error: "Enter your business name." };
  if (payerName === "") return { error: "Enter the payer's name." };
  if (receiptNumber === "") return { error: "Enter a receipt number." };
  if (date === "") return { error: "Select the payment date." };
  if (amount === null) return { error: "Enter the amount received." };
  if (forPayment === "") return { error: "Describe what the payment is for." };

  const text = `${businessName}

PAYMENT RECEIPT

Receipt #: ${receiptNumber}
Date: ${date}

Received from: ${payerName}

Amount received: ${formatINR(amount)}
Payment method: ${paymentMethod}
Payment for: ${forPayment}

We acknowledge receipt of the above payment in full.

For ${businessName}

_______________________
Authorised Signatory`;

  return { text, filename: "receipt.txt" };
};
