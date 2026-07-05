import type { GenerateFn } from "@/tools/types";

/** Quote a CSV field if it contains a comma, quote or newline. */
function csvField(value: unknown): string {
  let str: string;
  if (value === null || value === undefined) str = "";
  else if (typeof value === "object") str = JSON.stringify(value);
  else str = String(value);

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const jsonToCsv: GenerateFn = (values) => {
  const text = typeof values.json === "string" ? values.json : "";
  if (text.trim() === "") return { error: "Paste a JSON array to convert." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `Invalid JSON: ${detail}` };
  }

  if (!Array.isArray(parsed)) {
    return { error: "Expected a JSON array of objects, e.g. [{\"name\":\"A\"},{\"name\":\"B\"}]." };
  }
  if (parsed.length === 0) return { error: "The JSON array is empty — nothing to convert." };

  const objects: Record<string, unknown>[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { error: "Every item in the array must be an object with key/value pairs." };
    }
    objects.push(item as Record<string, unknown>);
  }

  // Union of keys across all objects, in first-seen order.
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  const lines = [
    keys.map(csvField).join(","),
    ...objects.map((obj) => keys.map((key) => csvField(obj[key])).join(",")),
  ];

  return { text: lines.join("\n"), filename: "data.csv" };
};
