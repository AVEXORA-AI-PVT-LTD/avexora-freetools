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

export const LEGAL_DISCLAIMER =
  "DISCLAIMER: This document is a general template generated for informational purposes only and does not constitute legal advice. Laws vary by jurisdiction and change over time. Have this document reviewed by a qualified lawyer before signing or relying on it for any legal purpose.";
