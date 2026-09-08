import type { ComputeFn } from "@/types/tools";
import { toPositive } from "../format";

const TERMS: Record<string, number> = {
  "net-15": 15,
  "net-30": 30,
  "net-45": 45,
  "net-60": 60,
  "net-90": 90,
};

export const computeInvoiceDueDate: ComputeFn = (values) => {
  const invoiceDate = typeof values.invoiceDate === "string" ? values.invoiceDate : "";
  const term = typeof values.term === "string" ? values.term : "net-30";

  if (invoiceDate === "") return { error: "Select the invoice date." };
  const parsed = new Date(invoiceDate + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime())) return { error: "Enter a valid invoice date." };

  let days = TERMS[term];
  if (term === "custom") {
    const custom = toPositive(values.customDays);
    if (custom === null) return { error: "Enter a custom number of days." };
    days = custom;
  }
  if (!days) return { error: "Select payment terms." };

  const due = new Date(parsed);
  due.setUTCDate(due.getUTCDate() + days);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const status =
    daysUntilDue < 0
      ? `Overdue by ${Math.abs(daysUntilDue)} day(s)`
      : daysUntilDue === 0
        ? "Due today"
        : `Due in ${daysUntilDue} day(s)`;

  return {
    results: [
      {
        label: "Due date",
        value: due.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
        emphasis: true,
      },
      { label: "Payment terms", value: `Net ${days} days` },
      { label: "Status", value: status },
    ],
  };
};
