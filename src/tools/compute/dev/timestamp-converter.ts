import type { ComputeFn } from "@/types/tools";

function parseInput(raw: string): Date | null {
  const s = raw.trim();
  if (s === "" || s.toLowerCase() === "now") return new Date();

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    // Heuristic: 13+ digit numbers are milliseconds, 12 or fewer are seconds.
    const date = new Date(s.length >= 13 ? n : n * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}

function relative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units: [number, string][] = [
    [1000, "second"],
    [60 * 1000, "minute"],
    [60 * 60 * 1000, "hour"],
    [24 * 60 * 60 * 1000, "day"],
    [365.25 * 24 * 60 * 60 * 1000, "year"],
  ];
  let value = abs / 1000;
  let unit = "second";
  for (const [ms, name] of units) {
    if (abs >= ms) {
      value = abs / ms;
      unit = name;
    }
  }
  const rounded = Math.round(value);
  const plural = rounded === 1 ? "" : "s";
  return diffMs < 0 ? `${rounded} ${unit}${plural} ago` : `in ${rounded} ${unit}${plural}`;
}

export const convertTimestamp: ComputeFn = (values) => {
  const raw = typeof values.input === "string" ? values.input : "";
  const date = parseInput(raw);
  if (!date) {
    return {
      error:
        "Couldn't parse that. Enter a unix timestamp (seconds or milliseconds), an ISO date like 2026-07-05T10:30:00Z, or leave empty for now.",
    };
  }

  const ist = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);

  return {
    results: [
      { label: "Unix timestamp (seconds)", value: String(Math.floor(date.getTime() / 1000)), emphasis: true },
      { label: "Unix timestamp (milliseconds)", value: String(date.getTime()) },
      { label: "UTC (ISO 8601)", value: date.toISOString() },
      { label: "India (IST)", value: ist },
      { label: "Relative", value: relative(date) },
    ],
  };
};
