import type { GenerateFn } from "@/types/tools";
import { formatINR, toPositive } from "../format";
import { formatDate, str } from "./shared";

const TONES: Record<string, (name: string, invoice: string, amount: string, due: string) => string> = {
  friendly: (name, invoice, amount, due) =>
    `Hi ${name},\n\nJust a friendly reminder that invoice ${invoice} for ${amount}, due on ${due}, is now outstanding. If you've already made the payment, please ignore this message — otherwise, we'd appreciate it if you could process it at your earliest convenience.\n\nLet us know if you have any questions or need a copy of the invoice.\n\nThanks so much!`,
  firm: (name, invoice, amount, due) =>
    `Dear ${name},\n\nThis is to inform you that invoice ${invoice} for ${amount}, due on ${due}, remains unpaid. We request that you settle this amount within 7 days of this notice to avoid any late payment charges or interruption to services.\n\nPlease contact us immediately if there is a dispute regarding this invoice, or to arrange payment.`,
  final: (name, invoice, amount, due) =>
    `Dear ${name},\n\nFINAL NOTICE: Invoice ${invoice} for ${amount}, due on ${due}, remains unpaid despite previous reminders. Please settle this amount within 3 business days of this notice.\n\nFailure to make payment within this period may result in suspension of services and/or referral to a collections process, and may attract late payment interest as per our agreed terms.\n\nWe would prefer to resolve this amicably — please contact us immediately to discuss.`,
};

export const generatePaymentReminder: GenerateFn = (values) => {
  const customerName = str(values.customerName);
  const invoiceNumber = str(values.invoiceNumber);
  const amountDue = toPositive(values.amountDue);
  const dueDate = formatDate(values.dueDate);
  const tone = str(values.tone) || "friendly";

  if (customerName === "") return { error: "Enter the customer's name." };
  if (invoiceNumber === "") return { error: "Enter the invoice number." };
  if (amountDue === null) return { error: "Enter the amount due." };
  if (dueDate === "") return { error: "Select the invoice due date." };

  const builder = TONES[tone] ?? TONES.friendly;
  const text = builder(customerName, invoiceNumber, formatINR(amountDue), dueDate);

  return { text, filename: "payment-reminder.txt" };
};
