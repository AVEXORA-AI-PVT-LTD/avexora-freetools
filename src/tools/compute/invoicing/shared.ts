import { formatINR } from "../format";

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format an ISO date (yyyy-mm-dd) as "1 August 2026"; pass anything else through. */
export function formatDate(value: unknown): string {
  const s = str(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const monthName = MONTHS[Number(m[2]) - 1];
  if (!monthName) return s;
  return `${Number(m[3])} ${monthName} ${m[1]}`;
}

export interface LineItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

/** Parse "description, qty, rate" lines (one item per line) into LineItems. */
export function parseLineItems(raw: string): LineItem[] {
  const items: LineItem[] = [];
  for (const line of raw.split("\n")) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 1 || parts[0] === "") continue;
    const description = parts[0];
    const qty = parts[1] ? Number(parts[1]) : 1;
    const rate = parts[2] ? Number(parts[2]) : 0;
    if (!Number.isFinite(qty) || !Number.isFinite(rate)) continue;
    items.push({ description, qty, rate, amount: qty * rate });
  }
  return items;
}

/** Render a simple aligned plain-text line-item table with a total row. */
export function renderItemsTable(items: LineItem[]): string {
  const lines = [
    "Description                              Qty      Rate           Amount",
    "-".repeat(74),
  ];
  for (const it of items) {
    const desc = it.description.slice(0, 38).padEnd(40);
    const qty = String(it.qty).padStart(5).padEnd(9);
    const rate = formatINR(it.rate).padStart(12).padEnd(15);
    const amount = formatINR(it.amount).padStart(12);
    lines.push(`${desc}${qty}${rate}${amount}`);
  }
  const total = items.reduce((s, it) => s + it.amount, 0);
  lines.push("-".repeat(74));
  lines.push(`${"TOTAL".padEnd(62)}${formatINR(total).padStart(12)}`);
  return lines.join("\n");
}

export function itemsTotal(items: LineItem[]): number {
  return items.reduce((s, it) => s + it.amount, 0);
}

export const LEGAL_NOTE = "This is a computer-generated document.";
