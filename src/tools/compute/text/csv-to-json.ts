import type { GenerateFn } from "@/types/tools";

const DELIMITERS: Record<string, string> = {
  comma: ",",
  semicolon: ";",
  tab: "\t",
};

/** Parse CSV text into rows, honouring quoted fields with embedded delimiters,
 *  newlines and escaped ("") quotes. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += ch;
        i += 1;
      }
    } else if (ch === '"' && field === "") {
      inQuotes = true;
      i += 1;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
      i += 1;
    } else if (ch === "\r" && text[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 2;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
    } else {
      field += ch;
      i += 1;
    }
  }
  // Flush the final field/row (unless the text ended exactly on a newline).
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export const csvToJson: GenerateFn = (values) => {
  const csv = typeof values.csv === "string" ? values.csv : "";
  const hasHeader = values.header !== false;
  const delimiter = DELIMITERS[typeof values.delimiter === "string" ? values.delimiter : "comma"] ?? ",";

  if (csv.trim() === "") return { error: "Paste some CSV data to convert." };

  const rows = parseCsv(csv, delimiter).filter(
    (r) => !(r.length === 1 && r[0].trim() === ""),
  );
  if (rows.length === 0) return { error: "No data rows found in the CSV." };

  let output: unknown;
  if (hasHeader) {
    const [headerRow, ...dataRows] = rows;
    const keys = headerRow.map((h, idx) => (h.trim() !== "" ? h.trim() : `column${idx + 1}`));
    if (dataRows.length === 0) {
      return { error: "The CSV only contains a header row — add at least one data row." };
    }
    output = dataRows.map((r) =>
      Object.fromEntries(keys.map((key, idx) => [key, r[idx] ?? ""])),
    );
  } else {
    output = rows.map((r) =>
      Object.fromEntries(r.map((value, idx) => [`column${idx + 1}`, value])),
    );
  }

  return { text: JSON.stringify(output, null, 2), filename: "data.json" };
};
