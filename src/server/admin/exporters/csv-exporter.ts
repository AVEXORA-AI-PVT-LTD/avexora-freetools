/**
 * CSV Exporter Utility
 * Generates robust, formula-injection-safe UTF-8 CSV strings.
 */

export interface CSVColumn {
  key: string;
  header: string;
}

/**
 * Escapes a cell value for CSV safety:
 * - Wraps strings containing commas, quotes, or newlines in double quotes.
 * - Escapes internal quotes by doubling them ("").
 * - Sanitizes formula injection triggers (=, +, -, @, \t, \r) by prefixing with a single quote (').
 */
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '""';
  
  let str = String(value);

  // Prevent CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote string if it contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

/**
 * Generates a complete UTF-8 CSV string with optional summary metadata header.
 */
export function generateCSV<T extends Record<string, any>>(
  columns: CSVColumn[],
  rows: T[],
  title?: string,
  summaryItems?: { label: string; value: any }[]
): string {
  const lines: string[] = [];

  // Add UTF-8 BOM for Excel opening compatibility
  const bom = "\uFEFF";

  if (title) {
    lines.push(escapeCSVCell(title));
    lines.push(escapeCSVCell(`Generated: ${new Date().toISOString()}`));
    lines.push('""');
  }

  if (summaryItems && summaryItems.length > 0) {
    lines.push(escapeCSVCell("EXECUTIVE SUMMARY"));
    summaryItems.forEach((item) => {
      lines.push(`${escapeCSVCell(item.label)},${escapeCSVCell(item.value)}`);
    });
    lines.push('""');
  }

  // Header row
  const headerLine = columns.map((col) => escapeCSVCell(col.header)).join(",");
  lines.push(headerLine);

  // Data rows
  rows.forEach((row) => {
    const rowLine = columns.map((col) => escapeCSVCell(row[col.key])).join(",");
    lines.push(rowLine);
  });

  return bom + lines.join("\n");
}
